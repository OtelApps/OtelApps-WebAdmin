<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotelSuppliesCategory extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_supplies_categories';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'supplies_id',
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

    public function supplies(): BelongsTo
    {
        return $this->belongsTo(HotelSupplies::class, 'supplies_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(HotelSuppliesItem::class, 'category_id')->orderBy('sort_order');
    }
}
