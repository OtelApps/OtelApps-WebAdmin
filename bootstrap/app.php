<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Railway terminates TLS at the edge. Trust X-Forwarded-Proto so Vite
        // assets are https:// — otherwise the browser blocks them (mixed content)
        // and the UI stays on "Loading...".
        $middleware->trustProxies(at: '*');
        $middleware->validateCsrfTokens(except: [
            'api/concierge/guest/*',
            'api/platform/*',
        ]);
        $middleware->alias([
            'permission' => \App\Http\Middleware\EnsurePermission::class,
            'superadmin' => \App\Http\Middleware\EnsureSuperAdmin::class,
        ]);
        $middleware->redirectGuestsTo(function () {
            return '/h/'.\App\Models\Hotel::requestedSlug().'/login';
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
