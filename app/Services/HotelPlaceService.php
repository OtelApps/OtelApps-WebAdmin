<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelPlace;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class HotelPlaceService
{
    /**
     * @return list<array<string, mixed>>
     */
    public function list(Hotel $hotel): array
    {
        return HotelPlace::query()
            ->where('hotel_id', $hotel->id)
            ->orderByDesc('is_recommended')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (HotelPlace $place) => $this->payload($place))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function create(Hotel $hotel, array $data): array
    {
        [$latitude, $longitude, $address] = $this->resolveCoordinates($data);

        $name = trim((string) $data['name']);
        $slug = $this->uniqueSlug($hotel, $data['slug'] ?? $name);

        $place = HotelPlace::query()->create([
            'hotel_id' => $hotel->id,
            'slug' => $slug,
            'name' => $name,
            'description' => trim((string) ($data['description'] ?? '')),
            'long_description' => $data['long_description'] ?? null,
            'address' => $address,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'category' => $data['category'] ?? 'place',
            'opening_hours' => $data['opening_hours'] ?? null,
            'admission' => $data['admission'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'is_recommended' => (bool) ($data['is_recommended'] ?? false),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
        ]);

        return $this->payload($place);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function update(HotelPlace $place, array $data): array
    {
        $needsGeo = array_key_exists('address', $data)
            || array_key_exists('latitude', $data)
            || array_key_exists('longitude', $data);

        if ($needsGeo) {
            $merged = [
                'address' => array_key_exists('address', $data) ? $data['address'] : $place->address,
                'latitude' => array_key_exists('latitude', $data) ? $data['latitude'] : $place->latitude,
                'longitude' => array_key_exists('longitude', $data) ? $data['longitude'] : $place->longitude,
            ];
            [$latitude, $longitude, $address] = $this->resolveCoordinates($merged);
            $data['latitude'] = $latitude;
            $data['longitude'] = $longitude;
            $data['address'] = $address;
        }

        if (isset($data['name'])) {
            $data['name'] = trim((string) $data['name']);
        }
        if (isset($data['description'])) {
            $data['description'] = trim((string) $data['description']);
        }
        if (array_key_exists('is_recommended', $data)) {
            $data['is_recommended'] = (bool) $data['is_recommended'];
        }
        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (bool) $data['is_active'];
        }

        $place->update($data);

        return $this->payload($place->fresh());
    }

    public function delete(HotelPlace $place): void
    {
        $place->delete();
    }

    /**
     * @return array{latitude: float, longitude: float, address: string|null, display_name: string|null}
     */
    public function geocodeAddress(string $address): array
    {
        $address = trim($address);
        if ($address === '') {
            throw new RuntimeException('Zadejte adresu.');
        }

        $response = Http::timeout(12)
            ->withHeaders([
                'User-Agent' => 'OtelApps-WebAdmin/1.0 (hotel places geocoding)',
                'Accept' => 'application/json',
            ])
            ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $address,
                'format' => 'json',
                'limit' => 1,
                'addressdetails' => 0,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Geocoding služba neodpovídá. Zkuste souřadnice ručně.');
        }

        $row = $response->json('0');
        if (! is_array($row) || ! isset($row['lat'], $row['lon'])) {
            throw new RuntimeException('Adresu se nepodařilo najít. Upravte text nebo zadejte souřadnice.');
        }

        return [
            'latitude' => (float) $row['lat'],
            'longitude' => (float) $row['lon'],
            'address' => $address,
            'display_name' => isset($row['display_name']) ? (string) $row['display_name'] : $address,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{0: float, 1: float, 2: string|null}
     */
    private function resolveCoordinates(array $data): array
    {
        $lat = isset($data['latitude']) && $data['latitude'] !== '' && $data['latitude'] !== null
            ? (float) $data['latitude']
            : null;
        $lng = isset($data['longitude']) && $data['longitude'] !== '' && $data['longitude'] !== null
            ? (float) $data['longitude']
            : null;
        $address = isset($data['address']) ? trim((string) $data['address']) : '';
        $address = $address !== '' ? $address : null;

        if ($lat !== null && $lng !== null) {
            $this->assertValidCoords($lat, $lng);

            return [$lat, $lng, $address];
        }

        if ($address) {
            $geo = $this->geocodeAddress($address);

            return [$geo['latitude'], $geo['longitude'], $address];
        }

        throw new RuntimeException('Zadejte přesnou adresu, nebo zeměpisnou šířku a délku.');
    }

    private function assertValidCoords(float $lat, float $lng): void
    {
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            throw new RuntimeException('Souřadnice jsou mimo platný rozsah.');
        }
    }

    private function uniqueSlug(Hotel $hotel, string $source): string
    {
        $base = Str::slug(Str::limit($source, 80, ''));
        if ($base === '') {
            $base = 'misto';
        }

        $slug = $base;
        $i = 2;
        while (
            HotelPlace::query()
                ->where('hotel_id', $hotel->id)
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(HotelPlace $place): array
    {
        return [
            'id' => $place->id,
            'slug' => $place->slug,
            'name' => $place->name,
            'description' => $place->description,
            'long_description' => $place->long_description,
            'address' => $place->address,
            'latitude' => $place->latitude,
            'longitude' => $place->longitude,
            'category' => $place->category,
            'opening_hours' => $place->opening_hours,
            'admission' => $place->admission,
            'image_url' => $place->image_url,
            'is_recommended' => (bool) $place->is_recommended,
            'sort_order' => (int) $place->sort_order,
            'is_active' => (bool) $place->is_active,
        ];
    }
}
