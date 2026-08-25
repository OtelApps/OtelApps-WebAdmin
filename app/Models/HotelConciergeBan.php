<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelConciergeBan extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_concierge_bans';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'hotel_id',
        'guest_external_id',
        'guest_display_name',
        'room_number',
        'duration_key',
        'reason',
        'banned_at',
        'expires_at',
        'banned_by_user_id',
        'banned_by_label',
        'conversation_id',
        'chat_snapshot',
        'lifted_at',
        'lifted_by_user_id',
        'lifted_by_label',
        'created_at',
    ];

    protected $casts = [
        'chat_snapshot' => 'array',
        'banned_at' => 'datetime',
        'expires_at' => 'datetime',
        'lifted_at' => 'datetime',
        'created_at' => 'datetime',
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

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(HotelConciergeConversation::class, 'conversation_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->whereNull('lifted_at')
            ->where(function (Builder $q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function isActive(): bool
    {
        if ($this->lifted_at !== null) {
            return false;
        }

        if ($this->expires_at === null) {
            return true;
        }

        return $this->expires_at->isFuture();
    }

    public function statusKey(): string
    {
        if ($this->lifted_at !== null) {
            return 'lifted';
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return 'expired';
        }

        return 'active';
    }
}
