<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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

    public static function bySlug(string $slug): ?self
    {
        return static::query()->where('slug', $slug)->first();
    }

    /**
     * Slug z X-Hotel-Slug / ?hotel_slug= / /h/{slug} / env.
     * Staff bez SuperAdmina je vázaný na svůj hotel_slug (fallback env).
     */
    public static function requestedSlug(?\Illuminate\Http\Request $request = null): string
    {
        $env = (string) config('otelapps.hotel_slug', 'default');
        try {
            $request ??= request();
        } catch (\Throwable) {
            return $env;
        }

        $header = strtolower(trim((string) $request->header('X-Hotel-Slug', '')));
        $query = strtolower(trim((string) $request->query('hotel_slug', '')));
        $fromPath = null;
        if (preg_match('#(?:^|/)h/([a-z0-9]+(?:-[a-z0-9]+)*)#', $request->path(), $m)) {
            $fromPath = $m[1];
        }

        $candidate = $header !== '' ? $header : ($query !== '' ? $query : ($fromPath ?: $env));
        if ($candidate === '') {
            $candidate = $env;
        }

        $user = $request->user();
        if ($user && method_exists($user, 'isSuperAdmin') && ! $user->isSuperAdmin()) {
            $locked = method_exists($user, 'hotelSlug') ? $user->hotelSlug() : '';
            if ($locked !== '') {
                return $locked;
            }

            return $env;
        }

        return $candidate;
    }

    public static function current(): ?self
    {
        return static::bySlug(static::requestedSlug());
    }

    public function moduleSetting(): HasOne
    {
        return $this->hasOne(HotelModuleSetting::class, 'hotel_id');
    }

    public function profile(): HasOne
    {
        return $this->hasOne(HotelProfile::class, 'hotel_id');
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

    public function conciergeConversations(): HasMany
    {
        return $this->hasMany(HotelConciergeConversation::class);
    }
}
