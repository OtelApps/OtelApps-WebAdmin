<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelFolioLine extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_folio_lines';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'hotel_id',
        'room_id',
        'stay_id',
        'description',
        'amount',
        'currency',
        'category',
        'posted_at',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'float',
        'posted_at' => 'datetime',
        'metadata' => 'array',
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

    public function room(): BelongsTo
    {
        return $this->belongsTo(HotelRoom::class, 'room_id');
    }
}
