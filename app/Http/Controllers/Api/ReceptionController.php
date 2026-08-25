<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\ModuleService;
use App\Services\ReceptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceptionController extends Controller
{
    public function __construct(
        private readonly ReceptionService $receptionService,
    ) {}

    public function rooms(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('recepce')) {
            return response()->json(['message' => 'Modul Recepce není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $floor = $request->query('floor');
        $occupancy = $request->query('occupancy');
        $cleaning = $request->query('cleaning');

        return response()->json($this->receptionService->board(
            $hotel,
            $floor !== null && $floor !== '' ? (int) $floor : null,
            is_string($occupancy) && $occupancy !== '' ? $occupancy : null,
            is_string($cleaning) && $cleaning !== '' ? $cleaning : null,
        ));
    }

    public function show(Request $request, string $roomNumber): JsonResponse
    {
        if (! ModuleService::isEnabled('recepce')) {
            return response()->json(['message' => 'Modul Recepce není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json(
            $this->receptionService->roomDetail($hotel, urldecode($roomNumber))
        );
    }

    public function checkout(Request $request, string $roomNumber): JsonResponse
    {
        if (! ModuleService::isEnabled('recepce')) {
            return response()->json(['message' => 'Modul Recepce není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json(
            $this->receptionService->checkout($hotel, urldecode($roomNumber))
        );
    }

    public function toggleRequest(Request $request, string $roomNumber, string $requestId): JsonResponse
    {
        if (! ModuleService::isEnabled('recepce')) {
            return response()->json(['message' => 'Modul Recepce není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'is_checked' => ['required', 'boolean'],
        ]);

        $item = $this->receptionService->toggleRequest(
            $hotel,
            urldecode($roomNumber),
            $requestId,
            (bool) $data['is_checked'],
        );

        return response()->json(['request' => $item]);
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
