<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WellnessFacilityHour extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'wellness_facility_hours';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['facility_id', 'day_order', 'day_name', 'hours_text'];

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
        return $this->belongsTo(WellnessFacility::class, 'facility_id');
    }
}
