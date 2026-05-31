<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelRelaxSportArea extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_relax_sport_areas';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'relax_sport_id',
        'slug',
        'home_title',
        'home_image_key',
        'list_screen',
        'list_title',
        'is_enabled',
        'sort_order',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function relaxSport(): BelongsTo
    {
        return $this->belongsTo(HotelRelaxSport::class, 'relax_sport_id');
    }
}
