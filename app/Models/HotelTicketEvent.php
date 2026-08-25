<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelTicketEvent extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_ticket_events';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'request_id',
        'event_type',
        'body',
        'actor_user_id',
        'actor_label',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'actor_user_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function setMetadataAttribute($value): void
    {
        if ($value === null || $value === [] || $value === '') {
            $this->attributes['metadata'] = '{}';

            return;
        }

        if (is_string($value)) {
            $this->attributes['metadata'] = $value;

            return;
        }

        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);
        if ($encoded === '[]') {
            $encoded = '{}';
        }
        $this->attributes['metadata'] = $encoded;
    }

    public function getMetadataAttribute($value): array
    {
        if ($value === null || $value === '') {
            return [];
        }
        if (is_array($value)) {
            return $value;
        }
        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

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
