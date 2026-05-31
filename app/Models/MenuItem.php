<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MenuItem extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'category_id',
        'slug',
        'name',
        'description_short',
        'description_long',
        'price_amount',
        'currency',
        'image_url',
        'sort_order',
        'is_available',
    ];

    protected $casts = [
        'price_amount' => 'integer',
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
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function allergens(): BelongsToMany
    {
        return $this->belongsToMany(
            Allergen::class,
            'menu_item_allergens',
            'menu_item_id',
            'allergen_code',
            'id',
            'code'
        );
    }
}
