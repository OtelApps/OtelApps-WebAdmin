<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelMinibarCharge extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_minibar_charges';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'stay_id',
        'catalog_item_id',
        'name',
        'quantity',
        'unit_price',
        'currency',
        'charged_at',
        'folio_line_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'float',
        'charged_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(HotelStay::class, 'stay_id');
    }
}
