<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelAdminNotificationSetting extends Model
{
    protected $connection;

    protected $table = 'hotel_admin_notification_settings';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $primaryKey = 'hotel_id';

    protected $fillable = [
        'hotel_id',
        'preferences',
    ];

    protected $casts = [
        'preferences' => 'array',
        'updated_at' => 'datetime',
    ];

    public const UPDATED_AT = 'updated_at';

    public const CREATED_AT = null;

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
