<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelRelaxSport;
use App\Models\HotelRelaxSportArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RelaxSportController extends Controller
{
    private const LIST_SCREENS = ['WellnessSpaList', 'PosilovnaSportList'];

    private const AREA_SLUGS = ['wellness-spa', 'gym-sport'];

    public function show(Request $request): JsonResponse
    {
        $relaxSport = $this->resolveRelaxSport($request);
        $this->ensureDefaultAreas($relaxSport);
        $relaxSport->load('areas');

        $enabledCount = $relaxSport->areas->where('is_enabled', true)->count();

        return response()->json([
            'relax_sport' => $this->relaxSportPayload($relaxSport),
            'areas' => $relaxSport->areas->map(fn ($a) => $this->areaPayload($a))->values(),
            'enabled_area_count' => $enabledCount,
            'layout_variant' => $enabledCount === 1 ? 'full' : ($enabledCount >= 2 ? 'half' : 'hidden'),
            'home_image_keys' => array_keys(config_array('otelapps.relax_sport_home_image_keys')),
            'list_screens' => self::LIST_SCREENS,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $relaxSport = $this->resolveRelaxSport($request);

        $data = $request->validate([
            'section_title' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $relaxSport->update($data);

        return response()->json([
            'relax_sport' => $this->relaxSportPayload($relaxSport->fresh()),
        ]);
    }

    public function updateAreas(Request $request): JsonResponse
    {
        $relaxSport = $this->resolveRelaxSport($request);

        $data = $request->validate([
            'areas' => ['required', 'array'],
            'areas.*.slug' => ['required', 'string', Rule::in(self::AREA_SLUGS)],
            'areas.*.home_title' => ['required', 'string', 'max:255'],
            'areas.*.home_image_key' => ['nullable', 'string', 'max:120'],
            'areas.*.list_screen' => ['required', Rule::in(self::LIST_SCREENS)],
            'areas.*.list_title' => ['required', 'string', 'max:255'],
            'areas.*.is_enabled' => ['required', 'boolean'],
            'areas.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:10'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($relaxSport, $data) {
            foreach ($data['areas'] as $areaData) {
                HotelRelaxSportArea::where('relax_sport_id', $relaxSport->id)
                    ->where('slug', $areaData['slug'])
                    ->update([
                        'home_title' => $areaData['home_title'],
                        'home_image_key' => $areaData['home_image_key'] ?? null,
                        'list_screen' => $areaData['list_screen'],
                        'list_title' => $areaData['list_title'],
                        'is_enabled' => $areaData['is_enabled'],
                        'sort_order' => $areaData['sort_order'] ?? 0,
                    ]);
            }
        });

        $relaxSport->load('areas');
        $enabledCount = $relaxSport->areas->where('is_enabled', true)->count();

        return response()->json([
            'areas' => $relaxSport->areas->map(fn ($a) => $this->areaPayload($a))->values(),
            'enabled_area_count' => $enabledCount,
            'layout_variant' => $enabledCount === 1 ? 'full' : ($enabledCount >= 2 ? 'half' : 'hidden'),
        ]);
    }

    private function resolveRelaxSport(Request $request): HotelRelaxSport
    {
        $hotel = $this->resolveHotel($request);

        return HotelRelaxSport::firstOrCreate(
            ['hotel_id' => $hotel->id],
            [
                'section_title' => 'Relax a Sport',
                'is_active' => true,
            ]
        );
    }

    private function ensureDefaultAreas(HotelRelaxSport $relaxSport): void
    {
        if ($relaxSport->areas()->exists()) {
            return;
        }

        $defaults = [
            [
                'slug' => 'wellness-spa',
                'home_title' => 'Wellness & SPA',
                'home_image_key' => 'sauna',
                'list_screen' => 'WellnessSpaList',
                'list_title' => 'Wellness & SPA',
                'sort_order' => 1,
            ],
            [
                'slug' => 'gym-sport',
                'home_title' => 'Posilovna a sport',
                'home_image_key' => 'gym',
                'list_screen' => 'PosilovnaSportList',
                'list_title' => 'Posilovna & Sport',
                'sort_order' => 2,
            ],
        ];

        foreach ($defaults as $area) {
            HotelRelaxSportArea::create([
                'relax_sport_id' => $relaxSport->id,
                ...$area,
                'is_enabled' => true,
            ]);
        }
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function relaxSportPayload(HotelRelaxSport $relaxSport): array
    {
        return [
            'id' => $relaxSport->id,
            'section_title' => $relaxSport->section_title,
            'is_active' => $relaxSport->is_active,
        ];
    }

    private function areaPayload(HotelRelaxSportArea $area): array
    {
        return [
            'id' => $area->id,
            'slug' => $area->slug,
            'home_title' => $area->home_title,
            'home_image_key' => $area->home_image_key,
            'list_screen' => $area->list_screen,
            'list_title' => $area->list_title,
            'is_enabled' => $area->is_enabled,
            'sort_order' => $area->sort_order,
            'list_module' => $area->slug === 'wellness-spa' ? 'wellness_spa' : 'sports',
        ];
    }
}
