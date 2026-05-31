<?php

use App\Http\Controllers\Api\HotelInfoController;
use App\Http\Controllers\Api\HotelParkingController;
use App\Http\Controllers\Api\HotelHousekeepingController;
use App\Http\Controllers\Api\FitnessController;
use App\Http\Controllers\Api\HotelRoomServiceController;
use App\Http\Controllers\Api\RelaxSportController;
use App\Http\Controllers\Api\HotelMaintenanceController;
use App\Http\Controllers\Api\HotelSuppliesController;
use App\Http\Controllers\Api\HotelRoomController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\WellnessController;
use App\Http\Controllers\Api\HotelServiceRequestController;
use App\Services\ModuleService;
use Illuminate\Http\Request;
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
            'map' => ModuleService::getFlatMap(),
        ]);
    });

    Route::get('/modules/sidebar', function (Request $request) {
        $sectionParam = $request->query('section');
        $section = is_string($sectionParam) ? $sectionParam : null;
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

    // Wellness & SPA — Supabase schema
    Route::get('/wellness/facilities', [WellnessController::class, 'index']);
    Route::post('/wellness/facilities', [WellnessController::class, 'store']);
    Route::get('/wellness/facilities/{slug}', [WellnessController::class, 'show']);
    Route::put('/wellness/facilities/{slug}', [WellnessController::class, 'update']);
    Route::delete('/wellness/facilities/{slug}', [WellnessController::class, 'destroy']);
    Route::put('/wellness/facilities/{slug}/services', [WellnessController::class, 'updateServices']);
    Route::get('/wellness/program', [WellnessController::class, 'programIndex']);
    Route::put('/wellness/program', [WellnessController::class, 'updateProgram']);

    // Relax & Sport — domovské dlaždice + instance
    Route::get('/relax-sport', [RelaxSportController::class, 'show']);
    Route::put('/relax-sport', [RelaxSportController::class, 'update']);
    Route::put('/relax-sport/areas', [RelaxSportController::class, 'updateAreas']);

    // Posilovna & Sport — Supabase schema (fitness_facilities, …)
    Route::get('/fitness/facilities', [FitnessController::class, 'index']);
    Route::post('/fitness/facilities', [FitnessController::class, 'store']);
    Route::get('/fitness/facilities/{slug}', [FitnessController::class, 'show']);
    Route::put('/fitness/facilities/{slug}', [FitnessController::class, 'update']);
    Route::delete('/fitness/facilities/{slug}', [FitnessController::class, 'destroy']);
    Route::put('/fitness/facilities/{slug}/images', [FitnessController::class, 'updateImages']);

    // Informace o hotelu — Supabase schema (hotel_info_topics, hotel_info_sections)
    Route::get('/hotel-info/topics', [HotelInfoController::class, 'index']);
    Route::post('/hotel-info/topics', [HotelInfoController::class, 'store']);
    Route::get('/hotel-info/topics/{slug}', [HotelInfoController::class, 'show']);
    Route::put('/hotel-info/topics/{slug}', [HotelInfoController::class, 'update']);
    Route::delete('/hotel-info/topics/{slug}', [HotelInfoController::class, 'destroy']);
    Route::put('/hotel-info/topics/{slug}/sections', [HotelInfoController::class, 'updateSections']);

    // Nabídka pokojů — Supabase schema (hotel_room_types, …)
    Route::get('/hotel-rooms/types', [HotelRoomController::class, 'index']);
    Route::post('/hotel-rooms/types', [HotelRoomController::class, 'store']);
    Route::get('/hotel-rooms/types/{slug}', [HotelRoomController::class, 'show']);
    Route::delete('/hotel-rooms/types/{slug}', [HotelRoomController::class, 'destroy']);
    Route::put('/hotel-rooms/types/{slug}', [HotelRoomController::class, 'update']);
    Route::put('/hotel-rooms/types/{slug}/features', [HotelRoomController::class, 'updateFeatures']);
    Route::put('/hotel-rooms/types/{slug}/gallery', [HotelRoomController::class, 'updateGallery']);

    // Parkování — Supabase schema (hotel_parking_topics)
    Route::get('/hotel-parking/topics', [HotelParkingController::class, 'index']);
    Route::post('/hotel-parking/topics', [HotelParkingController::class, 'store']);
    Route::get('/hotel-parking/topics/{slug}', [HotelParkingController::class, 'show']);
    Route::put('/hotel-parking/topics/{slug}', [HotelParkingController::class, 'update']);
    Route::delete('/hotel-parking/topics/{slug}', [HotelParkingController::class, 'destroy']);

    // Doplňky (Amenities) — Supabase schema (hotel_supplies, …)
    Route::get('/hotel-supplies', [HotelSuppliesController::class, 'index']);
    Route::get('/hotel-supplies/{slug}', [HotelSuppliesController::class, 'show']);
    Route::put('/hotel-supplies/{slug}', [HotelSuppliesController::class, 'update']);
    Route::put('/hotel-supplies/{slug}/hours', [HotelSuppliesController::class, 'updateHours']);
    Route::put('/hotel-supplies/{slug}/catalog', [HotelSuppliesController::class, 'updateCatalog']);
    Route::post('/hotel-supplies/{slug}/catalog/categories/{categorySlug}/items', [HotelSuppliesController::class, 'storeCatalogItem']);
    Route::delete('/hotel-supplies/{slug}/catalog/items/{itemId}', [HotelSuppliesController::class, 'destroyCatalogItem']);

    // Údržba & opravy (Issues & repairs) — Supabase schema (hotel_maintenance, …)
    Route::get('/hotel-maintenance', [HotelMaintenanceController::class, 'index']);
    Route::get('/hotel-maintenance/{slug}', [HotelMaintenanceController::class, 'show']);
    Route::put('/hotel-maintenance/{slug}', [HotelMaintenanceController::class, 'update']);
    Route::put('/hotel-maintenance/{slug}/hours', [HotelMaintenanceController::class, 'updateHours']);
    Route::put('/hotel-maintenance/{slug}/catalog', [HotelMaintenanceController::class, 'updateCatalog']);
    Route::post('/hotel-maintenance/{slug}/catalog/categories/{categorySlug}/items', [HotelMaintenanceController::class, 'storeCatalogItem']);
    Route::delete('/hotel-maintenance/{slug}/catalog/items/{itemId}', [HotelMaintenanceController::class, 'destroyCatalogItem']);

    // Úklid pokoje (Laundry) — Supabase schema (hotel_housekeeping, …)
    Route::get('/hotel-housekeeping', [HotelHousekeepingController::class, 'index']);
    Route::get('/hotel-housekeeping/{slug}', [HotelHousekeepingController::class, 'show']);
    Route::put('/hotel-housekeeping/{slug}', [HotelHousekeepingController::class, 'update']);
    Route::put('/hotel-housekeeping/{slug}/hours', [HotelHousekeepingController::class, 'updateHours']);
    Route::put('/hotel-housekeeping/{slug}/catalog', [HotelHousekeepingController::class, 'updateCatalog']);
    Route::post('/hotel-housekeeping/{slug}/catalog/categories/{categorySlug}/items', [HotelHousekeepingController::class, 'storeCatalogItem']);
    Route::delete('/hotel-housekeeping/{slug}/catalog/items/{itemId}', [HotelHousekeepingController::class, 'destroyCatalogItem']);

    // Pokojová služba (Room service) — Supabase schema (hotel_room_service_menus, …)
    Route::get('/hotel-room-service/menus', [HotelRoomServiceController::class, 'index']);
    Route::get('/hotel-room-service/menus/{slug}', [HotelRoomServiceController::class, 'show']);
    Route::put('/hotel-room-service/menus/{slug}', [HotelRoomServiceController::class, 'update']);
    Route::put('/hotel-room-service/menus/{slug}/hours', [HotelRoomServiceController::class, 'updateHours']);
    Route::put('/hotel-room-service/menus/{slug}/catalog', [HotelRoomServiceController::class, 'updateCatalog']);

    // Activity — požadavky hostů (tiketovací systém)
    Route::get('/activity/requests', [HotelServiceRequestController::class, 'index']);
    Route::post('/activity/requests', [HotelServiceRequestController::class, 'store']);
    Route::get('/activity/requests/{id}', [HotelServiceRequestController::class, 'show']);
    Route::put('/activity/requests/{id}', [HotelServiceRequestController::class, 'update']);
    Route::delete('/activity/requests/{id}', [HotelServiceRequestController::class, 'destroy']);
});

// React SPA Route - všechny ostatní routes budou řešeny React Routerem
// Musí být na konci, aby nezachytával API routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
