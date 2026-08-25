<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelStay extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_stays';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'room_id',
        'status',
        'check_in_at',
        'check_out_at',
        'guest_count',
        'primary_guest_profile_id',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'guest_count' => 'integer',
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

    public function room(): BelongsTo
    {
        return $this->belongsTo(HotelRoom::class, 'room_id');
    }

    public function guests(): HasMany
    {
        return $this->hasMany(HotelStayGuest::class, 'stay_id')->orderBy('sort_order');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(HotelStayRequest::class, 'stay_id')->orderBy('sort_order');
    }

    public function folioLines(): HasMany
    {
        return $this->hasMany(HotelFolioLine::class, 'stay_id')->orderBy('posted_at');
    }

    public function minibarCharges(): HasMany
    {
        return $this->hasMany(HotelMinibarCharge::class, 'stay_id')->orderBy('charged_at');
    }
}
