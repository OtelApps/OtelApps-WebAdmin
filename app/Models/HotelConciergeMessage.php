<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelConciergeMessage extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_concierge_messages';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'body',
        'body_original',
        'body_translated',
        'locale',
        'staff_display_name',
        'read_by_staff_at',
        'read_by_guest_at',
        'created_at',
    ];

    protected $casts = [
        'read_by_staff_at' => 'datetime',
        'read_by_guest_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(HotelConciergeConversation::class, 'conversation_id');
    }
}
