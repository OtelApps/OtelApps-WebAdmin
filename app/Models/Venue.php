<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venue extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'slug',
        'title',
        'venue_type',
        'description',
        'schedule_summary',
        'image_key',
        'list_label',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public const UPDATED_AT = null;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function openingHours(): HasMany
    {
        return $this->hasMany(VenueOpeningHour::class, 'venue_id')->orderBy('day_order');
    }

    public function menus(): HasMany
    {
        return $this->hasMany(VenueMenu::class)->orderBy('sort_order');
    }
}
