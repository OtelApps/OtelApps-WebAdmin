<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelGuestPushToken;
use Illuminate\Support\Collection;

class GuestPushService
{
    public const ANDROID_CHANNEL_ID = 'otelapps-default';

    public function __construct(
        private readonly ExpoPushService $expoPushService,
        private readonly NotificationService $notificationService,
        private readonly GuestPushCopy $guestPushCopy,
        private readonly GuestPushAudienceResolver $audienceResolver,
    ) {}

    public function isEnabled(Hotel $hotel): bool
    {
        $prefs = $this->notificationService->settings($hotel)['preferences'];

        return (bool) ($prefs['guest_push_enabled'] ?? true);
    }

    public function isStatusChangeEnabled(Hotel $hotel): bool
    {
        if (! $this->isEnabled($hotel)) {
            return false;
        }

        $prefs = $this->notificationService->settings($hotel)['preferences'];

        return (bool) ($prefs['guest_push_on_status_change'] ?? true);
    }

    /**
     * @return array{device_count: int, guest_count: int, guest_external_ids: array<int, string>}
     */
    public function audienceStats(
        Hotel $hotel,
        string $audience,
        ?string $segment = null,
        ?string $cohort = null,
        ?string $guestKey = null,
    ): array {
        return $this->audienceResolver->stats($hotel, $audience, $segment, $cohort, $guestKey);
    }

    /**
     * @return array<int, array{key: string, type: string, label: string, description: string, icon: string, device_count: int, guest_count: int}>
     */
    public function audienceOptions(Hotel $hotel): array
    {
        return $this->audienceResolver->listOptions($hotel);
    }

    /**
     * @return array{sent: int, device_count: int, guest_count: int, tickets: array<int, mixed>, delivered: bool}
     */
    public function sendToAudience(
        Hotel $hotel,
        string $title,
        string $body,
        string $audience,
        ?string $segment = null,
        ?string $cohort = null,
        ?string $guestKey = null,
        array $data = [],
        string $severity = 'info',
    ): array {
        if (! $this->isEnabled($hotel)) {
            return [
                'sent' => 0,
                'device_count' => 0,
                'guest_count' => 0,
                'tickets' => [],
                'delivered' => false,
                'error' => 'guest_push_disabled',
            ];
        }

        $externalIds = $this->audienceResolver->resolveGuestExternalIds(
            $hotel,
            $audience,
            $segment,
            $cohort,
            $guestKey,
        );
        $tokens = $this->audienceResolver->loadTokens($hotel, $externalIds);

        if ($tokens->isEmpty()) {
            return [
                'sent' => 0,
                'device_count' => 0,
                'guest_count' => $externalIds->count(),
                'tickets' => [],
                'delivered' => false,
                'error' => 'no_devices',
            ];
        }

        $copy = $this->guestPushCopy->crmAlert(
            $this->hotelDisplayName($hotel),
            $title,
            $body,
            $severity,
            isset($data['alertId']) ? (string) $data['alertId'] : null,
        );

        $messages = $tokens
            ->map(fn (HotelGuestPushToken $token) => $this->buildMessage($token, [
                ...$copy,
                'data' => array_merge([
                    'type' => 'crm_alert',
                    'severity' => $severity,
                    'audience' => $audience,
                ], $data),
            ]))
            ->values()
            ->all();

        $result = $this->expoPushService->send($messages);

        return [
            'sent' => $result['sent'],
            'device_count' => $tokens->count(),
            'guest_count' => $externalIds->count(),
            'tickets' => $result['tickets'],
            'delivered' => $result['sent'] > 0,
        ];
    }

    public function isConciergePushEnabled(Hotel $hotel): bool
    {
        if (! $this->isEnabled($hotel)) {
            return false;
        }

        $prefs = $this->notificationService->settings($hotel)['preferences'];

        return (bool) ($prefs['guest_push_on_concierge'] ?? true);
    }

