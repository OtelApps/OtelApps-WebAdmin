<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotelConfigController extends Controller
{
    public function publicConfig(string $slug): JsonResponse
    {
        $config = ModuleService::publicConfig($slug);
        if (! $config) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        return response()->json($config);
    }

    public function modules(): JsonResponse
    {
        $hotel = Hotel::current();
        if (! $hotel) {
            return response()->json(['message' => 'Hotel nenalezen.'], 404);
        }

        return response()->json([
            'slug' => $hotel->slug,
            'name' => $hotel->name,
            'modules' => ModuleService::enabledMap($hotel->slug),
        ]);
    }

    public function updateModules(Request $request): JsonResponse
    {
        $hotel = Hotel::current();
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
}
