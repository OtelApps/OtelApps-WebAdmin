<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelStayRequest extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_stay_requests';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'stay_id',
        'label',
        'is_checked',
        'is_new',
        'sort_order',
    ];

    protected $casts = [
        'is_checked' => 'boolean',
        'is_new' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(HotelStay::class, 'stay_id');
    }
}
