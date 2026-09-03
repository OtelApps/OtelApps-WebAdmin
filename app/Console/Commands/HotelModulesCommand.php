<?php

namespace App\Console\Commands;

use App\Models\Hotel;
use App\Services\ModuleService;
use Illuminate\Console\Command;

class HotelModulesCommand extends Command
{
    protected $signature = 'hotel:modules
                            {slug : Hotel slug}
                            {--enable= : Čárkou oddělené klíče k zapnutí}
                            {--disable= : Čárkou oddělené klíče k vypnutí}';

    protected $description = 'Vypíše nebo nastaví per-hotel moduly';

    public function handle(): int
    {
        $slug = (string) $this->argument('slug');
        $hotel = Hotel::bySlug($slug);
        if (! $hotel) {
            $this->error("Hotel '{$slug}' nenalezen.");

            return self::FAILURE;
        }

        $enable = $this->csvOption('enable');
        $disable = $this->csvOption('disable');

        if ($enable !== [] || $disable !== []) {
            $patch = [];
            foreach ($enable as $key) {
                $patch[$key] = true;
            }
            foreach ($disable as $key) {
                $patch[$key] = false;
            }
            ModuleService::saveEnabledMap($hotel, $patch);
            $this->info("Moduly hotelu {$hotel->slug} uloženy.");
        }

        $map = ModuleService::enabledMap($hotel->slug);
        foreach ($map as $key => $enabled) {
            $this->line(sprintf('  %s  %s', $enabled ? 'on ' : 'off', $key));
        }

        return self::SUCCESS;
    }

    /**
     * @return list<string>
     */
    private function csvOption(string $name): array
    {
        $raw = $this->option($name);
        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }
}
