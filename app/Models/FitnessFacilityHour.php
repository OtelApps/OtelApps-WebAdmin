<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FitnessFacilityHour extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'fitness_facility_hours';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'facility_id',
        'day_order',
        'day_name',
        'hours_text',
    ];

    protected $casts = [
        'day_order' => 'integer',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(FitnessFacility::class, 'facility_id');
    }
}
