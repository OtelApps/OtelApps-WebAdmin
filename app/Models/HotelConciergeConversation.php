<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelConciergeConversation extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_concierge_conversations';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'guest_external_id',
        'guest_display_name',
        'room_number',
        'guest_locale',
        'status',
        'last_message_preview',
        'last_message_at',
        'unread_staff_count',
        'unread_guest_count',
        'assigned_staff_name',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'unread_staff_count' => 'integer',
        'unread_guest_count' => 'integer',
        'last_message_at' => 'datetime',
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

    public function messages(): HasMany
    {
        return $this->hasMany(HotelConciergeMessage::class, 'conversation_id')->orderBy('created_at');
    }
}
