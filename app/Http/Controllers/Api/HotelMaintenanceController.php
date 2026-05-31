<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelMaintenance;
use App\Models\HotelMaintenanceCategory;
use App\Models\HotelMaintenanceHour;
use App\Models\HotelMaintenanceItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HotelMaintenanceController extends Controller
{
    private const ICON_LIBRARIES = ['ionicons', 'material-community'];

    public function index(Request $request): JsonResponse
    {
        $maintenance = $this->resolveMaintenance($request);
        $maintenance->load(['categories.items']);

        $maintenanceSlug = $maintenance->slug;
        $sections = $maintenance->categories->map(function ($category) use ($maintenanceSlug) {
            return [
                'id' => $category->slug,
                'title' => $category->title,
                'items' => $category->items
                    ->map(fn ($item) => $this->listItem($item, $maintenanceSlug, $category->title))
                    ->values(),
            ];
        })->values();

        return response()->json([
            'title' => $maintenance->title,
            'maintenance_slug' => $maintenance->slug,
            'description' => $maintenance->description,
            'description_extra' => $maintenance->description_extra,
            'schedule_summary' => $maintenance->schedule_summary,
            'is_active' => $maintenance->is_active,
            'sections' => $sections,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $maintenance = $this->findMaintenance($slug);
        $maintenance->load(['hours', 'categories.items']);

        return response()->json([
            'maintenance' => $this->maintenancePayload($maintenance),
            'opening_hours' => $maintenance->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
            'categories' => $maintenance->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
            'image_keys' => array_keys(config_array('otelapps.hotel_maintenance_image_keys')),
            'icon_libraries' => self::ICON_LIBRARIES,
        ]);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $maintenance = $this->findMaintenance($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'description_extra' => ['nullable', 'string'],
            'schedule_summary' => ['nullable', 'string', 'max:120'],
            'header_image_key' => ['nullable', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $maintenance->update($data);

        return response()->json([
            'maintenance' => $this->maintenancePayload($maintenance->fresh()),
        ]);
    }

    public function updateHours(Request $request, string $slug): JsonResponse
    {
        $maintenance = $this->findMaintenance($slug);

        $data = $request->validate([
            'opening_hours' => ['required', 'array'],
            'opening_hours.*.day_order' => ['required', 'integer', 'between:1,7'],
            'opening_hours.*.day_name' => ['required', 'string', 'max:40'],
            'opening_hours.*.hours_text' => ['required', 'string', 'max:80'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($maintenance, $data) {
            foreach ($data['opening_hours'] as $row) {
                HotelMaintenanceHour::updateOrCreate(
                    [
                        'maintenance_id' => $maintenance->id,
                        'day_order' => $row['day_order'],
                    ],
                    [
                        'day_name' => $row['day_name'],
                        'hours_text' => $row['hours_text'],
                    ]
                );
            }
        });

        $maintenance->load('hours');

        return response()->json([
            'opening_hours' => $maintenance->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
        ]);
    }

    public function updateCatalog(Request $request, string $slug): JsonResponse
    {
        $maintenance = $this->findMaintenance($slug);

        $data = $request->validate([
            'categories' => ['required', 'array'],
            'categories.*.id' => ['nullable', 'uuid'],
            'categories.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'categories.*.title' => ['required', 'string', 'max:255'],
            'categories.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'categories.*.items' => ['nullable', 'array'],
            'categories.*.items.*.id' => ['nullable', 'uuid'],
            'categories.*.items.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'categories.*.items.*.label' => ['required', 'string', 'max:255'],
            'categories.*.items.*.icon_library' => ['required', Rule::in(self::ICON_LIBRARIES)],
            'categories.*.items.*.icon_name' => ['required', 'string', 'max:120'],
            'categories.*.items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'categories.*.items.*.is_available' => ['nullable', 'boolean'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($maintenance, $data) {
            $keptCategoryIds = [];

            foreach ($data['categories'] as $categoryData) {
                $category = isset($categoryData['id'])
                    ? HotelMaintenanceCategory::where('maintenance_id', $maintenance->id)
                        ->where('id', $categoryData['id'])
                        ->first()
                    : null;

                if (! $category) {
                    $category = HotelMaintenanceCategory::create([
                        'maintenance_id' => $maintenance->id,
                        'slug' => $categoryData['slug'],
                        'title' => $categoryData['title'],
                        'sort_order' => $categoryData['sort_order'] ?? 0,
                    ]);
                } else {
                    $category->update([
                        'slug' => $categoryData['slug'],
                        'title' => $categoryData['title'],
                        'sort_order' => $categoryData['sort_order'] ?? 0,
                    ]);
                }

                $keptCategoryIds[] = $category->id;
                $keptItemIds = [];

                foreach ($categoryData['items'] ?? [] as $itemData) {
                    $item = isset($itemData['id'])
                        ? HotelMaintenanceItem::where('category_id', $category->id)
                            ->where('id', $itemData['id'])
                            ->first()
                        : null;

                    if (! $item) {
                        $item = HotelMaintenanceItem::create([
                            'category_id' => $category->id,
                            'slug' => $itemData['slug'],
                            'label' => $itemData['label'],
                            'icon_library' => $itemData['icon_library'],
                            'icon_name' => $itemData['icon_name'],
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    } else {
                        $item->update([
                            'slug' => $itemData['slug'],
                            'label' => $itemData['label'],
                            'icon_library' => $itemData['icon_library'],
                            'icon_name' => $itemData['icon_name'],
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    }

                    $keptItemIds[] = $item->id;
                }

                $itemQuery = HotelMaintenanceItem::where('category_id', $category->id);
                if ($keptItemIds !== []) {
                    $itemQuery->whereNotIn('id', $keptItemIds);
                }
                $itemQuery->delete();
            }

            $categoryQuery = HotelMaintenanceCategory::where('maintenance_id', $maintenance->id);
            if ($keptCategoryIds !== []) {
                $categoryQuery->whereNotIn('id', $keptCategoryIds);
            }
            $categoryQuery->delete();
        });

        $maintenance->load(['categories.items']);

        return response()->json([
            'categories' => $maintenance->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
        ]);
    }

    public function storeCatalogItem(Request $request, string $slug, string $categorySlug): JsonResponse
    {
        $maintenance = $this->findMaintenance($slug);
        $category = HotelMaintenanceCategory::query()
            ->where('maintenance_id', $maintenance->id)
            ->where('slug', $categorySlug)
            ->firstOrFail();

        $data = $request->validate([
            'slug' => [
                'required',
                'string',
                'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            ],
            'label' => ['required', 'string', 'max:255'],
        ]);

        $item = HotelMaintenanceItem::create([
            'category_id' => $category->id,
            'slug' => $data['slug'],
            'label' => $data['label'],
            'icon_library' => 'ionicons',
            'icon_name' => 'construct-outline',
            'sort_order' => $category->items()->count(),
            'is_available' => true,
        ]);

        return response()->json(['item' => ['id' => $item->id, 'slug' => $item->slug]], 201);
    }

    public function destroyCatalogItem(string $slug, string $itemId): JsonResponse
    {
        $maintenance = $this->findMaintenance($slug);
        $item = HotelMaintenanceItem::query()
            ->where('id', $itemId)
            ->whereHas('category', fn ($q) => $q->where('maintenance_id', $maintenance->id))
            ->firstOrFail();
        $item->delete();

        return response()->json(['success' => true]);
    }

    private function resolveMaintenance(Request $request): HotelMaintenance
    {
        $hotelSlug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));
        $maintenanceSlug = $request->query('maintenance_slug', 'udrzba-opravy');

        $hotel = Hotel::where('slug', $hotelSlug)->firstOrFail();

        return HotelMaintenance::where('hotel_id', $hotel->id)
            ->where('slug', $maintenanceSlug)
            ->firstOrFail();
    }

    private function findMaintenance(string $slug): HotelMaintenance
    {
        return HotelMaintenance::where('slug', $slug)->firstOrFail();
    }

    private function listItem(HotelMaintenanceItem $item, string $maintenanceSlug, string $categoryTitle): array
    {
        return [
            'id' => $item->slug,
            'record_id' => $item->id,
            'edit_slug' => $maintenanceSlug,
            'slug' => $item->slug,
            'title' => $item->label,
            'list_label' => $categoryTitle,
            'schedule_summary' => $item->icon_name,
            'is_active' => $item->is_available,
        ];
    }

    private function maintenancePayload(HotelMaintenance $maintenance): array
    {
        return [
            'id' => $maintenance->id,
            'slug' => $maintenance->slug,
            'title' => $maintenance->title,
            'description' => $maintenance->description,
            'description_extra' => $maintenance->description_extra,
            'schedule_summary' => $maintenance->schedule_summary,
            'header_image_key' => $maintenance->header_image_key,
            'is_active' => $maintenance->is_active,
        ];
    }

    private function categoryPayload(HotelMaintenanceCategory $category): array
    {
        return [
            'id' => $category->id,
            'slug' => $category->slug,
            'title' => $category->title,
            'sort_order' => $category->sort_order,
            'items' => $category->items->map(fn ($i) => [
                'id' => $i->id,
                'slug' => $i->slug,
                'label' => $i->label,
                'icon_library' => $i->icon_library,
                'icon_name' => $i->icon_name,
                'sort_order' => $i->sort_order,
                'is_available' => $i->is_available,
            ])->values(),
        ];
    }
}
