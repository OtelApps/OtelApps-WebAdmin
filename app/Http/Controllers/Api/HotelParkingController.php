<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\FindsHotelScopedSlug;
use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelParkingTopic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HotelParkingController extends Controller
{
    use FindsHotelScopedSlug;

    private const NAVIGATION_SCREEN = 'ParkingDetail';

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $topics = HotelParkingTopic::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return response()->json([
            'title' => 'Parkování',
            'sections' => [
                [
                    'id' => 'parking',
                    'title' => 'Parkování',
                    'items' => $topics->map(fn ($t) => $this->listItem($t))->values(),
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
                $this->uniqueSlugPerHotel(HotelParkingTopic::class, $hotel),
            ],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $topic = HotelParkingTopic::create([
            ...$data,
            'hotel_id' => $hotel->id,
            'list_description' => '',
            'navigation_screen' => self::NAVIGATION_SCREEN,
            'sort_order' => 0,
            'is_active' => true,
        ]);

        return response()->json([
            'topic' => $this->topicPayload($topic),
        ], 201);
    }

    public function destroy(string $slug): JsonResponse
    {
        $topic = $this->findTopic($slug);
        $topic->delete();

        return response()->json(['success' => true]);
    }

    public function show(string $slug): JsonResponse
    {
        $topic = $this->findTopic($slug);

        return response()->json([
            'topic' => $this->topicPayload($topic),
            'image_keys' => array_keys(config_array('otelapps.hotel_parking_image_keys')),
            'navigation_screen' => self::NAVIGATION_SCREEN,
        ]);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $topic = $this->findTopic($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'list_description' => ['sometimes', 'string'],
            'detail_info' => ['nullable', 'string'],
            'list_image_key' => ['nullable', 'string', 'max:120'],
            'detail_image_key' => ['nullable', 'string', 'max:120'],
            'link_type' => ['sometimes', Rule::in(['detail', 'external'])],
            'navigation_screen' => ['nullable', Rule::in([self::NAVIGATION_SCREEN])],
            'external_url' => ['nullable', 'string', 'max:2048'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['link_type'])) {
            if ($data['link_type'] === 'external') {
                $data['navigation_screen'] = null;
            } else {
                $data['external_url'] = null;
                $data['navigation_screen'] = self::NAVIGATION_SCREEN;
            }
            unset($data['link_type']);
        }

        if (
            array_key_exists('navigation_screen', $data) &&
            array_key_exists('external_url', $data) &&
            empty($data['navigation_screen']) &&
            empty($data['external_url'])
        ) {
            return response()->json([
                'message' => 'Vyplňte buď obrazovku v aplikaci, nebo externí URL.',
            ], 422);
        }

        $topic->update($data);

        return response()->json([
            'topic' => $this->topicPayload($topic->fresh()),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findTopic(string $slug): HotelParkingTopic
    {
        return $this->findByHotelSlug(HotelParkingTopic::class, $slug);
    }

    private function listItem(HotelParkingTopic $topic): array
    {
        $imageMap = config_array('otelapps.hotel_parking_image_keys');
        $imageKey = $topic->list_image_key;

        return [
            'id' => $topic->slug,
            'slug' => $topic->slug,
            'title' => $topic->title,
            'image' => $imageKey ? ($imageMap[$imageKey] ?? null) : null,
            'list_label' => $topic->list_description,
            'schedule_summary' => $topic->isExternal() ? 'Externí odkaz' : 'Detail v aplikaci',
            'is_active' => $topic->is_active,
            'is_external' => $topic->isExternal(),
        ];
    }

    private function topicPayload(HotelParkingTopic $topic): array
    {
        return [
            'id' => $topic->id,
            'slug' => $topic->slug,
            'title' => $topic->title,
            'list_description' => $topic->list_description,
            'detail_info' => $topic->detail_info,
            'list_image_key' => $topic->list_image_key,
            'detail_image_key' => $topic->detail_image_key,
            'navigation_screen' => $topic->navigation_screen,
            'external_url' => $topic->external_url,
            'link_type' => $topic->isExternal() ? 'external' : 'detail',
            'sort_order' => $topic->sort_order,
            'is_active' => $topic->is_active,
        ];
    }
}
