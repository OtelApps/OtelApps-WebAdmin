<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelHousekeeping extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_housekeeping';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'slug',
        'title',
        'description',
        'schedule_summary',
        'header_image_key',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
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

    public function hours(): HasMany
    {
        return $this->hasMany(HotelHousekeepingHour::class, 'housekeeping_id')->orderBy('day_order');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(HotelHousekeepingCategory::class, 'housekeeping_id')->orderBy('sort_order');
    }
}
