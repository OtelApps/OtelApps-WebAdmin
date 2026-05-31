<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelHousekeepingHour extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_housekeeping_hours';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'housekeeping_id',
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

    public function housekeeping(): BelongsTo
    {
        return $this->belongsTo(HotelHousekeeping::class, 'housekeeping_id');
    }
}
