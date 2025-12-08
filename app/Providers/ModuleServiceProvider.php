<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;

class ModuleServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Sdílení aktivních modulů do všech view
        View::composer('*', function ($view) {
            $view->with('activeModules', \App\Services\ModuleService::getEnabledModules());
        });
    }
}

