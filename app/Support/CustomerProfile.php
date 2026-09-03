<?php

namespace App\Support;

use InvalidArgumentException;
use Symfony\Component\Yaml\Yaml;

class CustomerProfile
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(public readonly array $data) {}

    public static function fromFile(string $path): self
    {
        if (! is_file($path)) {
            throw new InvalidArgumentException("Soubor profilu neexistuje: {$path}");
        }

        $parsed = Yaml::parseFile($path);
        if (! is_array($parsed)) {
            throw new InvalidArgumentException("Profil musí být YAML mapa: {$path}");
        }

        return new self($parsed);
    }

    public function slug(): string
    {
        $slug = trim((string) ($this->data['slug'] ?? ''));
        if ($slug === '' || ! preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            throw new InvalidArgumentException('Profil musí mít platný slug (a-z, 0-9, pomlčky).');
        }

        return $slug;
    }

    public function name(): string
    {
        $name = trim((string) ($this->data['name'] ?? ''));
        if ($name === '') {
            throw new InvalidArgumentException('Profil musí mít name.');
        }

        return $name;
    }

    /**
     * @return array<string, bool>
     */
    public function modules(): array
    {
        $raw = $this->data['modules'] ?? [];
        if (! is_array($raw)) {
            return [];
        }

        $out = [];
        foreach ($raw as $key => $value) {
            if (! is_string($key) || $key === '') {
                continue;
            }
            $out[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        return $out;
    }

    public function adminUrl(): string
    {
        $url = trim((string) data_get($this->data, 'domains.admin', ''));

        return rtrim($url, '/');
    }

    public function webUrl(): string
    {
        $url = trim((string) data_get($this->data, 'domains.web', ''));

        return rtrim($url, '/');
    }

    public function appName(): string
    {
        $brand = trim((string) data_get($this->data, 'brand.app_name', ''));

        return $brand !== '' ? $brand : $this->name();
    }

    public function lat(): string
    {
        return (string) (data_get($this->data, 'geo.lat') ?? '50.0875');
    }

    public function lng(): string
    {
        return (string) (data_get($this->data, 'geo.lng') ?? '14.4213');
    }

    public function appStoreUrl(): string
    {
        return trim((string) data_get($this->data, 'stores.app_store', ''));
    }

    public function playStoreUrl(): string
    {
        return trim((string) data_get($this->data, 'stores.play_store', ''));
    }

    public function adminEmail(): string
    {
        return trim((string) data_get($this->data, 'staff.admin_email', ''));
    }
}
