<?php

namespace App\Services;

class SupabaseStaffTokenService
{
    public function isConfigured(): bool
    {
        return filled(config('supabase.url'))
            && filled(config('supabase.key'))
            && filled(config('supabase.jwt_secret'));
    }

    /**
     * Krátkodobý JWT pro Supabase Realtime v prohlížeči (role authenticated + hotel_id).
     */
    public function createStaffToken(string $hotelId, int $ttlSeconds = 3600): string
    {
        $secret = (string) config('supabase.jwt_secret');
        $now = time();

        $payload = [
            'aud' => 'authenticated',
            'exp' => $now + $ttlSeconds,
            'iat' => $now,
            'iss' => 'supabase',
            'sub' => 'webadmin-staff',
            'role' => 'authenticated',
            'hotel_id' => $hotelId,
        ];

        return $this->encodeJwt($payload, $secret);
    }

    private function encodeJwt(array $payload, string $secret): string
    {
        $header = $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $body = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = $this->base64UrlEncode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));

        return "{$header}.{$body}.{$signature}";
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
