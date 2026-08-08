<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserType;
use App\Services\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserAdminController extends Controller
{
    public function permissions(Request $request): JsonResponse
    {
        if (! $request->user()?->hasPermission('users.manage_types')) {
            return response()->json(['message' => 'Nemáte oprávnění.'], 403);
        }

        $items = Permission::query()->orderBy('sort_order')->orderBy('key')->get();
        $grouped = [];
        foreach ($items as $perm) {
            $grouped[$perm->group][] = [
                'id' => $perm->id,
                'key' => $perm->key,
                'label' => $perm->label,
                'description' => $perm->description,
            ];
        }

        return response()->json([
            'groups' => $grouped,
            'group_labels' => PermissionCatalog::groupLabels(),
        ]);
    }

    public function userTypes(Request $request): JsonResponse
    {
        if (! $request->user()?->hasPermission('users.manage_types')) {
            return response()->json(['message' => 'Nemáte oprávnění.'], 403);
        }

        $types = UserType::query()->with('permissions')->withCount('users')->orderBy('id')->get();

        return response()->json([
            'user_types' => $types->map(fn (UserType $t) => $this->typePayload($t)),
        ]);
    }

    public function storeUserType(Request $request): JsonResponse
    {
        if (! $request->user()?->hasPermission('users.manage_types')) {
            return response()->json(['message' => 'Nemáte oprávnění.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:80', 'alpha_dash', 'unique:user_types,slug'],
            'description' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:32'],
            'badge_label' => ['nullable', 'string', 'max:32'],
            'permission_keys' => ['array'],
            'permission_keys.*' => ['string', 'exists:permissions,key'],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['name']);
        if (UserType::query()->where('slug', $slug)->exists()) {
            $slug .= '-'.Str::random(4);
        }

        $type = UserType::query()->create([
            'slug' => $slug,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? '#64748b',
            'badge_label' => $data['badge_label'] ?? null,
            'is_system' => false,
        ]);

        $ids = Permission::query()->whereIn('key', $data['permission_keys'] ?? [])->pluck('id');
        $type->permissions()->sync($ids);
        $type->load('permissions');
        $type->loadCount('users');

        return response()->json(['user_type' => $this->typePayload($type)], 201);
    }

    public function updateUserType(Request $request, UserType $userType): JsonResponse
    {
        if (! $request->user()?->hasPermission('users.manage_types')) {
            return response()->json(['message' => 'Nemáte oprávnění.'], 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:32'],
            'badge_label' => ['nullable', 'string', 'max:32'],
            'permission_keys' => ['sometimes', 'array'],
            'permission_keys.*' => ['string', 'exists:permissions,key'],
        ]);

        if ($userType->isSuperAdmin() && array_key_exists('permission_keys', $data)) {
            // Superadmin vždy všechny permissions — sync all
            $userType->permissions()->sync(Permission::query()->pluck('id'));
            unset($data['permission_keys']);
        }

        $userType->fill(collect($data)->except('permission_keys')->all());
        $userType->save();

        if (array_key_exists('permission_keys', $data) && ! $userType->isSuperAdmin()) {
            $ids = Permission::query()->whereIn('key', $data['permission_keys'])->pluck('id');
            $userType->permissions()->sync($ids);
        }

        $userType->load('permissions');
        $userType->loadCount('users');

        return response()->json(['user_type' => $this->typePayload($userType)]);
    }

    public function destroyUserType(Request $request, UserType $userType): JsonResponse
    {
        if (! $request->user()?->hasPermission('users.manage_types')) {
            return response()->json(['message' => 'Nemáte oprávnění.'], 403);
        }

        if ($userType->is_system) {
            return response()->json(['message' => 'Systémový typ nelze smazat.'], 422);
        }

        if ($userType->users()->exists()) {
            return response()->json(['message' => 'Typ má přiřazené uživatele.'], 422);
        }

        $userType->delete();

        return response()->json(['ok' => true]);
    }

    public function users(Request $request): JsonResponse
    {
        if (! $request->user()?->hasAnyPermission(['users.manage_types', 'users.manage_users'])) {
            return response()->json(['message' => 'Nemáte oprávnění.'], 403);
        }

        $users = User::query()->with('userType')->orderBy('id')->get();

        return response()->json([
            'users' => $users->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'initials' => $u->initials ?: $u->makeInitials(),
                'job_title' => $u->job_title,
                'is_active' => $u->is_active,
                'availability_status' => $u->availability_status,
                'user_type_id' => $u->user_type_id,
                'user_type' => $u->userType ? [
                    'id' => $u->userType->id,
                    'slug' => $u->userType->slug,
                    'name' => $u->userType->name,
                ] : null,
            ]),
        ]);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        if (! $request->user()?->hasAnyPermission(['users.manage_types', 'users.manage_users'])) {
            return response()->json(['message' => 'Nemáte oprávnění.'], 403);
        }

        $data = $request->validate([
            'user_type_id' => ['sometimes', 'nullable', Rule::exists('user_types', 'id')],
            'is_active' => ['sometimes', 'boolean'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'name' => ['sometimes', 'string', 'max:120'],
        ]);

        $user->fill($data);
        $user->save();
        $user->load('userType');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type_id' => $user->user_type_id,
                'is_active' => $user->is_active,
                'job_title' => $user->job_title,
            ],
        ]);
    }

    private function typePayload(UserType $t): array
    {
        return [
            'id' => $t->id,
            'slug' => $t->slug,
            'name' => $t->name,
            'description' => $t->description,
            'is_system' => $t->is_system,
            'color' => $t->color,
            'badge_label' => $t->badge_label,
            'users_count' => $t->users_count ?? $t->users()->count(),
            'permission_keys' => $t->permissions->pluck('key')->values()->all(),
        ];
    }
}
