<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelMaintenanceCategory extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_maintenance_categories';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'maintenance_id',
        'slug',
        'title',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function maintenance(): BelongsTo
    {
        return $this->belongsTo(HotelMaintenance::class, 'maintenance_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(HotelMaintenanceItem::class, 'category_id')->orderBy('sort_order');
    }
}
