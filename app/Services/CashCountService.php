<?php

namespace App\Services;

use App\Support\Money;

class CashCountService
{
    /**
     * @return list<float|int>
     */
    public function denominationsFor(string $currency): array
    {
        $map = config_array('otelapps.finance.denominations');

        return array_values($map[strtoupper($currency)] ?? $map['CZK'] ?? [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]);
    }

    /**
     * @param  list<array{denomination: float|int|string, quantity: int}>  $rows
     * @return array{total: string, rows: list<array{denomination: string, quantity: int, amount: string}>}
     */
    public function summarize(string $currency, array $rows): array
    {
        $totalCents = 0;
        $normalized = [];

        foreach ($rows as $row) {
            $denom = Money::fromCents(Money::toCents($row['denomination'] ?? 0));
            $qty = max(0, (int) ($row['quantity'] ?? 0));
            $lineCents = Money::toCents($denom) * $qty;
            $totalCents += $lineCents;
            $normalized[] = [
                'denomination' => $denom,
                'quantity' => $qty,
                'amount' => Money::fromCents($lineCents),
            ];
        }

        return [
            'currency' => strtoupper($currency),
            'total' => Money::fromCents($totalCents),
            'rows' => $normalized,
        ];
    }
}
