<?php

namespace App\Services;

class ModuleService
{
    private static $sidebarMap = [
        'content' => [
            'facilities' => [
                'restaurants_bars',
                'wellness_spa',
                'sports',
                'other_facilities',
            ],
            'services' => [
                'room_service',
                'amenities',
                'laundry',
                'issues_repairs',
                'check_in_out',
            ],
            'other' => [
                'hotel_info',
                'hotel_rooms',
                'parking',
                'places_of_interest',
                'transportation',
                'where_to_go',
                'generic_other',
            ],
            'leisure',
            'welcome_message',
            'smart_assistant',
            'legal_texts',
        ],
        'my_app' => [
            'mobile_app',
            'web_app',
        ],
        'activity' => [
            'requests',
        ],
        'crm' => [
            'guests',
            'alerts',
            'promotions',
            'tasks',
            'history',
        ],
        'feedback' => [
            'surveys' => [
                'surveys_welcome',
                'surveys_generic',
                'surveys_facilities',
                'surveys_checkout',
            ],
            'external_platforms',
            'inbox',
            'stats',
        ],
        'insights' => [
            'users',
            'transactions',
            'revenue',
            'behavior',
            'staff',
        ],
        'finance' => [
            'finance_overview',
            'finance_closings',
            'finance_transactions',
            'finance_deposits',
            'finance_reports',
        ],
    ];

    /** @var array<string, array{label: string, icon: string, modules: list<string>}> */
    private static $navGroups = [
        'provoz' => [
            'label' => 'Provoz',
            'icon' => 'desk',
            'modules' => ['recepce', 'ukoly', 'finance'],
        ],
        'hoste' => [
            'label' => 'Hosté',
            'icon' => 'group',
            'modules' => ['crm', 'concierge', 'feedback'],
        ],
        'hotel' => [
            'label' => 'Hotel',
            'icon' => 'apartment',
            'modules' => ['content', 'insights', 'my_app'],
        ],
    ];

    /**
     * Zkontroluje, zda je modul zapnutý
     */
    public static function isEnabled(string $module): bool
    {
        $config = config_array('modules.enabled');
        return $config[$module] ?? false;
    }

    /**
     * Získá název modulu
     */
    public static function getLabel(string $module): string
    {
        $labels = config_array('modules.labels');
        return $labels[$module] ?? ucfirst(str_replace('_', ' ', $module));
    }

    /**
     * Získá ikonu modulu
     */
    public static function getIcon(string $module): string
    {
        $icons = config_array('modules.icons');
        return $icons[$module] ?? 'square';
    }

    /**
     * Získá všechny zapnuté moduly
     */
    public static function getEnabledModules(): array
    {
        $config = config_array('modules.enabled');
        return array_filter($config, fn ($enabled) => $enabled === true);
    }

    /**
     * Získá moduly pro hlavní navigaci
     *
     * @param  list<string>|null  $allowedModules  null = bez RBAC filtru, ['*'] = vše zapnuté, jinak whitelist
     */
    public static function getMainNavigation(?array $allowedModules = null): array
    {
        $mainModules = ['recepce', 'ukoly', 'finance', 'dashboard', 'content', 'my_app', 'crm', 'feedback', 'concierge', 'insights'];

        return array_values(array_filter($mainModules, function ($module) use ($allowedModules) {
            return self::isNavModuleVisible($module, $allowedModules);
        }));
    }

    /**
     * Skupiny hlavní navigace — jen ty, které mají aspoň jeden povolený modul.
     *
     * @param  list<string>|null  $allowedModules
     * @return list<array{key: string, label: string, icon: string, modules: list<string>}>
     */
    public static function getMainNavigationGroups(?array $allowedModules = null): array
    {
        $groups = [];

        foreach (self::$navGroups as $key => $group) {
            $modules = array_values(array_filter(
                $group['modules'],
                fn ($module) => self::isNavModuleVisible($module, $allowedModules)
            ));

            if ($modules === []) {
                continue;
            }

            $groups[] = [
                'key' => $key,
                'label' => $group['label'],
                'icon' => $group['icon'],
                'modules' => $modules,
            ];
        }

        return $groups;
    }

