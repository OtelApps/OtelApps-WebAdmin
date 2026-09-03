<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\FindsHotelScopedSlug;
use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\WellnessFacility;
use App\Models\WellnessFacilityHour;
use App\Models\WellnessProgramEvent;
use App\Models\WellnessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WellnessController extends Controller
{
    use FindsHotelScopedSlug;

    private const DETAIL_SCREENS = ['PoolDetail', 'WellnessDetail', 'ThaiMassageDetail'];

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $facilities = WellnessFacility::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return response()->json([
            'title' => 'Wellness & SPA',
            'sections' => [
                [
                    'id' => 'facilities',
                    'title' => 'Wellness & SPA',
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
                $this->uniqueSlugPerHotel(WellnessFacility::class, $hotel),
            ],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $facility = WellnessFacility::create([
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
            $facility->services()->delete();
            $facility->delete();
        });

        return response()->json(['success' => true]);
    }

    public function show(string $slug): JsonResponse
    {
        $facility = $this->findFacility($slug);
        $facility->load(['hours', 'services', 'images']);

        return response()->json([
            'facility' => $this->facilityPayload($facility),
            'opening_hours' => $facility->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
            'services' => $facility->services->map(fn ($s) => $this->servicePayload($s))->values(),
            'image_keys' => array_keys(config_array('otelapps.wellness_image_keys')),
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
                    WellnessFacilityHour::updateOrCreate(
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

    public function updateServices(Request $request, string $slug): JsonResponse
    {
        $facility = $this->findFacility($slug);

        $data = $request->validate([
            'services' => ['required', 'array'],
            'services.*.id' => ['nullable', 'uuid'],
            'services.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'services.*.name' => ['required', 'string', 'max:255'],
            'services.*.duration_minutes' => ['required', 'integer', 'min:1'],
            'services.*.price_amount' => ['required', 'numeric', 'min:0'],
            'services.*.currency' => ['nullable', 'string', 'max:8'],
            'services.*.description' => ['nullable', 'string'],
            'services.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'services.*.is_available' => ['nullable', 'boolean'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($facility, $data) {
            $keptIds = [];

            foreach ($data['services'] as $serviceData) {
                $service = isset($serviceData['id'])
                    ? WellnessService::where('facility_id', $facility->id)->where('id', $serviceData['id'])->first()
                    : null;

                if (! $service) {
                    $service = WellnessService::create([
                        'facility_id' => $facility->id,
                        'slug' => $serviceData['slug'],
                        'name' => $serviceData['name'],
                        'duration_minutes' => $serviceData['duration_minutes'],
                        'price_amount' => $serviceData['price_amount'],
                        'currency' => $serviceData['currency'] ?? 'CZK',
                        'description' => $serviceData['description'] ?? null,
                        'sort_order' => $serviceData['sort_order'] ?? 0,
                        'is_available' => $serviceData['is_available'] ?? true,
                    ]);
                } else {
                    $service->update([
                        'slug' => $serviceData['slug'],
                        'name' => $serviceData['name'],
                        'duration_minutes' => $serviceData['duration_minutes'],
                        'price_amount' => $serviceData['price_amount'],
                        'currency' => $serviceData['currency'] ?? 'CZK',
                        'description' => $serviceData['description'] ?? null,
                        'sort_order' => $serviceData['sort_order'] ?? 0,
                        'is_available' => $serviceData['is_available'] ?? true,
                    ]);
                }

                $keptIds[] = $service->id;
            }

            $query = WellnessService::where('facility_id', $facility->id);
            if ($keptIds !== []) {
                $query->whereNotIn('id', $keptIds);
            }
            $query->delete();
        });

        $facility->load('services');

        return response()->json([
            'services' => $facility->services->map(fn ($s) => $this->servicePayload($s))->values(),
        ]);
    }

    public function programIndex(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $events = WellnessProgramEvent::query()
            ->where('hotel_id', $hotel->id)
            ->with('facility:id,slug,title')
            ->orderBy('day_order')
            ->orderBy('start_time')
            ->orderBy('sort_order')
            ->get();

        $facilities = WellnessFacility::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->get(['id', 'slug', 'title']);

        return response()->json([
            'events' => $events->map(fn ($e) => $this->programEventPayload($e))->values(),
            'facilities' => $facilities->map(fn ($f) => [
                'id' => $f->id,
                'slug' => $f->slug,
                'title' => $f->title,
            ])->values(),
            'day_names' => $this->dayNames(),
        ]);
    }

    public function updateProgram(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);

        $data = $request->validate([
            'events' => ['required', 'array'],
            'events.*.id' => ['nullable', 'uuid'],
            'events.*.day_order' => ['required', 'integer', 'between:1,7'],
            'events.*.start_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'events.*.title' => ['required', 'string', 'max:255'],
            'events.*.description' => ['nullable', 'string'],
            'events.*.facility_slug' => ['nullable', 'string', 'max:120'],
            'events.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'events.*.is_active' => ['nullable', 'boolean'],
        ]);

        $facilitySlugToId = WellnessFacility::query()
            ->where('hotel_id', $hotel->id)
            ->pluck('id', 'slug');

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($hotel, $data, $facilitySlugToId) {
            $keptIds = [];

            foreach ($data['events'] as $eventData) {
                $facilityId = null;
                if (! empty($eventData['facility_slug'])) {
                    $facilityId = $facilitySlugToId[$eventData['facility_slug']] ?? null;
                }

                $event = isset($eventData['id'])
                    ? WellnessProgramEvent::where('hotel_id', $hotel->id)->where('id', $eventData['id'])->first()
                    : null;

                $payload = [
                    'day_order' => $eventData['day_order'],
                    'start_time' => $eventData['start_time'],
                    'title' => $eventData['title'],
                    'description' => $eventData['description'] ?? null,
                    'facility_id' => $facilityId,
                    'sort_order' => $eventData['sort_order'] ?? 0,
                    'is_active' => $eventData['is_active'] ?? true,
                ];

                if (! $event) {
                    $event = WellnessProgramEvent::create([
                        ...$payload,
                        'hotel_id' => $hotel->id,
                    ]);
                } else {
                    $event->update($payload);
                }

                $keptIds[] = $event->id;
            }

            $query = WellnessProgramEvent::where('hotel_id', $hotel->id);
            if ($keptIds !== []) {
                $query->whereNotIn('id', $keptIds);
            }
            $query->delete();
        });

        $events = WellnessProgramEvent::query()
            ->where('hotel_id', $hotel->id)
            ->with('facility:id,slug,title')
            ->orderBy('day_order')
            ->orderBy('start_time')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'events' => $events->map(fn ($e) => $this->programEventPayload($e))->values(),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findFacility(string $slug): WellnessFacility
    {
        return $this->findByHotelSlug(WellnessFacility::class, $slug);
    }

    private function seedDefaultHours(WellnessFacility $facility): void
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
            WellnessFacilityHour::create([
                'facility_id' => $facility->id,
                'day_order' => $order,
                'day_name' => $name,
                'hours_text' => '10:00 - 20:00',
            ]);
        }
    }

    private function listItem(WellnessFacility $facility): array
    {
        $imageMap = config_array('otelapps.wellness_image_keys');

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

    private function facilityPayload(WellnessFacility $facility): array
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
            'has_services' => $facility->relationLoaded('services')
                ? $facility->services->isNotEmpty()
                : WellnessService::where('facility_id', $facility->id)->exists(),
        ];
    }

    private function servicePayload(WellnessService $service): array
    {
        return [
            'id' => $service->id,
            'slug' => $service->slug,
            'name' => $service->name,
            'duration_minutes' => $service->duration_minutes,
            'price_amount' => (float) $service->price_amount,
            'currency' => $service->currency,
            'description' => $service->description,
            'sort_order' => $service->sort_order,
            'is_available' => $service->is_available,
        ];
    }

    private function programEventPayload(WellnessProgramEvent $event): array
    {
        return [
            'id' => $event->id,
            'day_order' => $event->day_order,
            'start_time' => substr((string) $event->start_time, 0, 5),
            'title' => $event->title,
            'description' => $event->description,
            'facility_slug' => $event->facility?->slug,
            'facility_title' => $event->facility?->title,
            'sort_order' => $event->sort_order,
            'is_active' => $event->is_active,
        ];
    }

    private function dayNames(): array
    {
        return [
            1 => 'Pondělí',
            2 => 'Úterý',
            3 => 'Středa',
            4 => 'Čtvrtek',
            5 => 'Pátek',
            6 => 'Sobota',
            7 => 'Neděle',
        ];
    }
}
