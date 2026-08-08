<?php

namespace Tests\Unit;

use App\Support\Money;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    public function test_cents_roundtrip(): void
    {
        $this->assertSame(199999, Money::toCents('1999.99'));
        $this->assertSame('1999.99', Money::fromCents(199999));
    }

    public function test_avoids_float_drift(): void
    {
        $sum = Money::add('0.1', '0.2');
        $this->assertSame('0.30', $sum);
    }

    public function test_sub_and_variance(): void
    {
        $this->assertSame('-10.00', Money::sub('45970', '45980'));
        $this->assertTrue(Money::isZero(Money::sub('100', '100')));
        $this->assertSame('10.00', Money::abs('-10'));
    }

    public function test_compare_abs(): void
    {
        $this->assertSame(1, Money::compareAbs('-150', '100'));
        $this->assertSame(0, Money::compareAbs('10', '10'));
        $this->assertSame(-1, Money::compareAbs('5', '10'));
    }
}
