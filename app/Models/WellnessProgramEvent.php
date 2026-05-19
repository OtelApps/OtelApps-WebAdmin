<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WellnessProgramEvent extends Model
{
    protected $connection;

    protected $table = 'wellness_program_events';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'day_order',
        'start_time',
        'title',
        'description',
        'facility_id',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'day_order' => 'integer',
        'sort_order' => 'integer',
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

    public function facility(): BelongsTo
    {
        return $this->belongsTo(WellnessFacility::class, 'facility_id');
    }
}
