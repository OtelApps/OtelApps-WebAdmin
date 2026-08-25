<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelFinanceSetting;
use App\Models\HotelPayment;
use App\Support\Money;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ClosingPreflightService
{
    /**
     * @param  Collection<int, HotelPayment>  $scopedPayments  platby v období (včetně non-completed)
     * @return array{items: list<array>, blocking_count: int, warning_count: int, can_proceed: bool}
     */
    public function run(Hotel $hotel, Carbon $periodStart, Carbon $periodEnd, Collection $scopedPayments, bool $hasOpenClosing): array
    {
        $items = [];

        if ($hasOpenClosing) {
            $items[] = [
                'level' => 'blocking',
                'code' => 'open_closing_exists',
                'message' => 'Za toto období už běží jiná uzávěrka.',
            ];
        }

        $pending = $scopedPayments->where('status', 'pending');
        if ($pending->isNotEmpty()) {
            $items[] = [
                'level' => 'warning',
                'code' => 'pending_payments',
                'message' => sprintf('Existuje %d neuzavřených platebních sessions.', $pending->count()),
                'count' => $pending->count(),
                'payment_ids' => $pending->pluck('id')->values()->all(),
            ];
        }

        $unknown = $scopedPayments->where('status', 'unknown');
        if ($unknown->isNotEmpty()) {
            $items[] = [
                'level' => 'blocking',
                'code' => 'unknown_status',
                'message' => sprintf('%d transakcí je v neznámém stavu.', $unknown->count()),
                'count' => $unknown->count(),
                'payment_ids' => $unknown->pluck('id')->values()->all(),
            ];
        }

        $manualEdits = $scopedPayments->filter(function (HotelPayment $p) {
            $meta = $p->metadata ?? [];

            return ($meta['manually_edited'] ?? false) === true
                || ($p->source === 'manual' && Money::toCents($p->amount) !== 0);
        });
        if ($manualEdits->count() >= 3) {
            $items[] = [
                'level' => 'info',
                'code' => 'manual_edits',
                'message' => sprintf('Dnes byly provedeny %d manuálních plateb / oprav.', $manualEdits->count()),
                'count' => $manualEdits->count(),
            ];
        }

        $refunds = $scopedPayments->filter(fn (HotelPayment $p) => Money::toCents($p->amount) < 0 && $p->status === 'completed');
        $settings = $this->settingsFor($hotel);
        $warningThreshold = (float) $settings['closing_variance_warning'] * 10;
        $largeRefunds = $refunds->filter(fn (HotelPayment $p) => Money::compareAbs($p->amount, $warningThreshold) >= 0);
        if ($largeRefunds->isNotEmpty()) {
            $items[] = [
                'level' => 'warning',
                'code' => 'large_refunds',
                'message' => sprintf('Nalezeno %d neobvykle vysokých refundací.', $largeRefunds->count()),
                'count' => $largeRefunds->count(),
                'payment_ids' => $largeRefunds->pluck('id')->values()->all(),
            ];
        }

        $nearEnd = $scopedPayments->filter(function (HotelPayment $p) use ($periodEnd) {
            return $p->paid_at && $p->paid_at->greaterThan($periodEnd->copy()->subMinutes(15));
        });
        if ($nearEnd->count() >= 2) {
            $items[] = [
                'level' => 'info',
                'code' => 'late_payments',
                'message' => sprintf('%d transakcí vzniklo těsně před uzávěrkou.', $nearEnd->count()),
                'count' => $nearEnd->count(),
            ];
        }

        $blocking = collect($items)->where('level', 'blocking')->count();
        $warnings = collect($items)->where('level', 'warning')->count();

        return [
            'items' => array_values($items),
            'blocking_count' => $blocking,
            'warning_count' => $warnings,
            'can_proceed' => $blocking === 0,
        ];
    }

    /** @return array<string, mixed> */
    private function settingsFor(Hotel $hotel): array
    {
        $row = HotelFinanceSetting::query()->find($hotel->id);
        $cfg = config_array('otelapps.finance');

        return [
            'financial_day_start_time' => $row?->financial_day_start_time ?? ($cfg['financial_day_start_time'] ?? '06:00'),
            'default_cash_float' => $row?->default_cash_float ?? ($cfg['default_cash_float'] ?? 5000),
            'closing_variance_warning' => $row?->closing_variance_warning ?? ($cfg['closing_variance_warning'] ?? 10),
            'closing_variance_blocking' => $row?->closing_variance_blocking ?? ($cfg['closing_variance_blocking'] ?? 100),
            'primary_currency' => $row?->primary_currency ?? config('otelapps.currency', 'CZK'),
        ];
    }
}
