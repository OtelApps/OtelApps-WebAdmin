<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelFinanceSetting extends Model
{
    protected $connection;

    protected $table = 'hotel_finance_settings';

    protected $primaryKey = 'hotel_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'financial_day_start_time',
        'default_cash_float',
        'closing_variance_warning',
        'closing_variance_blocking',
        'primary_currency',
    ];

    protected $casts = [
        'default_cash_float' => 'float',
        'closing_variance_warning' => 'float',
        'closing_variance_blocking' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'hotel_id');
    }
}