    /**
     * @param  list<string>|null  $allowedModules
     */
    private static function isNavModuleVisible(string $module, ?array $allowedModules): bool
    {
        if (! self::isEnabled($module)) {
            return false;
        }

        if ($allowedModules === null || in_array('*', $allowedModules, true)) {
            return true;
        }

        return in_array($module, $allowedModules, true);
    }

    /**
     * Vyřeší hlavní sekci pro daný modul
     */
    public static function resolveSection(?string $moduleKey): ?string
    {
        if (!$moduleKey) return null;

        // Pokud je to přímo klíč sekce
        if (isset(self::$sidebarMap[$moduleKey])) {
            return $moduleKey;
        }

        // Prohledej mapu a najdi pod kterým rodičem se modul nachází
        foreach (self::$sidebarMap as $section => $modules) {
            foreach ($modules as $key => $value) {
                if (is_array($value)) {
                    // Je to sekce se submoduly (např. facilities)
                    if ($key === $moduleKey) {
                        return $section;
                    }
                    // Prohledej submoduly
                    if (in_array($moduleKey, $value)) {
                        return $section;
                    }
                } else {
                    // Je to jednoduchý modul
                    if ($value === $moduleKey) {
                        return $section;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Získá moduly pro sidebar na základě aktuální sekce
     */
    public static function getSidebarModules(?string $section = null): array
    {
        // Resolve section in case a module key was passed
        $section = self::resolveSection($section);

        if (!$section || !isset(self::$sidebarMap[$section])) {
            return [];
        }

        $sidebarModules = self::$sidebarMap[$section];
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

    /**
     * Získá mapu všech modulů a jejich hlavních sekcí
     */
    public static function getFlatMap(): array
    {
        $map = [];
        foreach (self::$sidebarMap as $section => $modules) {
            $map[$section] = $section;
            foreach ($modules as $key => $value) {
                if (is_array($value)) {
                    $map[$key] = $section;
                    foreach ($value as $sub) {
                        $map[$sub] = $section;
                    }
                } else {
                    $map[$value] = $section;
                }
            }
        }
        return $map;
    }

    /**
     * Formát sidebaru pro klienta (stejný tvar jako /api/modules/sidebar).
     */
    public static function formatSidebarForClient(?string $section): array
    {
        $resolvedSection = self::resolveSection($section);
        $sidebarModules = self::getSidebarModules($section);
        $result = [];

        foreach ($sidebarModules as $key => $value) {
            if (is_array($value)) {
                $result[] = [
                    'key' => $key,
                    'label' => self::getLabel($key),
                    'submodules' => array_map(fn ($m) => [
                        'key' => $m,
                        'label' => self::getLabel($m),
                    ], $value),
                ];
            } else {
                $result[] = [
                    'key' => $value,
                    'label' => self::getLabel($value),
                ];
            }
        }

        return [
            'modules' => $result,
            'resolvedSection' => $resolvedSection,
        ];
    }

    /**
     * Bootstrap pro SPA — bez dalšího HTTP round-tripu na module checky / navigaci.
     *
     * @param  \App\Models\User|null  $user
     */
    public static function getClientBootstrap($user = null): array
    {
        $allowedModules = $user ? $user->allowedModuleKeys() : null;
        $mainModules = self::getMainNavigation($allowedModules);
        $labels = [];
        foreach ($mainModules as $module) {
            $labels[$module] = self::getLabel($module);
        }

        $sidebars = [];
        foreach (array_keys(self::$sidebarMap) as $section) {
            $sidebars[$section] = self::formatSidebarForClient($section);
        }

        return [
            'enabled' => config_array('modules.enabled'),
            'mainNavigation' => [
                'modules' => $mainModules,
                'labels' => $labels,
                'groups' => self::getMainNavigationGroups($allowedModules),
            ],
            'map' => self::getFlatMap(),
            'sidebars' => $sidebars,
            'user' => $user ? $user->toAuthArray() : null,
            'demo_user_switcher' => (bool) config('otelapps.demo_user_switcher'),
        ];
    }
}
