<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelRoomServiceItemOption extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_room_service_item_options';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'item_id',
        'slug',
        'label',
        'price_amount',
        'sort_order',
    ];

    protected $casts = [
        'price_amount' => 'float',
        'sort_order' => 'integer',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(HotelRoomServiceItem::class, 'item_id');
    }
}
