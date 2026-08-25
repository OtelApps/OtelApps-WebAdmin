<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelFinancialClosingDeposit extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_financial_closing_deposits';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'closing_id',
        'currency',
        'expected_amount',
        'actual_amount',
        'destination',
        'reference',
        'note',
    ];

    protected $casts = [
        'expected_amount' => 'float',
        'actual_amount' => 'float',
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
}
