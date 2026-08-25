<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelInfoSection extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'hotel_info_sections';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'topic_id',
        'slug',
        'title',
        'description',
        'icon_library',
        'icon_name',
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

    public function topic(): BelongsTo
    {
        return $this->belongsTo(HotelInfoTopic::class, 'topic_id');
    }
}
