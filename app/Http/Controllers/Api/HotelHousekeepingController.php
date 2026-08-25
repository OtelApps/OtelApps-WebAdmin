<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelHousekeeping;
use App\Models\HotelHousekeepingCategory;
use App\Models\HotelHousekeepingHour;
use App\Models\HotelHousekeepingItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HotelHousekeepingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $housekeeping = $this->resolveHousekeeping($request);
        $housekeeping->load(['categories.items']);

        $housekeepingSlug = $housekeeping->slug;
        $sections = $housekeeping->categories->map(function ($category) use ($housekeepingSlug) {
            return [
                'id' => $category->slug,
                'title' => $category->title,
                'items' => $category->items
                    ->map(fn ($item) => $this->listItem($item, $housekeepingSlug, $category->title))
                    ->values(),
            ];
        })->values();

        return response()->json([
            'title' => $housekeeping->title,
            'housekeeping_slug' => $housekeeping->slug,
            'description' => $housekeeping->description,
            'schedule_summary' => $housekeeping->schedule_summary,
            'is_active' => $housekeeping->is_active,
            'sections' => $sections,
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $housekeeping = $this->findHousekeeping($slug);
        $housekeeping->load(['hours', 'categories.items']);

        return response()->json([
            'housekeeping' => $this->housekeepingPayload($housekeeping),
            'opening_hours' => $housekeeping->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
            'categories' => $housekeeping->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
            'image_keys' => array_keys(config_array('otelapps.hotel_housekeeping_image_keys')),
        ]);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $housekeeping = $this->findHousekeeping($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'schedule_summary' => ['nullable', 'string', 'max:120'],
            'header_image_key' => ['nullable', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $housekeeping->update($data);

        return response()->json([
            'housekeeping' => $this->housekeepingPayload($housekeeping->fresh()),
        ]);
    }

    public function updateHours(Request $request, string $slug): JsonResponse
    {
        $housekeeping = $this->findHousekeeping($slug);

        $data = $request->validate([
            'opening_hours' => ['required', 'array'],
            'opening_hours.*.day_order' => ['required', 'integer', 'between:1,7'],
            'opening_hours.*.day_name' => ['required', 'string', 'max:40'],
            'opening_hours.*.hours_text' => ['required', 'string', 'max:80'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($housekeeping, $data) {
            foreach ($data['opening_hours'] as $row) {
                HotelHousekeepingHour::updateOrCreate(
                    [
                        'housekeeping_id' => $housekeeping->id,
                        'day_order' => $row['day_order'],
                    ],
                    [
                        'day_name' => $row['day_name'],
                        'hours_text' => $row['hours_text'],
                    ]
                );
            }
        });

        $housekeeping->load('hours');

        return response()->json([
            'opening_hours' => $housekeeping->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
        ]);
    }

    public function updateCatalog(Request $request, string $slug): JsonResponse
    {
        $housekeeping = $this->findHousekeeping($slug);

        $data = $request->validate([
            'categories' => ['required', 'array'],
            'categories.*.id' => ['nullable', 'uuid'],
            'categories.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'categories.*.title' => ['required', 'string', 'max:255'],
            'categories.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'categories.*.items' => ['nullable', 'array'],
            'categories.*.items.*.id' => ['nullable', 'uuid'],
            'categories.*.items.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'categories.*.items.*.title' => ['required', 'string', 'max:255'],
            'categories.*.items.*.icon_image_key' => ['nullable', 'string', 'max:120'],
            'categories.*.items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'categories.*.items.*.is_available' => ['nullable', 'boolean'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($housekeeping, $data) {
            $keptCategoryIds = [];

            foreach ($data['categories'] as $categoryData) {
                $category = isset($categoryData['id'])
                    ? HotelHousekeepingCategory::where('housekeeping_id', $housekeeping->id)
                        ->where('id', $categoryData['id'])
                        ->first()
                    : null;

                if (! $category) {
                    $category = HotelHousekeepingCategory::create([
                        'housekeeping_id' => $housekeeping->id,
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
                        ? HotelHousekeepingItem::where('category_id', $category->id)
                            ->where('id', $itemData['id'])
                            ->first()
                        : null;

                    if (! $item) {
                        $item = HotelHousekeepingItem::create([
                            'category_id' => $category->id,
                            'slug' => $itemData['slug'],
                            'title' => $itemData['title'],
                            'icon_image_key' => $itemData['icon_image_key'] ?? null,
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    } else {
                        $item->update([
                            'slug' => $itemData['slug'],
                            'title' => $itemData['title'],
                            'icon_image_key' => $itemData['icon_image_key'] ?? null,
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    }

                    $keptItemIds[] = $item->id;
                }

                $itemQuery = HotelHousekeepingItem::where('category_id', $category->id);
                if ($keptItemIds !== []) {
                    $itemQuery->whereNotIn('id', $keptItemIds);
                }
                $itemQuery->delete();
            }

            $categoryQuery = HotelHousekeepingCategory::where('housekeeping_id', $housekeeping->id);
            if ($keptCategoryIds !== []) {
                $categoryQuery->whereNotIn('id', $keptCategoryIds);
            }
            $categoryQuery->delete();
        });

        $housekeeping->load(['categories.items']);

        return response()->json([
            'categories' => $housekeeping->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
        ]);
    }

    public function storeCatalogItem(Request $request, string $slug, string $categorySlug): JsonResponse
    {
        $housekeeping = $this->findHousekeeping($slug);
        $category = HotelHousekeepingCategory::query()
            ->where('housekeeping_id', $housekeeping->id)
            ->where('slug', $categorySlug)
            ->firstOrFail();

        $data = $request->validate([
            'slug' => [
                'required',
                'string',
                'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            ],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $item = HotelHousekeepingItem::create([
            'category_id' => $category->id,
            'slug' => $data['slug'],
            'title' => $data['title'],
            'sort_order' => $category->items()->count(),
            'is_available' => true,
        ]);

        return response()->json(['item' => ['id' => $item->id, 'slug' => $item->slug]], 201);
    }

    public function destroyCatalogItem(string $slug, string $itemId): JsonResponse
    {
        $housekeeping = $this->findHousekeeping($slug);
        $item = HotelHousekeepingItem::query()
            ->where('id', $itemId)
            ->whereHas('category', fn ($q) => $q->where('housekeeping_id', $housekeeping->id))
            ->firstOrFail();
        $item->delete();

        return response()->json(['success' => true]);
    }

    private function resolveHousekeeping(Request $request): HotelHousekeeping
    {
        $hotelSlug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));
        $housekeepingSlug = $request->query('housekeeping_slug', 'uklid-pokoje');

        $hotel = Hotel::where('slug', $hotelSlug)->firstOrFail();

        return HotelHousekeeping::where('hotel_id', $hotel->id)
            ->where('slug', $housekeepingSlug)
            ->firstOrFail();
    }

    private function findHousekeeping(string $slug): HotelHousekeeping
    {
        return HotelHousekeeping::where('slug', $slug)->firstOrFail();
    }

    private function listItem(HotelHousekeepingItem $item, string $housekeepingSlug, string $categoryTitle): array
    {
        return [
            'id' => $item->slug,
            'record_id' => $item->id,
            'edit_slug' => $housekeepingSlug,
            'slug' => $item->slug,
            'title' => $item->title,
            'list_label' => $categoryTitle,
            'schedule_summary' => $item->icon_image_key,
            'is_active' => $item->is_available,
        ];
    }

    private function housekeepingPayload(HotelHousekeeping $housekeeping): array
    {
        return [
            'id' => $housekeeping->id,
            'slug' => $housekeeping->slug,
            'title' => $housekeeping->title,
            'description' => $housekeeping->description,
            'schedule_summary' => $housekeeping->schedule_summary,
            'header_image_key' => $housekeeping->header_image_key,
            'is_active' => $housekeeping->is_active,
        ];
    }

    private function categoryPayload(HotelHousekeepingCategory $category): array
    {
        return [
            'id' => $category->id,
            'slug' => $category->slug,
            'title' => $category->title,
            'sort_order' => $category->sort_order,
            'items' => $category->items->map(fn ($i) => [
                'id' => $i->id,
                'slug' => $i->slug,
                'title' => $i->title,
                'icon_image_key' => $i->icon_image_key,
                'sort_order' => $i->sort_order,
                'is_available' => $i->is_available,
            ])->values(),
        ];
    }
}
