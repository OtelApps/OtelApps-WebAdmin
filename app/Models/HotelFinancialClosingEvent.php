<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelFinancialClosingEvent extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_financial_closing_events';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'closing_id',
        'hotel_id',
        'user_id',
        'user_name',
        'action',
        'old_value',
        'new_value',
        'metadata',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
        'metadata' => 'object',
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
