<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelParkingTopic extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_parking_topics';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'slug',
        'title',
        'list_description',
        'detail_info',
        'list_image_key',
        'detail_image_key',
        'navigation_screen',
        'external_url',
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

    public function isExternal(): bool
    {
        return filled($this->external_url);
    }
}
