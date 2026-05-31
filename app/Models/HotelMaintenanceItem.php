<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelMaintenanceItem extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_maintenance_items';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'category_id',
        'slug',
        'label',
        'icon_library',
        'icon_name',
        'sort_order',
        'is_available',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_available' => 'boolean',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(HotelMaintenanceCategory::class, 'category_id');
    }
}
