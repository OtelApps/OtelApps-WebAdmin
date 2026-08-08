<?php

use App\Http\Controllers\Api\HotelInfoController;
use App\Http\Controllers\Api\HotelParkingController;
use App\Http\Controllers\Api\HotelPlaceController;
use App\Http\Controllers\Api\HotelHousekeepingController;
use App\Http\Controllers\Api\FitnessController;
use App\Http\Controllers\Api\HotelRoomServiceController;
use App\Http\Controllers\Api\RelaxSportController;
use App\Http\Controllers\Api\HotelMaintenanceController;
use App\Http\Controllers\Api\HotelSuppliesController;
use App\Http\Controllers\Api\HotelRoomController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\WellnessController;
use App\Http\Controllers\Api\ActivityRevenueController;
use App\Http\Controllers\Api\InsightsController;
use App\Http\Controllers\Api\ConciergeBotController;
use App\Http\Controllers\Api\ConciergeChatController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\ReceptionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\HotelServiceRequestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserAdminController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\FinancialClosingController;
use App\Services\ModuleService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// API Routes for React - musí být před catch-all route
Route::prefix('api')->group(function () {
    Route::get('/csrf', fn () => response()->json(['token' => csrf_token()]));

    // Auth (veřejné)
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Concierge guest — mobilní app (bez session auth)
    Route::post('/concierge/guest/on-message', [ConciergeBotController::class, 'onGuestMessage']);
    Route::post('/concierge/guest/ensure-reply', [ConciergeBotController::class, 'ensureReply']);
    Route::post('/concierge/guest/escalate', [ConciergeBotController::class, 'escalate']);
    Route::post('/concierge/guest/satisfaction', [ConciergeBotController::class, 'satisfaction']);
    Route::post('/concierge/guest/presence', [ConciergeBotController::class, 'presence']);

    Route::middleware('auth')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/auth/profiles', [AuthController::class, 'profiles']);
    Route::post('/auth/switch/{user}', [AuthController::class, 'switchUser']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/modules/main-navigation', function () {
        $bootstrap = ModuleService::getClientBootstrap(Auth::user());

        return response()->json([
            'modules' => $bootstrap['mainNavigation']['modules'],
            'labels' => $bootstrap['mainNavigation']['labels'],
            'map' => $bootstrap['map'],
        ]);
    });

    Route::get('/modules/sidebar', function (Request $request) {
        $sectionParam = $request->query('section');
        $section = is_string($sectionParam) ? $sectionParam : null;

        return response()->json(ModuleService::formatSidebarForClient($section));
    });

    Route::get('/modules/check/{module}', function ($module) {
        return response()->json([
            'enabled' => ModuleService::isEnabled($module),
        ]);
    });

    Route::get('/modules/check/{type}/{module}', function ($type, $module) {
        $typeEnabled = ModuleService::isEnabled($type);
        $moduleEnabled = ModuleService::isEnabled($module);

        return response()->json([
            'enabled' => $typeEnabled && $moduleEnabled,
        ]);
    });

    // Dashboard
    Route::get('/dashboard/bootstrap', [DashboardController::class, 'bootstrap']);
    Route::get('/dashboard/hotel-overview', [DashboardController::class, 'hotelOverview']);
    Route::get('/dashboard/layout', [DashboardController::class, 'layout']);
    Route::put('/dashboard/layout', [DashboardController::class, 'updateLayout']);

    // Venues (restaurants & bars) — Supabase schema
    Route::get('/venues', [VenueController::class, 'index']);
    Route::post('/venues', [VenueController::class, 'store']);
    Route::get('/venues/{slug}', [VenueController::class, 'show']);
    Route::put('/venues/{slug}', [VenueController::class, 'update']);
    Route::put('/venues/{slug}/hours', [VenueController::class, 'updateHours']);
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

    // Památky a místa — mapa + trip planner
    Route::get('/hotel-places', [HotelPlaceController::class, 'index']);
    Route::post('/hotel-places', [HotelPlaceController::class, 'store']);
    Route::post('/hotel-places/geocode', [HotelPlaceController::class, 'geocode']);
    Route::put('/hotel-places/{id}', [HotelPlaceController::class, 'update']);
    Route::delete('/hotel-places/{id}', [HotelPlaceController::class, 'destroy']);

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

    // CRM — hosté, alerty, promo akce
    Route::get('/crm/overview', [CrmController::class, 'overview']);
    Route::get('/crm/guests', [CrmController::class, 'guests']);
    Route::post('/crm/guests', [CrmController::class, 'storeGuest']);
    Route::get('/crm/guests/export/csv', [CrmController::class, 'exportGuests']);
    Route::get('/crm/guests/{guestKey}', [CrmController::class, 'showGuest']);
    Route::put('/crm/guests/{guestKey}', [CrmController::class, 'updateGuest']);
    Route::get('/crm/alerts', [CrmController::class, 'alerts']);
    Route::post('/crm/alerts', [CrmController::class, 'storeAlert']);
    Route::post('/crm/alerts/{id}/dismiss', [CrmController::class, 'dismissAlert']);
    Route::get('/crm/push/audience', [CrmController::class, 'pushAudience']);
    Route::get('/crm/push/audience-options', [CrmController::class, 'pushAudienceOptions']);
    Route::post('/crm/push', [CrmController::class, 'sendPush']);
    Route::get('/crm/promotions', [CrmController::class, 'promotions']);
    Route::post('/crm/promotions', [CrmController::class, 'storePromotion']);
    Route::put('/crm/promotions/{id}', [CrmController::class, 'updatePromotion']);
    Route::delete('/crm/promotions/{id}', [CrmController::class, 'destroyPromotion']);
    Route::get('/crm/tasks', [CrmController::class, 'tasks']);
    Route::post('/crm/tasks', [CrmController::class, 'storeTask']);
    Route::put('/crm/tasks/{id}', [CrmController::class, 'updateTask']);
    Route::get('/crm/history', [CrmController::class, 'history']);
    Route::post('/crm/interactions', [CrmController::class, 'storeInteraction']);

    // Recepce — přehled pokojů
    Route::get('/reception/rooms', [ReceptionController::class, 'rooms']);
    Route::get('/reception/rooms/{roomNumber}', [ReceptionController::class, 'show']);
    Route::post('/reception/rooms/{roomNumber}/checkout', [ReceptionController::class, 'checkout']);
    Route::patch('/reception/rooms/{roomNumber}/requests/{requestId}', [ReceptionController::class, 'toggleRequest']);

    // WebAdmin notifikace
    Route::get('/notifications/summary', [NotificationController::class, 'summary']);
    Route::get('/notifications/settings', [NotificationController::class, 'settings']);
    Route::put('/notifications/settings', [NotificationController::class, 'updateSettings']);
    Route::post('/notifications/read', [NotificationController::class, 'markRead']);

    // Insights — analytika z Activity a Concierge
    Route::get('/insights/overview', [InsightsController::class, 'overview']);
    Route::get('/insights/users', [InsightsController::class, 'users']);
    Route::get('/insights/transactions', [InsightsController::class, 'transactions']);
    Route::get('/insights/behavior', [InsightsController::class, 'behavior']);

    // Activity — požadavky hostů (tiketovací systém)
    Route::get('/activity/revenue-summary', [ActivityRevenueController::class, 'summary']);
    Route::get('/activity/requests', [HotelServiceRequestController::class, 'index']);
    Route::post('/activity/requests', [HotelServiceRequestController::class, 'store']);
    Route::get('/activity/requests/{id}', [HotelServiceRequestController::class, 'show']);
    Route::put('/activity/requests/{id}', [HotelServiceRequestController::class, 'update']);
    Route::delete('/activity/requests/{id}', [HotelServiceRequestController::class, 'destroy']);


    // Concierge — chat host ↔ recepce
    Route::get('/concierge/realtime-config', [ConciergeChatController::class, 'realtimeConfig']);
    Route::get('/concierge/conversations', [ConciergeChatController::class, 'index']);
    Route::get('/concierge/conversations/{id}', [ConciergeChatController::class, 'show']);
    Route::post('/concierge/conversations/{id}/messages', [ConciergeChatController::class, 'storeMessage']);
    Route::post('/concierge/conversations/{id}/read', [ConciergeChatController::class, 'markRead']);
    Route::post('/concierge/conversations/{id}/take-over', [ConciergeChatController::class, 'takeOver']);
    Route::post('/concierge/conversations/{id}/release-to-bot', [ConciergeChatController::class, 'releaseToBot']);
    Route::post('/concierge/conversations/{id}/satisfaction-check', [ConciergeChatController::class, 'sendSatisfactionCheck']);
    Route::get('/concierge/conversations/{id}/guest-card', [ConciergeChatController::class, 'guestCard']);
    Route::post('/concierge/conversations/{id}/guest-ops', [ConciergeChatController::class, 'guestOps']);
    Route::post('/concierge/conversations/{id}/presence', [ConciergeChatController::class, 'presence']);
    Route::put('/concierge/conversations/{id}', [ConciergeChatController::class, 'update']);

    // Úkoly — provozní tikety nad service requests
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/stats', [TicketController::class, 'stats']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::post('/tickets/{id}/claim', [TicketController::class, 'claim']);
    Route::post('/tickets/{id}/complete', [TicketController::class, 'complete']);
    Route::post('/tickets/{id}/reassign', [TicketController::class, 'reassign']);
    Route::patch('/tickets/{id}', [TicketController::class, 'update']);

    // Finance — uzávěrky a platby
    Route::get('/finance/dashboard', [FinancialClosingController::class, 'dashboard']);
    Route::get('/finance/closings', [FinancialClosingController::class, 'index']);
    Route::post('/finance/closings', [FinancialClosingController::class, 'store']);
    Route::get('/finance/closings/{id}', [FinancialClosingController::class, 'show']);
    Route::patch('/finance/closings/{id}', [FinancialClosingController::class, 'update']);
    Route::post('/finance/closings/{id}/acknowledge-preflight', [FinancialClosingController::class, 'acknowledgePreflight']);
    Route::post('/finance/closings/{id}/cash-count', [FinancialClosingController::class, 'cashCount']);
    Route::post('/finance/closings/{id}/resolve-variance', [FinancialClosingController::class, 'resolveVariance']);
    Route::get('/finance/closings/{id}/reconciliation-hints', [FinancialClosingController::class, 'reconciliationHints']);
    Route::post('/finance/closings/{id}/deposit', [FinancialClosingController::class, 'deposit']);
    Route::post('/finance/closings/{id}/complete', [FinancialClosingController::class, 'complete']);
    Route::post('/finance/closings/{id}/reopen', [FinancialClosingController::class, 'reopen']);
    Route::get('/finance/closings/{id}/transactions', [FinancialClosingController::class, 'transactions']);
    Route::get('/finance/closings/{id}/report', [FinancialClosingController::class, 'report']);
    Route::get('/finance/deposits', [FinancialClosingController::class, 'deposits']);
    Route::get('/finance/payments', [FinancialClosingController::class, 'payments']);

    // Správa typů / uživatelů (superadmin)
    Route::get('/admin/permissions', [UserAdminController::class, 'permissions']);
    Route::get('/admin/user-types', [UserAdminController::class, 'userTypes']);
    Route::post('/admin/user-types', [UserAdminController::class, 'storeUserType']);
    Route::put('/admin/user-types/{userType}', [UserAdminController::class, 'updateUserType']);
    Route::delete('/admin/user-types/{userType}', [UserAdminController::class, 'destroyUserType']);
    Route::get('/admin/users', [UserAdminController::class, 'users']);
    Route::put('/admin/users/{user}', [UserAdminController::class, 'updateUser']);
    });
});

// React SPA Route - všechny ostatní routes budou řešeny React Routerem
// Musí být na konci, aby nezachytával API routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');

