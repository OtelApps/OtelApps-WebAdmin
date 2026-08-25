<?php

namespace App\Support;

/**
 * Peníze v minor units (centech) — žádný floating point drift.
 */
final class Money
{
    public static function toCents(int|float|string|null $amount): int
    {
        if ($amount === null || $amount === '') {
            return 0;
        }

        return (int) round(((float) $amount) * 100);
    }

    public static function fromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    public static function add(int|float|string|null ...$amounts): string
    {
        $sum = 0;
        foreach ($amounts as $amount) {
            $sum += self::toCents($amount);
        }

        return self::fromCents($sum);
    }

    public static function sub(int|float|string|null $a, int|float|string|null $b): string
    {
        return self::fromCents(self::toCents($a) - self::toCents($b));
    }

    public static function abs(int|float|string|null $amount): string
    {
        return self::fromCents(abs(self::toCents($amount)));
    }

    public static function equals(int|float|string|null $a, int|float|string|null $b): bool
    {
        return self::toCents($a) === self::toCents($b);
    }

    public static function isZero(int|float|string|null $amount): bool
    {
        return self::toCents($amount) === 0;
    }

    public static function compareAbs(int|float|string|null $amount, int|float|string|null $threshold): int
    {
        return abs(self::toCents($amount)) <=> self::toCents($threshold);
    }
}
