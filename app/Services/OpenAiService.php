<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class OpenAiService
{
    public function isConfigured(): bool
    {
        return filled(config('openai.base_url')) && filled(config('openai.model'));
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @return array<string, mixed>
     */
    public function chatJson(array $messages, ?string $system = null): array
    {
        $payloadMessages = [];
        if ($system !== null && $system !== '') {
            $payloadMessages[] = ['role' => 'system', 'content' => $system];
        }
        foreach ($messages as $message) {
            $payloadMessages[] = $message;
        }

        $content = $this->chat($payloadMessages, (bool) config('openai.json_mode', false), [
            'max_tokens' => (int) config('openai.max_tokens', 768),
            'timeout' => (int) config('openai.translate_timeout', 90),
        ]);
        $decoded = $this->decodeJsonObject($content);

        if (! is_array($decoded)) {
            throw new RuntimeException('Model nevrátil validní JSON.');
        }

        return $decoded;
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @param  array{max_tokens?: int, timeout?: int}  $options
     */
    public function chat(array $messages, bool $jsonObject = false, array $options = []): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('OpenAI/LM Studio není nakonfigurováno (OPENAI_BASE_URL / OPENAI_MODEL).');
        }

        $maxTokens = (int) ($options['max_tokens'] ?? config('openai.max_tokens', 768));
        $timeout = $this->resolveTimeout((int) ($options['timeout'] ?? config('openai.timeout', 25)));
        $model = (string) config('openai.model', 'gpt-4o-mini');
        $isLocal = $this->isLocalLlm();

        // Gemma-4 reasoning: nízký max_tokens → content="" + finish_reason=length (viz LM Studio log).
        $minTokens = $isLocal ? 512 : 256;
        $messages = $this->withLocalAntiThinkingGuard($messages, $isLocal);

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => 0.3,
            'max_tokens' => max($minTokens, $maxTokens),
        ];

        if ($jsonObject) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $url = $this->chatCompletionsUrl();
        $apiKey = (string) (config('openai.api_key') ?: 'lm-studio');

        // artisan serve / PHP-FPM má default 30 s — Guzzle timeout nestačí, PHP request umře dřív.
        $this->extendPhpTimeLimit($timeout);

        $response = Http::withToken($apiKey)
            ->timeout(max(10, $timeout))
            ->connectTimeout(10)
            ->acceptJson()
            ->withOptions($this->httpClientOptions())
            ->post($url, $payload);

        if (! $response->successful()) {
            $body = $response->body();
            Log::warning('LLM API error', [
                'url' => $url,
                'model' => $model,
                'status' => $response->status(),
                'body' => $body,
            ]);

            $hint = '';
            if (str_contains($body, 'No models loaded') || str_contains($body, 'model')) {
                $hint = ' Zkontroluj LM Studio: načti model a OPENAI_MODEL musí sedět s /v1/models.';
            }

            throw new RuntimeException('LLM API selhalo (HTTP '.$response->status().').'.$hint);
        }

        $json = $response->json();
        $choice = data_get($json, 'choices.0');
        if (! is_array($choice)) {
            Log::warning('LLM unexpected response shape', [
                'url' => $url,
                'body_preview' => mb_substr($response->body(), 0, 400),
            ]);
            throw new RuntimeException('LLM vrátilo neočekávanou odpověď (chybí choices).');
        }

        $message = data_get($choice, 'message', []);
        $content = data_get($message, 'content');
        $finishReason = data_get($choice, 'finish_reason');
        $reasoning = trim((string) data_get($message, 'reasoning_content', ''));

        if (is_string($content) && trim($content) !== '') {
            return trim($content);
        }

        // finish_reason=length → reasoning sežral celý budget; nejdřív retry s víc tokeny
        if ($finishReason === 'length' && empty($options['_retried_length'])) {
            Log::info('LLM: retry po finish_reason=length (prázdný content)', [
                'model' => $model,
                'prev_max_tokens' => $payload['max_tokens'],
                'reasoning_preview' => mb_substr($reasoning, 0, 160),
            ]);

            return $this->chat($messages, $jsonObject, [
                ...$options,
                'max_tokens' => min(4096, max(1024, $payload['max_tokens'] * 2)),
                '_retried_length' => true,
            ]);
        }

        $recovered = $this->recoverFromReasoning($reasoning);
        if ($recovered !== null) {
            Log::info('LLM: content recovered from reasoning_content', [
                'chars' => mb_strlen($recovered),
                'finish_reason' => $finishReason,
            ]);

            return $recovered;
        }

        Log::warning('LLM empty content', [
            'model' => $model,
            'finish_reason' => $finishReason,
            'usage' => data_get($json, 'usage'),
            'reasoning_preview' => mb_substr($reasoning, 0, 200),
        ]);
        throw new RuntimeException(
            'LLM vrátilo prázdnou odpověď (Gemma reasoning spotřebovala tokeny — v LM Studio nech vyšší Response tokens / OPENAI_MAX_TOKENS).'
        );
    }

    public function translate(string $text, string $fromLocale, string $toLocale): string
    {
        $text = trim($text);
        if ($text === '' || $fromLocale === $toLocale) {
            return $text;
        }

        $labels = [
            'cs' => 'Czech',
            'en' => 'English',
            'de' => 'German',
            'fr' => 'French',
            'pl' => 'Polish',
        ];

        $from = $labels[$fromLocale] ?? $fromLocale;
        $to = $labels[$toLocale] ?? $toLocale;

        // Delší texty potřebují víc výstupních tokenů (Gemma bere i reasoning).
        $charLen = mb_strlen($text);
        $maxTokens = min(4096, max(
            (int) config('openai.max_tokens', 768),
            (int) ceil($charLen * 1.6) + 256,
        ));
        $timeout = (int) config('openai.translate_timeout', 90);

        // Plain text je spolehlivější než JSON u lokálních modelů (Gemma).
        $plain = $this->chat([
            [
                'role' => 'system',
                'content' => 'You are a precise translation engine for hotel guest–staff chat. '
                    .'Reply with ONLY the translated message text. No quotes, no JSON, no explanation. '
                    .'Preserve line breaks and structure.',
            ],
            [
                'role' => 'user',
                'content' => "Translate from {$from} to {$to}:\n\n{$text}",
            ],
        ], false, [
            'max_tokens' => $maxTokens,
            'timeout' => $timeout,
        ]);

        $plain = trim($plain);
        $plain = trim($plain, " \t\n\r\"'`");
        if ($plain !== '') {
            return $plain;
        }

        $result = $this->chatJson([
            [
                'role' => 'user',
                'content' => "Translate the following hotel concierge chat message from {$from} to {$to}. "
                    ."Keep the meaning, tone and formatting. Return JSON only: {\"translation\": \"...\"}\n\n"
                    ."Message:\n{$text}",
            ],
        ], 'You are a precise translation engine for hotel guest–staff chat. Output JSON only, no markdown.');

        $translation = trim((string) ($result['translation'] ?? ''));
        if ($translation === '') {
            throw new RuntimeException('Překlad je prázdný.');
        }

        return $translation;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function tryDecodeJson(string $content): ?array
    {
        return $this->decodeJsonObject($content);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJsonObject(string $content): ?array
    {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        // Gemma často obalí JSON do ```json ... ```
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $content, $m)) {
            $decoded = json_decode($m[1], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        if (preg_match('/\{.*\}/s', $content, $m)) {
            $decoded = json_decode($m[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    /**
     * Lokální LM Studio (Gemma thinking) často potřebuje 60–120 s.
     */
    private function resolveTimeout(int $configured): int
    {
        if ($this->isLocalLlm()) {
            return max($configured, 120);
        }

        return max(10, $configured);
    }

    /**
     * PHP default max_execution_time=30 zabije Guzzle dřív, než doběhne LM Studio.
     * Každé LLM volání proto prodlouží limit o timeout + rezervu (víc sekvenčních callů).
     */
    private function extendPhpTimeLimit(int $httpTimeoutSeconds): void
    {
        $needed = max(120, $httpTimeoutSeconds + 60);
        if ($this->isLocalLlm()) {
            // Celý concierge pipeline = překlad + bot + případný další překlad.
            $needed = max(600, $needed);
        }

        @ini_set('max_execution_time', (string) $needed);
        @set_time_limit($needed);
    }

    private function isLocalLlm(): bool
    {
        $base = (string) config('openai.base_url', '');
        if ($base === '') {
            return false;
        }

        // Localhost nebo LM Studio na LAN (stejná síť).
        if (str_contains($base, '127.0.0.1') || str_contains($base, 'localhost')) {
            return true;
        }

        $host = parse_url($base, PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            return false;
        }

        return (bool) preg_match(
            '/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/',
            $host
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function httpClientOptions(): array
    {
        $options = [];

        // LAN LM Studio: vynuť IPv4 (někdy PHP/cURL zkusí IPv6 a hned spadne).
        if ($this->isLocalLlm() && defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            $options['curl'] = [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ];
        }

        return $options;
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @return list<array{role: string, content: string}>
     */
    private function withLocalAntiThinkingGuard(array $messages, bool $isLocal): array
    {
        if (! $isLocal || $messages === []) {
            return $messages;
        }

        $guard = 'CRITICAL: Answer immediately with the final reply only. '
            .'Do not write long chain-of-thought. Keep internal reasoning minimal so the answer fits in content.';

        if (($messages[0]['role'] ?? null) === 'system') {
            $messages[0]['content'] = $guard."\n\n".$messages[0]['content'];

            return $messages;
        }

        array_unshift($messages, ['role' => 'system', 'content' => $guard]);

        return $messages;
    }

    /**
     * LM Studio očekává …/v1/chat/completions. Když v .env chybí /v1, doplníme ho.
     */
    private function chatCompletionsUrl(): string
    {
        $base = rtrim((string) config('openai.base_url'), '/');
        if ($base === '') {
            throw new RuntimeException('OPENAI_BASE_URL chybí.');
        }

        if (! str_ends_with($base, '/v1')) {
            // http://127.0.0.1:1234 → http://127.0.0.1:1234/v1
            if (preg_match('#^https?://[^/]+$#', $base)) {
                $base .= '/v1';
            }
        }

        return $base.'/chat/completions';
    }

    /**
     * Když Gemma naplní jen reasoning_content, zkus vytáhnout JSON nebo poslední smysluplný odstavec.
     */
    private function recoverFromReasoning(string $reasoning): ?string
    {
        $reasoning = trim($reasoning);
        if ($reasoning === '') {
            return null;
        }

        if ($this->decodeJsonObject($reasoning) !== null) {
            if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $reasoning, $m)) {
                return trim($m[1]);
            }
            if (preg_match('/\{.*\}/s', $reasoning, $m)) {
                return trim($m[0]);
            }
        }

        // Poslední neprázdný odstavec bez „Thinking“ hlaviček
        $parts = preg_split('/\n{2,}/', $reasoning) ?: [];
        for ($i = count($parts) - 1; $i >= 0; $i--) {
            $p = trim($parts[$i]);
            if ($p === '' || str_starts_with($p, 'Thinking') || preg_match('/^\d+\.\s/', $p)) {
                continue;
            }
            if (mb_strlen($p) >= 2 && mb_strlen($p) <= 600) {
                return $p;
            }
        }

        return null;
    }
}