    /**
     * Push hostovi při nové zprávě od AI / recepce.
     *
     * @return array{sent: int, tickets: array<int, mixed>}
     */
    public function sendConciergeMessage(
        Hotel $hotel,
        string $guestExternalId,
        string $conversationId,
        string $preview,
        string $from = 'bot',
    ): array {
        if (! $this->isConciergePushEnabled($hotel) || $guestExternalId === '') {
            return ['sent' => 0, 'tickets' => []];
        }

        if (app(ConciergeBanService::class)->isBanned((string) $hotel->id, $guestExternalId)) {
            return ['sent' => 0, 'tickets' => []];
        }

        $tokens = $this->audienceResolver->loadTokens($hotel, collect([$guestExternalId]));
        if ($tokens->isEmpty()) {
            return ['sent' => 0, 'tickets' => []];
        }

        $copy = $this->guestPushCopy->conciergeMessage(
            $this->hotelDisplayName($hotel),
            $preview,
            $conversationId,
            $from,
        );

        $messages = $tokens
            ->map(fn (HotelGuestPushToken $token) => $this->buildMessage($token, [
                ...$copy,
                'data' => [
                    'type' => 'concierge_message',
                    'conversationId' => $conversationId,
                    'from' => $from,
                ],
            ]))
            ->values()
            ->all();

        return $this->expoPushService->send($messages);
    }

    /**
     * @return array{sent: int, tickets: array<int, mixed>}
     */
    public function sendStatusChange(
        Hotel $hotel,
        string $guestExternalId,
        string $serviceLabel,
        ?string $requestNumber,
        string $requestId,
        string $newStatus,
    ): array {
        if (! $this->isStatusChangeEnabled($hotel) || $guestExternalId === '') {
            return ['sent' => 0, 'tickets' => []];
        }

        $tokens = $this->audienceResolver->loadTokens($hotel, collect([$guestExternalId]));

        $copy = $this->guestPushCopy->serviceRequestStatus(
            $this->hotelDisplayName($hotel),
            $serviceLabel,
            $requestNumber,
            $newStatus,
            $requestId,
        );

        $messages = $tokens
            ->map(fn (HotelGuestPushToken $token) => $this->buildMessage($token, [
                ...$copy,
                'data' => [
                    'type' => 'service_request_status',
                    'requestId' => $requestId,
                    'status' => $newStatus,
                ],
            ]))
            ->values()
            ->all();

        return $this->expoPushService->send($messages);
    }

    /**
     * @return array{title: string, subtitle: string, body: string}
     */
    public function statusChangeCopy(string $serviceLabel, ?string $requestNumber, string $newStatus): array
    {
        $preview = $this->guestPushCopy->serviceRequestStatus(
            'OtelApps Hotel',
            $serviceLabel,
            $requestNumber,
            $newStatus,
            'preview',
        );

        return [
            'title' => $preview['title'],
            'subtitle' => $preview['subtitle'],
            'body' => $preview['body'],
        ];
    }

    /**
     * @param  array{
     *   title: string,
     *   subtitle?: string|null,
     *   body?: string,
     *   category_id?: string,
     *   thread_id?: string,
     *   badge?: int,
     *   data?: array<string, mixed>
     * }  $content
     * @return array<string, mixed>
     */
    private function buildMessage(HotelGuestPushToken $token, array $content): array
    {
        $message = [
            'to' => $token->expo_push_token,
            'title' => $content['title'],
            'body' => $content['body'] ?? '',
            'sound' => 'default',
            'priority' => 'high',
            'channelId' => self::ANDROID_CHANNEL_ID,
            'badge' => $content['badge'] ?? 1,
            'data' => $content['data'] ?? [],
        ];

        $subtitle = trim((string) ($content['subtitle'] ?? ''));
        if ($subtitle !== '') {
            $message['subtitle'] = $subtitle;
        }

        $categoryId = trim((string) ($content['category_id'] ?? ''));
        if ($categoryId !== '') {
            $message['categoryId'] = $categoryId;
        }

        $threadId = trim((string) ($content['thread_id'] ?? ''));
        if ($threadId !== '') {
            $message['threadId'] = $threadId;
        }

        return $message;
    }

    private function hotelDisplayName(Hotel $hotel): string
    {
        $name = trim((string) $hotel->name);

        return $name !== '' ? $name : 'OtelApps Hotel';
    }
}
