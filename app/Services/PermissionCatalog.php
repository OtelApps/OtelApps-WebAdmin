<?php

namespace App\Services;

use App\Models\HotelServiceRequestType;

class PermissionCatalog
{
    public static function all(): array
    {
        return config_array('permissions.catalog');
    }

    public static function groupLabels(): array
    {
        return config_array('permissions.group_labels');
    }

    public static function queueForServiceModule(string $serviceModule, ?string $hotelId = null): string
    {
        if ($hotelId) {
            try {
                $fromType = HotelServiceRequestType::query()
                    ->where('hotel_id', $hotelId)
                    ->where('module_key', $serviceModule)
                    ->where('is_active', true)
                    ->value('queue_key');
                if (is_string($fromType) && trim($fromType) !== '') {
                    return trim($fromType);
                }
            } catch (\Throwable) {
                // sloupec queue_key ještě nemusí existovat
            }
        }

        $map = config_array('permissions.service_module_queues');

        return $map[$serviceModule] ?? 'other';
    }

    public static function modulePermissionKey(string $module): string
    {
        return 'modules.'.$module.'.view';
    }

    public static function queuePermissionKey(string $queueKey): string
    {
        return 'tickets.queue.'.$queueKey;
    }
}
