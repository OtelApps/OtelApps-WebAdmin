<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelPayment;
use App\Models\HotelPaymentMethod;
use App\Support\Money;

class HotelPaymentService
{
    public function list(Hotel $hotel, array $filters = []): array
    {
        $q = HotelPayment::query()
            ->where('hotel_id', $hotel->id)
            ->with(['paymentMethod', 'terminal'])
            ->orderByDesc('paid_at');

        if (! empty($filters['status'])) {
            $q->where('status', $filters['status']);
        }
        if (! empty($filters['payment_method_id'])) {
            $q->where('payment_method_id', $filters['payment_method_id']);
        }
        if (! empty($filters['from'])) {
            $q->where('paid_at', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $q->where('paid_at', '<=', $filters['to']);
        }
        if (! empty($filters['currency'])) {
            $q->where('currency', $filters['currency']);
        }

        $limit = min(200, max(1, (int) ($filters['limit'] ?? 100)));

        $payments = $q->limit($limit)->get();

        $methods = HotelPaymentMethod::query()
            ->where('hotel_id', $hotel->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'label', 'is_cash']);

        return [
            'payments' => $payments->map(fn (HotelPayment $p) => [
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
            ])->values()->all(),
            'methods' => $methods,
        ];
    }
}
