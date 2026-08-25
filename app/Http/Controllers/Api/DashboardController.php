<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\DashboardService;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function hotelOverview(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('dashboard')) {
            return response()->json(['message' => 'Modul Dashboard není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json($this->dashboardService->hotelOverview($hotel));
    }

    public function bootstrap(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('dashboard')) {
            return response()->json(['message' => 'Modul Dashboard není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json($this->dashboardService->bootstrap($hotel));
    }

    public function layout(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('dashboard')) {
            return response()->json(['message' => 'Modul Dashboard není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json($this->dashboardService->layout($hotel));
    }

    public function updateLayout(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('dashboard')) {
            return response()->json(['message' => 'Modul Dashboard není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'widgets' => ['required', 'array', 'min:1'],
            'widgets.*' => ['string'],
        ]);

        return response()->json($this->dashboardService->updateLayout($hotel, $data['widgets']));
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
