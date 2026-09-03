<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelProfile;
use App\Support\CustomerProfile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use InvalidArgumentException;

class HotelProvisionService
{
    /**
     * @param  array{
     *     slug: string,
     *     name: string,
     *     modules?: array<string, mixed>,
     *     copy_modules_from?: string|null,
     *     app_name?: string,
     *     admin_url?: string,
     *     web_url?: string,
     *     lat?: float|string|null,
     *     lng?: float|string|null,
     *     admin_email?: string,
     *     app_store_url?: string,
     *     play_store_url?: string
     * }  $payload
     */
    public function provision(array $payload): Hotel
    {
        $slug = $this->normalizeSlug((string) ($payload['slug'] ?? ''));
        $name = trim((string) ($payload['name'] ?? ''));
        if ($name === '') {
            throw new InvalidArgumentException('Hotel musí mít name.');
        }

        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            $hotel = new Hotel;
            $hotel->id = (string) Str::uuid();
            $hotel->slug = $slug;
        }
        $hotel->name = $name;
        $hotel->save();

        $modules = is_array($payload['modules'] ?? null) ? $payload['modules'] : [];
        $copyFrom = trim((string) ($payload['copy_modules_from'] ?? ''));
        if ($modules === [] && $copyFrom !== '') {
            $source = Hotel::bySlug($copyFrom);
            if ($source) {
                $modules = ModuleService::enabledMap($source->slug);
            }
        }
        ModuleService::saveEnabledMap($hotel, $modules);

        $this->saveProfile($hotel, $payload);

