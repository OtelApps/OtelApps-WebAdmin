<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        if (! Auth::attempt(
            ['email' => $credentials['email'], 'password' => $credentials['password'], 'is_active' => true],
            $request->boolean('remember'),
        )) {
            throw ValidationException::withMessages([
                'email' => ['Neplatné přihlašovací údaje.'],
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();
        $user->load('userType.permissions');

        return response()->json([
            'user' => $user->toAuthArray(),
            'bootstrap' => ModuleService::getClientBootstrap($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('userType.permissions');

        return response()->json([
            'user' => $user->toAuthArray(),
            'bootstrap' => ModuleService::getClientBootstrap($user),
            'demo_user_switcher' => (bool) config('otelapps.demo_user_switcher'),
        ]);
    }

    public function profiles(): JsonResponse
    {
        if (! config('otelapps.demo_user_switcher')) {
            return response()->json(['message' => 'Přepínač profilů není zapnutý.'], 403);
        }

        $profiles = User::query()
            ->with('userType')
            ->where('is_active', true)
            ->orderBy('id')
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'initials' => $u->initials ?: $u->makeInitials(),
                'job_title' => $u->job_title,
                'user_type' => $u->userType ? [
                    'slug' => $u->userType->slug,
                    'name' => $u->userType->name,
                    'badge_label' => $u->userType->badge_label,
                    'color' => $u->userType->color,
                ] : null,
            ]);

        return response()->json(['profiles' => $profiles]);
    }

    public function switchUser(Request $request, User $user): JsonResponse
    {
        if (! config('otelapps.demo_user_switcher')) {
            return response()->json(['message' => 'Přepínač profilů není zapnutý.'], 403);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Uživatel je neaktivní.'], 422);
        }

        Auth::login($user, true);
        $request->session()->regenerate();
        $user->load('userType.permissions');

        return response()->json([
            'user' => $user->toAuthArray(),
            'bootstrap' => ModuleService::getClientBootstrap($user),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'initials' => ['sometimes', 'nullable', 'string', 'max:8'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'availability_status' => ['sometimes', 'in:available,busy,offline'],
        ]);

        $user->fill($data);
        $user->save();
        $user->load('userType.permissions');

        return response()->json(['user' => $user->toAuthArray()]);
    }
}
