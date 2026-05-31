<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelInfoTopic extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_info_topics';

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

    public function sections(): HasMany
    {
        return $this->hasMany(HotelInfoSection::class, 'topic_id')->orderBy('sort_order');
    }
}
