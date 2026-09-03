<?php

namespace App\Console\Commands;

use App\Services\HotelProvisionService;
use App\Support\CustomerProfile;
use Illuminate\Console\Command;
use InvalidArgumentException;
use Throwable;

class HotelProvisionCommand extends Command
{
    protected $signature = 'hotel:provision
                            {yml : Cesta k customers/*.yml}';

    protected $description = 'Vytvoří/aktualizuje hotel, profil a moduly z YAML';

    public function handle(HotelProvisionService $provision): int
    {
        try {
            $profile = CustomerProfile::fromFile($this->resolvePath((string) $this->argument('yml')));
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        try {
            $hotel = $provision->provisionFromYaml($profile);
            $this->info("Hotel {$hotel->slug} uložen (moduly + profil).");
        } catch (Throwable $e) {
            $this->error('Provision selhal: '.$e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function resolvePath(string $path): string
    {
        if (is_file($path)) {
            return $path;
        }

        $fromBase = base_path($path);
        if (is_file($fromBase)) {
            return $fromBase;
        }

        return $path;
    }
}
