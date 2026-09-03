<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\HotelProvisionService;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PlatformHotelController extends Controller
{
    public function __construct(private HotelProvisionService $provision) {}

    public function catalog(): JsonResponse
    {
        return response()->json(['modules' => ModuleService::catalog()]);
    }

    public function index(): JsonResponse
    {
        $hotels = Hotel::query()->with(['profile', 'moduleSetting'])->orderBy('name')->get();

        return response()->json([
            'hotels' => $hotels->map(fn (Hotel $hotel) => $this->provision->toArray($hotel))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedPayload($request, creating: true);

        try {
            $slug = $this->provision->normalizeSlug((string) $data['slug']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        if (Hotel::bySlug($slug)) {
            return response()->json(['message' => 'Hotel s tímto slugem už existuje.'], 422);
        }

        $data['slug'] = $slug;

        try {
            $hotel = $this->provision->provision($data);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($this->provision->toArray($hotel), 201);
    }

    public function show(string $slug): JsonResponse
    {
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        return response()->json($this->provision->toArray($hotel));
    }

    public function update(Request $request, string $slug): JsonResponse
    {
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        $data = $this->validatedPayload($request, creating: false);
        $data['slug'] = $hotel->slug;
        $data['name'] = $data['name'] ?? $hotel->name;

        $hotel = $this->provision->provision($data);

        return response()->json($this->provision->toArray($hotel));
    }

    public function updateModules(Request $request, string $slug): JsonResponse
    {
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        $data = $request->validate([
            'modules' => ['required', 'array'],
            'modules.*' => ['boolean'],
        ]);

        $modules = ModuleService::saveEnabledMap($hotel, $data['modules']);

        return response()->json([
            'slug' => $hotel->slug,
            'name' => $hotel->name,
            'modules' => $modules,
        ]);
    }

    public function health(string $slug): JsonResponse
    {
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        return response()->json([
            'slug' => $hotel->slug,
            'health' => $this->provision->health($hotel),
        ]);
    }

    public function env(string $slug): JsonResponse
    {
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        return response()->json([
            'slug' => $hotel->slug,
            'files' => $this->provision->envTemplates($hotel),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(Request $request, bool $creating): array
    {
        $rules = [
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'app_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'admin_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'web_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'lat' => ['sometimes', 'nullable', 'numeric'],
            'lng' => ['sometimes', 'nullable', 'numeric'],
            'admin_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'app_store_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'play_store_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'modules' => ['sometimes', 'array'],
            'modules.*' => ['boolean'],
            'copy_modules_from' => ['sometimes', 'nullable', 'string', 'max:80'],
        ];

        if ($creating) {
            $rules['slug'] = ['required', 'string', 'max:80'];
        }

        return $request->validate($rules);
    }
}
