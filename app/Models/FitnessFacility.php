<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FitnessFacility extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'fitness_facilities';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'slug',
        'title',
        'list_label',
        'schedule_summary',
        'description_long',
        'image_key',
        'detail_screen',
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

    public function hours(): HasMany
    {
        return $this->hasMany(FitnessFacilityHour::class, 'facility_id')->orderBy('day_order');
    }

    public function images(): HasMany
    {
        return $this->hasMany(FitnessFacilityImage::class, 'facility_id')->orderBy('sort_order');
    }
}
