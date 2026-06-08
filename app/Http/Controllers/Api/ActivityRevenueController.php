<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelServiceRequest;
use App\Services\ActivityRevenueService;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityRevenueController extends Controller
{
    public function __construct(
        private readonly ActivityRevenueService $revenueService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('activity')) {
            return response()->json([
                'message' => 'Modul Activity není zapnutý.',
                'activity_enabled' => false,
            ], 403);
        }

        $period = $request->query('period', 'today');
        if (! in_array($period, ['today', 'week', 'month'], true)) {
            $period = 'today';
        }

        $hotel = $this->resolveHotel($request);

        $tz = config('app.timezone', 'Europe/Prague');
        $now = \Carbon\Carbon::now($tz);
        $from = match ($period) {
            'week' => $now->copy()->startOfWeek(),
            'month' => $now->copy()->startOfMonth(),
            default => $now->copy()->startOfDay(),
        };

        $requests = HotelServiceRequest::query()
            ->where('hotel_id', $hotel->id)
            ->where('created_at', '>=', $from)
            ->whereNotIn('status', ['rejected', 'archived'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'activity_enabled' => true,
            ...$this->revenueService->summarize($requests, $period),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
