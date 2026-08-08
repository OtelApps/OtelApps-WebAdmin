<?php

namespace App\Services;

use App\Models\HotelFinancialClosing;
use App\Models\HotelPayment;
use App\Support\Money;
use Illuminate\Support\Collection;

class ClosingReconciliationService
{
    /**
     * @return list<array{id: string, amount: string, currency: string, paid_at: string|null, guest_name: string|null, note: string|null, reason: string}>
     */
    public function hints(HotelFinancialClosing $closing, string $currency, string|float $varianceAmount): array
    {
        $targetCents = abs(Money::toCents($varianceAmount));
        if ($targetCents === 0) {
            return [];
        }

        $ids = $closing->payment_ids ?? [];
        if ($ids === []) {
            return [];
        }

        /** @var Collection<int, HotelPayment> $payments */
        $payments = HotelPayment::query()
            ->where('hotel_id', $closing->hotel_id)
            ->whereIn('id', $ids)
            ->where('currency', $currency)
            ->where('status', 'completed')
            ->with('paymentMethod')
            ->orderByDesc('paid_at')
            ->get();

        $hints = [];

        foreach ($payments as $payment) {
            $cents = abs(Money::toCents($payment->amount));
            $reason = null;

            if ($cents === $targetCents) {
                $reason = Money::toCents($payment->amount) < 0
                    ? 'Částka odpovídá refundaci'
                    : 'Částka přesně odpovídá rozdílu';
            } elseif ($cents === $targetCents * 2) {
                $reason = 'Možný duplicitní záznam (2× částka)';
            }

            $meta = $payment->metadata ?? [];
            if (($meta['manually_edited'] ?? false) === true && $reason === null) {
                $reason = 'Manuálně upravená platba';
            }

            if ($reason === null) {
                continue;
            }

            $hints[] = [
                'id' => $payment->id,
                'amount' => Money::fromCents(Money::toCents($payment->amount)),
                'currency' => $payment->currency,
                'paid_at' => optional($payment->paid_at)?->toIso8601String(),
                'guest_name' => $payment->guest_name,
                'note' => $payment->note,
                'payment_method' => $payment->paymentMethod?->label,
                'source' => $payment->source,
                'reason' => $reason,
            ];
        }

        // Platby blízko konce období
        foreach ($payments->take(20) as $payment) {
            if ($closing->period_end && $payment->paid_at
                && $payment->paid_at->greaterThan($closing->period_end->copy()->subMinutes(20))) {
                $already = collect($hints)->contains(fn ($h) => $h['id'] === $payment->id);
                if (! $already) {
                    $hints[] = [
                        'id' => $payment->id,
                        'amount' => Money::fromCents(Money::toCents($payment->amount)),
                        'currency' => $payment->currency,
                        'paid_at' => optional($payment->paid_at)?->toIso8601String(),
                        'guest_name' => $payment->guest_name,
                        'note' => $payment->note,
                        'payment_method' => $payment->paymentMethod?->label,
                        'source' => $payment->source,
                        'reason' => 'Transakce těsně před uzávěrkou',
                    ];
                }
            }
        }

        return array_slice($hints, 0, 15);
    }
}
