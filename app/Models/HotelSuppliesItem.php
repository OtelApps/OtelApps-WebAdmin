<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelSuppliesItem extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_supplies_items';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'category_id',
        'slug',
        'name',
        'icon_emoji',
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
        return $this->belongsTo(HotelSuppliesCategory::class, 'category_id');
    }
}
