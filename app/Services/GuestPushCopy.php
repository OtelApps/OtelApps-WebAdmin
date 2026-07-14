<?php

namespace App\Services;

class GuestPushCopy
{
    /**
     * @return array{title: string, subtitle: string, body: string, category_id: string, thread_id: string, badge: int}
     */
    public function crmAlert(string $hotelName, string $headline, string $body, string $severity = 'info', ?string $alertId = null): array
    {
        $headline = trim($headline);
        $body = trim($body);

        $severityMeta = match ($severity) {
            'critical' => ['prefix' => '🔴', 'tag' => 'Naléhavé', 'badge' => 1],
            'warning' => ['prefix' => '⚡', 'tag' => 'Důležité', 'badge' => 1],
            default => ['prefix' => '✨', 'tag' => 'Pro vás', 'badge' => 1],
        };

        $subtitle = $headline !== ''
            ? "{$severityMeta['prefix']} {$headline}"
            : "{$severityMeta['prefix']} {$severityMeta['tag']}";

        $messageBody = $body !== ''
            ? $body
            : 'Máme pro vás novinku přímo z hotelu. Otevřete aplikaci a podívejte se na detail.';

        return [
            'title' => $hotelName,
            'subtitle' => $subtitle,
            'body' => $messageBody,
            'category_id' => 'crm_alert',
            'thread_id' => $alertId ? "crm-alert-{$alertId}" : 'crm-alerts',
            'badge' => $severityMeta['badge'],
        ];
    }

    /**
     * @return array{title: string, subtitle: string, body: string, category_id: string, thread_id: string, badge: int}
     */
    public function serviceRequestStatus(
        string $hotelName,
        string $serviceLabel,
        ?string $requestNumber,
        string $newStatus,
        string $requestId,
    ): array {
        $label = trim($serviceLabel) !== '' ? trim($serviceLabel) : 'Váš požadavek';
        $ref = $requestNumber ? "#{$requestNumber}" : '';

        $copy = match ($newStatus) {
            'new' => [
                'emoji' => '📩',
                'hook' => 'Právě přijato',
                'body' => $ref !== ''
                    ? "Objednávka {$ref} je u nás. Brzy se jí začneme věnovat."
                    : 'Vaše objednávka je u nás. Brzy se jí začneme věnovat.',
            ],
            'pending' => [
                'emoji' => '⏳',
                'hook' => 'Čeká na vyřízení',
                'body' => $ref !== ''
                    ? "Objednávka {$ref} je ve frontě. Personál hotelu ji právě připravuje."
                    : 'Vaše objednávka je ve frontě. Personál hotelu ji právě připravuje.',
            ],
            'in_progress' => [
                'emoji' => '⚡',
                'hook' => 'Právě pro vás',
                'body' => $ref !== ''
                    ? "Na objednávce {$ref} právě pracujeme. Za chvíli bude u vás."
                    : 'Na vaší objednávce právě pracujeme. Za chvíli bude u vás.',
            ],
            'solved' => [
                'emoji' => '✓',
                'hook' => 'Hotovo',
                'body' => $ref !== ''
                    ? "Objednávka {$ref} je vyřízena. Přejeme příjemný zbytek pobytu."
                    : 'Vaše objednávka je vyřízena. Přejeme příjemný zbytek pobytu.',
            ],
            'rejected' => [
                'emoji' => 'ℹ️',
                'hook' => 'Nelze splnit',
                'body' => $ref !== ''
                    ? "Objednávku {$ref} bohužel nemůžeme splnit. Rádi vám nabídneme alternativu v aplikaci."
                    : 'Vaši objednávku bohužel nemůžeme splnit. Rádi vám nabídneme alternativu v aplikaci.',
            ],
            'archived' => [
                'emoji' => '📁',
                'hook' => 'Archivováno',
                'body' => $ref !== ''
                    ? "Objednávka {$ref} byla uzavřena. Historii najdete v aplikaci."
                    : 'Vaše objednávka byla uzavřena. Historii najdete v aplikaci.',
            ],
            default => [
                'emoji' => '🔔',
                'hook' => 'Aktualizace',
                'body' => $ref !== ''
                    ? "Stav objednávky {$ref} se právě změnil."
                    : 'Stav vaší objednávky se právě změnil.',
            ],
        };

        return [
            'title' => $label,
            'subtitle' => "{$copy['emoji']} {$copy['hook']} · {$hotelName}",
            'body' => $copy['body'],
            'category_id' => 'service_request',
            'thread_id' => "service-request-{$requestId}",
            'badge' => 1,
        ];
    }
}
