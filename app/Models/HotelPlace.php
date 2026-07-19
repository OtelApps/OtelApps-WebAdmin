<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelPlace extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_places';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'slug',
        'name',
        'description',
        'long_description',
        'address',
        'latitude',
        'longitude',
        'category',
        'opening_hours',
        'admission',
        'image_url',
        'is_recommended',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_recommended' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
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
}
