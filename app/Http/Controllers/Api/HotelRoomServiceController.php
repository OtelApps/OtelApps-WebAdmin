<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelRoomServiceCategory;
use App\Models\HotelRoomServiceHour;
use App\Models\HotelRoomServiceItem;
use App\Models\HotelRoomServiceItemOption;
use App\Models\HotelRoomServiceMenu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HotelRoomServiceController extends Controller
{
    private const NAVIGATION_SCREENS = ['SnidaneScreen', 'ObedScreen', 'VecereScreen'];

    private const CONFIRM_SCREENS = ['ConfirmSnidaneScreen', 'ConfirmObedScreen', 'ConfirmVecereScreen'];

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $menus = HotelRoomServiceMenu::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        $imageMap = config_array('otelapps.hotel_room_service_list_image_keys');

        return response()->json([
            'title' => 'Pokojová služba',
            'sections' => [
                [
                    'id' => 'menus',
                    'title' => 'Snídaně, oběd, večeře',
                    'items' => $menus->map(fn ($menu) => $this->listItem($menu, $imageMap))->values(),
                ],
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $menu = $this->findMenu($slug);
        $menu->load(['hours', 'categories.items.options']);

        return response()->json([
            'menu' => $this->menuPayload($menu),
            'opening_hours' => $menu->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
            'categories' => $menu->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
            'list_image_keys' => array_keys(config_array('otelapps.hotel_room_service_list_image_keys')),
            'header_image_keys' => array_keys(config_array('otelapps.hotel_room_service_header_image_keys')),
            'navigation_screens' => self::NAVIGATION_SCREENS,
            'confirm_screens' => self::CONFIRM_SCREENS,
        ]);
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $menu = $this->findMenu($slug);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'list_label' => ['sometimes', 'string', 'max:255'],
            'list_schedule_summary' => ['nullable', 'string', 'max:120'],
            'list_image_key' => ['nullable', 'string', 'max:120'],
            'navigation_screen' => ['sometimes', Rule::in(self::NAVIGATION_SCREENS)],
            'confirm_screen' => ['sometimes', Rule::in(self::CONFIRM_SCREENS)],
            'description' => ['sometimes', 'string'],
            'schedule_summary' => ['nullable', 'string', 'max:120'],
            'header_image_key' => ['nullable', 'string', 'max:120'],
            'juice_modal_title' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $menu->update($data);

        return response()->json([
            'menu' => $this->menuPayload($menu->fresh()),
        ]);
    }

    public function updateHours(Request $request, string $slug): JsonResponse
    {
        $menu = $this->findMenu($slug);

        $data = $request->validate([
            'opening_hours' => ['required', 'array'],
            'opening_hours.*.day_order' => ['required', 'integer', 'between:1,7'],
            'opening_hours.*.day_name' => ['required', 'string', 'max:40'],
            'opening_hours.*.hours_text' => ['required', 'string', 'max:80'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($menu, $data) {
            foreach ($data['opening_hours'] as $row) {
                HotelRoomServiceHour::updateOrCreate(
                    [
                        'menu_id' => $menu->id,
                        'day_order' => $row['day_order'],
                    ],
                    [
                        'day_name' => $row['day_name'],
                        'hours_text' => $row['hours_text'],
                    ]
                );
            }
        });

        $menu->load('hours');

        return response()->json([
            'opening_hours' => $menu->hours->map(fn ($h) => [
                'id' => $h->id,
                'day_order' => $h->day_order,
                'day_name' => $h->day_name,
                'hours_text' => $h->hours_text,
            ])->values(),
        ]);
    }

    public function updateCatalog(Request $request, string $slug): JsonResponse
    {
        $menu = $this->findMenu($slug);

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
            'categories.*.items.*.description_short' => ['nullable', 'string', 'max:500'],
            'categories.*.items.*.icon_emoji' => ['nullable', 'string', 'max:16'],
            'categories.*.items.*.price_amount' => ['required', 'numeric', 'min:0'],
            'categories.*.items.*.currency' => ['nullable', 'string', 'max:8'],
            'categories.*.items.*.requires_option' => ['nullable', 'boolean'],
            'categories.*.items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'categories.*.items.*.is_available' => ['nullable', 'boolean'],
            'categories.*.items.*.options' => ['nullable', 'array'],
            'categories.*.items.*.options.*.id' => ['nullable', 'uuid'],
            'categories.*.items.*.options.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'categories.*.items.*.options.*.label' => ['required', 'string', 'max:255'],
            'categories.*.items.*.options.*.price_amount' => ['required', 'numeric', 'min:0'],
            'categories.*.items.*.options.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($menu, $data) {
            $keptCategoryIds = [];

            foreach ($data['categories'] as $categoryData) {
                $category = isset($categoryData['id'])
                    ? HotelRoomServiceCategory::where('menu_id', $menu->id)
                        ->where('id', $categoryData['id'])
                        ->first()
                    : null;

                if (! $category) {
                    $category = HotelRoomServiceCategory::create([
                        'menu_id' => $menu->id,
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
                        ? HotelRoomServiceItem::where('category_id', $category->id)
                            ->where('id', $itemData['id'])
                            ->first()
                        : null;

                    if (! $item) {
                        $item = HotelRoomServiceItem::create([
                            'category_id' => $category->id,
                            'slug' => $itemData['slug'],
                            'name' => $itemData['name'],
                            'description_short' => $itemData['description_short'] ?? null,
                            'icon_emoji' => $itemData['icon_emoji'] ?? null,
                            'price_amount' => $itemData['price_amount'],
                            'currency' => $itemData['currency'] ?? 'CZK',
                            'requires_option' => $itemData['requires_option'] ?? false,
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    } else {
                        $item->update([
                            'slug' => $itemData['slug'],
                            'name' => $itemData['name'],
                            'description_short' => $itemData['description_short'] ?? null,
                            'icon_emoji' => $itemData['icon_emoji'] ?? null,
                            'price_amount' => $itemData['price_amount'],
                            'currency' => $itemData['currency'] ?? 'CZK',
                            'requires_option' => $itemData['requires_option'] ?? false,
                            'sort_order' => $itemData['sort_order'] ?? 0,
                            'is_available' => $itemData['is_available'] ?? true,
                        ]);
                    }

                    $keptItemIds[] = $item->id;
                    $keptOptionIds = [];

                    foreach ($itemData['options'] ?? [] as $optionData) {
                        $option = isset($optionData['id'])
                            ? HotelRoomServiceItemOption::where('item_id', $item->id)
                                ->where('id', $optionData['id'])
                                ->first()
                            : null;

                        if (! $option) {
                            $option = HotelRoomServiceItemOption::create([
                                'item_id' => $item->id,
                                'slug' => $optionData['slug'],
                                'label' => $optionData['label'],
                                'price_amount' => $optionData['price_amount'],
                                'sort_order' => $optionData['sort_order'] ?? 0,
                            ]);
                        } else {
                            $option->update([
                                'slug' => $optionData['slug'],
                                'label' => $optionData['label'],
                                'price_amount' => $optionData['price_amount'],
                                'sort_order' => $optionData['sort_order'] ?? 0,
                            ]);
                        }

                        $keptOptionIds[] = $option->id;
                    }

                    $optionQuery = HotelRoomServiceItemOption::where('item_id', $item->id);
                    if ($keptOptionIds !== []) {
                        $optionQuery->whereNotIn('id', $keptOptionIds);
                    }
                    $optionQuery->delete();
                }

                $itemQuery = HotelRoomServiceItem::where('category_id', $category->id);
                if ($keptItemIds !== []) {
                    $itemQuery->whereNotIn('id', $keptItemIds);
                }
                $itemQuery->delete();
            }

            $categoryQuery = HotelRoomServiceCategory::where('menu_id', $menu->id);
            if ($keptCategoryIds !== []) {
                $categoryQuery->whereNotIn('id', $keptCategoryIds);
            }
            $categoryQuery->delete();
        });

        $menu->load(['categories.items.options']);

        return response()->json([
            'categories' => $menu->categories->map(fn ($c) => $this->categoryPayload($c))->values(),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $hotelSlug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $hotelSlug)->firstOrFail();
    }

    private function findMenu(string $slug): HotelRoomServiceMenu
    {
        return HotelRoomServiceMenu::where('slug', $slug)->firstOrFail();
    }

    private function listItem(HotelRoomServiceMenu $menu, array $imageMap): array
    {
        $imageKey = $menu->list_image_key;

        return [
            'id' => $menu->slug,
            'edit_slug' => $menu->slug,
            'slug' => $menu->slug,
            'title' => $menu->title,
            'image' => $imageKey ? ($imageMap[$imageKey] ?? null) : null,
            'list_label' => $menu->list_label,
            'schedule_summary' => $menu->list_schedule_summary,
            'is_active' => $menu->is_active,
        ];
    }

    private function menuPayload(HotelRoomServiceMenu $menu): array
    {
        return [
            'id' => $menu->id,
            'slug' => $menu->slug,
            'title' => $menu->title,
            'list_label' => $menu->list_label,
            'list_schedule_summary' => $menu->list_schedule_summary,
            'list_image_key' => $menu->list_image_key,
            'navigation_screen' => $menu->navigation_screen,
            'confirm_screen' => $menu->confirm_screen,
            'description' => $menu->description,
            'schedule_summary' => $menu->schedule_summary,
            'header_image_key' => $menu->header_image_key,
            'juice_modal_title' => $menu->juice_modal_title,
            'sort_order' => $menu->sort_order,
            'is_active' => $menu->is_active,
        ];
    }

    private function categoryPayload(HotelRoomServiceCategory $category): array
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
                'description_short' => $i->description_short,
                'icon_emoji' => $i->icon_emoji,
                'price_amount' => $i->price_amount,
                'currency' => $i->currency,
                'requires_option' => $i->requires_option,
                'sort_order' => $i->sort_order,
                'is_available' => $i->is_available,
                'options' => $i->options->map(fn ($o) => [
                    'id' => $o->id,
                    'slug' => $o->slug,
                    'label' => $o->label,
                    'price_amount' => $o->price_amount,
                    'sort_order' => $o->sort_order,
                ])->values(),
            ])->values(),
        ];
    }
}
