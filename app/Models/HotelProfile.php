<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelProfile extends Model
{
    protected $connection;

    protected $table = 'hotel_profiles';

    protected $primaryKey = 'hotel_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'hotel_id',
        'app_name',
        'admin_url',
        'web_url',
        'lat',
        'lng',
        'admin_email',
        'app_store_url',
        'play_store_url',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
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
        return $this->belongsTo(Hotel::class, 'hotel_id');
    }

    /**
     * @return array{
     *     app_name: string,
     *     admin_url: string,
     *     web_url: string,
     *     lat: float|null,
     *     lng: float|null,
     *     admin_email: string,
     *     app_store_url: string,
     *     play_store_url: string
     * }
     */
    public function toPublicArray(): array
    {
        return [
            'app_name' => (string) $this->app_name,
            'admin_url' => rtrim((string) $this->admin_url, '/'),
            'web_url' => rtrim((string) $this->web_url, '/'),
            'lat' => $this->lat,
            'lng' => $this->lng,
            'admin_email' => (string) $this->admin_email,
            'app_store_url' => (string) $this->app_store_url,
            'play_store_url' => (string) $this->play_store_url,
        ];
    }
}
