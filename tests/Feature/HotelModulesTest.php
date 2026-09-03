<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\HotelModuleSetting;
use App\Models\HotelProfile;
use App\Models\User;
use App\Services\ModuleService;
use Database\Seeders\AuthDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class HotelModulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        ModuleService::resetEnabledCache();
    }

    public function test_enabled_map_falls_back_to_config_when_hotel_missing(): void
    {
        $map = ModuleService::enabledMap('neexistujici-hotel-xyz');

        $this->assertSame(
            (bool) config('modules.enabled.recepce'),
            $map['recepce'] ?? false
        );
        $this->assertArrayHasKey('concierge_chat', $map);
    }

    public function test_env_files_command_writes_three_templates(): void
    {
        $out = storage_path('app/testing-customers/example');
        File::deleteDirectory($out);

        $this->artisan('hotel:env-files', [
            'yml' => base_path('customers/_example.yml'),
            '--out' => $out,
        ])->assertSuccessful();

        $this->assertFileExists($out.'/webadmin.env');
        $this->assertFileExists($out.'/hostweb.env');
        $this->assertFileExists($out.'/mobile.env');

        $webadmin = File::get($out.'/webadmin.env');
        $this->assertStringContainsString('OTELAPPS_HOTEL_SLUG=grand-hotel', $webadmin);
        $this->assertStringContainsString('OTELAPPS_DEMO_USER_SWITCHER=false', $webadmin);

        $mobile = File::get($out.'/mobile.env');
        $this->assertStringContainsString('EXPO_PUBLIC_HOTEL_SLUG=grand-hotel', $mobile);

        File::deleteDirectory(storage_path('app/testing-customers'));
    }

    public function test_public_config_returns_merged_modules(): void
    {
        $this->requireHotelSettings();

        $hotel = Hotel::query()->where('slug', config('otelapps.hotel_slug', 'default'))->first();
        $this->assertNotNull($hotel);

        ModuleService::saveEnabledMap($hotel, ['insights' => false, 'recepce' => true]);

        $response = $this->getJson('/api/public/hotel/'.$hotel->slug.'/config');
        $response->assertOk()
            ->assertJsonPath('slug', $hotel->slug)
            ->assertJsonPath('modules.insights', false)
            ->assertJsonPath('modules.recepce', true)
            ->assertJsonStructure(['app_name', 'geo', 'stores']);
    }

    public function test_auth_modules_put_updates_overlay(): void
    {
        $this->requireHotelSettings();
        $this->seed(AuthDemoSeeder::class);

        $user = User::query()->where('email', 'superadmin@otelapps.test')->first();
        $hotel = Hotel::query()->where('slug', config('otelapps.hotel_slug', 'default'))->first();
        if (! $user || ! $hotel) {
            $this->markTestSkipped('Chybí demo user nebo hotel.');
        }

        $this->actingAs($user)
            ->putJson('/api/hotel/modules', [
                'modules' => ['insights' => false],
            ])
            ->assertOk()
            ->assertJsonPath('modules.insights', false);

        ModuleService::resetEnabledCache();
        $this->assertFalse(ModuleService::enabledMap($hotel->slug)['insights']);
    }

    public function test_provision_command_upserts_hotel_and_modules(): void
    {
        $this->requireHotelSettings();

        $this->artisan('hotel:provision', [
            'yml' => base_path('customers/_example.yml'),
        ])->assertSuccessful();

        $hotel = Hotel::query()->where('slug', 'grand-hotel')->first();
        $this->assertNotNull($hotel);
        $this->assertSame('Grand Hotel Praha', $hotel->name);

        $map = ModuleService::enabledMap('grand-hotel');
        $this->assertFalse($map['insights']);
        $this->assertTrue($map['recepce']);

        $hotel->load('profile');
        $this->assertSame('Grand Hotel', $hotel->profile?->app_name);
        $this->assertSame('https://admin.grandhotel.cz', $hotel->profile?->admin_url);

        HotelProfile::query()->where('hotel_id', $hotel->id)->delete();
        HotelModuleSetting::query()->where('hotel_id', $hotel->id)->delete();
        $hotel->delete();
    }

    public function test_guest_concierge_access_forbidden_when_concierge_disabled(): void
    {
        $this->requireHotelSettings();

        $hotel = Hotel::query()->where('slug', config('otelapps.hotel_slug', 'default'))->first();
        $this->assertNotNull($hotel);

        $previous = ModuleService::enabledMap($hotel->slug);
        ModuleService::saveEnabledMap($hotel, ['concierge' => false]);

        try {
            $this->postJson('/api/concierge/guest/access', [
                'guest_external_id' => 'guest-kill-switch',
                'hotel_slug' => $hotel->slug,
            ])
                ->assertForbidden()
                ->assertJsonPath('code', 'module_disabled');
        } finally {
            ModuleService::saveEnabledMap($hotel, [
                'concierge' => $previous['concierge'] ?? true,
                'concierge_chat' => $previous['concierge_chat'] ?? true,
            ]);
        }
    }

    public function test_guest_concierge_access_forbidden_when_chat_disabled(): void
    {
        $this->requireHotelSettings();

        $hotel = Hotel::query()->where('slug', config('otelapps.hotel_slug', 'default'))->first();
        $this->assertNotNull($hotel);

        $previous = ModuleService::enabledMap($hotel->slug);
        ModuleService::saveEnabledMap($hotel, ['concierge_chat' => false]);

        try {
            $this->postJson('/api/concierge/guest/access', [
                'guest_external_id' => 'guest-kill-switch',
                'hotel_slug' => $hotel->slug,
            ])
                ->assertForbidden()
                ->assertJsonPath('code', 'module_disabled');
        } finally {
            ModuleService::saveEnabledMap($hotel, [
                'concierge' => $previous['concierge'] ?? true,
                'concierge_chat' => $previous['concierge_chat'] ?? true,
            ]);
        }
    }

    public function test_guest_concierge_on_message_forbidden_when_module_disabled(): void
    {
        $this->requireHotelSettings();

        $connection = config('otelapps.db_connection');
        if (! Schema::connection($connection)->hasTable('hotel_concierge_conversations')) {
            $this->markTestSkipped('Chybí hotel_concierge_conversations.');
        }

        $hotel = Hotel::query()->where('slug', config('otelapps.hotel_slug', 'default'))->first();
        $this->assertNotNull($hotel);

        $conversation = \App\Models\HotelConciergeConversation::query()->create([
            'hotel_id' => $hotel->id,
            'guest_external_id' => 'guest-kill-switch',
            'guest_display_name' => 'Kill switch',
            'status' => 'open',
        ]);

        $previous = ModuleService::enabledMap($hotel->slug);
        ModuleService::saveEnabledMap($hotel, ['concierge' => false]);

        try {
            $this->postJson('/api/concierge/guest/on-message', [
                'conversation_id' => $conversation->id,
                'guest_external_id' => 'guest-kill-switch',
                'message_id' => (string) \Illuminate\Support\Str::uuid(),
            ])
                ->assertForbidden()
                ->assertJsonPath('code', 'module_disabled');
        } finally {
            ModuleService::saveEnabledMap($hotel, [
                'concierge' => $previous['concierge'] ?? true,
                'concierge_chat' => $previous['concierge_chat'] ?? true,
            ]);
            $conversation->delete();
        }
    }

    private function requireHotelSettings(): void
    {
        $connection = config('otelapps.db_connection');
        if (! Schema::connection($connection)->hasTable('hotels')
            || ! Schema::connection($connection)->hasTable('hotel_module_settings')
            || ! Schema::connection($connection)->hasTable('hotel_profiles')) {
            $this->markTestSkipped('Spusť database/supabase/hotel_profiles.sql v Supabase.');
        }
    }

    public function test_staff_cannot_switch_hotel_via_header(): void
    {
        $this->requireHotelSettings();
        $this->seed(AuthDemoSeeder::class);

        $user = User::query()->where('email', 'recepce@otelapps.test')->first();
        $envHotel = Hotel::query()->where('slug', config('otelapps.hotel_slug', 'default'))->first();
        if (! $user || ! $envHotel) {
            $this->markTestSkipped('Chybí demo user nebo hotel.');
        }

        $other = Hotel::query()->where('slug', '!=', $envHotel->slug)->first();
        if (! $other) {
            $this->markTestSkipped('Pro test je potřeba druhý hotel v DB.');
        }

        $this->actingAs($user)
            ->withHeaders(['X-Hotel-Slug' => $other->slug])
            ->getJson('/api/hotel/modules')
            ->assertOk()
            ->assertJsonPath('slug', $envHotel->slug);
    }
}
