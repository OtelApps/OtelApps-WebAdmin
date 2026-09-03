<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'user_type_id',
        'hotel_slug',
        'name',
        'initials',
        'job_title',
        'email',
        'password',
        'is_active',
        'availability_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function userType(): BelongsTo
    {
        return $this->belongsTo(UserType::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->userType?->isSuperAdmin() === true;
    }

    public function hotelSlug(): string
    {
        return strtolower(trim((string) $this->hotel_slug));
    }

    public function permissionKeys(): array
    {
        if ($this->isSuperAdmin()) {
            return ['*'];
        }

        if (! $this->relationLoaded('userType')) {
            $this->load('userType.permissions');
        } elseif ($this->userType && ! $this->userType->relationLoaded('permissions')) {
            $this->userType->load('permissions');
        }

        return $this->userType?->permissions?->pluck('key')->values()->all() ?? [];
    }

    public function hasPermission(string $key): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($key, $this->permissionKeys(), true);
    }

    public function hasAnyPermission(array $keys): bool
    {
        foreach ($keys as $key) {
            if ($this->hasPermission($key)) {
                return true;
            }
        }

        return false;
    }

    public function allowedQueueKeys(): array
    {
        if ($this->hasPermission('tickets.view_all') || $this->isSuperAdmin()) {
            return ['*'];
        }

        $queues = [];
        foreach ($this->permissionKeys() as $key) {
            if (str_starts_with($key, 'tickets.queue.')) {
                $queues[] = substr($key, strlen('tickets.queue.'));
            }
        }

        return $queues;
    }

    public function allowedModuleKeys(): array
    {
        if ($this->isSuperAdmin()) {
            return ['*'];
        }

        $modules = [];
        foreach ($this->permissionKeys() as $key) {
            if (preg_match('/^modules\.([a-z0-9_]+)\.view$/', $key, $m)) {
                $modules[] = $m[1];
            }
        }

        return $modules;
    }

    public function toAuthArray(): array
    {
        $type = $this->userType;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'initials' => $this->initials ?: $this->makeInitials(),
            'job_title' => $this->job_title,
            'availability_status' => $this->availability_status,
            'is_active' => $this->is_active,
            'is_superadmin' => $this->isSuperAdmin(),
            'hotel_slug' => $this->isSuperAdmin() ? null : ($this->hotelSlug() ?: null),
            'user_type' => $type ? [
                'id' => $type->id,
                'slug' => $type->slug,
                'name' => $type->name,
                'color' => $type->color,
                'badge_label' => $type->badge_label,
            ] : null,
            'permissions' => $this->permissionKeys(),
            'queues' => $this->allowedQueueKeys(),
            'modules' => $this->allowedModuleKeys(),
        ];
    }

    public function makeInitials(): string
    {
        $parts = preg_split('/\s+/u', trim($this->name)) ?: [];
        $letters = '';
        foreach (array_slice($parts, 0, 2) as $part) {
            $letters .= mb_strtoupper(mb_substr($part, 0, 1));
        }

        return $letters !== '' ? $letters : 'U';
    }
}
