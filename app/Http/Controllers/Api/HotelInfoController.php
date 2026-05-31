<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelInfoSection;
use App\Models\HotelInfoTopic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HotelInfoController extends Controller
{
    private const NAVIGATION_SCREENS = [
        'HotelDetail',
        'RecepceDetail',
        'SpojeniDetail',
        'SejfDetail',
        'MapScreen',
    ];

    private const ICON_LIBRARIES = ['ionicons', 'material-community'];

    public function index(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $topics = HotelInfoTopic::query()
            ->where('hotel_id', $hotel->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return response()->json([
            'title' => 'Informace o hotelu',
            'sections' => [
                [
                    'id' => 'topics',
                    'title' => 'Informace o hotelu',
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
                Rule::unique(HotelInfoTopic::class, 'slug'),
            ],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $topic = HotelInfoTopic::create([
            ...$data,
            'hotel_id' => $hotel->id,
            'list_description' => '',
            'navigation_screen' => self::NAVIGATION_SCREENS[0],
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

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($topic) {
            $topic->sections()->delete();
            $topic->delete();
        });

        return response()->json(['success' => true]);
    }

    public function show(string $slug): JsonResponse
    {
        $topic = $this->findTopic($slug);
        $topic->load('sections');

        return response()->json([
            'topic' => $this->topicPayload($topic),
            'sections' => $topic->sections->map(fn ($s) => $this->sectionPayload($s))->values(),
            'list_image_keys' => array_keys(config_array('otelapps.hotel_info_image_keys')),
            'detail_image_keys' => array_keys(config_array('otelapps.hotel_info_image_keys')),
            'navigation_screens' => self::NAVIGATION_SCREENS,
            'icon_libraries' => self::ICON_LIBRARIES,
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
            'navigation_screen' => ['sometimes', Rule::in(self::NAVIGATION_SCREENS)],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $topic->update($data);

        return response()->json([
            'topic' => $this->topicPayload($topic->fresh()),
        ]);
    }

    public function updateSections(Request $request, string $slug): JsonResponse
    {
        $topic = $this->findTopic($slug);

        $data = $request->validate([
            'sections' => ['required', 'array'],
            'sections.*.id' => ['nullable', 'uuid'],
            'sections.*.slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.description' => ['required', 'string'],
            'sections.*.icon_library' => ['required', Rule::in(self::ICON_LIBRARIES)],
            'sections.*.icon_name' => ['required', 'string', 'max:120'],
            'sections.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::connection(config('otelapps.db_connection'))->transaction(function () use ($topic, $data) {
            $keptIds = [];

            foreach ($data['sections'] as $sectionData) {
                $section = isset($sectionData['id'])
                    ? HotelInfoSection::where('topic_id', $topic->id)->where('id', $sectionData['id'])->first()
                    : null;

                if (! $section) {
                    $section = HotelInfoSection::create([
                        'topic_id' => $topic->id,
                        'slug' => $sectionData['slug'],
                        'title' => $sectionData['title'],
                        'description' => $sectionData['description'],
                        'icon_library' => $sectionData['icon_library'],
                        'icon_name' => $sectionData['icon_name'],
                        'sort_order' => $sectionData['sort_order'] ?? 0,
                    ]);
                } else {
                    $section->update([
                        'slug' => $sectionData['slug'],
                        'title' => $sectionData['title'],
                        'description' => $sectionData['description'],
                        'icon_library' => $sectionData['icon_library'],
                        'icon_name' => $sectionData['icon_name'],
                        'sort_order' => $sectionData['sort_order'] ?? 0,
                    ]);
                }

                $keptIds[] = $section->id;
            }

            $query = HotelInfoSection::where('topic_id', $topic->id);
            if ($keptIds !== []) {
                $query->whereNotIn('id', $keptIds);
            }
            $query->delete();
        });

        $topic->load('sections');

        return response()->json([
            'sections' => $topic->sections->map(fn ($s) => $this->sectionPayload($s))->values(),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }

    private function findTopic(string $slug): HotelInfoTopic
    {
        return HotelInfoTopic::where('slug', $slug)->firstOrFail();
    }

    private function listItem(HotelInfoTopic $topic): array
    {
        $imageMap = config_array('otelapps.hotel_info_image_keys');
        $imageKey = $topic->list_image_key;

        return [
            'id' => $topic->slug,
            'slug' => $topic->slug,
            'title' => $topic->title,
            'image' => $imageKey ? ($imageMap[$imageKey] ?? null) : null,
            'list_label' => $topic->list_description,
            'navigation_screen' => $topic->navigation_screen,
            'is_active' => $topic->is_active,
        ];
    }

    private function topicPayload(HotelInfoTopic $topic): array
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
            'sort_order' => $topic->sort_order,
            'is_active' => $topic->is_active,
            'has_sections' => $topic->relationLoaded('sections')
                ? $topic->sections->isNotEmpty()
                : HotelInfoSection::where('topic_id', $topic->id)->exists(),
        ];
    }

    private function sectionPayload(HotelInfoSection $section): array
    {
        return [
            'id' => $section->id,
            'slug' => $section->slug,
            'title' => $section->title,
            'description' => $section->description,
            'icon_library' => $section->icon_library,
            'icon_name' => $section->icon_name,
            'sort_order' => $section->sort_order,
        ];
    }
}
