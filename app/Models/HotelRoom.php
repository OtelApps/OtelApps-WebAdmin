<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelRoom extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_rooms';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'room_number',
        'floor',
        'occupancy_status',
        'cleaning_status',
        'cleaning_note',
        'room_type_id',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'floor' => 'integer',
        'sort_order' => 'integer',
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
        return $this->belongsTo(Hotel::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(HotelRoomType::class, 'room_type_id');
    }

    public function stays(): HasMany
    {
        return $this->hasMany(HotelStay::class, 'room_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(HotelRoomEvent::class, 'room_id');
    }

    public function issues(): HasMany
    {
        return $this->hasMany(HotelRoomIssue::class, 'room_id');
    }

    public function folioLines(): HasMany
    {
        return $this->hasMany(HotelFolioLine::class, 'room_id');
    }
}
