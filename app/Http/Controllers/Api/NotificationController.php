<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $withSync = $request->boolean('sync');

        return response()->json($this->notificationService->summary($hotel, $withSync));
    }

    public function settings(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);

        return response()->json($this->notificationService->settings($hotel));
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'activity_enabled' => ['sometimes', 'boolean'],
            'activity_statuses' => ['sometimes', 'array'],
            'activity_statuses.*' => [Rule::in(['new', 'pending', 'in_progress'])],
            'concierge_enabled' => ['sometimes', 'boolean'],
            'toast_enabled' => ['sometimes', 'boolean'],
            'browser_notifications' => ['sometimes', 'boolean'],
            'sound_enabled' => ['sometimes', 'boolean'],
            'poll_interval_seconds' => ['sometimes', 'integer', Rule::in([10, 15, 30, 60])],
        ]);

        $result = $this->notificationService->updateSettings($hotel, $data);

        return response()->json($result);
    }

    public function markRead(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'source' => ['nullable', Rule::in(['activity', 'concierge'])],
            'all' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('all')) {
            $count = $this->notificationService->markRead($hotel);
        } else {
            $count = $this->notificationService->markRead(
                $hotel,
                $data['id'] ?? null,
                $data['source'] ?? null,
            );
        }

        return response()->json([
            'marked' => $count,
            'summary' => $this->notificationService->summary($hotel),
        ]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
