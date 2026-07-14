<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\CrmService;
use App\Services\GuestPushAudienceResolver;
use App\Services\GuestPushService;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CrmController extends Controller
{
    public function __construct(
        private readonly CrmService $crmService,
        private readonly GuestPushService $guestPushService,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel) => $this->crmService->overview($hotel));
    }

    public function guests(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel) => $this->crmService->guests(
            $hotel,
            $request->query('q'),
            $request->query('segment'),
            $request->query('locale'),
        ));
    }

    public function storeGuest(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('crm')) {
            return response()->json(['message' => 'Modul CRM není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'display_name' => ['required', 'string', 'max:120'],
            'room_number' => ['required', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:40'],
            'locale' => ['nullable', Rule::in(['cs', 'en', 'de', 'fr', 'pl'])],
            'segment' => ['nullable', Rule::in(['standard', 'vip', 'corporate', 'returning'])],
            'notes' => ['nullable', 'string', 'max:4000'],
            'guest_external_id' => ['nullable', 'string', 'max:120'],
            'check_in_at' => ['nullable', 'date'],
            'check_out_at' => ['nullable', 'date', 'after_or_equal:check_in_at'],
            'marketing_consent' => ['nullable', 'boolean'],
            'assigned_staff_name' => ['nullable', 'string', 'max:80'],
            'company_name' => ['nullable', 'string', 'max:160'],
            'nationality' => ['nullable', 'string', 'max:80'],
        ]);

        $guest = $this->crmService->createGuest($hotel, $data);

        return response()->json(['guest' => $guest], 201);
    }

    public function showGuest(Request $request, string $guestKey): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $guest = $this->crmService->guestDetail($hotel, urldecode($guestKey));

        if (! $guest) {
            return response()->json(['message' => 'Host nenalezen.'], 404);
        }

        return response()->json(['guest' => $guest]);
    }

    public function updateGuest(Request $request, string $guestKey): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'display_name' => ['nullable', 'string', 'max:120'],
            'room_number' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:40'],
            'locale' => ['nullable', Rule::in(['cs', 'en', 'de', 'fr', 'pl'])],
            'segment' => ['nullable', Rule::in(['standard', 'vip', 'corporate', 'returning'])],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:4000'],
            'guest_external_id' => ['nullable', 'string', 'max:120'],
            'check_in_at' => ['nullable', 'date'],
            'check_out_at' => ['nullable', 'date'],
            'marketing_consent' => ['nullable', 'boolean'],
            'preferences' => ['nullable', 'array'],
            'loyalty_points' => ['nullable', 'integer', 'min:0'],
            'stay_count' => ['nullable', 'integer', 'min:0'],
            'assigned_staff_name' => ['nullable', 'string', 'max:80'],
            'company_name' => ['nullable', 'string', 'max:160'],
            'nationality' => ['nullable', 'string', 'max:80'],
        ]);

        $guest = $this->crmService->upsertGuestProfile($hotel, urldecode($guestKey), $data);

        return response()->json(['guest' => $guest]);
    }

    public function alerts(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel) => [
            'alerts' => $this->crmService->alerts($hotel),
        ]);
    }

    public function storeAlert(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'body' => ['nullable', 'string', 'max:2000'],
            'severity' => ['nullable', Rule::in(['info', 'warning', 'critical'])],
            'guest_key' => ['nullable', 'string', 'max:200'],
        ]);

        $alert = $this->crmService->createAlert($hotel, $data);

        return response()->json(['alert' => $alert]);
    }

    public function pushAudience(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('crm')) {
            return response()->json(['message' => 'Modul CRM není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'audience' => ['required', Rule::in(['all', 'segment', 'cohort', 'guest'])],
            'segment' => ['nullable', Rule::in(GuestPushAudienceResolver::CRM_SEGMENTS)],
            'cohort' => ['nullable', Rule::in(array_keys(GuestPushAudienceResolver::COHORTS))],
            'guest_key' => ['nullable', 'string', 'max:200'],
        ]);

        if ($data['audience'] === 'segment' && empty($data['segment'])) {
            return response()->json(['message' => 'Vyberte CRM segment.'], 422);
        }

        if ($data['audience'] === 'cohort' && empty($data['cohort'])) {
            return response()->json(['message' => 'Vyberte cílovou kategorii hostů.'], 422);
        }

        if ($data['audience'] === 'guest' && empty($data['guest_key'])) {
            return response()->json(['message' => 'Vyberte hosta.'], 422);
        }

        return response()->json($this->guestPushService->audienceStats(
            $hotel,
            $data['audience'],
            $data['segment'] ?? null,
            $data['cohort'] ?? null,
            $data['guest_key'] ?? null,
        ));
    }

    public function pushAudienceOptions(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('crm')) {
            return response()->json(['message' => 'Modul CRM není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json([
            'options' => $this->guestPushService->audienceOptions($hotel),
        ]);
    }

    public function sendPush(Request $request): JsonResponse
    {
        if (! ModuleService::isEnabled('crm')) {
            return response()->json(['message' => 'Modul CRM není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'body' => ['nullable', 'string', 'max:2000'],
            'severity' => ['nullable', Rule::in(['info', 'warning', 'critical'])],
            'audience' => ['required', Rule::in(['all', 'segment', 'cohort', 'guest'])],
            'segment' => ['nullable', Rule::in(GuestPushAudienceResolver::CRM_SEGMENTS)],
            'cohort' => ['nullable', Rule::in(array_keys(GuestPushAudienceResolver::COHORTS))],
            'guest_key' => ['nullable', 'string', 'max:200'],
        ]);

        if ($data['audience'] === 'segment' && empty($data['segment'])) {
            return response()->json(['message' => 'Pro cílení na segment vyberte segment.'], 422);
        }

        if ($data['audience'] === 'cohort' && empty($data['cohort'])) {
            return response()->json(['message' => 'Vyberte cílovou kategorii hostů.'], 422);
        }

        if ($data['audience'] === 'guest' && empty($data['guest_key'])) {
            return response()->json(['message' => 'Pro cílení na hosta vyberte hosta.'], 422);
        }

        if (! $this->guestPushService->isEnabled($hotel)) {
            return response()->json([
                'message' => 'Push notifikace jsou v nastavení hotelu vypnuté.',
            ], 422);
        }

        $stats = $this->guestPushService->audienceStats(
            $hotel,
            $data['audience'],
            $data['segment'] ?? null,
            $data['cohort'] ?? null,
            $data['guest_key'] ?? null,
        );

        if ($stats['device_count'] === 0) {
            return response()->json([
                'message' => 'Ve vybrané skupině není žádné zařízení s push tokenem. Host se musí přihlásit v mobilní app a povolit notifikace.',
                'audience' => $stats,
            ], 422);
        }

        $alert = $this->crmService->createAlert($hotel, [
            'title' => $data['title'],
            'body' => $data['body'] ?? null,
            'severity' => $data['severity'] ?? 'info',
            'guest_key' => $data['audience'] === 'guest' ? ($data['guest_key'] ?? null) : null,
        ]);

        $push = $this->guestPushService->sendToAudience(
            $hotel,
            $data['title'],
            $data['body'] ?? '',
            $data['audience'],
            $data['segment'] ?? null,
            $data['cohort'] ?? null,
            $data['guest_key'] ?? null,
            [
                'alertId' => $alert['id'] ?? null,
                'cohort' => $data['cohort'] ?? null,
                'segment' => $data['segment'] ?? null,
            ],
            $data['severity'] ?? 'info',
        );

        if (! ($push['delivered'] ?? false)) {
            return response()->json([
                'message' => 'Push se nepodařilo odeslat na žádné zařízení. Zkuste to znovu nebo zkontrolujte Expo credentials.',
                'alert' => $alert,
                'push' => $push,
            ], 502);
        }

        return response()->json([
            'alert' => $alert,
            'push' => $push,
            'message' => "Push odeslána na {$push['device_count']} zařízení.",
        ], 201);
    }

    public function dismissAlert(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $alert = $this->crmService->dismissAlert($hotel, $id);

        if (! $alert) {
            return response()->json(['message' => 'Alert nenalezen.'], 404);
        }

        return response()->json(['alert' => $alert]);
    }

    public function promotions(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel) => [
            'promotions' => $this->crmService->promotions($hotel),
        ]);
    }

    public function storePromotion(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $this->validatePromotion($request);

        return response()->json([
            'promotion' => $this->crmService->createPromotion($hotel, $data),
        ], 201);
    }

    public function updatePromotion(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $this->validatePromotion($request, partial: true);
        $promotion = $this->crmService->updatePromotion($hotel, $id, $data);

        if (! $promotion) {
            return response()->json(['message' => 'Promo akce nenalezena.'], 404);
        }

        return response()->json(['promotion' => $promotion]);
    }

    public function destroyPromotion(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $deleted = $this->crmService->deletePromotion($hotel, $id);

        if (! $deleted) {
            return response()->json(['message' => 'Promo akce nenalezena.'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function exportGuests(Request $request)
    {
        if (! ModuleService::isEnabled('crm')) {
            return response()->json(['message' => 'Modul CRM není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);
        $rows = $this->crmService->exportGuestsRows($hotel);

        $headers = [
            'Jméno', 'Pokoj', 'E-mail', 'Telefon', 'Segment', 'Jazyk',
            'Věrnostní body', 'Počet pobytů', 'Marketing souhlas',
            'Check-in', 'Check-out', 'Přiřazeno', 'Firma',
            'Požadavky', 'Chaty', 'Poslední kontakt', 'Poznámky',
        ];

        $callback = function () use ($rows, $headers) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, $headers, ';');
            foreach ($rows as $row) {
                fputcsv($out, array_values($row), ';');
            }
            fclose($out);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="crm-hoste-'.now()->format('Y-m-d').'.csv"',
        ]);
    }

    public function tasks(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel) => $this->crmService->tasks(
            $hotel,
            $request->query('status'),
        ));
    }

    public function storeTask(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'guest_key' => ['nullable', 'string', 'max:200'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'task_type' => ['nullable', Rule::in(['follow_up', 'call', 'email', 'checkout', 'vip_service', 'other'])],
            'assigned_staff_name' => ['nullable', 'string', 'max:80'],
            'due_at' => ['nullable', 'date'],
        ]);

        return response()->json([
            'task' => $this->crmService->createTask($hotel, $data),
        ], 201);
    }

    public function updateTask(Request $request, string $id): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'guest_key' => ['nullable', 'string', 'max:200'],
            'status' => ['nullable', Rule::in(['open', 'done', 'cancelled'])],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'task_type' => ['nullable', Rule::in(['follow_up', 'call', 'email', 'checkout', 'vip_service', 'other'])],
            'assigned_staff_name' => ['nullable', 'string', 'max:80'],
            'due_at' => ['nullable', 'date'],
        ]);

        $task = $this->crmService->updateTask($hotel, $id, $data);

        if (! $task) {
            return response()->json(['message' => 'Úkol nenalezen.'], 404);
        }

        return response()->json(['task' => $task]);
    }

    public function history(Request $request): JsonResponse
    {
        return $this->respond($request, fn (Hotel $hotel) => $this->crmService->history(
            $hotel,
            $request->query('guest_key'),
        ));
    }

    public function storeInteraction(Request $request): JsonResponse
    {
        $hotel = $this->resolveHotel($request);
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:160'],
            'body' => ['nullable', 'string', 'max:4000'],
            'guest_key' => ['nullable', 'string', 'max:200'],
            'channel' => ['nullable', Rule::in(['note', 'phone', 'email', 'reception', 'whatsapp', 'sms', 'in_person'])],
            'direction' => ['nullable', Rule::in(['inbound', 'outbound', 'internal'])],
            'staff_name' => ['nullable', 'string', 'max:80'],
        ]);

        return response()->json([
            'interaction' => $this->crmService->createInteraction($hotel, $data),
        ], 201);
    }

    private function validatePromotion(Request $request, bool $partial = false): array
    {
        $rules = [
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:160'],
            'subtitle' => ['nullable', 'string', 'max:200'],
            'body' => ['nullable', 'string', 'max:4000'],
            'cta_label' => ['nullable', 'string', 'max:80'],
            'cta_url' => ['nullable', 'string', 'max:500'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'segment' => ['nullable', Rule::in(['all', 'standard', 'vip', 'corporate', 'returning'])],
            'channels' => ['nullable', 'array'],
            'channels.*' => [Rule::in(['mobile_app', 'web_app'])],
            'status' => ['nullable', Rule::in(['draft', 'scheduled', 'active', 'ended'])],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
        ];

        return $request->validate($rules);
    }

    private function respond(Request $request, callable $builder): JsonResponse
    {
        if (! ModuleService::isEnabled('crm')) {
            return response()->json(['message' => 'Modul CRM není zapnutý.'], 403);
        }

        $hotel = $this->resolveHotel($request);

        return response()->json($builder($hotel));
    }

    private function resolveHotel(Request $request): Hotel
    {
        $slug = $request->query('hotel_slug', config('otelapps.hotel_slug', 'default'));

        return Hotel::where('slug', $slug)->firstOrFail();
    }
}
