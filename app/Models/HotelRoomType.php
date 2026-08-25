<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelRoomType extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_room_types';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'slug',
        'title',
        'list_description',
        'detail_info',
        'size_text',
        'image_key',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
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

    public function features(): HasMany
    {
        return $this->hasMany(HotelRoomTypeFeature::class, 'room_type_id')->orderBy('sort_order');
    }

    public function images(): HasMany
    {
        return $this->hasMany(HotelRoomTypeImage::class, 'room_type_id')->orderBy('sort_order');
    }
}
