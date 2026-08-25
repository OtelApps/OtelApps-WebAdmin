<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\HotelFinancialClosing;
use App\Models\User;
use App\Support\Money;
use Database\Seeders\AuthDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class FinancialClosingTest extends TestCase
{
    use RefreshDatabase;

    private ?Hotel $hotel = null;

    private ?User $recepce = null;

    private ?User $manager = null;

    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('otelapps.db_connection');
        if (! Schema::connection($connection)->hasTable('hotel_payments')
            || ! Schema::connection($connection)->hasTable('hotel_financial_closings')) {
            $this->markTestSkipped('Finance tabulky nejsou v DB — spusť database/supabase/hotel_finance_closings.sql');
        }

        $this->seed(AuthDemoSeeder::class);
        $this->recepce = User::query()->where('email', 'recepce@otelapps.test')->first()
            ?? User::query()->whereHas('userType', fn ($q) => $q->where('slug', 'recepce'))->first();
        $this->manager = User::query()->whereHas('userType', fn ($q) => $q->where('slug', 'manazer'))->first();
        $this->hotel = Hotel::query()->where('slug', config('otelapps.hotel_slug', 'default'))->first();

        if (! $this->recepce || ! $this->hotel) {
            $this->markTestSkipped('Chybí demo uživatel recepce nebo hotel.');
        }

        // Úklid otevřených uzávěrek z předchozích běhů
        HotelFinancialClosing::query()
            ->where('hotel_id', $this->hotel->id)
            ->whereIn('status', HotelFinancialClosing::OPEN_STATUSES)
            ->delete();
    }

    public function test_create_closing_builds_expected_totals(): void
    {
        $response = $this->actingAs($this->recepce)->postJson('/api/finance/closings');

        $response->assertCreated();
        $closing = $response->json('closing');
        $this->assertNotEmpty($closing['id']);
        $this->assertSame('in_progress', $closing['status']);
        $this->assertNotEmpty($closing['payment_lines']);
        $this->assertTrue(Money::toCents($closing['expected_total']) >= 0);

        $cash = collect($closing['payment_lines'])->firstWhere('is_cash', true);
        $this->assertNotNull($cash);
        $this->assertNull($cash['actual_amount']);

        $card = collect($closing['payment_lines'])->firstWhere('payment_method_code', 'card');
        $this->assertNotNull($card);
        $this->assertNotNull($card['actual_amount']);
        $this->assertTrue(Money::equals($card['actual_amount'], $card['expected_amount']));

        HotelFinancialClosing::query()->where('id', $closing['id'])->delete();
    }

    public function test_duplicate_closing_is_rejected(): void
    {
        $first = $this->actingAs($this->recepce)->postJson('/api/finance/closings');
        $first->assertCreated();
        $id = $first->json('closing.id');

        $second = $this->actingAs($this->recepce)->postJson('/api/finance/closings');
        $second->assertStatus(409);

        HotelFinancialClosing::query()->where('id', $id)->delete();
    }

    public function test_variance_resolve_and_complete_flow(): void
    {
        $create = $this->actingAs($this->recepce)->postJson('/api/finance/closings');
        $create->assertCreated();
        $id = $create->json('closing.id');
        $closing = $create->json('closing');

        // ACK preflight warnings if any
        if (($closing['preflight_result']['warning_count'] ?? 0) > 0) {
            $this->actingAs($this->recepce)
                ->postJson("/api/finance/closings/{$id}/acknowledge-preflight")
                ->assertOk();
        } else {
            $this->actingAs($this->recepce)
                ->patchJson("/api/finance/closings/{$id}", ['current_step' => 2])
                ->assertOk();
        }

        $cash = collect($closing['payment_lines'])->firstWhere('is_cash', true);
        $expectedCash = $cash['expected_amount'];
        $actualCash = Money::sub($expectedCash, '10');

        $this->actingAs($this->recepce)->patchJson("/api/finance/closings/{$id}", [
            'lines' => [
                ['id' => $cash['id'], 'actual_amount' => (float) $actualCash],
            ],
        ])->assertOk();

        $this->actingAs($this->recepce)->postJson("/api/finance/closings/{$id}/resolve-variance", [
            'line_id' => $cash['id'],
            'reason' => 'shortage',
            'note' => 'Test manko 10 Kč',
        ])->assertOk();

        // Auto-fill remaining null actuals (shouldn't be any non-cash)
        $detail = $this->actingAs($this->recepce)->getJson("/api/finance/closings/{$id}")->json('closing');
        foreach ($detail['payment_lines'] as $line) {
            if ($line['actual_amount'] === null) {
                $this->actingAs($this->recepce)->patchJson("/api/finance/closings/{$id}", [
                    'lines' => [['id' => $line['id'], 'actual_amount' => (float) $line['expected_amount']]],
                ])->assertOk();
            }
        }

        $depositExpected = (float) Money::sub($actualCash, $detail['cash_float']);
        $this->actingAs($this->recepce)->postJson("/api/finance/closings/{$id}/deposit", [
            'actual_amount' => max(0, $depositExpected),
            'destination' => 'safe',
        ])->assertOk();

        $complete = $this->actingAs($this->recepce)->postJson("/api/finance/closings/{$id}/complete");
        $complete->assertOk();
        $this->assertSame('completed', $complete->json('closing.status'));
        $this->assertTrue($complete->json('closing.locked'));
        $this->assertNotNull($complete->json('closing.handover_summary'));

        // Completed cannot be edited
        $this->actingAs($this->recepce)
            ->patchJson("/api/finance/closings/{$id}", ['current_step' => 2])
            ->assertStatus(422);

        // Snapshot integrity
        $report = $this->actingAs($this->recepce)->getJson("/api/finance/closings/{$id}/report");
        $report->assertOk();
        $this->assertTrue($report->json('from_snapshot'));
        $this->assertSame(
            Money::fromCents(Money::toCents($actualCash)),
            collect($report->json('report.payment_lines'))->firstWhere('is_cash', true)['actual_amount']
                ?? collect($report->json('report.payment_lines'))->firstWhere('payment_method_code', 'cash')['actual_amount']
        );

        // Reopen requires manager permission
        if ($this->manager) {
            $this->actingAs($this->recepce)
                ->postJson("/api/finance/closings/{$id}/reopen", ['reason' => 'Oprava odvodu test'])
                ->assertStatus(403);

            $reopen = $this->actingAs($this->manager)
                ->postJson("/api/finance/closings/{$id}/reopen", ['reason' => 'Oprava odvodu test']);
            $reopen->assertOk();
            $this->assertSame('reopened', $reopen->json('closing.status'));
        }

        HotelFinancialClosing::query()->where('id', $id)->delete();
    }

    public function test_permission_denied_without_finance_access(): void
    {
        $uklid = User::query()->whereHas('userType', fn ($q) => $q->where('slug', 'uklid'))->first();
        if (! $uklid) {
            $this->markTestSkipped('Chybí uživatel uklid');
        }

        $this->actingAs($uklid)->getJson('/api/finance/dashboard')->assertStatus(403);
    }

    public function test_cash_count_sets_actual(): void
    {
        $create = $this->actingAs($this->recepce)->postJson('/api/finance/closings');
        $create->assertCreated();
        $id = $create->json('closing.id');

        $res = $this->actingAs($this->recepce)->postJson("/api/finance/closings/{$id}/cash-count", [
            'currency' => 'CZK',
            'rows' => [
                ['denomination' => 1000, 'quantity' => 40],
                ['denomination' => 500, 'quantity' => 10],
            ],
        ]);
        $res->assertOk();
        $cash = collect($res->json('closing.payment_lines'))->firstWhere('is_cash', true);
        $this->assertTrue(Money::equals($cash['actual_amount'], '45000'));

        HotelFinancialClosing::query()->where('id', $id)->delete();
    }
}
