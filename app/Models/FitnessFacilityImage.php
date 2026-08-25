<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FitnessFacilityImage extends Model
{
    use HasUuidPrimaryKey;
    protected $connection;

    protected $table = 'fitness_facility_images';

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'facility_id',
        'image_key',
        'image_url',
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

    public function facility(): BelongsTo
    {
        return $this->belongsTo(FitnessFacility::class, 'facility_id');
    }
}
