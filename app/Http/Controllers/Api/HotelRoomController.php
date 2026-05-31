<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelRoomType;
use App\Models\HotelRoomTypeFeature;
use App\Models\HotelRoomTypeImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HotelRoomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $roomTypes = HotelRoomType::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return response()->json([
            'title' => 'Nabídka pokojů',
            'sections' => [
                [
                    'id' => 'room_types',
                    'title' => 'Nabídka pokojů',
                    'items' => $roomTypes->map(fn ($r) => $this->listItem($r))->values(),
                ],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'slug' => [
                'required',
                'string',
                'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique(HotelRoomType::class, 'slug'),
            ],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $roomType = HotelRoomType::create([
            ...$data,
            'hotel_id' => $hotel->id,
            'list_description' => '',
            'detail_info' => '',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        return response()->json([
            'room_type' => $this->roomTypePayload($roomType),
        ], 201);
    }

    public function destroy(string $slug): JsonResponse
    {
        $roomType = $this->findRoomType($slug);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($roomType) {
            $roomType->features()->delete();
            $roomType->images()->delete();
            $roomType->delete();
        });

        return response()->json(['success' => true]);
    }

    public function show(string $slug): JsonResponse
    {
        $roomType = $this->findRoomType($slug);
        $roomType->load(['features', 'images']);

        return response()->json([
            'room_type' => $this->roomTypePayload($roomType),
            'features' => $roomType->features->map(fn ($f) => $this->featurePayload($f))->values(),
            'gallery' => $roomType->images->map(fn ($i) => $this->imagePayload($i))->values(),
            'image_keys' => array_keys(config_array('otelapps.hotel_room_image_keys')),
        ]);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $roomType = $this->findRoomType($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'list_description' => ['sometimes', 'string'],
            'detail_info' => ['sometimes', 'string'],
            'size_text' => ['nullable', 'string', 'max:80'],
            'image_key' => ['nullable', 'string', 'max:120'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $roomType->update($data);

        return response()->json([
            'room_type' => $this->roomTypePayload($roomType->fresh()),
        ]);
    }

    public function updateFeatures(Request $request, string $slug): JsonResponse
    {
        $roomType = $this->findRoomType($slug);

        $data = $request->validate([
            'features' => ['required', 'array'],
            'features.*.id' => ['nullable', 'uuid'],
            'features.*.label' => ['required', 'string', 'max:255'],
            'features.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($roomType, $data) {
            $keptIds = [];

            foreach ($data['features'] as $featureData) {
                $feature = isset($featureData['id'])
                    ? HotelRoomTypeFeature::where('room_type_id', $roomType->id)
                        ->where('id', $featureData['id'])
                        ->first()
                    : null;

                if (! $feature) {
                    $feature = HotelRoomTypeFeature::create([
                        'room_type_id' => $roomType->id,
                        'label' => $featureData['label'],
                        'sort_order' => $featureData['sort_order'] ?? 0,
                    ]);
                } else {
                    $feature->update([
                        'label' => $featureData['label'],
                        'sort_order' => $featureData['sort_order'] ?? 0,
                    ]);
                }

                $keptIds[] = $feature->id;
            }

            $query = HotelRoomTypeFeature::where('room_type_id', $roomType->id);
            if ($keptIds !== []) {
                $query->whereNotIn('id', $keptIds);
            }
            $query->delete();
        });

        $roomType->load('features');

        return response()->json([
            'features' => $roomType->features->map(fn ($f) => $this->featurePayload($f))->values(),
        ]);
    }

    public function updateGallery(Request $request, string $slug): JsonResponse
    {
        $roomType = $this->findRoomType($slug);

        $data = $request->validate([
            'gallery' => ['required', 'array'],
            'gallery.*.id' => ['nullable', 'uuid'],
            'gallery.*.image_key' => ['nullable', 'string', 'max:120'],
            'gallery.*.image_url' => ['nullable', 'string', 'max:2048'],
            'gallery.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($roomType, $data) {
            $keptIds = [];

            foreach ($data['gallery'] as $imageData) {
                if (empty($imageData['image_key']) && empty($imageData['image_url'])) {
                    continue;
                }

                $image = isset($imageData['id'])
                    ? HotelRoomTypeImage::where('room_type_id', $roomType->id)
                        ->where('id', $imageData['id'])
                        ->first()
                    : null;

                if (! $image) {
                    $image = HotelRoomTypeImage::create([
                        'room_type_id' => $roomType->id,
                        'image_key' => $imageData['image_key'] ?? null,
                        'image_url' => $imageData['image_url'] ?? null,
                        'sort_order' => $imageData['sort_order'] ?? 0,
                    ]);
                } else {
                    $image->update([
                        'image_key' => $imageData['image_key'] ?? null,
                        'image_url' => $imageData['image_url'] ?? null,
                        'sort_order' => $imageData['sort_order'] ?? 0,
                    ]);
                }

                $keptIds[] = $image->id;
            }

            $query = HotelRoomTypeImage::where('room_type_id', $roomType->id);
            if ($keptIds !== []) {
                $query->whereNotIn('id', $keptIds);
            }
            $query->delete();
        });

        $roomType->load('images');

        return response()->json([
            'gallery' => $roomType->images->map(fn ($i) => $this->imagePayload($i))->values(),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findRoomType(string $slug): HotelRoomType
    {
        return HotelRoomType::where('slug', $slug)->firstOrFail();
    }

    private function listItem(HotelRoomType $roomType): array
    {
        $imageMap = config_array('otelapps.hotel_room_image_keys');

        return [
            'id' => $roomType->slug,
            'slug' => $roomType->slug,
            'title' => $roomType->title,
            'image' => $roomType->image_key ? ($imageMap[$roomType->image_key] ?? null) : null,
            'list_label' => $roomType->list_description,
            'schedule_summary' => $roomType->size_text,
            'is_active' => $roomType->is_active,
        ];
    }

    private function roomTypePayload(HotelRoomType $roomType): array
    {
        return [
            'id' => $roomType->id,
            'slug' => $roomType->slug,
            'title' => $roomType->title,
            'list_description' => $roomType->list_description,
            'detail_info' => $roomType->detail_info,
            'size_text' => $roomType->size_text,
            'image_key' => $roomType->image_key,
            'sort_order' => $roomType->sort_order,
            'is_active' => $roomType->is_active,
            'has_features' => $roomType->relationLoaded('features')
                ? $roomType->features->isNotEmpty()
                : HotelRoomTypeFeature::where('room_type_id', $roomType->id)->exists(),
            'has_gallery' => $roomType->relationLoaded('images')
                ? $roomType->images->isNotEmpty()
                : HotelRoomTypeImage::where('room_type_id', $roomType->id)->exists(),
        ];
    }

    private function featurePayload(HotelRoomTypeFeature $feature): array
    {
        return [
            'id' => $feature->id,
            'label' => $feature->label,
            'sort_order' => $feature->sort_order,
        ];
    }

    private function imagePayload(HotelRoomTypeImage $image): array
    {
        return [
            'id' => $image->id,
            'image_key' => $image->image_key,
            'image_url' => $image->image_url,
            'sort_order' => $image->sort_order,
        ];
    }
}
