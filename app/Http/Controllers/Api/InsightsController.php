<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\InsightsService;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightsController extends Controller
{
    public function __construct(
        private readonly InsightsService $insightsService,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel, string $period) => $this->insightsService->overview($hotel, $period));
    }

    public function users(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel, string $period) => $this->insightsService->users($hotel, $period));
    }

    public function transactions(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel, string $period) => $this->insightsService->transactions($hotel, $period));
    }

    public function behavior(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel, string $period) => $this->insightsService->behavior($hotel, $period));
    }

    /**
     * @param  callable(Hotel, string): array  $builder
     */
    private function respond(Request $request, callable $builder): JsonResponse
    {
        if (! ModuleService::isEnabled('insights')) {
            return response()->json([
                'message' => 'Modul Insights není zapnutý.',
                'insights_enabled' => false,
            ], 403);
        }

        $period = $this->normalizePeriod($request->query('period', 'week'));
        $hotel = $this->resolveHotel($request);

        return response()->json([
            'insights_enabled' => true,
            ...$builder($hotel, $period),
        ]);
    }

    private function normalizePeriod(?string $period): string
    {
        return in_array($period, ['today', 'week', 'month'], true) ? $period : 'week';
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
