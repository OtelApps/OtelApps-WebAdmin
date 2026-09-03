<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\User;
use App\Services\HotelProvisionService;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $payload = $this->provision->toArray($hotel);
        $payload['staff'] = $this->staffPayload($hotel->slug);

        return response()->json($payload);
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

    public function destroy(Request $request, string $slug): JsonResponse
    {
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        $data = $request->validate([
            'confirmation' => ['required', 'string', 'max:80'],
            'password' => ['required', 'string'],
        ]);

        if ($data['confirmation'] !== $hotel->slug) {
            return response()->json(['message' => 'Potvrzení slugu nesouhlasí.'], 422);
        }

        if (! Hash::check($data['password'], (string) $request->user()?->password)) {
            return response()->json(['message' => 'Neplatné heslo SuperAdmina.'], 422);
        }

        $this->deleteHotelStaff($hotel->slug);
        $hotel->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @return list<array{id: int, name: string, email: string, user_type: string|null}>
     */
    private function staffPayload(string $slug): array
    {
        return User::query()
            ->with('userType')
            ->where('hotel_slug', $slug)
            ->orderBy('name')
            ->get()
            ->reject(fn (User $user) => $user->isSuperAdmin())
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->userType?->name,
            ])
            ->values()
            ->all();
    }

    private function deleteHotelStaff(string $slug): void
    {
        $staff = User::query()
            ->with('userType')
            ->where('hotel_slug', $slug)
            ->get()
            ->reject(fn (User $user) => $user->isSuperAdmin());

        foreach ($staff as $user) {
            $user->tokens()->delete();
            $user->delete();
        }
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
