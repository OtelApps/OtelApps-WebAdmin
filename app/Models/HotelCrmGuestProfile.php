<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelCrmGuestProfile extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_crm_guest_profiles';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'guest_key',
        'guest_external_id',
        'display_name',
        'room_number',
        'email',
        'phone',
        'locale',
        'segment',
        'tags',
        'notes',
        'metadata',
        'check_in_at',
        'check_out_at',
        'marketing_consent',
        'marketing_consent_at',
        'preferences',
        'loyalty_points',
        'stay_count',
        'assigned_staff_name',
        'company_name',
        'nationality',
    ];

    protected $casts = [
        'tags' => 'array',
        'metadata' => 'array',
        'preferences' => 'array',
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'marketing_consent' => 'boolean',
        'marketing_consent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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
}
