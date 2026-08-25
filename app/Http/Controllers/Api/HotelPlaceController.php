<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelPlace;
use App\Services\HotelPlaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class HotelPlaceController extends Controller
{
    public function __construct(
        private readonly HotelPlaceService $places,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);

        return response()->json([
            'places' => $this->places->list($hotel),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'long_description' => ['nullable', 'string', 'max:10000'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'category' => ['sometimes', Rule::in(['place', 'atm', 'other'])],
            'opening_hours' => ['nullable', 'string', 'max:255'],
            'admission' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'is_recommended' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'slug' => ['nullable', 'string', 'max:120'],
        ]);

        try {
            $place = $this->places->create($hotel, $data);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Místo se nepodařilo uložit.'], 500);
        }

        return response()->json(['place' => $place], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $place = $this->findPlace($hotel, $id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'long_description' => ['nullable', 'string', 'max:10000'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'category' => ['sometimes', Rule::in(['place', 'atm', 'other'])],
            'opening_hours' => ['nullable', 'string', 'max:255'],
            'admission' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'is_recommended' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        try {
            $updated = $this->places->update($place, $data);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Místo se nepodařilo uložit.'], 500);
        }

        return response()->json(['place' => $updated]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $place = $this->findPlace($hotel, $id);
        $this->places->delete($place);

        return response()->json(['success' => true]);
    }

    public function geocode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'address' => ['required', 'string', 'max:500'],
        ]);

        try {
            $result = $this->places->geocodeAddress($data['address']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Geocoding selhal.'], 500);
        }

        return response()->json($result);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findPlace(Hotel $hotel, string $id): HotelPlace
    {
        return HotelPlace::query()
            ->where('hotel_id', $hotel->id)
            ->where(fn ($q) => $q->where('id', $id)->orWhere('slug', $id))
            ->firstOrFail();
    }
}
