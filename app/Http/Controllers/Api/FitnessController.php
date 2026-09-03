<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\FindsHotelScopedSlug;
use App\Http\Controllers\Controller;
use App\Models\FitnessFacility;
use App\Models\FitnessFacilityHour;
use App\Models\FitnessFacilityImage;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FitnessController extends Controller
{
    use FindsHotelScopedSlug;

    private const DETAIL_SCREENS = ['GymDetail', 'TenisoveKurtyDetail'];

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $facilities = FitnessFacility::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return response()->json([
            'title' => 'Posilovna & Sport',
            'sections' => [
                [
                    'id' => 'facilities',
                    'title' => 'Posilovna & Sport',
                    'items' => $facilities->map(fn ($f) => $this->listItem($f))->values(),
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
                $this->uniqueSlugPerHotel(FitnessFacility::class, $hotel),
            ],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $facility = FitnessFacility::create([
            ...$data,
            'hotel_id' => $hotel->id,
            'detail_screen' => self::DETAIL_SCREENS[0],
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $this->seedDefaultHours($facility);

        return response()->json([
            'facility' => $this->facilityPayload($facility->fresh('hours')),
        ], 201);
    }

    public function destroy(string $slug): JsonResponse
    {
        $facility = $this->findFacility($slug);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($facility) {
            $facility->hours()->delete();
            $facility->images()->delete();
            $facility->delete();
        });

        return response()->json(['success' => true]);
    }

    public function show(string $slug): JsonResponse
    {
        $facility = $this->findFacility($slug);
        $facility->load(['hours', 'images']);

        return response()->json([
            'facility' => $this->facilityPayload($facility),
            'opening_hours' => $facility->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
            'images' => $facility->images->map(fn ($i) => $this->imagePayload($i))->values(),
            'image_keys' => array_keys(config_array('otelapps.fitness_image_keys')),
            'detail_screens' => self::DETAIL_SCREENS,
        ]);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $facility = $this->findFacility($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'list_label' => ['nullable', 'string', 'max:120'],
            'schedule_summary' => ['nullable', 'string', 'max:120'],
            'description_long' => ['nullable', 'string'],
            'image_key' => ['nullable', 'string', 'max:120'],
            'detail_screen' => ['sometimes', Rule::in(self::DETAIL_SCREENS)],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'opening_hours' => ['sometimes', 'array'],
            'opening_hours.*.day_order' => ['required_with:opening_hours', 'integer', 'between:1,7'],
            'opening_hours.*.day_name' => ['required_with:opening_hours', 'string', 'max:40'],
            'opening_hours.*.hours_text' => ['required_with:opening_hours', 'string', 'max:80'],
        ]);

        $openingHours = $data['opening_hours'] ?? null;
        unset($data['opening_hours']);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($facility, $data, $openingHours) {
            if ($data !== []) {
                $facility->update($data);
            }

            if (is_array($openingHours)) {
                foreach ($openingHours as $row) {
                    FitnessFacilityHour::updateOrCreate(
                        [
                            'facility_id' => $facility->id,
                            'day_order' => $row['day_order'],
                        ],
                        [
                            'day_name' => $row['day_name'],
                            'hours_text' => $row['hours_text'],
                        ]
                    );
                }
            }
        });

        return response()->json([
            'facility' => $this->facilityPayload($facility->fresh(['hours'])),
        ]);
    }

    public function updateImages(Request $request, string $slug): JsonResponse
    {
        $facility = $this->findFacility($slug);

        $data = $request->validate([
            'images' => ['required', 'array'],
            'images.*.id' => ['nullable', 'uuid'],
            'images.*.image_key' => ['nullable', 'string', 'max:120'],
            'images.*.image_url' => ['nullable', 'string', 'max:500'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($facility, $data) {
            $keptIds = [];

            foreach ($data['images'] as $index => $imageData) {
                if (empty($imageData['image_key']) && empty($imageData['image_url'])) {
                    continue;
                }

                $image = isset($imageData['id'])
                    ? FitnessFacilityImage::where('facility_id', $facility->id)
                        ->where('id', $imageData['id'])
                        ->first()
                    : null;

                if (! $image) {
                    $image = FitnessFacilityImage::create([
                        'facility_id' => $facility->id,
                        'image_key' => $imageData['image_key'] ?? null,
                        'image_url' => $imageData['image_url'] ?? null,
                        'sort_order' => $imageData['sort_order'] ?? $index,
                    ]);
                } else {
                    $image->update([
                        'image_key' => $imageData['image_key'] ?? null,
                        'image_url' => $imageData['image_url'] ?? null,
                        'sort_order' => $imageData['sort_order'] ?? $index,
                    ]);
                }

                $keptIds[] = $image->id;
            }

            $query = FitnessFacilityImage::where('facility_id', $facility->id);
            if ($keptIds !== []) {
                $query->whereNotIn('id', $keptIds);
            }
            $query->delete();
        });

        $facility->load('images');

        return response()->json([
            'images' => $facility->images->map(fn ($i) => $this->imagePayload($i))->values(),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findFacility(string $slug): FitnessFacility
    {
        return $this->findByHotelSlug(FitnessFacility::class, $slug);
    }

    private function seedDefaultHours(FitnessFacility $facility): void
    {
        $days = [
            [1, 'Pondělí'],
            [2, 'Úterý'],
            [3, 'Středa'],
            [4, 'Čtvrtek'],
            [5, 'Pátek'],
            [6, 'Sobota'],
            [7, 'Neděle'],
        ];

        foreach ($days as [$order, $name]) {
            FitnessFacilityHour::create([
                'facility_id' => $facility->id,
                'day_order' => $order,
                'day_name' => $name,
                'hours_text' => '07:00 - 21:00',
            ]);
        }
    }

    private function listItem(FitnessFacility $facility): array
    {
        $imageMap = config_array('otelapps.fitness_image_keys');

        return [
            'id' => $facility->slug,
            'slug' => $facility->slug,
            'title' => $facility->title,
            'image' => $imageMap[$facility->image_key] ?? null,
            'list_label' => $facility->list_label,
            'schedule_summary' => $facility->schedule_summary,
            'is_active' => $facility->is_active,
            'detail_screen' => $facility->detail_screen,
        ];
    }

    private function facilityPayload(FitnessFacility $facility): array
    {
        return [
            'id' => $facility->id,
            'slug' => $facility->slug,
            'title' => $facility->title,
            'list_label' => $facility->list_label,
            'schedule_summary' => $facility->schedule_summary,
            'description_long' => $facility->description_long,
            'image_key' => $facility->image_key,
            'detail_screen' => $facility->detail_screen,
            'sort_order' => $facility->sort_order,
            'is_active' => $facility->is_active,
        ];
    }

    private function imagePayload(FitnessFacilityImage $image): array
    {
        return [
            'id' => $image->id,
            'image_key' => $image->image_key,
            'image_url' => $image->image_url,
            'sort_order' => $image->sort_order,
        ];
    }
}
