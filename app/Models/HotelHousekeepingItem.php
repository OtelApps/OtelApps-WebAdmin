<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelHousekeepingItem extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_housekeeping_items';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'category_id',
        'slug',
        'title',
        'icon_image_key',
        'sort_order',
        'is_available',
    ];

    protected $casts = [
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
        return $this->belongsTo(HotelHousekeepingCategory::class, 'category_id');
    }
}
