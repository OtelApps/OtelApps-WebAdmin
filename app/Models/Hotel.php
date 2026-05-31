<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    protected $connection;

    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['slug', 'name'];

    public const UPDATED_AT = null;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->connection = config('otelapps.db_connection');
    }

    public function venues(): HasMany
    {
        return $this->hasMany(Venue::class);
    }

    public function wellnessFacilities(): HasMany
    {
        return $this->hasMany(WellnessFacility::class);
    }

    public function wellnessProgramEvents(): HasMany
    {
        return $this->hasMany(WellnessProgramEvent::class);
    }

    public function hotelInfoTopics(): HasMany
    {
        return $this->hasMany(HotelInfoTopic::class);
    }

    public function hotelRoomTypes(): HasMany
    {
        return $this->hasMany(HotelRoomType::class);
    }

    public function hotelParkingTopics(): HasMany
    {
        return $this->hasMany(HotelParkingTopic::class);
    }

    public function hotelSupplies(): HasMany
    {
        return $this->hasMany(HotelSupplies::class);
    }

    public function hotelMaintenance(): HasMany
    {
        return $this->hasMany(HotelMaintenance::class);
    }

    public function hotelHousekeeping(): HasMany
    {
        return $this->hasMany(HotelHousekeeping::class);
    }

    public function hotelRoomServiceMenus(): HasMany
    {
        return $this->hasMany(HotelRoomServiceMenu::class);
    }

    public function hotelRelaxSport(): HasMany
    {
        return $this->hasMany(HotelRelaxSport::class);
    }

    public function fitnessFacilities(): HasMany
    {
        return $this->hasMany(FitnessFacility::class);
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(HotelServiceRequest::class);
    }

    public function serviceRequestTypes(): HasMany
    {
        return $this->hasMany(HotelServiceRequestType::class);
    }
}
