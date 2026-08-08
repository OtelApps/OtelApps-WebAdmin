<?php

namespace App\Services;

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

    public static function queueForServiceModule(string $serviceModule): string
    {
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
