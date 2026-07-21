<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelConciergeCaseSummary extends Model
{
    use HasUuidPrimaryKey;

    protected $connection;

    protected $table = 'hotel_concierge_case_summaries';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'hotel_id',
        'guest_external_id',
        'guest_locale',
        'summary',
        'summary_cs',
        'room_number',
        'resolved_at',
        'created_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
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
