<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelRoomServiceItem extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_room_service_items';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'category_id',
        'slug',
        'name',
        'description_short',
        'icon_emoji',
        'price_amount',
        'currency',
        'requires_option',
        'sort_order',
        'is_available',
    ];

    protected $casts = [
        'price_amount' => 'float',
        'requires_option' => 'boolean',
        'sort_order' => 'integer',
        'is_available' => 'boolean',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(HotelRoomServiceCategory::class, 'category_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(HotelRoomServiceItemOption::class, 'item_id')->orderBy('sort_order');
    }
}
