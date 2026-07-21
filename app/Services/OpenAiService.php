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
        $timeout = (int) ($options['timeout'] ?? config('openai.timeout', 25));

        $payload = [
            'model' => config('openai.model', 'gpt-4o-mini'),
            'messages' => $messages,
            'temperature' => 0.3,
            'max_tokens' => max(256, $maxTokens),
        ];

        if ($jsonObject) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $url = config('openai.base_url').'/chat/completions';
        $apiKey = (string) (config('openai.api_key') ?: 'lm-studio');

        $response = Http::withToken($apiKey)
            ->timeout(max(10, $timeout))
            ->acceptJson()
            ->post($url, $payload);

        if (! $response->successful()) {
            Log::warning('LLM API error', [
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException('LLM API selhalo (HTTP '.$response->status().').');
        }

        $choice = data_get($response->json(), 'choices.0');
        $message = data_get($choice, 'message', []);
        $content = data_get($message, 'content');
        if (! is_string($content) || trim($content) === '') {
            // Gemma-4 thinking: často naplní reasoning_content a content nechá prázdný při nízkém max_tokens.
            Log::warning('LLM empty content', [
                'finish_reason' => data_get($choice, 'finish_reason'),
                'usage' => data_get($response->json(), 'usage'),
                'reasoning_preview' => mb_substr((string) data_get($message, 'reasoning_content', ''), 0, 200),
            ]);
            throw new RuntimeException(
                'LLM vrátilo prázdnou odpověď (model pravděpodobně spotřeboval tokeny na reasoning — zvyš OPENAI_MAX_TOKENS).'
            );
        }

        return trim($content);
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
}
