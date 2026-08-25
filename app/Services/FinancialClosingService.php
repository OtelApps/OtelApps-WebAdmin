<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelFinanceSetting;
use App\Models\HotelFinancialClosing;
use App\Models\HotelFinancialClosingCashCount;
use App\Models\HotelFinancialClosingDeposit;
use App\Models\HotelFinancialClosingPaymentLine;
use App\Models\HotelPayment;
use App\Models\HotelPaymentMethod;
use App\Models\HotelPaymentTerminal;
use App\Models\User;
use App\Support\Money;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class FinancialClosingService
{
    public function __construct(
        private readonly ClosingPreflightService $preflight,
        private readonly ClosingReconciliationService $reconciliation,
        private readonly CashCountService $cashCount,
        private readonly ClosingAuditLogger $audit,
    ) {}

    public function dashboard(Hotel $hotel): array
    {
        $settings = $this->settingsFor($hotel);
        $businessDate = $this->resolveBusinessDate(now(), $settings['financial_day_start_time']);

        $open = HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('status', HotelFinancialClosing::OPEN_STATUSES)
            ->first();

        $todayCompleted = HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->where('business_date', $businessDate->toDateString())
            ->where('status', HotelFinancialClosing::STATUS_COMPLETED)
            ->orderByDesc('completed_at')
            ->first();

        $last7 = HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', HotelFinancialClosing::STATUS_COMPLETED)
            ->where('business_date', '>=', now()->subDays(7)->toDateString())
            ->get();

        $varianceDays = $last7->filter(fn (HotelFinancialClosing $c) => ! Money::isZero($c->variance_total))->count();

        return [
            'business_date' => $businessDate->toDateString(),
            'settings' => $settings,
            'open_closing' => $open ? $this->summaryItem($open) : null,
            'today' => [
                'completed' => $todayCompleted !== null,
                'closing' => $todayCompleted ? $this->summaryItem($todayCompleted) : null,
                'message' => $todayCompleted
                    ? sprintf(
                        'Uzávěrka dokončena v %s uživatelem %s',
                        optional($todayCompleted->completed_at)?->timezone(config('app.timezone'))->format('H:i') ?? '—',
                        $todayCompleted->completed_by_name ?? '—'
                    )
                    : 'Dnešní uzávěrka nebyla dokončena',
            ],
            'manager_kpis' => [
                'last_7_days' => [
                    'closings_count' => $last7->count(),
                    'expected_total' => Money::fromCents($last7->sum(fn ($c) => Money::toCents($c->expected_total))),
                    'variance_total' => Money::fromCents($last7->sum(fn ($c) => Money::toCents($c->variance_total))),
                    'with_variance_count' => $varianceDays,
                    'deposit_total' => Money::fromCents($last7->sum(fn ($c) => Money::toCents($c->deposit_actual))),
                ],
            ],
            'variance_reasons' => config_array('otelapps.finance.variance_reasons'),
            'deposit_destinations' => config_array('otelapps.finance.deposit_destinations'),
        ];
    }

    public function list(Hotel $hotel, array $filters = []): array
    {
        $q = HotelFinancialClosing::query()->where('hotel_id', $hotel->id);

        if (! empty($filters['status'])) {
            $q->where('status', $filters['status']);
        }
        if (! empty($filters['from'])) {
            $q->whereDate('business_date', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $q->whereDate('business_date', '<=', $filters['to']);
        }
        if (! empty($filters['user_id'])) {
            $q->where(function ($qq) use ($filters) {
                $qq->where('started_by', $filters['user_id'])
                    ->orWhere('completed_by', $filters['user_id']);
            });
        }
        if (isset($filters['has_variance'])) {
            if (filter_var($filters['has_variance'], FILTER_VALIDATE_BOOLEAN)) {
                $q->where('variance_total', '!=', 0);
            } else {
                $q->where('variance_total', 0);
            }
        }

        $items = $q->orderByDesc('business_date')->orderByDesc('started_at')->limit(100)->get();

        return [
            'closings' => $items->map(fn (HotelFinancialClosing $c) => $this->summaryItem($c))->values()->all(),
        ];
    }

    public function show(Hotel $hotel, string $id): array
    {
        $closing = $this->findOrFail($hotel, $id);
        $closing->load(['paymentLines', 'cashCounts', 'deposits', 'events']);

        return $this->detailPayload($closing, $hotel);
    }

    public function create(Hotel $hotel, User $user): array
    {
        if (! $user->hasPermission('finance.closing.create') && ! $user->isSuperAdmin()) {
            throw new HttpException(403, 'Nemáte oprávnění zahájit uzávěrku.');
        }

        $existing = HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('status', HotelFinancialClosing::OPEN_STATUSES)
            ->first();

        if ($existing) {
            throw new ConflictHttpException(sprintf(
                'Uzávěrku právě zpracovává %s od %s.',
                $existing->started_by_name ?? 'jiný uživatel',
                optional($existing->started_at)?->timezone(config('app.timezone'))->format('H:i') ?? '—'
            ));
        }

        $settings = $this->settingsFor($hotel);
        $now = now();
        $businessDate = $this->resolveBusinessDate($now, $settings['financial_day_start_time']);

        $previous = HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', HotelFinancialClosing::STATUS_COMPLETED)
            ->orderByDesc('period_end')
            ->first();

        $periodStart = $previous?->period_end
            ?? $this->businessDayStart($businessDate, $settings['financial_day_start_time']);
        $periodEnd = $now->copy();

        $scopedAll = HotelPayment::query()
            ->where('hotel_id', $hotel->id)
            ->where('paid_at', '>=', $periodStart)
            ->where('paid_at', '<=', $periodEnd)
            ->with(['paymentMethod', 'terminal'])
            ->get();

        $preflight = $this->preflight->run($hotel, $periodStart, $periodEnd, $scopedAll, false);
        if (! $preflight['can_proceed']) {
            // Blocking errors still allow create with status waiting — user must resolve
        }

        $completedPayments = $scopedAll->where('status', 'completed')->values();
        $paymentIds = $completedPayments->pluck('id')->values()->all();

        $cashFloat = $previous && $previous->cash_float !== null
            ? (float) $previous->cash_float
            : (float) $settings['default_cash_float'];

        $connection = config('otelapps.db_connection');

        $closing = DB::connection($connection)->transaction(function () use (
            $hotel, $user, $businessDate, $periodStart, $periodEnd, $settings,
            $paymentIds, $completedPayments, $preflight, $cashFloat
        ) {
            $closing = HotelFinancialClosing::query()->create([
                'hotel_id' => $hotel->id,
                'business_date' => $businessDate->toDateString(),
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'status' => HotelFinancialClosing::STATUS_IN_PROGRESS,
                'primary_currency' => $settings['primary_currency'],
                'cash_float' => $cashFloat,
                'started_by' => $user->id,
                'started_by_name' => $user->name,
                'started_at' => now(),
                'current_step' => 1,
                'preflight_result' => $preflight,
                'payment_ids' => $paymentIds,
                'expected_total' => 0,
                'actual_total' => 0,
                'variance_total' => 0,
                // DB default '{}' — prázdné PHP [] by se serializovalo jako JSON array
            ]);

            $this->buildPaymentLines($closing, $completedPayments, $settings['primary_currency']);
            $this->recalculateTotals($closing);
            $this->audit->log($closing, 'closing.started', $user, null, [
                'period_start' => $periodStart->toIso8601String(),
                'period_end' => $periodEnd->toIso8601String(),
                'payment_count' => count($paymentIds),
            ]);

            return $closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']);
        });

        return $this->detailPayload($closing, $hotel);
    }

    public function update(Hotel $hotel, User $user, string $id, array $data): array
    {
        $closing = $this->findEditable($hotel, $id);

        $old = [
            'current_step' => $closing->current_step,
            'cash_float' => $closing->cash_float,
        ];

        if (isset($data['current_step'])) {
            $closing->current_step = max(1, min(4, (int) $data['current_step']));
        }

        if (array_key_exists('cash_float', $data)) {
            if (! $user->hasPermission('finance.closing.edit_cash_float') && ! $user->isSuperAdmin()) {
                // allow only if value unchanged from current — otherwise require permission
                if (! Money::equals($data['cash_float'], $closing->cash_float)) {
                    throw new HttpException(403, 'Nemáte oprávnění měnit základ pokladny.');
                }
            } else {
                $closing->cash_float = Money::fromCents(Money::toCents($data['cash_float']));
            }
            $this->syncDepositExpected($closing);
        }

        if (! empty($data['lines']) && is_array($data['lines'])) {
            foreach ($data['lines'] as $lineData) {
                $lineId = $lineData['id'] ?? null;
                if (! $lineId) {
                    continue;
                }
                $line = $closing->paymentLines()->where('id', $lineId)->first();
                if (! $line) {
                    continue;
                }
                if (array_key_exists('actual_amount', $lineData)) {
                    $actual = $lineData['actual_amount'];
                    $line->actual_amount = $actual === null ? null : Money::fromCents(Money::toCents($actual));
                    $line->variance = $line->actual_amount === null
                        ? 0
                        : (float) Money::sub($line->actual_amount, $line->expected_amount);
                    if (Money::isZero($line->variance)) {
                        $line->variance_reason = null;
                        $line->variance_note = null;
                    }
                    $line->save();
                    $this->audit->log($closing, 'closing.payment_actual_changed', $user, [
                        'line_id' => $line->id,
                        'code' => $line->payment_method_code,
                    ], [
                        'actual_amount' => $line->actual_amount,
                        'variance' => $line->variance,
                    ]);
                }
            }
        }

        $this->recalculateTotals($closing);
        $this->refreshStatus($closing);
        $closing->save();

        $this->audit->log($closing, 'closing.autosaved', $user, $old, [
            'current_step' => $closing->current_step,
            'cash_float' => $closing->cash_float,
        ]);

        return $this->detailPayload($closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']), $hotel);
    }

    public function acknowledgePreflight(Hotel $hotel, User $user, string $id): array
    {
        $closing = $this->findEditable($hotel, $id);
        $result = $closing->preflight_result ?? [];
        if (($result['blocking_count'] ?? 0) > 0) {
            throw ValidationException::withMessages([
                'preflight' => 'Nejdříve vyřešte blokující problémy.',
            ]);
        }

        $closing->preflight_ack_at = now();
        if ($closing->current_step < 2) {
            $closing->current_step = 2;
        }
        $closing->save();

        $this->audit->log($closing, 'closing.preflight_acked', $user);

        return $this->detailPayload($closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']), $hotel);
    }

    public function saveCashCount(Hotel $hotel, User $user, string $id, array $data): array
    {
        $closing = $this->findEditable($hotel, $id);
        $currency = strtoupper($data['currency'] ?? $closing->primary_currency);
        $summary = $this->cashCount->summarize($currency, $data['rows'] ?? []);

        $connection = config('otelapps.db_connection');
        DB::connection($connection)->transaction(function () use ($closing, $currency, $summary, $user) {
            HotelFinancialClosingCashCount::query()
                ->where('closing_id', $closing->id)
                ->where('currency', $currency)
                ->delete();

            foreach ($summary['rows'] as $row) {
                if ($row['quantity'] <= 0) {
                    continue;
                }
                HotelFinancialClosingCashCount::query()->create([
                    'closing_id' => $closing->id,
                    'currency' => $currency,
                    'denomination' => $row['denomination'],
                    'quantity' => $row['quantity'],
                    'amount' => $row['amount'],
                    'created_at' => now(),
                ]);
            }

            $cashLine = $closing->paymentLines()
                ->where('is_cash', true)
                ->where('currency', $currency)
                ->first();

            if ($cashLine) {
                $cashLine->actual_amount = $summary['total'];
                $cashLine->variance = (float) Money::sub($cashLine->actual_amount, $cashLine->expected_amount);
                if (Money::isZero($cashLine->variance)) {
                    $cashLine->variance_reason = null;
                    $cashLine->variance_note = null;
                }
                $cashLine->save();
            }

            $this->recalculateTotals($closing);
            $this->syncDepositExpected($closing);
            $this->refreshStatus($closing);
            $closing->save();

            $this->audit->log($closing, 'closing.cash_count_saved', $user, null, [
                'currency' => $currency,
                'total' => $summary['total'],
            ]);
        });

        return $this->detailPayload($closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']), $hotel);
    }

    public function resolveVariance(Hotel $hotel, User $user, string $id, array $data): array
    {
        $closing = $this->findEditable($hotel, $id);
        $line = $closing->paymentLines()->where('id', $data['line_id'])->firstOrFail();

        $reasons = config_array('otelapps.finance.variance_reasons');
        $reason = $data['reason'] ?? null;
        if (! is_string($reason) || ! array_key_exists($reason, $reasons)) {
            throw ValidationException::withMessages(['reason' => 'Vyberte platný důvod rozdílu.']);
        }

        $old = ['variance_reason' => $line->variance_reason, 'variance_note' => $line->variance_note];
        $line->variance_reason = $reason;
        $line->variance_note = $data['note'] ?? null;
        $line->save();

        $this->refreshStatus($closing);
        $closing->save();

        $this->audit->log($closing, 'closing.variance_resolved', $user, $old, [
            'line_id' => $line->id,
            'reason' => $reason,
            'note' => $line->variance_note,
            'variance' => $line->variance,
        ]);

        return $this->detailPayload($closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']), $hotel);
    }

    public function reconciliationHints(Hotel $hotel, string $id, ?string $lineId = null): array
    {
        $closing = $this->findOrFail($hotel, $id);
        $line = $lineId
            ? $closing->paymentLines()->where('id', $lineId)->first()
            : $closing->paymentLines()->where('is_cash', true)->first();

        if (! $line || Money::isZero($line->variance)) {
            return ['hints' => [], 'message' => null];
        }

        $hints = $this->reconciliation->hints($closing, $line->currency, $line->variance);

        return [
            'hints' => $hints,
            'message' => sprintf(
                'Tyto transakce mohou souviset s rozdílem %s %s.',
                Money::fromCents(Money::toCents($line->variance)),
                $line->currency
            ),
            'line_id' => $line->id,
        ];
    }

    public function saveDeposit(Hotel $hotel, User $user, string $id, array $data): array
    {
        $closing = $this->findEditable($hotel, $id);
        $currency = strtoupper($data['currency'] ?? $closing->primary_currency);
        $destinations = config_array('otelapps.finance.deposit_destinations');
        $destination = $data['destination'] ?? 'safe';
        if (! array_key_exists($destination, $destinations)) {
            throw ValidationException::withMessages(['destination' => 'Neplatný cíl odvodu.']);
        }

        $this->syncDepositExpected($closing);
        $expected = $closing->deposit_expected ?? 0;
        $actual = Money::fromCents(Money::toCents($data['actual_amount'] ?? $expected));

        $deposit = $closing->deposits()->where('currency', $currency)->first();
        if (! $deposit) {
            $deposit = new HotelFinancialClosingDeposit([
                'closing_id' => $closing->id,
                'currency' => $currency,
            ]);
        }
        $deposit->expected_amount = $expected;
        $deposit->actual_amount = $actual;
        $deposit->destination = $destination;
        $deposit->reference = $data['reference'] ?? null;
        $deposit->note = $data['note'] ?? null;
        $deposit->save();

        $closing->deposit_expected = $expected;
        $closing->deposit_actual = $actual;
        if ($closing->current_step < 3) {
            $closing->current_step = 3;
        }
        $closing->save();

        $this->audit->log($closing, 'closing.deposit_created', $user, null, [
            'actual' => $actual,
            'destination' => $destination,
        ]);

        return $this->detailPayload($closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']), $hotel);
    }

    public function complete(Hotel $hotel, User $user, string $id): array
    {
        if (! $user->hasPermission('finance.closing.complete') && ! $user->isSuperAdmin()) {
            throw new HttpException(403, 'Nemáte oprávnění dokončit uzávěrku.');
        }

        $closing = $this->findEditable($hotel, $id);
        $closing->load(['paymentLines', 'cashCounts', 'deposits']);

        $this->assertCanComplete($closing);

        $snapshot = $this->buildSnapshot($closing, $hotel);
        $handover = $this->buildHandoverSummary($closing);

        $closing->status = HotelFinancialClosing::STATUS_COMPLETED;
        $closing->completed_by = $user->id;
        $closing->completed_by_name = $user->name;
        $closing->completed_at = now();
        $closing->locked_at = now();
        $closing->snapshot = $snapshot;
        $closing->handover_summary = $handover;
        $closing->current_step = 4;
        $closing->save();

        $this->audit->log($closing, 'closing.completed', $user, null, [
            'expected_total' => $closing->expected_total,
            'actual_total' => $closing->actual_total,
            'variance_total' => $closing->variance_total,
            'deposit_actual' => $closing->deposit_actual,
        ]);

        return $this->detailPayload($closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']), $hotel);
    }

    public function reopen(Hotel $hotel, User $user, string $id, string $reason): array
    {
        if (! $user->hasPermission('finance.closing.reopen') && ! $user->isSuperAdmin()) {
            throw new HttpException(403, 'Nemáte oprávnění znovu otevřít uzávěrku.');
        }

        $closing = $this->findOrFail($hotel, $id);
        if ($closing->status !== HotelFinancialClosing::STATUS_COMPLETED) {
            throw ValidationException::withMessages(['status' => 'Znovu otevřít lze jen dokončenou uzávěrku.']);
        }

        $open = HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('status', HotelFinancialClosing::OPEN_STATUSES)
            ->where('id', '!=', $closing->id)
            ->exists();
        if ($open) {
            throw new ConflictHttpException('Nejdříve dokončete nebo uzavřete jinou rozpracovanou uzávěrku.');
        }

        $oldSnapshot = $closing->snapshot;
        $closing->status = HotelFinancialClosing::STATUS_REOPENED;
        $closing->locked_at = null;
        $closing->reopened_by = $user->id;
        $closing->reopened_by_name = $user->name;
        $closing->reopened_at = now();
        $closing->reopen_reason = $reason;
        $closing->current_step = 2;
        $closing->save();

        $this->audit->log($closing, 'closing.reopened', $user, [
            'snapshot_preserved' => $oldSnapshot !== null,
        ], [
            'reason' => $reason,
        ]);

        return $this->detailPayload($closing->fresh(['paymentLines', 'cashCounts', 'deposits', 'events']), $hotel);
    }

    public function transactions(Hotel $hotel, string $id, array $filters = []): array
    {
        $closing = $this->findOrFail($hotel, $id);
        $ids = $closing->payment_ids ?? [];

        $q = HotelPayment::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('id', $ids ?: ['00000000-0000-0000-0000-000000000000'])
            ->with(['paymentMethod', 'terminal'])
            ->orderByDesc('paid_at');

        if (! empty($filters['payment_method_id'])) {
            $q->where('payment_method_id', $filters['payment_method_id']);
        }
        if (! empty($filters['currency'])) {
            $q->where('currency', $filters['currency']);
        }

        return [
            'transactions' => $q->get()->map(fn (HotelPayment $p) => $this->paymentItem($p))->values()->all(),
        ];
    }

    public function report(Hotel $hotel, string $id): array
    {
        $closing = $this->findOrFail($hotel, $id);
        $closing->load(['paymentLines', 'cashCounts', 'deposits', 'events']);

        if ($closing->snapshot) {
            return [
                'report' => $closing->snapshot,
                'from_snapshot' => true,
                'handover_summary' => $closing->handover_summary,
            ];
        }

        return [
            'report' => $this->buildSnapshot($closing, $hotel),
            'from_snapshot' => false,
            'handover_summary' => $closing->handover_summary,
        ];
    }

    public function listDeposits(Hotel $hotel): array
    {
        $closings = HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->where('status', HotelFinancialClosing::STATUS_COMPLETED)
            ->whereNotNull('deposit_actual')
            ->orderByDesc('completed_at')
            ->limit(50)
            ->get();

        return [
            'deposits' => $closings->map(fn (HotelFinancialClosing $c) => [
                'closing_id' => $c->id,
                'business_date' => optional($c->business_date)?->toDateString(),
                'completed_at' => optional($c->completed_at)?->toIso8601String(),
                'completed_by_name' => $c->completed_by_name,
                'amount' => Money::fromCents(Money::toCents($c->deposit_actual)),
                'currency' => $c->primary_currency,
                'cash_float' => Money::fromCents(Money::toCents($c->cash_float)),
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function settingsFor(Hotel $hotel): array
    {
        $row = HotelFinanceSetting::query()->find($hotel->id);
        $cfg = config_array('otelapps.finance');

        return [
            'financial_day_start_time' => $row?->financial_day_start_time ?? ($cfg['financial_day_start_time'] ?? '06:00'),
            'default_cash_float' => (float) ($row?->default_cash_float ?? ($cfg['default_cash_float'] ?? 5000)),
            'closing_variance_warning' => (float) ($row?->closing_variance_warning ?? ($cfg['closing_variance_warning'] ?? 10)),
            'closing_variance_blocking' => (float) ($row?->closing_variance_blocking ?? ($cfg['closing_variance_blocking'] ?? 100)),
            'primary_currency' => $row?->primary_currency ?? config('otelapps.currency', 'CZK'),
            'denominations' => $cfg['denominations'] ?? [],
            'variance_reasons' => $cfg['variance_reasons'] ?? [],
            'deposit_destinations' => $cfg['deposit_destinations'] ?? [],
        ];
    }

    private function findOrFail(Hotel $hotel, string $id): HotelFinancialClosing
    {
        return HotelFinancialClosing::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', $id)
            ->firstOrFail();
    }

    private function findEditable(Hotel $hotel, string $id): HotelFinancialClosing
    {
        $closing = $this->findOrFail($hotel, $id);
        if (! $closing->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Dokončenou uzávěrku nelze upravovat. Požádejte manažera o znovuotevření.',
            ]);
        }

        return $closing->loadMissing(['paymentLines', 'cashCounts', 'deposits']);
    }

    private function resolveBusinessDate(Carbon $now, string $startTime): Carbon
    {
        [$h, $m] = array_map('intval', explode(':', $startTime) + [0, 0]);
        $startToday = $now->copy()->startOfDay()->setTime($h, $m, 0);
        if ($now->lt($startToday)) {
            return $now->copy()->subDay()->startOfDay();
        }

        return $now->copy()->startOfDay();
    }

    private function businessDayStart(Carbon $businessDate, string $startTime): Carbon
    {
        [$h, $m] = array_map('intval', explode(':', $startTime) + [0, 0]);

        return $businessDate->copy()->startOfDay()->setTime($h, $m, 0);
    }

    private function buildPaymentLines(HotelFinancialClosing $closing, $completedPayments, string $primaryCurrency): void
    {
        $methods = HotelPaymentMethod::query()
            ->where('hotel_id', $closing->hotel_id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $grouped = $completedPayments->groupBy(fn (HotelPayment $p) => $p->payment_method_id.'|'.$p->currency);

        foreach ($methods as $method) {
            $currencies = $completedPayments
                ->where('payment_method_id', $method->id)
                ->pluck('currency')
                ->unique()
                ->values();

            if ($currencies->isEmpty()) {
                $currencies = collect([$method->currency ?: $primaryCurrency]);
            }

            foreach ($currencies as $currency) {
                $key = $method->id.'|'.$currency;
                $bucket = $grouped->get($key, collect());
                $expectedCents = $bucket->sum(fn (HotelPayment $p) => Money::toCents($p->amount));
                $expected = Money::fromCents($expectedCents);

                $actual = null;
                if (! $method->requires_manual_count && ! $method->is_cash) {
                    $actual = $expected;
                }

                HotelFinancialClosingPaymentLine::query()->create([
                    'closing_id' => $closing->id,
                    'payment_method_id' => $method->id,
                    'payment_method_code' => $method->code,
                    'payment_method_label' => $method->label,
                    'currency' => $currency,
                    'is_cash' => (bool) $method->is_cash,
                    'requires_manual_count' => (bool) $method->requires_manual_count,
                    'expected_amount' => $expected,
                    'actual_amount' => $actual,
                    'variance' => $actual === null ? 0 : (float) Money::sub($actual, $expected),
                    'transaction_count' => $bucket->count(),
                    'sort_order' => $method->sort_order,
                ]);
            }
        }
    }

    private function recalculateTotals(HotelFinancialClosing $closing): void
    {
        $lines = $closing->paymentLines()->get();
        $primary = $closing->primary_currency;
        $byCurrency = [];

        foreach ($lines as $line) {
            $cur = $line->currency;
            if (! isset($byCurrency[$cur])) {
                $byCurrency[$cur] = ['expected' => 0, 'actual' => 0, 'variance' => 0];
            }
            $byCurrency[$cur]['expected'] += Money::toCents($line->expected_amount);
            $byCurrency[$cur]['actual'] += Money::toCents($line->actual_amount ?? 0);
            $byCurrency[$cur]['variance'] += Money::toCents($line->variance);
        }

        $formatted = [];
        foreach ($byCurrency as $cur => $cents) {
            $formatted[$cur] = [
                'expected' => Money::fromCents($cents['expected']),
                'actual' => Money::fromCents($cents['actual']),
                'variance' => Money::fromCents($cents['variance']),
            ];
        }

        if ($formatted === []) {
            $formatted = [
                $primary => [
                    'expected' => '0.00',
                    'actual' => '0.00',
                    'variance' => '0.00',
                ],
            ];
        }

        $primaryCents = $byCurrency[$primary] ?? ['expected' => 0, 'actual' => 0, 'variance' => 0];
        $closing->expected_total = (float) Money::fromCents($primaryCents['expected']);
        $closing->actual_total = (float) Money::fromCents($primaryCents['actual']);
        $closing->variance_total = (float) Money::fromCents($primaryCents['variance']);
        $closing->totals_by_currency = $formatted;
        $closing->save();
    }

    private function syncDepositExpected(HotelFinancialClosing $closing): void
    {
        $cashLine = $closing->paymentLines()
            ->where('is_cash', true)
            ->where('currency', $closing->primary_currency)
            ->first();

        $cashActual = $cashLine?->actual_amount;
        if ($cashActual === null) {
            $closing->deposit_expected = null;

            return;
        }

        $closing->deposit_expected = (float) Money::sub($cashActual, $closing->cash_float);
        if (Money::toCents($closing->deposit_expected) < 0) {
            $closing->deposit_expected = 0;
        }
    }

    private function refreshStatus(HotelFinancialClosing $closing): void
    {
        $unresolved = $closing->paymentLines()
            ->where('variance', '!=', 0)
            ->where(function ($q) {
                $q->whereNull('variance_reason')->orWhere('variance_reason', '');
            })
            ->exists();

        $missingActual = $closing->paymentLines()->whereNull('actual_amount')->exists();

        if ($unresolved || $missingActual) {
            if ($closing->status !== HotelFinancialClosing::STATUS_REOPENED) {
                $closing->status = HotelFinancialClosing::STATUS_WAITING;
            }
        } elseif ($closing->status === HotelFinancialClosing::STATUS_WAITING) {
            $closing->status = HotelFinancialClosing::STATUS_IN_PROGRESS;
        }
    }

    private function assertCanComplete(HotelFinancialClosing $closing): void
    {
        $settings = $this->settingsFor(
            Hotel::query()->findOrFail($closing->hotel_id)
        );

        if (($closing->preflight_result['blocking_count'] ?? 0) > 0) {
            throw ValidationException::withMessages([
                'preflight' => 'Uzávěrku nelze dokončit — existují blokující problémy.',
            ]);
        }

        if (($closing->preflight_result['warning_count'] ?? 0) > 0 && ! $closing->preflight_ack_at) {
            throw ValidationException::withMessages([
                'preflight' => 'Nejdříve potvrďte varování v kontrole plateb.',
            ]);
        }

        $missing = $closing->paymentLines()->whereNull('actual_amount')->exists();
        if ($missing) {
            throw ValidationException::withMessages([
                'lines' => 'Vyplňte skutečný stav u všech způsobů platby.',
            ]);
        }

        $unresolved = $closing->paymentLines()
            ->where('variance', '!=', 0)
            ->where(function ($q) {
                $q->whereNull('variance_reason')->orWhere('variance_reason', '');
            })
            ->get();

        foreach ($unresolved as $line) {
            throw ValidationException::withMessages([
                'variance' => sprintf(
                    '%s nesedí o %s %s. Přepočítejte nebo vysvětlete rozdíl.',
                    $line->payment_method_label,
                    Money::abs($line->variance),
                    $line->currency
                ),
            ]);
        }

        // Blocking variance without reason already caught; also block huge unexplained — reasons required anyway
        foreach ($closing->paymentLines as $line) {
            if (! Money::isZero($line->variance)
                && Money::compareAbs($line->variance, $settings['closing_variance_blocking']) >= 0
                && empty($line->variance_reason)) {
                throw ValidationException::withMessages([
                    'variance' => sprintf('Výrazný rozdíl u %s musí být vysvětlen.', $line->payment_method_label),
                ]);
            }
        }

        if ($closing->deposit_actual === null) {
            throw ValidationException::withMessages([
                'deposit' => 'Zadejte skutečný odvod hotovosti.',
            ]);
        }
    }

    private function buildSnapshot(HotelFinancialClosing $closing, Hotel $hotel): array
    {
        $terminals = HotelPaymentTerminal::query()
            ->where('hotel_id', $hotel->id)
            ->where('is_active', true)
            ->get();

        $terminalBreakdown = [];
        if ($terminals->isNotEmpty() && ! empty($closing->payment_ids)) {
            $payments = HotelPayment::query()
                ->whereIn('id', $closing->payment_ids)
                ->where('status', 'completed')
                ->whereNotNull('terminal_id')
                ->get()
                ->groupBy('terminal_id');

            foreach ($terminals as $terminal) {
                $sum = Money::fromCents(
                    ($payments->get($terminal->id) ?? collect())->sum(fn ($p) => Money::toCents($p->amount))
                );
                $terminalBreakdown[] = [
                    'id' => $terminal->id,
                    'name' => $terminal->name,
                    'expected' => $sum,
                    'actual' => $sum,
                    'variance' => '0.00',
                ];
            }
        }

        return [
            'hotel' => ['id' => $hotel->id, 'name' => $hotel->name, 'slug' => $hotel->slug],
            'business_date' => optional($closing->business_date)?->toDateString(),
            'period_start' => optional($closing->period_start)?->toIso8601String(),
            'period_end' => optional($closing->period_end)?->toIso8601String(),
            'primary_currency' => $closing->primary_currency,
            'expected_total' => Money::fromCents(Money::toCents($closing->expected_total)),
            'actual_total' => Money::fromCents(Money::toCents($closing->actual_total)),
            'variance_total' => Money::fromCents(Money::toCents($closing->variance_total)),
            'totals_by_currency' => $closing->totals_by_currency,
            'cash_float' => Money::fromCents(Money::toCents($closing->cash_float)),
            'deposit_expected' => $closing->deposit_expected !== null ? Money::fromCents(Money::toCents($closing->deposit_expected)) : null,
            'deposit_actual' => $closing->deposit_actual !== null ? Money::fromCents(Money::toCents($closing->deposit_actual)) : null,
            'payment_lines' => $closing->paymentLines->map(fn ($l) => [
                'payment_method_code' => $l->payment_method_code,
                'payment_method_label' => $l->payment_method_label,
                'currency' => $l->currency,
                'is_cash' => (bool) $l->is_cash,
                'expected_amount' => Money::fromCents(Money::toCents($l->expected_amount)),
                'actual_amount' => $l->actual_amount !== null ? Money::fromCents(Money::toCents($l->actual_amount)) : null,
                'variance' => Money::fromCents(Money::toCents($l->variance)),
                'variance_reason' => $l->variance_reason,
                'variance_note' => $l->variance_note,
                'transaction_count' => $l->transaction_count,
            ])->values()->all(),
            'cash_counts' => $closing->cashCounts->map(fn ($c) => [
                'currency' => $c->currency,
                'denomination' => Money::fromCents(Money::toCents($c->denomination)),
                'quantity' => $c->quantity,
                'amount' => Money::fromCents(Money::toCents($c->amount)),
            ])->values()->all(),
            'deposits' => $closing->deposits->map(fn ($d) => [
                'currency' => $d->currency,
                'expected_amount' => Money::fromCents(Money::toCents($d->expected_amount)),
                'actual_amount' => Money::fromCents(Money::toCents($d->actual_amount)),
                'destination' => $d->destination,
                'reference' => $d->reference,
                'note' => $d->note,
            ])->values()->all(),
            'terminals' => $terminalBreakdown,
            'payment_ids' => $closing->payment_ids,
            'started_by_name' => $closing->started_by_name,
            'completed_by_name' => $closing->completed_by_name,
            'completed_at' => optional($closing->completed_at)?->toIso8601String(),
            'created_at' => now()->toIso8601String(),
        ];
    }

    private function buildHandoverSummary(HotelFinancialClosing $closing): string
    {
        $notes = $closing->paymentLines->filter(fn ($l) => ! empty($l->variance_note))->count();

        return sprintf(
            "Uzávěrka dokončena.\nTržby %s %s.\nCelkový rozdíl %s %s.\nOdvod %s %s.\n%d poznámek k rozdílům.",
            Money::fromCents(Money::toCents($closing->expected_total)),
            $closing->primary_currency,
            Money::fromCents(Money::toCents($closing->variance_total)),
            $closing->primary_currency,
            Money::fromCents(Money::toCents($closing->deposit_actual ?? 0)),
            $closing->primary_currency,
            $notes
        );
    }

    private function summaryItem(HotelFinancialClosing $c): array
    {
        return [
            'id' => $c->id,
            'business_date' => optional($c->business_date)?->toDateString(),
            'period_start' => optional($c->period_start)?->toIso8601String(),
            'period_end' => optional($c->period_end)?->toIso8601String(),
            'status' => $c->status,
            'started_by_name' => $c->started_by_name,
            'completed_by_name' => $c->completed_by_name,
            'completed_at' => optional($c->completed_at)?->toIso8601String(),
            'started_at' => optional($c->started_at)?->toIso8601String(),
            'expected_total' => Money::fromCents(Money::toCents($c->expected_total)),
            'actual_total' => Money::fromCents(Money::toCents($c->actual_total)),
            'variance_total' => Money::fromCents(Money::toCents($c->variance_total)),
            'deposit_actual' => $c->deposit_actual !== null ? Money::fromCents(Money::toCents($c->deposit_actual)) : null,
            'primary_currency' => $c->primary_currency,
            'current_step' => $c->current_step,
            'locked' => $c->isLocked(),
        ];
    }

    private function detailPayload(HotelFinancialClosing $closing, Hotel $hotel): array
    {
        $settings = $this->settingsFor($hotel);

        return [
            'closing' => [
                ...$this->summaryItem($closing),
                'cash_float' => Money::fromCents(Money::toCents($closing->cash_float)),
                'deposit_expected' => $closing->deposit_expected !== null
                    ? Money::fromCents(Money::toCents($closing->deposit_expected))
                    : null,
                'preflight_ack_at' => optional($closing->preflight_ack_at)?->toIso8601String(),
                'preflight_result' => $closing->preflight_result,
                'totals_by_currency' => $closing->totals_by_currency,
                'handover_summary' => $closing->handover_summary,
                'reopen_reason' => $closing->reopen_reason,
                'reopened_at' => optional($closing->reopened_at)?->toIso8601String(),
                'reopened_by_name' => $closing->reopened_by_name,
                'editable' => $closing->isEditable(),
                'payment_lines' => $closing->paymentLines->map(function ($l) use ($settings) {
                    $absVar = Money::toCents($l->variance);
                    $level = 'ok';
                    if ($absVar !== 0) {
                        $level = Money::compareAbs($l->variance, $settings['closing_variance_blocking']) >= 0
                            ? 'blocking'
                            : (Money::compareAbs($l->variance, $settings['closing_variance_warning']) >= 0 ? 'warning' : 'ok');
                        if ($level === 'ok' && $absVar !== 0) {
                            $level = 'warning';
                        }
                    }

                    return [
                        'id' => $l->id,
                        'payment_method_id' => $l->payment_method_id,
                        'payment_method_code' => $l->payment_method_code,
                        'payment_method_label' => $l->payment_method_label,
                        'currency' => $l->currency,
                        'is_cash' => $l->is_cash,
                        'requires_manual_count' => $l->requires_manual_count,
                        'expected_amount' => Money::fromCents(Money::toCents($l->expected_amount)),
                        'actual_amount' => $l->actual_amount !== null ? Money::fromCents(Money::toCents($l->actual_amount)) : null,
                        'variance' => Money::fromCents(Money::toCents($l->variance)),
                        'variance_reason' => $l->variance_reason,
                        'variance_note' => $l->variance_note,
                        'transaction_count' => $l->transaction_count,
                        'variance_level' => $level,
                        'resolved' => Money::isZero($l->variance) || ! empty($l->variance_reason),
                    ];
                })->values()->all(),
                'cash_counts' => $closing->cashCounts->map(fn ($c) => [
                    'currency' => $c->currency,
                    'denomination' => Money::fromCents(Money::toCents($c->denomination)),
                    'quantity' => $c->quantity,
                    'amount' => Money::fromCents(Money::toCents($c->amount)),
                ])->values()->all(),
                'deposits' => $closing->deposits->map(fn ($d) => [
                    'id' => $d->id,
                    'currency' => $d->currency,
                    'expected_amount' => Money::fromCents(Money::toCents($d->expected_amount)),
                    'actual_amount' => Money::fromCents(Money::toCents($d->actual_amount)),
                    'destination' => $d->destination,
                    'reference' => $d->reference,
                    'note' => $d->note,
                ])->values()->all(),
                'events' => $closing->relationLoaded('events')
                    ? $closing->events->map(fn ($e) => [
                        'action' => $e->action,
                        'user_name' => $e->user_name,
                        'created_at' => optional($e->created_at)?->toIso8601String(),
                        'old_value' => $e->old_value,
                        'new_value' => $e->new_value,
                    ])->values()->all()
                    : [],
            ],
            'settings' => $settings,
            'can_complete' => $this->canCompletePreview($closing),
        ];
    }

    private function canCompletePreview(HotelFinancialClosing $closing): bool
    {
        try {
            $this->assertCanComplete($closing);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function paymentItem(HotelPayment $p): array
    {
        return [
            'id' => $p->id,
            'amount' => Money::fromCents(Money::toCents($p->amount)),
            'currency' => $p->currency,
            'status' => $p->status,
            'paid_at' => optional($p->paid_at)?->toIso8601String(),
            'guest_name' => $p->guest_name,
            'note' => $p->note,
            'source' => $p->source,
            'payment_method' => $p->paymentMethod?->label,
            'payment_method_id' => $p->payment_method_id,
            'terminal' => $p->terminal?->name,
        ];
    }
}
