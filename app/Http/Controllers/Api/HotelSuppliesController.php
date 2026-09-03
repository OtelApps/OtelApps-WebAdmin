<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\FindsHotelScopedSlug;
use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelSupplies;
use App\Models\HotelSuppliesCategory;
use App\Models\HotelSuppliesHour;
use App\Models\HotelSuppliesItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HotelSuppliesController extends Controller
{
    use FindsHotelScopedSlug;

    public function index(Request $request): JsonResponse
    {
        $supplies = $this->resolveSupplies($request);
        $supplies->load(['categories.items']);

        $suppliesSlug = $supplies->slug;
        $sections = $supplies->categories->map(function ($category) use ($suppliesSlug) {
            return [
                'id' => $category->slug,
                'title' => $category->title,
                'items' => $category->items
                    ->map(fn ($item) => $this->listItem($item, $suppliesSlug, $category->title))
                    ->values(),
            ];
        })->values();

        return response()->json([
            'title' => $supplies->title,
            'supplies_slug' => $supplies->slug,
            'description' => $supplies->description,
            'schedule_summary' => $supplies->schedule_summary,
            'max_quantity_per_item' => $supplies->max_quantity_per_item,
            'is_active' => $supplies->is_active,
            'sections' => $sections,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $supplies = $this->findSupplies($slug);
        $supplies->load(['hours', 'categories.items']);

        return response()->json([
            'supplies' => $this->suppliesPayload($supplies),
            'opening_hours' => $supplies->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
            'categories' => $supplies->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
            'image_keys' => array_keys(config_array('otelapps.hotel_supplies_image_keys')),
        ]);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $supplies = $this->findSupplies($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'schedule_summary' => ['nullable', 'string', 'max:120'],
            'header_image_key' => ['nullable', 'string', 'max:120'],
            'max_quantity_per_item' => ['sometimes', 'integer', 'min:1', 'max:99'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $supplies->update($data);

        return response()->json([
            'supplies' => $this->suppliesPayload($supplies->fresh()),
        ]);
    }

    public function updateHours(Request $request, string $slug): JsonResponse
    {
        $supplies = $this->findSupplies($slug);

        $data = $request->validate([
            'opening_hours' => ['required', 'array'],
            'opening_hours.*.day_order' => ['required', 'integer', 'between:1,7'],
            'opening_hours.*.day_name' => ['required', 'string', 'max:40'],
            'opening_hours.*.hours_text' => ['required', 'string', 'max:80'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($supplies, $data) {
            foreach ($data['opening_hours'] as $row) {
                HotelSuppliesHour::updateOrCreate(
                    [
                        'supplies_id' => $supplies->id,
                        'day_order' => $row['day_order'],
                    ],
                    [
                        'day_name' => $row['day_name'],
                        'hours_text' => $row['hours_text'],
                    ]
                );
            }
        });

        $supplies->load('hours');

        return response()->json([
            'opening_hours' => $supplies->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
        ]);
    }

    public function updateCatalog(Request $request, string $slug): JsonResponse
    {
        $supplies = $this->findSupplies($slug);

        $data = $request->validate([
            'categories' => ['required', 'array'],
            'categories.*.id' => ['nullable', 'uuid'],
            'categories.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'categories.*.title' => ['required', 'string', 'max:255'],
            'categories.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'categories.*.items' => ['nullable', 'array'],
            'categories.*.items.*.id' => ['nullable', 'uuid'],
            'categories.*.items.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'categories.*.items.*.name' => ['required', 'string', 'max:255'],
            'categories.*.items.*.icon_emoji' => ['nullable', 'string', 'max:16'],
            'categories.*.items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'categories.*.items.*.is_available' => ['nullable', 'boolean'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($supplies, $data) {
            $keptCategoryIds = [];

            foreach ($data['categories'] as $categoryData) {
                $category = isset($categoryData['id'])
                    ? HotelSuppliesCategory::where('supplies_id', $supplies->id)
                        ->where('id', $categoryData['id'])
                        ->first()
                    : null;

                if (! $category) {
                    $category = HotelSuppliesCategory::create([
                        'supplies_id' => $supplies->id,
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
                        ? HotelSuppliesItem::where('category_id', $category->id)
                            ->where('id', $itemData['id'])
                            ->first()
                        : null;

                    if (! $item) {
                        $item = HotelSuppliesItem::create([
                            'category_id' => $category->id,
                            'slug' => $itemData['slug'],
                            'name' => $itemData['name'],
                            'icon_emoji' => $itemData['icon_emoji'] ?? null,
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    } else {
                        $item->update([
                            'slug' => $itemData['slug'],
                            'name' => $itemData['name'],
                            'icon_emoji' => $itemData['icon_emoji'] ?? null,
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    }

                    $keptItemIds[] = $item->id;
                }

                $itemQuery = HotelSuppliesItem::where('category_id', $category->id);
                if ($keptItemIds !== []) {
                    $itemQuery->whereNotIn('id', $keptItemIds);
                }
                $itemQuery->delete();
            }

            $categoryQuery = HotelSuppliesCategory::where('supplies_id', $supplies->id);
            if ($keptCategoryIds !== []) {
                $categoryQuery->whereNotIn('id', $keptCategoryIds);
            }
            $categoryQuery->delete();
        });

        $supplies->load(['categories.items']);

        return response()->json([
            'categories' => $supplies->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
        ]);
    }

    public function storeCatalogItem(Request $request, string $slug, string $categorySlug): JsonResponse
    {
        $supplies = $this->findSupplies($slug);
        $category = HotelSuppliesCategory::query()
            ->where('supplies_id', $supplies->id)
            ->where('slug', $categorySlug)
            ->firstOrFail();

        $data = $request->validate([
            'slug' => [
                'required',
                'string',
                'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            ],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $item = HotelSuppliesItem::create([
            'category_id' => $category->id,
            'slug' => $data['slug'],
            'name' => $data['name'],
            'sort_order' => $category->items()->count(),
            'is_available' => true,
        ]);

        return response()->json(['item' => ['id' => $item->id, 'slug' => $item->slug]], 201);
    }

    public function destroyCatalogItem(string $slug, string $itemId): JsonResponse
    {
        $supplies = $this->findSupplies($slug);
        $item = HotelSuppliesItem::query()
            ->where('id', $itemId)
            ->whereHas('category', fn ($q) => $q->where('supplies_id', $supplies->id))
            ->firstOrFail();
        $item->delete();

        return response()->json(['success' => true]);
    }

    private function resolveSupplies(Request $request): HotelSupplies
    {
        $hotelSlug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));
        $suppliesSlug = $request->query('supplies_slug', 'doplnky');

        $hotel = Hotel::where('slug', $hotelSlug)->firstOrFail();

        return HotelSupplies::where('hotel_id', $hotel->id)
            ->where('slug', $suppliesSlug)
            ->firstOrFail();
    }

    private function findSupplies(string $slug): HotelSupplies
    {
        return $this->findByHotelSlug(HotelSupplies::class, $slug);
    }

    private function listItem(HotelSuppliesItem $item, string $suppliesSlug, string $categoryTitle): array
    {
        $emoji = $item->icon_emoji ? $item->icon_emoji.' ' : '';

        return [
            'id' => $item->slug,
            'record_id' => $item->id,
            'edit_slug' => $suppliesSlug,
            'slug' => $item->slug,
            'title' => $emoji.$item->name,
            'list_label' => $categoryTitle,
            'is_active' => $item->is_available,
        ];
    }

    private function suppliesPayload(HotelSupplies $supplies): array
    {
        return [
            'id' => $supplies->id,
            'slug' => $supplies->slug,
            'title' => $supplies->title,
            'description' => $supplies->description,
            'schedule_summary' => $supplies->schedule_summary,
            'header_image_key' => $supplies->header_image_key,
            'max_quantity_per_item' => $supplies->max_quantity_per_item,
            'is_active' => $supplies->is_active,
        ];
    }

    private function categoryPayload(HotelSuppliesCategory $category): array
    {
        return [
            'id' => $category->id,
            'slug' => $category->slug,
            'title' => $category->title,
            'sort_order' => $category->sort_order,
            'items' => $category->items->map(fn ($i) => [
                'id' => $i->id,
                'slug' => $i->slug,
                'name' => $i->name,
                'icon_emoji' => $i->icon_emoji,
                'sort_order' => $i->sort_order,
                'is_available' => $i->is_available,
            ])->values(),
        ];
    }
}
