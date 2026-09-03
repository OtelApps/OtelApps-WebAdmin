<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\HotelModuleSetting;
use App\Models\HotelProfile;
use App\Models\User;
use App\Services\ModuleService;
use Database\Seeders\AuthDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PlatformApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        ModuleService::resetEnabledCache();
    }

    public function test_platform_login_rejects_non_superadmin(): void
    {
        $this->seed(AuthDemoSeeder::class);

        $this->postJson('/api/platform/login', [
            'email' => 'recepce@otelapps.test',
            'password' => 'password',
        ])->assertForbidden();
    }

    public function test_platform_hotels_forbidden_for_staff_token(): void
    {
        $this->requireHotelSettings();
        $this->seed(AuthDemoSeeder::class);

        $user = User::query()->where('email', 'recepce@otelapps.test')->first();
        $this->assertNotNull($user);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/platform/hotels')
            ->assertForbidden();
    }

    public function test_platform_crud_modules_and_public_config_profile(): void
    {
        $this->requireHotelSettings();
        $this->seed(AuthDemoSeeder::class);

        $slug = 'hq-test-'.substr(bin2hex(random_bytes(4)), 0, 8);
        $token = $this->superadminToken();

        try {
            $this->withToken($token)
                ->getJson('/api/platform/module-catalog')
                ->assertOk()
                ->assertJsonStructure(['modules']);

            $this->withToken($token)
                ->postJson('/api/platform/hotels', [
                    'slug' => $slug,
                    'name' => 'HQ Test Hotel',
                    'app_name' => 'HQ Test',
                    'admin_url' => 'https://admin.example.test',
                    'web_url' => 'https://web.example.test',
                    'lat' => 50.1,
                    'lng' => 14.4,
                    'admin_email' => 'hq@example.test',
                    'modules' => ['insights' => false, 'recepce' => true],
                ])
                ->assertCreated()
                ->assertJsonPath('slug', $slug)
                ->assertJsonPath('profile.app_name', 'HQ Test')
                ->assertJsonPath('modules.insights', false);

            $this->withToken($token)
                ->putJson('/api/platform/hotels/'.$slug, [
                    'name' => 'HQ Test Hotel 2',
                    'app_name' => 'HQ App',
                ])
                ->assertOk()
                ->assertJsonPath('name', 'HQ Test Hotel 2')
                ->assertJsonPath('profile.app_name', 'HQ App')
                ->assertJsonPath('profile.admin_url', 'https://admin.example.test');

            $this->withToken($token)
                ->putJson('/api/platform/hotels/'.$slug.'/modules', [
                    'modules' => ['concierge' => false],
                ])
                ->assertOk()
                ->assertJsonPath('modules.concierge', false);

            $this->getJson('/api/public/hotel/'.$slug.'/config')
                ->assertOk()
                ->assertJsonPath('slug', $slug)
                ->assertJsonPath('name', 'HQ Test Hotel 2')
                ->assertJsonPath('app_name', 'HQ App')
                ->assertJsonPath('geo.lat', 50.1)
                ->assertJsonPath('modules.concierge', false)
                ->assertJsonPath('stores.app_store', '');

            Http::fake([
                'https://admin.example.test/up' => Http::response('ok', 200),
                'https://web.example.test/h/'.$slug.'/' => Http::response('ok', 200),
            ]);

            $this->withToken($token)
                ->getJson('/api/platform/hotels/'.$slug.'/health')
                ->assertOk()
                ->assertJsonPath('health.admin.ok', true)
                ->assertJsonPath('health.web.ok', true);

            $env = $this->withToken($token)
                ->getJson('/api/platform/hotels/'.$slug.'/env')
                ->assertOk();
            $env->assertJsonPath('slug', $slug);
            $this->assertStringContainsString('OTELAPPS_HOTEL_SLUG='.$slug, (string) $env->json('files.webadmin'));
            $this->assertStringContainsString('EXPO_PUBLIC_HOTEL_SLUG='.$slug, (string) $env->json('files.mobile'));
            $this->assertStringContainsString('VITE_HOTEL_SLUG='.$slug, (string) $env->json('files.hostweb'));
        } finally {
            $this->deleteTestHotel($slug);
        }
    }

    private function superadminToken(): string
    {
        $response = $this->postJson('/api/platform/login', [
            'email' => 'superadmin@otelapps.test',
            'password' => 'password',
        ]);
        $response->assertOk()->assertJsonStructure(['token']);

        return (string) $response->json('token');
    }

    private function deleteTestHotel(string $slug): void
    {
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            return;
        }
        HotelProfile::query()->where('hotel_id', $hotel->id)->delete();
        HotelModuleSetting::query()->where('hotel_id', $hotel->id)->delete();
        $hotel->delete();
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
}
