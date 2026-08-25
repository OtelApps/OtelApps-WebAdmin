<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelFinancialClosingCashCount extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_financial_closing_cash_counts';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'closing_id',
        'currency',
        'denomination',
        'quantity',
        'amount',
    ];

    protected $casts = [
        'denomination' => 'float',
        'quantity' => 'integer',
        'amount' => 'float',
        'created_at' => 'datetime',
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
}
