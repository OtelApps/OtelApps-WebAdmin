<?php

use App\Http\Controllers\Api\VenueController;
use App\Services\ModuleService;
use Illuminate\Support\Facades\Route;

// API Routes for React - musí být před catch-all route
Route::prefix('api')->group(function () {
    Route::get('/modules/main-navigation', function () {
        $modules = ModuleService::getMainNavigation();
        $labels = [];
        foreach ($modules as $module) {
            $labels[$module] = ModuleService::getLabel($module);
        }
        
        return response()->json([
            'modules' => array_values($modules), // Ensure it's a numeric array
            'labels' => $labels,
        ]);
    });

    Route::get('/modules/sidebar', function () {
        $section = request()->query('section');
        $resolvedSection = ModuleService::resolveSection($section);
        $sidebarModules = ModuleService::getSidebarModules($section);
        $result = [];
        
        foreach ($sidebarModules as $key => $value) {
            if (is_array($value)) {
                // Section with submodules
                $result[] = [
                    'key' => $key,
                    'label' => ModuleService::getLabel($key),
                    'submodules' => array_map(fn($m) => [
                        'key' => $m,
                        'label' => ModuleService::getLabel($m),
                    ], $value),
                ];
            } else {
                // Simple module
                $result[] = [
                    'key' => $value,
                    'label' => ModuleService::getLabel($value),
                ];
            }
        }
        
        return response()->json([
            'modules' => $result,
            'resolvedSection' => $resolvedSection
        ]);
    });

    Route::get('/modules/check/{module}', function ($module) {
        return response()->json([
            'enabled' => ModuleService::isEnabled($module),
        ]);
    });

    Route::get('/modules/check/{type}/{module}', function ($type, $module) {
        // Zkontroluj oba - type i module
        $typeEnabled = ModuleService::isEnabled($type);
        $moduleEnabled = ModuleService::isEnabled($module);
        
        return response()->json([
            'enabled' => $typeEnabled && $moduleEnabled,
        ]);
    });

    // Venues (restaurants & bars) — Supabase schema
    Route::get('/venues', [VenueController::class, 'index']);
    Route::post('/venues', [VenueController::class, 'store']);
    Route::get('/venues/{slug}', [VenueController::class, 'show']);
    Route::put('/venues/{slug}', [VenueController::class, 'update']);
    Route::put('/venues/{slug}/menus', [VenueController::class, 'updateMenus']);
    Route::delete('/venues/{slug}', [VenueController::class, 'destroy']);
});

// React SPA Route - všechny ostatní routes budou řešeny React Routerem
// Musí být na konci, aby nezachytával API routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
