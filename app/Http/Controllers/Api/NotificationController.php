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

        $boolKeys = [
            'activity_enabled',
            'concierge_enabled',
            'toast_enabled',
            'browser_notifications',
            'sound_enabled',
            'guest_push_enabled',
            'guest_push_on_status_change',
        ];

        $input = $request->all();
        foreach ($boolKeys as $key) {
            if (array_key_exists($key, $input)) {
                $input[$key] = filter_var($input[$key], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($input[$key] === null) {
                    $input[$key] = (bool) $request->input($key);
                }
            }
        }
        $request->merge($input);

        $data = $request->validate([
            'activity_enabled' => ['sometimes', 'boolean'],
            'activity_statuses' => ['sometimes', 'array'],
            'activity_statuses.*' => [Rule::in(['new', 'pending', 'in_progress'])],
            'concierge_enabled' => ['sometimes', 'boolean'],
            'toast_enabled' => ['sometimes', 'boolean'],
            'browser_notifications' => ['sometimes', 'boolean'],
            'sound_enabled' => ['sometimes', 'boolean'],
            'poll_interval_seconds' => ['sometimes', 'integer', Rule::in([10, 15, 30, 60])],
            'guest_push_enabled' => ['sometimes', 'boolean'],
            'guest_push_on_status_change' => ['sometimes', 'boolean'],
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
