<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($permissions === []) {
            return $next($request);
        }

        if (! $user->hasAnyPermission($permissions)) {
            return response()->json(['message' => 'Nemáte oprávnění k této akci.'], 403);
        }

        return $next($request);
    }
}
