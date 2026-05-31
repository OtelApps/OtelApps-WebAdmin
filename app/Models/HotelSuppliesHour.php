<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelSuppliesHour extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_supplies_hours';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'supplies_id',
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

    public function supplies(): BelongsTo
    {
        return $this->belongsTo(HotelSupplies::class, 'supplies_id');
    }
}
