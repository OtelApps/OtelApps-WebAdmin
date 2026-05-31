<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelServiceRequest extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_service_requests';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'request_number',
        'service_module',
        'service_label',
        'service_icon',
        'request_text',
        'guest_display_name',
        'room_number',
        'guest_phone',
        'guest_email',
        'guest_locale',
        'guest_external_id',
        'device_id',
        'app_session_id',
        'status',
        'status_guest_note',
        'staff_note',
        'priority',
        'assigned_staff_name',
        'metadata',
        'source_entity_type',
        'source_entity_slug',
        'created_via',
        'archived_at',
        'solved_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'priority' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'archived_at' => 'datetime',
        'solved_at' => 'datetime',
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

    public function statusLogs(): HasMany
    {
        return $this->hasMany(HotelServiceRequestStatusLog::class, 'request_id')->orderByDesc('created_at');
    }
}
