<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Allergen;
use App\Models\Hotel;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Venue;
use App\Models\VenueMenu;
use App\Models\VenueOpeningHour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class VenueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $venues = Venue::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        $restaurants = $venues->where('venue_type', 'restaurant')->values()->map(fn ($v) => $this->listItem($v));
        $bars = $venues->where('venue_type', 'bar')->values()->map(fn ($v) => $this->listItem($v));

        return response()->json([
            'title' => 'Restaurants & Bars',
            'sections' => array_values(array_filter([
                $restaurants->isNotEmpty() ? [
                    'id' => 'restaurants',
                    'title' => 'Restaurants',
                    'items' => $restaurants,
                ] : null,
                $bars->isNotEmpty() ? [
                    'id' => 'bars',
                    'title' => 'Bars',
                    'items' => $bars,
                ] : null,
            ])),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $venue = $this->findVenue($slug);
        if ($venue->openingHours()->count() === 0) {
            $this->seedDefaultOpeningHours($venue);
        }
        $venue->load([
            'openingHours',
            'menus.categories.items.allergens',
        ]);

        return response()->json([
            'venue' => $this->venuePayload($venue),
            'opening_hours' => $venue->openingHours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
            'menus' => $venue->menus->map(fn ($menu) => $this->menuPayload($menu))->values(),
            'allergens' => Allergen::query()->orderBy('code')->get(['code', 'name_cs', 'name_en']),
            'image_keys' => array_keys(config_array('otelapps.venue_image_keys')),
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
                Rule::unique(Venue::class, 'slug'),
            ],
            'title' => ['required', 'string', 'max:255'],
            'venue_type' => ['required', Rule::in(['restaurant', 'bar'])],
            'description' => ['nullable', 'string'],
            'schedule_summary' => ['nullable', 'string', 'max:120'],
            'image_key' => ['nullable', 'string', 'max:120'],
            'list_label' => ['nullable', 'string', 'max:120'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $venue = DB::connection(config('otelapps.db_connection'))->transaction(function () use ($data, $hotel) {
            $venue = Venue::create([
                ...$data,
                'hotel_id' => $hotel->id,
                'sort_order' => $data['sort_order'] ?? 0,
                'is_active' => true,
            ]);

            $this->seedDefaultOpeningHours($venue);

            return $venue;
        });

        return response()->json(['venue' => $this->venuePayload($venue->fresh('openingHours'))], 201);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $venue = $this->findVenue($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'venue_type' => ['sometimes', Rule::in(['restaurant', 'bar'])],
            'description' => ['nullable', 'string'],
            'schedule_summary' => ['nullable', 'string', 'max:120'],
            'image_key' => ['nullable', 'string', 'max:120'],
            'list_label' => ['nullable', 'string', 'max:120'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'opening_hours' => ['sometimes', 'array'],
            'opening_hours.*.day_order' => ['required_with:opening_hours', 'integer', 'between:1,7'],
            'opening_hours.*.day_name' => ['required_with:opening_hours', 'string', 'max:40'],
            'opening_hours.*.hours_text' => ['required_with:opening_hours', 'string', 'max:80'],
        ]);

        $openingHours = $data['opening_hours'] ?? null;
        unset($data['opening_hours']);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($venue, $data, $openingHours) {
            if ($data !== []) {
                $venue->update($data);
            }

            if (is_array($openingHours)) {
                foreach ($openingHours as $row) {
                    VenueOpeningHour::updateOrCreate(
                        [
                            'venue_id' => $venue->id,
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
            'venue' => $this->venuePayload($venue->fresh(['openingHours'])),
        ]);
    }

    public function updateMenus(Request $request, string $slug): JsonResponse
    {
        $venue = $this->findVenue($slug);

        $data = $request->validate([
            'menus' => ['required', 'array'],
            'menus.*.id' => ['nullable', 'uuid'],
            'menus.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'menus.*.title' => ['required', 'string', 'max:255'],
            'menus.*.navigation_screen' => ['required', 'string', 'max:120'],
            'menus.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'menus.*.is_active' => ['nullable', 'boolean'],
            'menus.*.categories' => ['nullable', 'array'],
            'menus.*.categories.*.id' => ['nullable', 'uuid'],
            'menus.*.categories.*.slug' => ['required', 'string', 'max:120'],
            'menus.*.categories.*.title' => ['required', 'string', 'max:255'],
            'menus.*.categories.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'menus.*.categories.*.items' => ['nullable', 'array'],
            'menus.*.categories.*.items.*.id' => ['nullable', 'uuid'],
            'menus.*.categories.*.items.*.slug' => ['required', 'string', 'max:120'],
            'menus.*.categories.*.items.*.name' => ['required', 'string', 'max:255'],
            'menus.*.categories.*.items.*.description_short' => ['nullable', 'string'],
            'menus.*.categories.*.items.*.description_long' => ['nullable', 'string'],
            'menus.*.categories.*.items.*.price_amount' => ['required', 'integer', 'min:0'],
            'menus.*.categories.*.items.*.currency' => ['nullable', 'string', 'max:8'],
            'menus.*.categories.*.items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'menus.*.categories.*.items.*.is_available' => ['nullable', 'boolean'],
            'menus.*.categories.*.items.*.image_url' => ['nullable', 'string', 'max:2048'],
            'menus.*.categories.*.items.*.allergen_codes' => ['nullable', 'array'],
            'menus.*.categories.*.items.*.allergen_codes.*' => ['string', 'max:4'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($venue, $data) {
            $keptMenuIds = [];

            foreach ($data['menus'] as $menuData) {
                $menu = isset($menuData['id'])
                    ? VenueMenu::where('venue_id', $venue->id)->where('id', $menuData['id'])->first()
                    : null;

                if (! $menu) {
                    $menu = VenueMenu::create([
                        'venue_id' => $venue->id,
                        'slug' => $menuData['slug'],
                        'title' => $menuData['title'],
                        'navigation_screen' => $menuData['navigation_screen'],
                        'sort_order' => $menuData['sort_order'] ?? 0,
                        'is_active' => $menuData['is_active'] ?? true,
                    ]);
                } else {
                    $menu->update([
                        'slug' => $menuData['slug'],
                        'title' => $menuData['title'],
                        'navigation_screen' => $menuData['navigation_screen'],
                        'sort_order' => $menuData['sort_order'] ?? 0,
                        'is_active' => $menuData['is_active'] ?? true,
                    ]);
                }

                $keptMenuIds[] = $menu->id;
                $keptCategoryIds = [];

                foreach ($menuData['categories'] ?? [] as $catData) {
                    $category = isset($catData['id'])
                        ? MenuCategory::where('menu_id', $menu->id)->where('id', $catData['id'])->first()
                        : null;

                    if (! $category) {
                        $category = MenuCategory::create([
                            'menu_id' => $menu->id,
                            'slug' => $catData['slug'],
                            'title' => $catData['title'],
                            'sort_order' => $catData['sort_order'] ?? 0,
                        ]);
                    } else {
                        $category->update([
                            'slug' => $catData['slug'],
                            'title' => $catData['title'],
                            'sort_order' => $catData['sort_order'] ?? 0,
                        ]);
                    }

                    $keptCategoryIds[] = $category->id;
                    $keptItemIds = [];

                    foreach ($catData['items'] ?? [] as $itemData) {
                        $item = isset($itemData['id'])
                            ? MenuItem::where('category_id', $category->id)->where('id', $itemData['id'])->first()
                            : null;

                        if (! $item) {
                            $item = MenuItem::create([
                                'category_id' => $category->id,
                                'slug' => $itemData['slug'],
                                'name' => $itemData['name'],
                                'description_short' => $itemData['description_short'] ?? null,
                                'description_long' => $itemData['description_long'] ?? null,
                                'price_amount' => $itemData['price_amount'],
                                'currency' => $itemData['currency'] ?? 'CZK',
                                'sort_order' => $itemData['sort_order'] ?? 0,
                                'is_available' => $itemData['is_available'] ?? true,
                                'image_url' => $itemData['image_url'] ?? null,
                            ]);
                        } else {
                            $item->update([
                                'slug' => $itemData['slug'],
                                'name' => $itemData['name'],
                                'description_short' => $itemData['description_short'] ?? null,
                                'description_long' => $itemData['description_long'] ?? null,
                                'price_amount' => $itemData['price_amount'],
                                'currency' => $itemData['currency'] ?? 'CZK',
                                'sort_order' => $itemData['sort_order'] ?? 0,
                                'is_available' => $itemData['is_available'] ?? true,
                                'image_url' => $itemData['image_url'] ?? null,
                            ]);
                        }

                        $keptItemIds[] = $item->id;
                        $codes = $itemData['allergen_codes'] ?? [];
                        $item->allergens()->sync($codes);
                    }

                    $this->deleteMenuItemsNotIn($category->id, $keptItemIds);
                }

                $this->deleteMenuCategoriesNotIn($menu->id, $keptCategoryIds);
            }

            $menusToRemove = VenueMenu::where('venue_id', $venue->id)->whereNotIn('id', $keptMenuIds)->get();
            foreach ($menusToRemove as $menu) {
                foreach ($menu->categories as $cat) {
                    foreach ($cat->items as $item) {
                        $item->allergens()->detach();
                        $item->delete();
                    }
                    $cat->delete();
                }
                $menu->delete();
            }
        });

        $venue->load(['menus.categories.items.allergens']);

        return response()->json([
            'menus' => $venue->menus->map(fn ($menu) => $this->menuPayload($menu))->values(),
        ]);
    }

    public function destroy(string $slug): JsonResponse
    {
        $venue = $this->findVenue($slug);
        $venue->delete();

        return response()->json(['success' => true]);
    }

    private function deleteMenuItemsNotIn(string $categoryId, array $keptItemIds): void
    {
        $query = MenuItem::where('category_id', $categoryId);

        if ($keptItemIds !== []) {
            $query->whereNotIn('id', $keptItemIds);
        }

        $query->each(function (MenuItem $item) {
            $item->allergens()->detach();
            $item->delete();
        });
    }

    private function deleteMenuCategoriesNotIn(string $menuId, array $keptCategoryIds): void
    {
        $query = MenuCategory::where('menu_id', $menuId);

        if ($keptCategoryIds !== []) {
            $query->whereNotIn('id', $keptCategoryIds);
        }

        $query->each(function (MenuCategory $category) {
            $category->items()->each(function (MenuItem $item) {
                $item->allergens()->detach();
                $item->delete();
            });
            $category->delete();
        });
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findVenue(string $slug): Venue
    {
        return Venue::where('slug', $slug)->firstOrFail();
    }

    private function listItem(Venue $venue): array
    {
        $imageMap = config_array('otelapps.venue_image_keys');

        return [
            'id' => $venue->slug,
            'slug' => $venue->slug,
            'title' => $venue->title,
            'image' => $imageMap[$venue->image_key] ?? null,
            'list_label' => $venue->list_label,
            'schedule_summary' => $venue->schedule_summary,
            'is_active' => $venue->is_active,
            'venue_type' => $venue->venue_type,
        ];
    }

    private function venuePayload(Venue $venue): array
    {
        return [
            'id' => $venue->id,
            'slug' => $venue->slug,
            'title' => $venue->title,
            'venue_type' => $venue->venue_type,
            'description' => $venue->description,
            'schedule_summary' => $venue->schedule_summary,
            'image_key' => $venue->image_key,
            'list_label' => $venue->list_label,
            'sort_order' => $venue->sort_order,
            'is_active' => $venue->is_active,
        ];
    }

    private function menuPayload(VenueMenu $menu): array
    {
        return [
            'id' => $menu->id,
            'slug' => $menu->slug,
            'title' => $menu->title,
            'navigation_screen' => $menu->navigation_screen,
            'sort_order' => $menu->sort_order,
            'is_active' => $menu->is_active,
            'categories' => $menu->categories->map(fn (MenuCategory $cat) => [
                'id' => $cat->id,
                'slug' => $cat->slug,
                'title' => $cat->title,
                'sort_order' => $cat->sort_order,
                'items' => $cat->items->map(fn (MenuItem $item) => [
                    'id' => $item->id,
                    'slug' => $item->slug,
                    'name' => $item->name,
                    'description_short' => $item->description_short,
                    'description_long' => $item->description_long,
                    'price_amount' => $item->price_amount,
                    'currency' => $item->currency,
                    'sort_order' => $item->sort_order,
                    'is_available' => $item->is_available,
                    'image_url' => $item->image_url,
                    'allergen_codes' => $item->allergens->pluck('code')->values(),
                ])->values(),
            ])->values(),
        ];
    }

    private function seedDefaultOpeningHours(Venue $venue): void
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
            VenueOpeningHour::create([
                'venue_id' => $venue->id,
                'day_order' => $order,
                'day_name' => $name,
                'hours_text' => '12:00 - 22:00',
            ]);
        }
    }
}
