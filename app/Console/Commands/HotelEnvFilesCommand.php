<?php

namespace App\Console\Commands;

use App\Services\HotelProvisionService;
use App\Support\CustomerProfile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;

class HotelEnvFilesCommand extends Command
{
    protected $signature = 'hotel:env-files
                            {yml : Cesta k customers/*.yml}
                            {--out= : Výstupní adresář (default storage/app/customers/{slug})}';

    protected $description = 'Vygeneruje webadmin/hostweb/mobile env šablony bez secretů';

    public function handle(HotelProvisionService $provision): int
    {
        try {
            $profile = CustomerProfile::fromFile($this->resolvePath((string) $this->argument('yml')));
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $out = (string) ($this->option('out') ?: storage_path('app/customers/'.$profile->slug()));
        File::ensureDirectoryExists($out);

        $templates = $provision->envTemplatesFromCustomer($profile);
        File::put($out.'/webadmin.env', $templates['webadmin']);
        File::put($out.'/hostweb.env', $templates['hostweb']);
        File::put($out.'/mobile.env', $templates['mobile']);

        $this->info("Env šablony: {$out}");
        if ($profile->adminEmail() !== '') {
            $this->line('Staff e-mail (vytvoř ručně): '.$profile->adminEmail());
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
