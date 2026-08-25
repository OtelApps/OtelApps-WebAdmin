<?php

namespace App\Console\Commands;

use App\Services\ConciergeIdleSweepService;
use Illuminate\Console\Command;
use Throwable;

class SweepIdleConciergeConversationsCommand extends Command
{
    protected $signature = 'concierge:sweep-idle';

    protected $description = 'Úklid idle Concierge chatů a auto-uzavření kontroly spokojenosti po 5 min bez odpovědi';

    public function handle(ConciergeIdleSweepService $sweep): int
    {
        try {
            $result = $sweep->sweep();
            $this->info(
                'Smazáno: '.$result['deleted']
                .', archivováno: '.$result['archived']
                .', spokojenost bez odpovědi: '.$result['satisfaction_timed_out'].'.'
            );

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }
}
