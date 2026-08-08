<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelPayment extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_payments';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'payment_method_id',
        'terminal_id',
        'amount',
        'currency',
        'status',
        'paid_at',
        'created_by',
        'source',
        'reference_type',
        'reference_id',
        'guest_name',
        'note',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
        'metadata' => 'array',
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

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(HotelPaymentMethod::class, 'payment_method_id');
    }

    public function terminal(): BelongsTo
    {
        return $this->belongsTo(HotelPaymentTerminal::class, 'terminal_id');
    }
}
