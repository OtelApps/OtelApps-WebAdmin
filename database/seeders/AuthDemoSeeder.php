<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\User;
use App\Models\UserType;
use App\Services\PermissionCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AuthDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPermissions();
        $types = $this->seedUserTypes();
        $this->seedUsers($types);
    }

    private function seedPermissions(): void
    {
        foreach (PermissionCatalog::all() as $item) {
            Permission::query()->updateOrCreate(
                ['key' => $item['key']],
                [
                    'group' => $item['group'],
                    'label' => $item['label'],
                    'description' => $item['description'] ?? null,
                    'sort_order' => $item['sort_order'] ?? 0,
                ],
            );
        }
    }

    /**
     * @return array<string, UserType>
     */
    private function seedUserTypes(): array
    {
        $definitions = [
            'superadmin' => [
                'name' => 'Superadmin',
                'description' => 'Plný přístup ke všemu včetně správy typů uživatelů',
                'is_system' => true,
                'color' => '#111827',
                'badge_label' => 'ADMIN',
                'permissions' => ['*'],
            ],
            'recepce' => [
                'name' => 'Recepce',
                'description' => 'Recepční — pokoje, tikety, hosté, concierge',
                'is_system' => true,
                'color' => '#ea580c',
                'badge_label' => 'PROVOZ',
                'permissions' => [
                    'modules.recepce.view',
                    'modules.dashboard.view',
                    'modules.ukoly.view',
                    'modules.finance.view',
                    'modules.activity.view',
                    'modules.crm.view',
                    'modules.concierge.view',
                    'modules.feedback.view',
                    'finance.closing.view',
                    'finance.closing.create',
                    'finance.closing.complete',
                    'finance.reports.view',
                    'tickets.queue.housekeeping',
                    'tickets.queue.room_delivery',
                    'tickets.queue.maintenance',
                    'tickets.queue.reception',
                    'tickets.queue.other',
                    'tickets.view_all',
                    'tickets.create',
                    'tickets.claim',
                    'tickets.reassign',
                    'tickets.close',
                    'tickets.edit',
                ],
            ],
            'uklid' => [
                'name' => 'Uklízečka',
                'description' => 'Housekeeping — tikety úklidu',
                'is_system' => true,
                'color' => '#2563eb',
                'badge_label' => 'ÚKLID',
                'permissions' => [
                    'modules.ukoly.view',
                    'modules.dashboard.view',
                    'tickets.queue.housekeeping',
                    'tickets.claim',
                    'tickets.close',
                ],
            ],
            'donaska' => [
                'name' => 'Donáška',
                'description' => 'Servis — donáška věcí a room service do pokojů',
                'is_system' => true,
                'color' => '#7c3aed',
                'badge_label' => 'SERVIS',
                'permissions' => [
                    'modules.ukoly.view',
                    'modules.dashboard.view',
                    'tickets.queue.room_delivery',
                    'tickets.claim',
                    'tickets.close',
                ],
            ],
            'manazer' => [
                'name' => 'Manažer',
                'description' => 'Provozní manažer — přehled a správa tiketů',
                'is_system' => true,
                'color' => '#059669',
                'badge_label' => 'MANAŽER',
                'permissions' => [
                    'modules.recepce.view',
                    'modules.dashboard.view',
                    'modules.ukoly.view',
                    'modules.finance.view',
                    'modules.content.view',
                    'modules.activity.view',
                    'modules.crm.view',
                    'modules.feedback.view',
                    'modules.concierge.view',
                    'modules.insights.view',
                    'finance.closing.view',
                    'finance.closing.create',
                    'finance.closing.complete',
                    'finance.closing.reopen',
                    'finance.closing.edit_cash_float',
                    'finance.reports.view',
                    'finance.reports.export',
                    'tickets.queue.housekeeping',
                    'tickets.queue.room_delivery',
                    'tickets.queue.maintenance',
                    'tickets.queue.reception',
                    'tickets.queue.other',
                    'tickets.view_all',
                    'tickets.create',
                    'tickets.claim',
                    'tickets.reassign',
                    'tickets.close',
                    'tickets.edit',
                ],
            ],
        ];

        $types = [];
        foreach ($definitions as $slug => $def) {
            $type = UserType::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $def['name'],
                    'description' => $def['description'],
                    'is_system' => $def['is_system'],
                    'color' => $def['color'],
                    'badge_label' => $def['badge_label'],
                ],
            );

            if (($def['permissions'][0] ?? null) === '*') {
                $type->permissions()->sync(Permission::query()->pluck('id'));
            } else {
                $ids = Permission::query()->whereIn('key', $def['permissions'])->pluck('id');
                $type->permissions()->sync($ids);
            }

            $types[$slug] = $type;
        }

        return $types;
    }

    /**
     * @param  array<string, UserType>  $types
     */
    private function seedUsers(array $types): void
    {
        $profiles = [
            [
                'email' => 'superadmin@otelapps.test',
                'name' => 'Super Admin',
                'initials' => 'SA',
                'job_title' => 'Superadmin',
                'type' => 'superadmin',
            ],
            [
                'email' => 'recepce@otelapps.test',
                'name' => 'Anna Dvořáková',
                'initials' => 'AD',
                'job_title' => 'Recepce',
                'type' => 'recepce',
            ],
            [
                'email' => 'uklid@otelapps.test',
                'name' => 'Jana Nováková',
                'initials' => 'JN',
                'job_title' => 'Pokojská',
                'type' => 'uklid',
            ],
            [
                'email' => 'donaska@otelapps.test',
                'name' => 'Petr Svoboda',
                'initials' => 'PS',
                'job_title' => 'Room service',
                'type' => 'donaska',
            ],
            [
                'email' => 'manazer@otelapps.test',
                'name' => 'Zdeněk Sibiřský',
                'initials' => 'ZS',
                'job_title' => 'Manažer provozu',
                'type' => 'manazer',
            ],
        ];

        foreach ($profiles as $profile) {
            User::query()->updateOrCreate(
                ['email' => $profile['email']],
                [
                    'user_type_id' => $types[$profile['type']]->id,
                    'name' => $profile['name'],
                    'initials' => $profile['initials'],
                    'job_title' => $profile['job_title'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'availability_status' => 'available',
                ],
            );
        }

        // Odstranit starý skeleton test user, ať nepřekáží v přepínači
        User::query()->where('email', 'test@example.com')->delete();
    }
}
