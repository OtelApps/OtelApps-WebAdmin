<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OpenAI-compatible API (OpenAI cloud nebo LM Studio / Ollama)
    |--------------------------------------------------------------------------
    |
    | LM Studio: OPENAI_BASE_URL=http://127.0.0.1:1234/v1
    |           OPENAI_API_KEY=lm-studio
    |           OPENAI_MODEL=google/gemma-4-e4b
    |
    */

    'api_key' => env('OPENAI_API_KEY', 'lm-studio'),

    'base_url' => rtrim(env('OPENAI_BASE_URL', 'https://api.openai.com/v1'), '/'),

    'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),

    'timeout' => (int) env('OPENAI_TIMEOUT', 25),

    /** Delší překlady (staff → host) běží afterResponse — můžou čekat déle. */
    'translate_timeout' => (int) env('OPENAI_TRANSLATE_TIMEOUT', 90),

    'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 768),

    /*
    | Některé lokální modely (Gemma) neumí response_format=json_object.
    | Pro LM Studio nech false — JSON vynutíme promptem.
    */
    'json_mode' => filter_var(env('OPENAI_JSON_MODE', false), FILTER_VALIDATE_BOOL),

    'bot_display_name' => env('CONCIERGE_BOT_NAME', 'Concierge AI'),

];