        return $hotel->fresh(['profile', 'moduleSetting']) ?? $hotel;
    }

    public function provisionFromYaml(CustomerProfile $profile): Hotel
    {
        return $this->provision([
            'slug' => $profile->slug(),
            'name' => $profile->name(),
            'modules' => $profile->modules(),
            'app_name' => $profile->appName(),
            'admin_url' => $profile->adminUrl(),
            'web_url' => $profile->webUrl(),
            'lat' => $profile->lat(),
            'lng' => $profile->lng(),
            'admin_email' => $profile->adminEmail(),
            'app_store_url' => $profile->appStoreUrl(),
            'play_store_url' => $profile->playStoreUrl(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveProfile(Hotel $hotel, array $payload): HotelProfile
    {
        $existing = HotelProfile::query()->find($hotel->id);
        $string = function (string $key, string $fallback) use ($payload, $existing): string {
            if (array_key_exists($key, $payload)) {
                return trim((string) ($payload[$key] ?? ''));
            }

            return trim((string) ($existing?->{$key} ?? $fallback));
        };

        $lat = array_key_exists('lat', $payload)
            ? $this->nullableFloat($payload['lat'])
            : $this->nullableFloat($existing?->lat);
        $lng = array_key_exists('lng', $payload)
            ? $this->nullableFloat($payload['lng'])
            : $this->nullableFloat($existing?->lng);

        return HotelProfile::query()->updateOrCreate(
            ['hotel_id' => $hotel->id],
            [
                'app_name' => $string('app_name', $hotel->name),
                'admin_url' => rtrim($string('admin_url', ''), '/'),
                'web_url' => rtrim($string('web_url', ''), '/'),
                'lat' => $lat,
                'lng' => $lng,
                'admin_email' => $string('admin_email', ''),
                'app_store_url' => $string('app_store_url', ''),
                'play_store_url' => $string('play_store_url', ''),
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Hotel $hotel): array
    {
        $hotel->loadMissing(['profile', 'moduleSetting']);
        $profile = $hotel->profile;
        $modules = ModuleService::enabledMap($hotel->slug);
        $disabled = [];
        foreach ($modules as $key => $on) {
            if (! $on) {
                $disabled[] = $key;
            }
        }

        return [
            'id' => $hotel->id,
            'slug' => $hotel->slug,
            'name' => $hotel->name,
            'modules' => $modules,
            'disabled_modules' => $disabled,
            'profile' => $profile?->toPublicArray() ?? [
                'app_name' => $hotel->name,
                'admin_url' => '',
                'web_url' => '',
                'lat' => null,
                'lng' => null,
                'admin_email' => '',
                'app_store_url' => '',
                'play_store_url' => '',
            ],
        ];
    }

    /**
     * @return array{admin: array{ok: bool, status: int|null}, web: array{ok: bool, status: int|null}}
     */
    public function health(Hotel $hotel): array
    {
        $hotel->loadMissing('profile');
        $adminUrl = rtrim((string) ($hotel->profile?->admin_url ?? ''), '/');
        $webUrl = rtrim((string) ($hotel->profile?->web_url ?? ''), '/');

        return [
            'admin' => $this->ping($adminUrl !== '' ? $adminUrl.'/up' : ''),
            'web' => $this->ping($webUrl !== '' ? $webUrl.'/h/'.$hotel->slug.'/' : ''),
        ];
    }

    /**
     * @return array{ok: bool, status: int|null}
     */
    private function ping(string $url): array
    {
        if ($url === '' || ! preg_match('#^https?://#i', $url)) {
            return ['ok' => false, 'status' => null];
        }

        try {
            $response = Http::timeout(4)->connectTimeout(3)->withOptions([
                'http_errors' => false,
            ])->get($url);

            $status = $response->status();

            return [
                'ok' => $status >= 200 && $status < 400,
                'status' => $status,
            ];
        } catch (\Throwable) {
            return ['ok' => false, 'status' => null];
        }
    }

    /**
     * @return array{webadmin: string, hostweb: string, mobile: string}
     */
    public function envTemplates(Hotel $hotel): array
    {
        $hotel->loadMissing('profile');
        $profile = $hotel->profile;

        return $this->buildEnvTemplates([
            'slug' => $hotel->slug,
            'app_name' => (string) ($profile?->app_name ?: $hotel->name),
            'admin_url' => rtrim((string) ($profile?->admin_url ?? ''), '/'),
            'web_url' => rtrim((string) ($profile?->web_url ?? ''), '/'),
            'lat' => $profile?->lat !== null ? (string) $profile->lat : '50.0875',
            'lng' => $profile?->lng !== null ? (string) $profile->lng : '14.4213',
            'app_store_url' => (string) ($profile?->app_store_url ?? ''),
            'play_store_url' => (string) ($profile?->play_store_url ?? ''),
        ]);
    }

    /**
     * @return array{webadmin: string, hostweb: string, mobile: string}
     */
    public function envTemplatesFromCustomer(CustomerProfile $profile): array
    {
        return $this->buildEnvTemplates([
            'slug' => $profile->slug(),
            'app_name' => $profile->appName(),
            'admin_url' => $profile->adminUrl(),
            'web_url' => $profile->webUrl(),
            'lat' => $profile->lat(),
            'lng' => $profile->lng(),
            'app_store_url' => $profile->appStoreUrl(),
            'play_store_url' => $profile->playStoreUrl(),
        ]);
    }

    /**
     * @param  array{
     *     slug: string,
     *     app_name: string,
     *     admin_url: string,
     *     web_url: string,
     *     lat: string,
     *     lng: string,
     *     app_store_url: string,
     *     play_store_url: string
     * }  $ctx
     * @return array{webadmin: string, hostweb: string, mobile: string}
     */
    public function buildEnvTemplates(array $ctx): array
    {
        $slug = $ctx['slug'];
        $appName = $this->escapeEnv($ctx['app_name']);
        $adminUrl = $ctx['admin_url'] !== '' ? $ctx['admin_url'] : 'https://admin.example.com';
        $webUrl = $ctx['web_url'];

        $webadmin = implode("\n", [
            'APP_NAME="'.$appName.'"',
            'APP_ENV=production',
            'APP_DEBUG=false',
            'APP_URL='.$adminUrl,
            'OTELAPPS_HOTEL_SLUG='.$slug,
            'OTELAPPS_DEMO_USER_SWITCHER=false',
            'CORS_ALLOWED_ORIGINS='.$webUrl,
            '',
            '# Doplň secrets z existujícího WebAdminu (stejná Supabase):',
            'APP_KEY=',
            'SUPABASE_URL=',
            'SUPABASE_KEY=',
            'SUPABASE_SERVICE_ROLE_KEY=',
            'SUPABASE_JWT_SECRET=',
            'SUPABASE_DB_HOST=',
            'SUPABASE_DB_PORT=6543',
            'SUPABASE_DB_DATABASE=',
            'SUPABASE_DB_USERNAME=',
            'SUPABASE_DB_PASSWORD=',
            'OPENAI_API_KEY=',
            'OPENAI_BASE_URL=https://api.openai.com/v1',
            'OPENAI_MODEL=gpt-4o-mini',
            'OPENAI_JSON_MODE=true',
            '',
        ]);

        $hostweb = implode("\n", [
            'VITE_HOTEL_SLUG='.$slug,
            'VITE_WEBADMIN_URL='.($ctx['admin_url'] !== '' ? $ctx['admin_url'] : $adminUrl),
            'VITE_HOTEL_LAT='.$ctx['lat'],
            'VITE_HOTEL_LNG='.$ctx['lng'],
            'VITE_APP_STORE_URL='.$ctx['app_store_url'],
            'VITE_PLAY_STORE_URL='.$ctx['play_store_url'],
            '',
            '# Doplň anon klíč z existujícího HostWebu (stejná Supabase):',
            'VITE_SUPABASE_URL=',
            'VITE_SUPABASE_ANON_KEY=',
            '',
        ]);

        $mobile = implode("\n", [
            'EXPO_PUBLIC_HOTEL_SLUG='.$slug,
            'EXPO_PUBLIC_WEBADMIN_URL='.($ctx['admin_url'] !== '' ? $ctx['admin_url'] : $adminUrl),
            '',
            '# Doplň anon klíč z existující mobilní appky (stejná Supabase):',
            'EXPO_PUBLIC_SUPABASE_URL=',
            'EXPO_PUBLIC_SUPABASE_ANON_KEY=',
            '',
        ]);

        return [
            'webadmin' => $webadmin,
            'hostweb' => $hostweb,
            'mobile' => $mobile,
        ];
    }

    private function escapeEnv(string $value): string
    {
        return str_replace('"', '\\"', $value);
    }

    public function normalizeSlug(string $slug): string
    {
        $slug = strtolower(trim($slug));
        if ($slug === '' || ! preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            throw new InvalidArgumentException('Slug musí být a-z, 0-9 a pomlčky.');
        }

        return $slug;
    }

    private function nullableFloat(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}
