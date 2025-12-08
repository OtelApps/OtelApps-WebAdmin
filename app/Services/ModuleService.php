<?php

namespace App\Services;

class ModuleService
{
    /**
     * Zkontroluje, zda je modul zapnutý
     */
    public static function isEnabled(string $module): bool
    {
        $config = config('modules.enabled', []);
        return $config[$module] ?? false;
    }

    /**
     * Získá název modulu
     */
    public static function getLabel(string $module): string
    {
        $labels = config('modules.labels', []);
        return $labels[$module] ?? ucfirst(str_replace('_', ' ', $module));
    }

    /**
     * Získá ikonu modulu
     */
    public static function getIcon(string $module): string
    {
        $icons = config('modules.icons', []);
        return $icons[$module] ?? 'square';
    }

    /**
     * Získá všechny zapnuté moduly
     */
    public static function getEnabledModules(): array
    {
        $config = config('modules.enabled', []);
        return array_filter($config, fn($enabled) => $enabled === true);
    }

    /**
     * Získá moduly pro hlavní navigaci
     */
    public static function getMainNavigation(): array
    {
        $mainModules = ['dashboard', 'content', 'my_app', 'activity', 'crm', 'feedback', 'concierge', 'insights'];
        
        return array_filter($mainModules, function($module) {
            return self::isEnabled($module);
        });
    }

    /**
     * Získá moduly pro sidebar
     */
    public static function getSidebarModules(): array
    {
        $sidebarModules = [
            'facilities' => [
                'restaurants_bars',
                'wellness_spa',
                'sports',
                'other_facilities',
            ],
            'services',
            'leisure',
            'other',
            'welcome_message',
            'smart_assistant',
            'legal_texts',
        ];

        $result = [];

        foreach ($sidebarModules as $key => $value) {
            if (is_array($value)) {
                // Má sub-moduly
                if (self::isEnabled($key)) {
                    $subModules = array_filter($value, fn($sub) => self::isEnabled($sub));
                    if (!empty($subModules)) {
                        $result[$key] = array_values($subModules);
                    }
                }
            } else {
                // Jednoduchý modul
                if (self::isEnabled($value)) {
                    $result[] = $value;
                }
            }
        }

        return $result;
    }
}
