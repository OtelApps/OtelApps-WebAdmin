<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $user?->loadMissing('userType');

        if (! $user || ! $user->isSuperAdmin()) {
            return response()->json(['message' => 'Jen superadmin.'], 403);
        }

        return $next($request);
    }
}
