<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelServiceRequestStatusLog extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_service_request_status_logs';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'request_id',
        'from_status',
        'to_status',
        'note',
        'changed_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(HotelServiceRequest::class, 'request_id');
    }
}
