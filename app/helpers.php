<?php

/**
 * Vrátí hodnotu z config() jako pole (pro statickou analýzu a bezpečné array_keys).
 *
 * @param  array<string, mixed>  $default
 * @return array<string, mixed>
 */
function config_array(string $key, array $default = []): array
{
    $value = config($key, $default);

    return is_array($value) ? $value : $default;
}
