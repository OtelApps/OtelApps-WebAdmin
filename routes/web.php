<?php

use Illuminate\Support\Facades\Route;
use App\Livewire\Pages\{Dashboard, Content, MyApp, Activity, Crm, Feedback, Concierge, Insights};
use App\Livewire\Modules\Facilities\{RestaurantsBars, WellnessSpa, Sports, OtherFacilities};

// Redirect root to dashboard
Route::get('/', function () {
    return redirect('/dashboard');
});

// Main pages - using Livewire full-page components
Route::get('/dashboard', Dashboard::class);
Route::get('/content', Content::class);
Route::get('/my_app', MyApp::class);
Route::get('/activity', Activity::class);
Route::get('/crm', Crm::class);
Route::get('/feedback', Feedback::class);
Route::get('/concierge', Concierge::class);
Route::get('/insights', Insights::class);

// Module routes
Route::get('/module/{type}/{module}', function ($type, $module) {
    $componentMap = [
        'restaurants_bars' => RestaurantsBars::class,
        'wellness_spa' => WellnessSpa::class,
        'sports' => Sports::class,
        'other_facilities' => OtherFacilities::class,
    ];

    if (!isset($componentMap[$module])) {
        abort(404);
    }

    return app($componentMap[$module]);
})->name('module');
