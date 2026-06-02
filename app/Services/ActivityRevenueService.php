<?php

namespace App\Services;

use App\Models\HotelServiceRequest;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ActivityRevenueService
{
    /** Statusy vyloučené z výpočtu tržeb */
    private const EXCLUDED_STATUSES = ['rejected', 'archived'];

    /** Kořenové klíče pro celkovou částku objednávky */
    private const TOTAL_KEYS = ['total_amount', 'totalAmount', 'total', 'amount', 'grand_total', 'grandTotal'];

    /** Klíče pole položek v metadata */
    private const ITEM_LIST_KEYS = ['items', 'line_items', 'lineItems', 'order_items', 'orderItems', 'products'];

    /**
     * Částka z metadata — součet cen služeb (položky), případně explicitní total pokud je > 0.
     */
    public function amountFromMetadata(mixed $metadata): float
    {
        $meta = $this->normalizeMetadata($metadata);
        if ($meta === null) {
            return 0.0;
        }

        $itemsSum = $this->sumItemPrices($meta);
        $explicitTotal = $this->explicitTotal($meta);

        if ($explicitTotal > 0 && $itemsSum > 0) {
            // Mobil může posílat total_amount i rozpis — vezmi vyšší (ochrana před podhodnocením)
            return max($explicitTotal, $itemsSum);
        }

        if ($explicitTotal > 0) {
            return $explicitTotal;
        }

        return $itemsSum;
    }

    /**
     * @return array{
     *   period: string,
     *   currency: string,
     *   today_total: float,
     *   period_total: float,
     *   order_count: int,
     *   categories: list<array{key: string, label: string, amount: float, count: int, percent: float}>,
     *   recent_orders: list<array<string, mixed>>
     * }
     */
    public function summarize(Collection $requests, string $period = 'today'): array
    {
        $tz = config('app.timezone', 'Europe/Prague');
        $now = Carbon::now($tz);

        [$from, $to] = match ($period) {
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };

        $filtered = $requests->filter(function (HotelServiceRequest $r) use ($from, $to) {
            if (in_array($r->status, self::EXCLUDED_STATUSES, true)) {
                return false;
            }
            $created = $r->created_at;
            if (! $created) {
                return false;
            }

            return $created->between($from, $to);
        });

        $todayFrom = $now->copy()->startOfDay();
        $todayTo = $now->copy()->endOfDay();
        $todayTotal = 0.0;
        $periodTotal = 0.0;

        $byCategory = [];

        foreach ($filtered as $request) {
            $amount = $this->amountFromMetadata($request->metadata);
            $periodTotal += $amount;

            $key = $request->service_module ?: 'other';
            $label = $request->service_label ?: $key;

            if (! isset($byCategory[$key])) {
                $byCategory[$key] = [
                    'key' => $key,
                    'label' => $label,
                    'amount' => 0.0,
                    'count' => 0,
                ];
            }
            $byCategory[$key]['amount'] += $amount;
            $byCategory[$key]['count']++;
        }

        foreach ($requests as $request) {
            if (in_array($request->status, self::EXCLUDED_STATUSES, true)) {
                continue;
            }
            $created = $request->created_at;
            if (! $created || ! $created->between($todayFrom, $todayTo)) {
                continue;
            }
            $todayTotal += $this->amountFromMetadata($request->metadata);
        }

        $categories = collect($byCategory)
            ->map(function (array $cat) {
                $cat['amount'] = round($cat['amount'], 2);

                return $cat;
            })
            ->values()
            ->sortByDesc('amount')
            ->values()
            ->all();

        $categoriesSum = round((float) collect($categories)->sum('amount'), 2);
        $periodTotal = round($periodTotal, 2);
        $todayTotal = round($todayTotal, 2);

        // Celkový součet = součet kategorií (konzistence UI)
        if ($periodTotal <= 0 && $categoriesSum > 0) {
            $periodTotal = $categoriesSum;
        }

        $totalForPercent = $periodTotal > 0
            ? $periodTotal
            : (float) collect($categories)->sum('count');

        foreach ($categories as &$cat) {
            $cat['percent'] = $totalForPercent > 0
                ? round(($periodTotal > 0 ? $cat['amount'] : $cat['count']) / $totalForPercent * 100, 1)
                : 0.0;
        }
        unset($cat);

        if ($periodTotal <= 0 && $totalForPercent > 0) {
            usort($categories, fn ($a, $b) => $b['count'] <=> $a['count']);
        }

        $recent = $filtered->sortByDesc('created_at')->take(10)->map(function (HotelServiceRequest $r) {
            return [
                'id' => $r->id,
                'request_number' => $r->request_number,
                'service_label' => $r->service_label,
                'service_module' => $r->service_module,
                'request_text' => $r->request_text,
                'guest_name' => $r->guest_display_name,
                'room_number' => $r->room_number,
                'status' => $r->status,
                'amount' => round($this->amountFromMetadata($r->metadata), 2),
                'created_at' => $r->created_at?->toIso8601String(),
            ];
        })->values()->all();

        return [
            'period' => $period,
            'currency' => config('otelapps.currency', 'CZK'),
            'today_total' => $todayTotal,
            'period_total' => $periodTotal,
            'categories_total' => $categoriesSum,
            'order_count' => $filtered->count(),
            'categories' => $categories,
            'recent_orders' => $recent,
        ];
    }

    private function normalizeMetadata(mixed $metadata): ?array
    {
        if ($metadata === null || $metadata === '') {
            return null;
        }

        if (is_string($metadata)) {
            $decoded = json_decode($metadata, true);
            if (! is_array($decoded)) {
                return null;
            }
            $metadata = $decoded;
        }

        if (is_object($metadata)) {
            $metadata = json_decode(json_encode($metadata), true);
        }

        return is_array($metadata) ? $metadata : null;
    }

    private function explicitTotal(array $metadata): float
    {
        foreach (self::TOTAL_KEYS as $key) {
            if (! array_key_exists($key, $metadata)) {
                continue;
            }
            $value = $metadata[$key];
            if (is_numeric($value)) {
                $float = (float) $value;
                if ($float > 0) {
                    return $float;
                }
            }
        }

        return 0.0;
    }

    private function sumItemPrices(array $metadata): float
    {
        $sum = 0.0;

        foreach (self::ITEM_LIST_KEYS as $listKey) {
            $items = $metadata[$listKey] ?? null;
            if (! is_array($items)) {
                continue;
            }
            foreach ($items as $item) {
                $sum += $this->itemLineAmount($item);
            }
        }

        return max(0.0, $sum);
    }

    private function itemLineAmount(mixed $item): float
    {
        if (! is_array($item)) {
            return 0.0;
        }

        $qty = (float) ($item['quantity'] ?? $item['qty'] ?? 1);
        if ($qty <= 0) {
            $qty = 1;
        }

        foreach (['line_total', 'lineTotal', 'total', 'subtotal', 'amount'] as $lineKey) {
            if (isset($item[$lineKey]) && is_numeric($item[$lineKey])) {
                return max(0.0, (float) $item[$lineKey]);
            }
        }

        $unit = null;
        foreach (['unit_price', 'unitPrice', 'price', 'unit_amount', 'unitAmount'] as $priceKey) {
            if (isset($item[$priceKey]) && is_numeric($item[$priceKey])) {
                $unit = (float) $item[$priceKey];
                break;
            }
        }

        if ($unit === null) {
            return 0.0;
        }

        return max(0.0, $qty * $unit);
    }
}
