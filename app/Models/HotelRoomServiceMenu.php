<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelRoomServiceMenu extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_room_service_menus';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'slug',
        'title',
        'list_label',
        'list_schedule_summary',
        'list_image_key',
        'navigation_screen',
        'confirm_screen',
        'description',
        'schedule_summary',
        'header_image_key',
        'juice_modal_title',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
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

    public function hours(): HasMany
    {
        return $this->hasMany(HotelRoomServiceHour::class, 'menu_id')->orderBy('day_order');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(HotelRoomServiceCategory::class, 'menu_id')->orderBy('sort_order');
    }
}
