<?php

namespace App\Providers;

use App\Database\PostgresEmulatedConnection;
use Illuminate\Database\Connection;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Connection::resolverFor('pgsql', function ($connection, $database, $prefix, $config) {
            return new PostgresEmulatedConnection($connection, $database, $prefix, $config);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
