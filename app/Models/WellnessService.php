<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WellnessService extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'wellness_services';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'facility_id',
        'slug',
        'name',
        'duration_minutes',
        'price_amount',
        'currency',
        'description',
        'sort_order',
        'is_available',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'price_amount' => 'float',
        'sort_order' => 'integer',
        'is_available' => 'boolean',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(WellnessFacility::class, 'facility_id');
    }
}
