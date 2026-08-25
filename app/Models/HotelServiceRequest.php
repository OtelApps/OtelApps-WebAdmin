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
        'queue_key',
        'due_at',
        'claimed_at',
        'completed_at',
        'assigned_user_id',
        'assigned_user_name',
        'created_by_user_id',
        'created_by_label',
        'metadata',
        'source_entity_type',
        'source_entity_slug',
        'created_via',
        'archived_at',
        'solved_at',
    ];

    protected $casts = [
        'priority' => 'integer',
        'assigned_user_id' => 'integer',
        'created_by_user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'archived_at' => 'datetime',
        'solved_at' => 'datetime',
        'due_at' => 'datetime',
        'claimed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Postgres check vyžaduje jsonb object, ne pole — prázdné [] padá.
     */
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

        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_FORCE_OBJECT);
        // JSON_FORCE_OBJECT na neprázdném listu změní klíče — pro asociativní OK;
        // pro list použij klasický encode a oprav [] → {}
        if (array_is_list($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);
            if ($encoded === '[]') {
                $encoded = '{}';
            }
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

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(HotelServiceRequestStatusLog::class, 'request_id')->orderByDesc('created_at');
    }

    public function ticketEvents(): HasMany
    {
        return $this->hasMany(HotelTicketEvent::class, 'request_id')->orderBy('created_at');
    }
}
