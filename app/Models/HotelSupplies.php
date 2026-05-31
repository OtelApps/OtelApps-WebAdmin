<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelSupplies extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_supplies';

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
        'max_quantity_per_item',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'max_quantity_per_item' => 'integer',
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
        return $this->hasMany(HotelSuppliesHour::class, 'supplies_id')->orderBy('day_order');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(HotelSuppliesCategory::class, 'supplies_id')->orderBy('sort_order');
    }
}
