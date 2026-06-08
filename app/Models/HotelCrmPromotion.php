<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelCrmPromotion extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_crm_promotions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'title',
        'subtitle',
        'body',
        'cta_label',
        'cta_url',
        'image_url',
        'segment',
        'channels',
        'status',
        'starts_at',
        'ends_at',
        'metadata',
    ];

    protected $casts = [
        'channels' => 'array',
        'metadata' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
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
