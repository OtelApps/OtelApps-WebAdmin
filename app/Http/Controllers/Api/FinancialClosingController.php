<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\FinancialClosingService;
use App\Services\HotelPaymentService;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class FinancialClosingController extends Controller
{
    public function __construct(
        private readonly FinancialClosingService $closings,
        private readonly HotelPaymentService $payments,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.view');

        return response()->json($this->closings->dashboard($this->resolveHotel($request)));
    }

    public function index(Request $request): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.view');

        return response()->json($this->closings->list($this->resolveHotel($request), $request->query()));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.view');

        return response()->json($this->closings->show($this->resolveHotel($request), $id));
    }

    public function store(Request $request): JsonResponse
    {
        $this->guardModule($request);

        try {
            return response()->json(
                $this->closings->create($this->resolveHotel($request), $request->user()),
                201
            );
        } catch (ConflictHttpException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.create');

        $data = $request->validate([
            'current_step' => ['sometimes', 'integer', 'min:1', 'max:4'],
            'cash_float' => ['sometimes', 'numeric', 'min:0'],
            'lines' => ['sometimes', 'array'],
            'lines.*.id' => ['required_with:lines', 'uuid'],
            'lines.*.actual_amount' => ['nullable', 'numeric'],
        ]);

        return response()->json(
            $this->closings->update($this->resolveHotel($request), $request->user(), $id, $data)
        );
    }

    public function acknowledgePreflight(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.create');

        return response()->json(
            $this->closings->acknowledgePreflight($this->resolveHotel($request), $request->user(), $id)
        );
    }

    public function cashCount(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.create');

        $data = $request->validate([
            'currency' => ['sometimes', 'string', 'max:8'],
            'rows' => ['required', 'array'],
            'rows.*.denomination' => ['required', 'numeric', 'min:0'],
            'rows.*.quantity' => ['required', 'integer', 'min:0'],
        ]);

        return response()->json(
            $this->closings->saveCashCount($this->resolveHotel($request), $request->user(), $id, $data)
        );
    }

    public function resolveVariance(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.create');

        $data = $request->validate([
            'line_id' => ['required', 'uuid'],
            'reason' => ['required', 'string'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        return response()->json(
            $this->closings->resolveVariance($this->resolveHotel($request), $request->user(), $id, $data)
        );
    }

    public function reconciliationHints(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.view');

        return response()->json(
            $this->closings->reconciliationHints(
                $this->resolveHotel($request),
                $id,
                $request->query('line_id')
            )
        );
    }

    public function deposit(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.create');

        $data = $request->validate([
            'currency' => ['sometimes', 'string', 'max:8'],
            'actual_amount' => ['required', 'numeric', 'min:0'],
            'destination' => ['required', 'string'],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        return response()->json(
            $this->closings->saveDeposit($this->resolveHotel($request), $request->user(), $id, $data)
        );
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);

        return response()->json(
            $this->closings->complete($this->resolveHotel($request), $request->user(), $id)
        );
    }

    public function reopen(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        try {
            return response()->json(
                $this->closings->reopen($this->resolveHotel($request), $request->user(), $id, $data['reason'])
            );
        } catch (ConflictHttpException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

    public function transactions(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.view');

        return response()->json(
            $this->closings->transactions($this->resolveHotel($request), $id, $request->query())
        );
    }

    public function report(Request $request, string $id): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.reports.view');

        return response()->json($this->closings->report($this->resolveHotel($request), $id));
    }

    public function deposits(Request $request): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.view');

        return response()->json($this->closings->listDeposits($this->resolveHotel($request)));
    }

    public function payments(Request $request): JsonResponse
    {
        $this->guardModule($request);
        $this->requirePermission($request, 'finance.closing.view');

        return response()->json($this->payments->list($this->resolveHotel($request), $request->query()));
    }

    private function guardModule(Request $request): void
    {
        if (! ModuleService::isEnabled('finance')) {
            abort(403, 'Modul Finance není zapnutý.');
        }
    }

    private function requirePermission(Request $request, string $key): void
    {
        $user = $request->user();
        if (! $user || (! $user->hasPermission($key) && ! $user->isSuperAdmin())) {
            throw new HttpException(403, 'Nemáte oprávnění k této akci.');
        }
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
