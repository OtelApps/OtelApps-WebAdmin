<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelPaymentMethod extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_payment_methods';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'hotel_id',
        'code',
        'label',
        'currency',
        'is_cash',
        'requires_manual_count',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_cash' => 'boolean',
        'requires_manual_count' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
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

    public function payments(): HasMany
    {
        return $this->hasMany(HotelPayment::class, 'payment_method_id');
    }
}
