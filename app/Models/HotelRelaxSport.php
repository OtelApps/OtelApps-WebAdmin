<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelRelaxSport extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_relax_sport';

    public const UPDATED_AT = 'updated_at';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'section_title',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
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

    public function areas(): HasMany
    {
        return $this->hasMany(HotelRelaxSportArea::class, 'relax_sport_id')->orderBy('sort_order');
    }
}
