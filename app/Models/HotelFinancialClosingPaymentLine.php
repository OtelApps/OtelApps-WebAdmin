<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelFinancialClosingPaymentLine extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_financial_closing_payment_lines';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'closing_id',
        'payment_method_id',
        'payment_method_code',
        'payment_method_label',
        'currency',
        'is_cash',
        'requires_manual_count',
        'expected_amount',
        'actual_amount',
        'variance',
        'variance_reason',
        'variance_note',
        'transaction_count',
        'sort_order',
    ];

    protected $casts = [
        'is_cash' => 'boolean',
        'requires_manual_count' => 'boolean',
        'expected_amount' => 'float',
        'actual_amount' => 'float',
        'variance' => 'float',
        'transaction_count' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function closing(): BelongsTo
    {
        return $this->belongsTo(HotelFinancialClosing::class, 'closing_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(HotelPaymentMethod::class, 'payment_method_id');
    }
}
