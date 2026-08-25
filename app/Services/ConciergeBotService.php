<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelConciergeCaseSummary;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Models\HotelCrmGuestProfile;
use App\Models\HotelInfoTopic;
use App\Models\HotelPlace;
use App\Models\HotelServiceRequest;
use App\Models\Venue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ConciergeBotService
{
    public const MODE_BOT = 'bot';

    /** Host požádal o živou recepci — AI už neodpovídá, čeká se na převzetí. */
    public const MODE_WAITING = 'waiting';

    public const MODE_STAFF = 'staff';

    /** Systémová zpráva viditelná jen hostovi (ne v admin Concierge). */
    public const GUEST_ONLY_NOTICE_MARKER = '__guest_only__';

    /** Systémová zpráva jen pro recepci (host ji v appce neuvidí). */
    public const STAFF_ONLY_NOTICE_MARKER = '__staff_only__';

    /** Kontrola spokojenosti: Ano → shrnutí + smazání chatu, Ne → pokračovat. */
    public const SATISFACTION_CHECK_MARKER = '__satisfaction_check__';

    private const SATISFACTION_PROMPTS = [
        'cs' => 'Byla vaše otázka zodpovězena? Potřebujete další asistenci?',
        'en' => 'Was your question answered? Do you need further assistance?',
        'de' => 'Wurde Ihre Frage beantwortet? Benötigen Sie weitere Hilfe?',
        'fr' => 'Votre question a-t-elle été résolue ? Avez-vous besoin d’une aide supplémentaire ?',
        'pl' => 'Czy Państwa pytanie zostało wyjaśnione? Potrzebują Państwo dalszej pomocy?',
    ];

    private const SATISFACTION_YES = [
        'cs' => 'Ano',
        'en' => 'Yes',
        'de' => 'Ja',
        'fr' => 'Oui',
        'pl' => 'Tak',
    ];

    private const SATISFACTION_NO = [
        'cs' => 'Ne',
        'en' => 'No',
        'de' => 'Nein',
        'fr' => 'Non',
        'pl' => 'Nie',
    ];

    private const SATISFACTION_THANKS = [
        'cs' => 'Děkujeme. Chat je uzavřený. Přejeme příjemný pobyt.',
        'en' => 'Thank you. This chat is now closed. We wish you a pleasant stay.',
        'de' => 'Vielen Dank. Dieser Chat ist geschlossen. Wir wünschen Ihnen einen angenehmen Aufenthalt.',
        'fr' => 'Merci. Cette conversation est fermée. Nous vous souhaitons un agréable séjour.',
        'pl' => 'Dziękujemy. Czat został zamknięty. Życzymy miłego pobytu.',
    ];

    private const SATISFACTION_CONTINUE = [
        'cs' => 'Rozumíme — recepce se vám brzy ozve.',
        'en' => 'Understood — reception will get back to you shortly.',
        'de' => 'Verstanden — die Rezeption meldet sich in Kürze bei Ihnen.',
        'fr' => 'Compris — la réception vous répondra bientôt.',
        'pl' => 'Rozumiemy — recepcja wkrótce się odezwie.',
    ];

    public function __construct(
        private readonly OpenAiService $openAi,
    ) {}

    public static function isGuestOnlyNotice(?HotelConciergeMessage $message): bool
    {
        return $message !== null
            && $message->sender_type === 'system'
            && $message->staff_display_name === self::GUEST_ONLY_NOTICE_MARKER;
    }

    public static function isStaffOnlyNotice(?HotelConciergeMessage $message): bool
    {
        return $message !== null
            && $message->sender_type === 'system'
            && $message->staff_display_name === self::STAFF_ONLY_NOTICE_MARKER;
    }

    public static function isSatisfactionCheck(?HotelConciergeMessage $message): bool
    {
        if ($message === null || $message->sender_type !== 'system') {
            return false;
        }

        $marker = (string) ($message->staff_display_name ?? '');

        return $marker === self::SATISFACTION_CHECK_MARKER
            || str_starts_with($marker, self::SATISFACTION_CHECK_MARKER.':');
    }

    public static function satisfactionAnswer(?HotelConciergeMessage $message): ?string
    {
        if (! self::isSatisfactionCheck($message)) {
            return null;
        }

        $marker = (string) $message->staff_display_name;
        if ($marker === self::SATISFACTION_CHECK_MARKER) {
            return null;
        }

        $answer = substr($marker, strlen(self::SATISFACTION_CHECK_MARKER) + 1);

        return in_array($answer, ['yes', 'no'], true) ? $answer : null;
    }

    public static function satisfactionLabels(string $locale): array
    {
        if (! isset(self::SATISFACTION_YES[$locale])) {
            $locale = 'en';
        }

        return [
            'yes' => self::SATISFACTION_YES[$locale],
            'no' => self::SATISFACTION_NO[$locale],
        ];
    }

    public function conversationMode(HotelConciergeConversation $conversation): string
    {
        $mode = data_get($conversation->metadata, 'mode');

        if ($mode === self::MODE_STAFF) {
            return self::MODE_STAFF;
        }

        if ($mode === self::MODE_WAITING) {
            return self::MODE_WAITING;
        }

        return self::MODE_BOT;
    }

    public static function needsStaffAttention(?string $mode): bool
    {
        return in_array($mode, [self::MODE_STAFF, self::MODE_WAITING], true);
    }

    public function ensureDefaultMetadata(HotelConciergeConversation $conversation): void
    {
        $metadata = $conversation->metadata ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }

        if (! isset($metadata['mode'])) {
            $metadata['mode'] = self::MODE_BOT;
            $conversation->update(['metadata' => $metadata]);
            $conversation->refresh();
        }
    }

    /**
     * Zpracuje novou zprávu hosta: bot odpověď, nebo překlad pro recepci.
     */
    public function handleGuestMessage(HotelConciergeConversation $conversation, HotelConciergeMessage $message): void
    {
        if ($message->sender_type !== 'guest') {
            return;
        }

        // Bot + 1–2 překlady přes LM Studio snadno přesáhne PHP default 30 s.
        @ini_set('max_execution_time', '600');
        @set_time_limit(600);

        // Jazyk z aktuální zprávy / UI výběru přepiš na konverzaci (ensure dřív locale neaktualizovalo).
        $messageLocale = $message->locale ?: null;
        if ($messageLocale && in_array($messageLocale, ['cs', 'en', 'de', 'fr', 'pl'], true)
            && $conversation->guest_locale !== $messageLocale) {
            $conversation->update(['guest_locale' => $messageLocale]);
            $conversation->refresh();
        }

        $this->ensureDefaultMetadata($conversation);
        $mode = $this->conversationMode($conversation);

        // Waiting / staff: jen překlad host → CS, žádný AI bot.
        if ($mode === self::MODE_WAITING || $mode === self::MODE_STAFF) {
            $this->translateGuestMessageForStaff($conversation, $message);

            return;
        }

        // Idempotent: už máme novější bot/staff odpověď po této zprávě.
        // Překlad host → CS ale stejně doplň (admin UI / retry po timeoutu).
        if ($this->hasReplyAfter($conversation, $message)) {
            $this->translateGuestMessageForStaff($conversation, $message);

            return;
        }

        // Jeden guest message = max jedna bot odpověď (on-message + ensure-reply + show race).
        $lock = Cache::lock('concierge-reply:'.$message->id, 300);
        if (! $lock->get()) {
            Log::info('Concierge bot: přeskočeno — jiný proces už odpovídá', [
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
            ]);

            return;
        }

        try {
            // Po čekání na lock znovu — první proces už mohl uložit odpověď.
            if ($this->hasReplyAfter($conversation->fresh(), $message)) {
                $this->translateGuestMessageForStaff($conversation, $message);

                return;
            }

            // AI chaty nebudí staff přes unread badge, ale jednorázově oznámí start.
            if ((int) $conversation->unread_staff_count > 0) {
                $conversation->update(['unread_staff_count' => 0]);
                $conversation->refresh();
            }

            $this->notifyAdminBotStarted($conversation);

            if ($this->guestRequestsHuman($message->body)) {
                $this->translateGuestMessageForStaff($conversation, $message);
                $this->escalateToStaff($conversation, 'guest_request');

                return;
            }

            if (! $this->openAi->isConfigured()) {
                Log::warning('Concierge bot: OPENAI_API_KEY chybí, eskaluji na recepci.');
                $this->escalateToStaff($conversation, 'openai_missing');

                return;
            }

            // Nejdřív překlad host → CS (admin UI ASAP), teprve potom bot reply.
            // translateGuestMessageForStaff je idempotentní — pokud už je hotový, ihned return.
            $this->translateGuestMessageForStaff($conversation, $message);

            try {
                $this->replyAsBot($conversation, $message);
            } catch (Throwable $e) {
                Log::error('Concierge bot selhal', [
                    'conversation_id' => $conversation->id,
                    'message' => $e->getMessage(),
                ]);

                // Transientní DB / timeout LLM — zkus ještě jednou, ať neeskalujeme zbytečně.
                if ($this->isLlmUnreachable($e)) {
                    Log::warning('Concierge bot: LM Studio nedostupné — nechávám bot mode pro retry', [
                        'conversation_id' => $conversation->id,
                        'base_url' => config('openai.base_url'),
                        'message' => $e->getMessage(),
                    ]);
                    $this->notifyLlmOffline($conversation);

                    return;
                }

                if ($this->isTransientDbError($e) || $this->isLlmTimeout($e)) {
                    try {
                        usleep(300_000);
                        if ($this->isTransientDbError($e)) {
                            DB::connection(config('otelapps.db_connection'))->reconnect();
                        }
                        if ($this->hasReplyAfter($conversation->fresh(), $message)) {
                            return;
                        }
                        $this->replyAsBot($conversation, $message);

                        return;
                    } catch (Throwable $retry) {
                        Log::error('Concierge bot retry selhal', [
                            'conversation_id' => $conversation->id,
                            'message' => $retry->getMessage(),
                        ]);
                        if ($this->isLlmUnreachable($retry)) {
                            $this->notifyLlmOffline($conversation);

                            return;
                        }
                    }
                }

                $this->escalateToStaff($conversation, 'bot_error');
            } finally {
                // Pojistka: kdyby překlad před reply selhal / race, doplň ho teď.
                $message->refresh();
                $this->translateGuestMessageForStaff($conversation, $message);
            }
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * Pokud poslední zpráva je od hosta bez odpovědi, zpracuj ji (fallback když
     * mobilní notify k Laravelu selhalo — např. restart artisan serve).
     */
    public function ensurePendingReply(HotelConciergeConversation $conversation): bool
    {
        $this->ensureDefaultMetadata($conversation);
        $mode = $this->conversationMode($conversation);

        // Waiting/staff: vždy doplň chybějící překlady host → CS (i když už staff odpověděl).
        if ($mode === self::MODE_WAITING || $mode === self::MODE_STAFF) {
            return $this->ensureGuestTranslationsForStaff($conversation) > 0;
        }

        // Bot mode: doplň chybějící CS překlady hosta (admin UI), i když už bot odpověděl.
        $translated = $this->ensureGuestTranslationsForStaff($conversation);

        $last = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        if (! $last || $last->sender_type !== 'guest') {
            return $translated > 0;
        }

        if ($this->hasReplyAfter($conversation, $last)) {
            return $translated > 0;
        }

        $this->handleGuestMessage($conversation->fresh(), $last);

        return true;
    }

    /**
     * Doplní CS překlady u hostovských zpráv (pro admin panel).
     */
    public function ensureGuestTranslationsForStaff(HotelConciergeConversation $conversation, int $limit = 15): int
    {
        if (($conversation->guest_locale ?: 'cs') === 'cs') {
            return 0;
        }

        $messages = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'guest')
            ->where(function ($q) {
                $q->whereNull('body_translated')
                    ->orWhere('body_translated', '');
            })
            ->orderByDesc('created_at')
            ->limit(max(1, $limit))
            ->get()
            ->sortBy('created_at')
            ->values();

        $done = 0;
        foreach ($messages as $message) {
            $this->translateGuestMessageForStaff($conversation, $message);
            $message->refresh();
            if (filled($message->body_translated)) {
                $done++;
            }
        }

        return $done;
    }

    private function hasReplyAfter(HotelConciergeConversation $conversation, HotelConciergeMessage $guestMessage): bool
    {
        // Jen bot/staff = skutečná odpověď. System noticely (escalate, satisfaction)
        // by jinak zablokovaly retry bota navždy.
        return HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->whereIn('sender_type', ['bot', 'staff'])
            ->where('created_at', '>=', $guestMessage->created_at)
            ->where('id', '!=', $guestMessage->id)
            ->exists();
    }

    public function escalateToStaff(HotelConciergeConversation $conversation, string $reason = 'guest_request'): void
    {
        $this->ensureDefaultMetadata($conversation);

        $current = $this->conversationMode($conversation);
        $isTakeOver = $reason === 'staff_takeover';

        if ($current === self::MODE_STAFF) {
            return;
        }

        // Host už čeká na recepci — další guest escalate nic nemění.
        if (! $isTakeOver && $current === self::MODE_WAITING) {
            return;
        }

        $locale = $conversation->guest_locale ?: 'cs';
        $guestNotice = $this->escalationNoticeForGuest($locale, $reason);
        $staffNoticeCs = $this->escalationNoticeForStaff($reason);

        $metadata = $conversation->metadata ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }

        // Guest / bot handoff → waiting; manuální převzetí → aktivní staff.
        $metadata['mode'] = $isTakeOver ? self::MODE_STAFF : self::MODE_WAITING;
        $metadata['escalated_at'] = now()->toIso8601String();
        $metadata['escalation_reason'] = $reason;
        if ($isTakeOver) {
            $metadata['taken_over_at'] = now()->toIso8601String();
        }

        // Nejdřív mode (ať další host zpráva nespustí bota znovu), pak notifikace.
        if ($isTakeOver) {
            $conversation->update([
                'metadata' => $metadata,
                'last_message_preview' => 'Převzato živou obsluhou',
            ]);

            HotelConciergeMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'system',
                'body' => $guestNotice,
                'body_original' => $guestNotice,
                'body_translated' => $guestNotice,
                'locale' => $locale,
                'staff_display_name' => self::GUEST_ONLY_NOTICE_MARKER,
                'created_at' => now(),
            ]);
        } else {
            $conversation->update([
                'metadata' => $metadata,
                'unread_staff_count' => max(1, (int) $conversation->unread_staff_count),
            ]);

            HotelConciergeMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'system',
                'body' => $staffNoticeCs,
                'body_original' => $staffNoticeCs,
                'body_translated' => $guestNotice,
                'locale' => 'cs',
                'staff_display_name' => null,
                'created_at' => now(),
            ]);

            $this->notifyAdminWaiting($conversation);
        }

        $conversation->refresh();

        if ($isTakeOver) {
            $this->pushGuestConcierge(
                $conversation,
                $guestNotice,
                'staff',
            );
        }
    }

    /** Recepce aktivně přebírá chat (z bot nebo waiting). */
    public function takeOverByStaff(HotelConciergeConversation $conversation): void
    {
        $this->escalateToStaff($conversation, 'staff_takeover');
    }

    private function notifyAdminBotStarted(HotelConciergeConversation $conversation): void
    {
        $metadata = $conversation->metadata ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }
        if (! empty($metadata['admin_notified_bot_start'])) {
            return;
        }

        $metadata['admin_notified_bot_start'] = now()->toIso8601String();
        $conversation->update(['metadata' => $metadata]);
        $conversation->refresh();

        try {
            app(NotificationService::class)->upsertConciergeAdminNotice($conversation, 'bot_started');
        } catch (Throwable $e) {
            Log::warning('Concierge admin notify bot_started failed', ['message' => $e->getMessage()]);
        }
    }

    private function notifyAdminWaiting(HotelConciergeConversation $conversation): void
    {
        try {
            app(NotificationService::class)->upsertConciergeAdminNotice($conversation, 'waiting');
        } catch (Throwable $e) {
            Log::warning('Concierge admin notify waiting failed', ['message' => $e->getMessage()]);
        }
    }

    public function pushGuestConcierge(
        HotelConciergeConversation $conversation,
        string $preview,
        string $from = 'bot',
    ): void {
        $guestExternalId = trim((string) $conversation->guest_external_id);
        if ($guestExternalId === '') {
            return;
        }

        $hotel = Hotel::query()->find($conversation->hotel_id);
        if (! $hotel) {
            return;
        }

        try {
            app(GuestPushService::class)->sendConciergeMessage(
                $hotel,
                $guestExternalId,
                (string) $conversation->id,
                $preview,
                $from,
            );
        } catch (Throwable $e) {
            Log::warning('Concierge guest push failed', ['message' => $e->getMessage()]);
        }
    }

    /**
     * Pošle předdefinovanou kontrolu spokojenosti (CS + překlad do jazyka hosta).
     *
     * @return HotelConciergeMessage
     */
    public function sendSatisfactionCheck(HotelConciergeConversation $conversation): HotelConciergeMessage
    {
        if ($conversation->status !== 'open') {
            throw new \RuntimeException('Konverzace není otevřená.');
        }

        $mode = $this->conversationMode($conversation);
        if ($mode === self::MODE_BOT) {
            throw new \RuntimeException('Nejdřív převeď kontrolu na sebe — v AI módu kontrolu neposílej.');
        }

        $pending = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'system')
            ->where('staff_display_name', self::SATISFACTION_CHECK_MARKER)
            ->exists();

        if ($pending) {
            throw new \RuntimeException('Už čekáš na odpověď hosta na předchozí kontrolu.');
        }

        $guestLocale = $conversation->guest_locale ?: 'cs';
        if (! isset(self::SATISFACTION_PROMPTS[$guestLocale])) {
            $guestLocale = 'en';
        }

        $bodyCs = self::SATISFACTION_PROMPTS['cs'];
        $bodyGuest = self::SATISFACTION_PROMPTS[$guestLocale];

        $message = HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'body' => $bodyCs,
            'body_original' => $bodyCs,
            'body_translated' => $guestLocale === 'cs' ? null : $bodyGuest,
            'locale' => 'cs',
            'staff_display_name' => self::SATISFACTION_CHECK_MARKER,
            'created_at' => now(),
        ]);

        $conversation->update([
            'unread_guest_count' => max(1, (int) $conversation->unread_guest_count + 1),
            'last_message_preview' => mb_substr($bodyCs, 0, 200),
            'last_message_at' => now(),
        ]);

        $metadata = $conversation->metadata ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }
        $metadata['satisfaction_check'] = [
            'message_id' => $message->id,
            'answer' => null,
            'sent_at' => now()->toIso8601String(),
        ];
        $conversation->update(['metadata' => $metadata]);
        $conversation->refresh();

        Log::info('Concierge: odeslána kontrola spokojenosti', [
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
            'guest_locale' => $guestLocale,
        ]);

        return $message;
    }

    /**
     * Host odpověděl Ano/Ne na kontrolu spokojenosti.
     *
     * @param  'yes'|'no'  $answer
     * @return array{status: string, summary?: array{id: string, summary: string}|null}
     */
    public function answerSatisfactionCheck(
        HotelConciergeConversation $conversation,
        HotelConciergeMessage $checkMessage,
        string $answer,
    ): array {
        if (! self::isSatisfactionCheck($checkMessage)) {
            throw new \RuntimeException('Zpráva není kontrola spokojenosti.');
        }

        if (self::satisfactionAnswer($checkMessage) !== null) {
            return [
                'status' => $conversation->status ?: 'open',
                'summary' => null,
            ];
        }

        if (! in_array($answer, ['yes', 'no'], true)) {
            throw new \InvalidArgumentException('Neplatná odpověď.');
        }

        $guestLocale = $conversation->guest_locale ?: 'cs';
        if (! isset(self::SATISFACTION_PROMPTS[$guestLocale])) {
            $guestLocale = 'en';
        }

        $checkMessage->update([
            'staff_display_name' => self::SATISFACTION_CHECK_MARKER.':'.$answer,
        ]);

        if ($answer === 'yes') {
            return $this->resolveAndDeleteConversation($conversation, $guestLocale);
        }

        $continue = self::SATISFACTION_CONTINUE[$guestLocale] ?? self::SATISFACTION_CONTINUE['en'];
        $continueCs = self::SATISFACTION_CONTINUE['cs'];

        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'body' => $continueCs,
            'body_original' => $continueCs,
            'body_translated' => $guestLocale === 'cs' ? null : $continue,
            'locale' => 'cs',
            'staff_display_name' => self::GUEST_ONLY_NOTICE_MARKER,
            'created_at' => now(),
        ]);

        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'body' => 'Host potřebuje další asistenci (odpověď Ne na kontrolu spokojenosti).',
            'body_original' => 'Host potřebuje další asistenci (odpověď Ne na kontrolu spokojenosti).',
            'body_translated' => null,
            'locale' => 'cs',
            'staff_display_name' => self::STAFF_ONLY_NOTICE_MARKER,
            'created_at' => now(),
        ]);

        $metadata = $conversation->metadata ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }
        $metadata['satisfaction_check'] = [
            'message_id' => $checkMessage->id,
            'answer' => $answer,
            'answered_at' => now()->toIso8601String(),
        ];
        $metadata['mode'] = self::MODE_WAITING;
        $metadata['escalated_at'] = now()->toIso8601String();
        $metadata['escalation_reason'] = 'satisfaction_no';

        $conversation->update([
            'status' => 'open',
            'metadata' => $metadata,
            'unread_staff_count' => max(1, (int) $conversation->unread_staff_count + 1),
            'last_message_preview' => 'Host potřebuje další asistenci',
            'last_message_at' => now(),
        ]);

        $conversation->refresh();

        Log::info('Concierge: odpověď na kontrolu spokojenosti', [
            'conversation_id' => $conversation->id,
            'answer' => $answer,
        ]);

        return ['status' => 'open', 'summary' => null];
    }

    /**
     * Kontrola spokojenosti bez odpovědi hosta → stejné jako „Ano“ (chat se uzavře).
     */
    public function timeoutUnansweredSatisfactionChecks(int $afterMinutes = 5): int
    {
        $cutoff = now()->subMinutes($afterMinutes);

        $pending = HotelConciergeMessage::query()
            ->where('sender_type', 'system')
            ->where('staff_display_name', self::SATISFACTION_CHECK_MARKER)
            ->where('created_at', '<=', $cutoff)
            ->get();

        $resolved = 0;
        foreach ($pending as $message) {
            $conversation = HotelConciergeConversation::query()->find($message->conversation_id);
            if (! $conversation) {
                continue;
            }

            try {
                $conversationId = (string) $conversation->id;
                $this->answerSatisfactionCheck($conversation, $message, 'yes');
                $resolved++;
                Log::info('Concierge: kontrola spokojenosti vypršela, chat uzavřen', [
                    'conversation_id' => $conversationId,
                    'message_id' => $message->id,
                ]);
            } catch (Throwable $e) {
                Log::warning('Concierge: auto-uzavření kontroly spokojenosti selhalo', [
                    'conversation_id' => $message->conversation_id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $resolved;
    }

    public static function hasPendingSatisfaction(HotelConciergeConversation $conversation): bool
    {
        return HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'system')
            ->where('staff_display_name', self::SATISFACTION_CHECK_MARKER)
            ->exists();
    }

    /**
     * Heslovité shrnutí → kartička historie → smazání celého chatu.
     *
     * @return array{status: string, summary: array{id: string, summary: string}}
     */
    private function resolveAndDeleteConversation(
        HotelConciergeConversation $conversation,
        string $guestLocale,
    ): array {
        $summaries = $this->buildCaseSummaries($conversation, $guestLocale);

        $row = HotelConciergeCaseSummary::create([
            'hotel_id' => $conversation->hotel_id,
            'guest_external_id' => $conversation->guest_external_id,
            'guest_locale' => $guestLocale,
            'summary' => $summaries['guest'],
            'summary_cs' => $summaries['cs'],
            'room_number' => $conversation->room_number,
            'resolved_at' => now(),
            'created_at' => now(),
        ]);

        $conversationId = (string) $conversation->id;
        $conversation->delete(); // cascade messages

        Log::info('Concierge: chat vyřešen a smazán', [
            'conversation_id' => $conversationId,
            'summary_id' => $row->id,
            'summary' => $summaries['guest'],
        ]);

        return [
            'status' => 'deleted',
            'summary' => [
                'id' => (string) $row->id,
                'summary' => $summaries['guest'],
            ],
        ];
    }

    /**
     * @return array{guest: string, cs: string}
     */
    private function buildCaseSummaries(
        HotelConciergeConversation $conversation,
        string $guestLocale,
    ): array {
        // Bez LLM — satisfaction „Ano“ musí být okamžité (jinak artisan serve + Expo: Network request failed).
        $guestBodies = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'guest')
            ->orderBy('created_at')
            ->limit(6)
            ->pluck('body')
            ->filter(fn ($b) => filled(trim((string) $b)))
            ->values()
            ->all();

        $fallbackGuest = $guestBodies[0] ?? 'Concierge chat';
        $fallbackGuest = mb_substr(trim(preg_replace('/\s+/u', ' ', $fallbackGuest) ?? $fallbackGuest), 0, 90);

        $csBodies = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'guest')
            ->whereNotNull('body_translated')
            ->where('body_translated', '!=', '')
            ->orderBy('created_at')
            ->limit(1)
            ->value('body_translated');

        $fallbackCs = filled($csBodies)
            ? mb_substr(trim(preg_replace('/\s+/u', ' ', (string) $csBodies) ?? (string) $csBodies), 0, 90)
            : ($guestLocale === 'cs' ? $fallbackGuest : $fallbackGuest);

        return ['guest' => $fallbackGuest, 'cs' => $fallbackCs];
    }

    public function translateStaffReply(HotelConciergeConversation $conversation, string $czechBody): ?string
    {
        $guestLocale = $conversation->guest_locale ?: 'cs';
        if ($guestLocale === 'cs' || ! $this->openAi->isConfigured()) {
            return null;
        }

        try {
            return $this->openAi->translate($czechBody, 'cs', $guestLocale);
        } catch (Throwable $e) {
            Log::warning('Překlad staff → host selhal', ['message' => $e->getMessage()]);

            return null;
        }
    }

    /** Doplní chybějící překlady staff/bot → jazyk hosta (po timeoutu / dlouhých zprávách). */
    public function ensureStaffTranslationsForGuest(HotelConciergeConversation $conversation, int $limit = 10): int
    {
        $guestLocale = $conversation->guest_locale ?: 'cs';
        if ($guestLocale === 'cs' || ! $this->openAi->isConfigured()) {
            return 0;
        }

        $messages = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->whereIn('sender_type', ['staff', 'bot'])
            ->where(function ($q) {
                $q->whereNull('body_translated')
                    ->orWhere('body_translated', '');
            })
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        $done = 0;
        foreach ($messages as $message) {
            $translated = $this->translateStaffReply($conversation, $message->body);
            if (! filled($translated)) {
                continue;
            }
            $wasPending = ! filled($message->body_translated);
            $message->update([
                'body_original' => $message->body_original ?: $message->body,
                'body_translated' => $translated,
            ]);
            $done++;
            Log::info('Concierge: přeloženo staff → host', [
                'message_id' => $message->id,
                'to' => $guestLocale,
                'chars' => mb_strlen($translated),
            ]);
            if ($wasPending) {
                $this->pushGuestConcierge($conversation, $translated, $message->sender_type === 'bot' ? 'bot' : 'staff');
            }
        }

        return $done;
    }

    private function translateGuestMessageForStaff(
        HotelConciergeConversation $conversation,
        HotelConciergeMessage $message,
    ): void {
        // Preferuj jazyk vybraný v appce (konverzace) — locale u zprávy bývá občas špatně.
        $guestLocale = $conversation->guest_locale ?: ($message->locale ?: 'cs');
        if (! in_array($guestLocale, ['cs', 'en', 'de', 'fr', 'pl'], true)) {
            $guestLocale = 'en';
        }
        if ($guestLocale === 'cs' || ! $this->openAi->isConfigured()) {
            return;
        }

        if (filled($message->body_translated)) {
            return;
        }

        try {
            $translated = $this->openAi->translate($message->body, $guestLocale, 'cs');
            $message->update([
                'body_original' => $message->body_original ?: $message->body,
                'body_translated' => $translated,
            ]);

            // Sidebar preview jinak zůstane v jazyku hosta (SQL trigger bere body).
            $isLatest = ! HotelConciergeMessage::query()
                ->where('conversation_id', $conversation->id)
                ->where('created_at', '>', $message->created_at)
                ->exists();
            if ($isLatest) {
                $conversation->update([
                    'last_message_preview' => mb_substr($translated, 0, 200),
                ]);
            }

            Log::info('Concierge: přeloženo guest → CS', [
                'message_id' => $message->id,
                'from' => $guestLocale,
                'chars' => mb_strlen($translated),
            ]);
        } catch (Throwable $e) {
            Log::warning('Překlad guest → staff selhal', [
                'message_id' => $message->id,
                'from' => $guestLocale,
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function replyAsBot(HotelConciergeConversation $conversation, HotelConciergeMessage $message): void
    {
        $hotel = Hotel::query()->find($conversation->hotel_id);
        $guestLocale = $message->locale ?: ($conversation->guest_locale ?: 'cs');
        $languageName = $this->localeLabel($guestLocale);
        $guestContext = $this->buildGuestContext($conversation, $hotel);
        $actionCatalog = $this->buildActionCatalog($hotel);
        $appContext = $this->buildAppCapabilities($actionCatalog);
        $hotelContext = $this->buildHotelContext($hotel);
        $history = $this->buildChatHistory($conversation);

        $system = <<<PROMPT
You are a hotel concierge chatbot for "{$hotel?->name}".
Answer immediately. Do NOT write chain-of-thought or step-by-step analysis — output the final answer only.
CRITICAL: The guest language is {$languageName} (code: {$guestLocale}).
The field "reply" MUST be written entirely in {$languageName}.
The field "reply_cs" MUST be the same meaning in Czech for hotel staff.
Keep answers to 1–3 short sentences. Be practical and personal using GUEST CONTEXT when relevant (name, room, stay, VIP).
Prefer guiding the guest to the hotel app features listed below when that solves the request (room service, requests, map, menus, etc.).
When the guest asks about wines, drinks, food menus, room service, requests, map, or similar app sections, include interactive actions from AVAILABLE ACTIONS (1–3 ids) plus a short card title/subtitle in {$languageName}.
Never invent action ids — only use ids from AVAILABLE ACTIONS.
Never invent prices, opening hours, menu items, or stay details that are not in the context.
Escalate to staff (escalate=true) for: billing/folio disputes, medical emergencies, serious complaints, security, or when you lack reliable info.
Do not mention internal notes, CRM, or staff-only data explicitly — use them only to tailor the answer.

Return ONLY JSON (no markdown fences):
{"reply":"...in {$languageName}...","reply_cs":"...in Czech...","escalate":false,"escalate_reason":null,"card":{"title":"...","subtitle":"..."}|null,"actions":[{"id":"action_id","label":"...optional..."}]}
If no buttons are useful, set "card":null and "actions":[].
If you cannot output JSON, write the guest-facing answer in {$languageName} only (plain text).

{$guestContext}

{$appContext}

HOTEL KNOWLEDGE:
{$hotelContext}
PROMPT;

        $userContent = "Guest message ({$languageName}):\n".$message->body;

        $raw = $this->openAi->chat([
            ['role' => 'system', 'content' => $system],
            ...$history,
            ['role' => 'user', 'content' => $userContent],
        ], false, [
            'max_tokens' => (int) config('openai.bot_max_tokens', 768),
            'timeout' => (int) config('openai.timeout', 120),
        ]);

        $result = $this->openAi->tryDecodeJson($raw);

        if ($result === null) {
            Log::info('Concierge bot: plain-text odpověď (bez JSON)', [
                'preview' => mb_substr($raw, 0, 160),
                'guest_locale' => $guestLocale,
            ]);
            $plain = trim($raw);
            if ($plain === '') {
                $this->escalateToStaff($conversation, 'empty_bot_reply');

                return;
            }

            [$replyGuest, $replyCs] = $this->normalizeBotReplies($plain, null, $guestLocale);
            $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale, $message);
            $conversation->update(['unread_staff_count' => 0]);
            Log::info('Concierge bot: uložena plain-text odpověď', [
                'conversation_id' => $conversation->id,
                'guest_locale' => $guestLocale,
                'chars' => mb_strlen($replyGuest),
            ]);

            return;
        }

        $escalate = (bool) ($result['escalate'] ?? false);
        $reply = trim((string) ($result['reply'] ?? ''));
        $replyCsField = trim((string) ($result['reply_cs'] ?? ''));
        $payload = $this->buildMessagePayloadFromLlm($result, $actionCatalog);

        if ($escalate) {
            $this->escalateToStaff(
                $conversation,
                (string) ($result['escalate_reason'] ?? 'bot_handoff'),
            );

            if ($reply !== '' || $replyCsField !== '') {
                [$replyGuest, $replyCs] = $this->normalizeBotReplies(
                    $reply !== '' ? $reply : $replyCsField,
                    $replyCsField !== '' ? $replyCsField : null,
                    $guestLocale,
                );
                $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale, $message, $payload);
            }

            return;
        }

        if ($reply === '' && $replyCsField === '') {
            $plain = trim($raw);
            if ($plain !== '' && ! str_contains($plain, '{')) {
                [$replyGuest, $replyCs] = $this->normalizeBotReplies($plain, null, $guestLocale);
                $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale, $message);
                $conversation->update(['unread_staff_count' => 0]);

                return;
            }
            $this->escalateToStaff($conversation, 'empty_bot_reply');

            return;
        }

        [$replyGuest, $replyCs] = $this->normalizeBotReplies(
            $reply !== '' ? $reply : $replyCsField,
            $replyCsField !== '' ? $replyCsField : null,
            $guestLocale,
        );

        $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale, $message, $payload);
        $conversation->update(['unread_staff_count' => 0]);
        Log::info('Concierge bot: uložena JSON odpověď', [
            'conversation_id' => $conversation->id,
            'guest_locale' => $guestLocale,
            'chars' => mb_strlen($replyGuest),
            'actions' => count($payload['actions'] ?? []),
        ]);
    }

    /**
     * @return array{0: string, 1: string} [guestLanguage, czech]
     */
    private function normalizeBotReplies(string $primary, ?string $czechHint, string $guestLocale): array
    {
        $primary = trim($primary);
        $czechHint = $czechHint !== null ? trim($czechHint) : '';

        if ($guestLocale === 'cs') {
            $replyCs = $czechHint !== '' ? $czechHint : $primary;

            return [$replyCs, $replyCs];
        }

        // Staff vždy CS; host vždy guest_locale.
        // Lokální model často ignoruje jazyk a píše česky (knowledge je CS) —
        // proto bereme CS verzi a přeložíme do jazyka hosta.
        $replyCs = $czechHint !== ''
            ? $czechHint
            : ($this->looksLikeCzech($primary)
                ? $primary
                : ($this->safeTranslate($primary, $guestLocale, 'cs') ?? $primary));

        // Model už vrátil reply v jazyku hosta + reply_cs — nevolej druhý LLM překlad (šetří 60–120 s).
        if ($czechHint !== '' && $primary !== '' && ! $this->looksLikeCzech($primary)) {
            return [$primary, $replyCs];
        }

        if (! $this->looksLikeCzech($primary) && $primary !== '' && $primary !== $replyCs) {
            return [$primary, $replyCs];
        }

        $replyGuest = $this->safeTranslate($replyCs, 'cs', $guestLocale);
        if ($replyGuest === null || trim($replyGuest) === '') {
            $replyGuest = $this->looksLikeCzech($primary) ? $replyCs : $primary;
        }

        return [$replyGuest, $replyCs];
    }

    private function looksLikeCzech(string $text): bool
    {
        return (bool) preg_match('/[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/u', $text)
            || (bool) preg_match('/\b(dobrý|vítejte|snídaně|check-in|prosím|mohu|pomoci)\b/iu', $text);
    }

    private function localeLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'English',
            'de' => 'German',
            'fr' => 'French',
            'pl' => 'Polish',
            default => 'Czech',
        };
    }

    private function safeTranslate(string $text, string $from, string $to): ?string
    {
        try {
            return $this->openAi->translate($text, $from, $to);
        } catch (Throwable $e) {
            Log::warning('Concierge translate fallback', ['message' => $e->getMessage()]);

            return null;
        }
    }

    private function hasStaffReply(HotelConciergeConversation $conversation): bool
    {
        return HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_type', 'staff')
            ->exists();
    }

    private function resumeBotMode(HotelConciergeConversation $conversation): void
    {
        $metadata = $conversation->metadata ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }
        $metadata['mode'] = self::MODE_BOT;
        unset(
            $metadata['escalated_at'],
            $metadata['escalation_reason'],
            $metadata['taken_over_at'],
        );
        $conversation->update([
            'metadata' => $metadata,
            'unread_staff_count' => 0,
        ]);
        $conversation->refresh();
        Log::info('Concierge: obnoven bot mode', [
            'conversation_id' => $conversation->id,
        ]);
    }

    /** Recepce vrací chat AI chatbotu. */
    public function releaseToBot(HotelConciergeConversation $conversation): void
    {
        $this->ensureDefaultMetadata($conversation);
        $this->resumeBotMode($conversation);

        $locale = $conversation->guest_locale ?: 'cs';
        $notices = [
            'cs' => 'Concierge AI opět převzal chat. Napište, s čím vám můžu pomoci.',
            'en' => 'Concierge AI is handling this chat again. How can I help you?',
            'de' => 'Concierge AI führt diesen Chat wieder. Wie kann ich Ihnen helfen?',
            'fr' => 'Concierge AI gère à nouveau ce chat. Comment puis-je vous aider ?',
            'pl' => 'Concierge AI ponownie prowadzi ten czat. W czym mogę pomóc?',
        ];
        $guestNotice = $notices[$locale] ?? $notices['en'];
        $staffNotice = 'Chat vrácen AI chatbotu.';

        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'body' => $staffNotice,
            'body_original' => $staffNotice,
            'body_translated' => $guestNotice,
            'locale' => 'cs',
            'staff_display_name' => null,
            'created_at' => now(),
        ]);

        $this->pushGuestConcierge($conversation, $guestNotice, 'system');
    }

    private function storeBotMessage(
        HotelConciergeConversation $conversation,
        string $replyGuestLang,
        string $replyCs,
        string $guestLocale,
        ?HotelConciergeMessage $triggerMessage = null,
        ?array $payload = null,
    ): void {
        // Poslední pojistka proti race (dva LLM call najednou).
        if ($triggerMessage && $this->hasReplyAfter($conversation->fresh(), $triggerMessage)) {
            Log::info('Concierge bot: storeBotMessage přeskočen — odpověď už existuje', [
                'conversation_id' => $conversation->id,
                'message_id' => $triggerMessage->id,
            ]);

            return;
        }

        $safePayload = is_array($payload) ? $payload : [];
        if ($safePayload === [] || (empty($safePayload['actions']) && empty($safePayload['card']))) {
            $safePayload = [];
        }

        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'bot',
            'body' => $replyCs,
            'body_original' => $replyCs,
            'body_translated' => $guestLocale === 'cs' ? null : $replyGuestLang,
            'locale' => 'cs',
            'staff_display_name' => config('openai.bot_display_name', 'Concierge AI'),
            'payload' => $safePayload === [] ? [] : $safePayload,
            'created_at' => now(),
        ]);

        $preview = $guestLocale === 'cs' ? $replyCs : $replyGuestLang;
        $this->pushGuestConcierge($conversation, $preview, 'bot');
    }

    /**
     * Kontext hosta pro LLM (bez e-mailu, telefonu, folio).
     */
    private function buildGuestContext(HotelConciergeConversation $conversation, ?Hotel $hotel): string
    {
        $lines = ['GUEST CONTEXT:'];
        $name = trim((string) ($conversation->guest_display_name ?: ''));
        $room = trim((string) ($conversation->room_number ?: ''));
        $locale = $conversation->guest_locale ?: 'cs';

        $lines[] = '- Name: '.($name !== '' ? $name : 'unknown');
        $lines[] = '- Room: '.($room !== '' ? $room : 'unknown');
        $lines[] = '- Locale: '.$locale;

        $segment = 'standard';
        $notes = null;
        $checkIn = null;
        $checkOut = null;
        $loyalty = 0;
        $stayCount = 0;
        $preferences = [];
        $company = null;

        if ($hotel) {
            try {
                $guestKey = app(ConciergeGuestOpsService::class)
                    ->guestKeyForConversation($conversation);

                $profile = HotelCrmGuestProfile::query()
                    ->where('hotel_id', $hotel->id)
                    ->where('guest_key', $guestKey)
                    ->first();

                if ($profile) {
                    $segment = (string) ($profile->segment ?: 'standard');
                    $notes = filled($profile->notes) ? (string) $profile->notes : null;
                    $checkIn = $profile->check_in_at?->format('Y-m-d H:i');
                    $checkOut = $profile->check_out_at?->format('Y-m-d H:i');
                    $loyalty = (int) ($profile->loyalty_points ?? 0);
                    $stayCount = (int) ($profile->stay_count ?? 0);
                    $preferences = is_array($profile->preferences) ? $profile->preferences : [];
                    $company = filled($profile->company_name) ? (string) $profile->company_name : null;
                    if (! $name && filled($profile->display_name)) {
                        $lines[1] = '- Name: '.$profile->display_name;
                    }
                    if (! $room && filled($profile->room_number)) {
                        $lines[2] = '- Room: '.$profile->room_number;
                    }
                }
            } catch (Throwable $e) {
                Log::warning('Concierge bot: guest CRM context selhal', [
                    'conversation_id' => $conversation->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $lines[] = '- Segment: '.$segment;
        if ($segment === 'vip') {
            $lines[] = '- Tone: VIP guest — be especially courteous and proactive.';
        }
        if ($company) {
            $lines[] = '- Company: '.mb_substr($company, 0, 80);
        }
        if ($checkIn || $checkOut) {
            $lines[] = '- Stay: '.($checkIn ?: '?').' → '.($checkOut ?: '?');
        }
        if ($loyalty > 0 || $stayCount > 0) {
            $lines[] = "- Loyalty points: {$loyalty}; previous stays: {$stayCount}";
        }
        if ($preferences !== []) {
            $prefBits = [];
            foreach (array_slice($preferences, 0, 4, true) as $k => $v) {
                if (is_scalar($v) && (string) $v !== '') {
                    $prefBits[] = (is_string($k) ? $k.': ' : '').mb_substr((string) $v, 0, 60);
                }
            }
            if ($prefBits !== []) {
                $lines[] = '- Preferences: '.implode('; ', $prefBits);
            }
        }
        if ($notes) {
            $lines[] = '- Staff notes (internal, do not quote): '.mb_substr($notes, 0, 200);
        }

        try {
            if ($conversation->guest_external_id) {
                $requests = HotelServiceRequest::query()
                    ->where('hotel_id', $conversation->hotel_id)
                    ->where('guest_external_id', $conversation->guest_external_id)
                    ->whereNull('archived_at')
                    ->orderByDesc('created_at')
                    ->limit(3)
                    ->get(['service_label', 'status', 'request_text', 'created_at']);

                if ($requests->isNotEmpty()) {
                    $lines[] = '- Recent service requests:';
                    foreach ($requests as $req) {
                        $label = $req->service_label ?: 'Request';
                        $status = $req->status ?: 'open';
                        $snippet = $req->request_text
                            ? mb_substr((string) $req->request_text, 0, 80)
                            : '';
                        $lines[] = '  - '.$label.' ['.$status.']'
                            .($snippet !== '' ? ': '.$snippet : '');
                    }
                }
            }

            if ($conversation->guest_external_id) {
                $past = HotelConciergeCaseSummary::query()
                    ->where('hotel_id', $conversation->hotel_id)
                    ->where('guest_external_id', $conversation->guest_external_id)
                    ->orderByDesc('resolved_at')
                    ->orderByDesc('created_at')
                    ->first();

                if ($past) {
                    $summary = $past->summary_cs ?: $past->summary;
                    if (filled($summary)) {
                        $lines[] = '- Previous concierge topic: '.mb_substr((string) $summary, 0, 160);
                    }
                }
            }
        } catch (Throwable $e) {
            Log::warning('Concierge bot: guest requests/history selhal', [
                'conversation_id' => $conversation->id,
                'message' => $e->getMessage(),
            ]);
        }

        $text = implode("\n", $lines);

        return mb_substr($text, 0, 900);
    }

    /**
     * @param  array<string, array{id: string, label: string, hint: string, type: string, screen?: string, params?: array<string, mixed>}>  $actionCatalog
     */
    private function buildAppCapabilities(array $actionCatalog = []): string
    {
        $actionLines = [];
        foreach ($actionCatalog as $action) {
            $actionLines[] = '- '.$action['id'].' | '.$action['label'].' | '.$action['hint'];
        }
        $actionsBlock = $actionLines === []
            ? '- (none)'
            : implode("\n", $actionLines);

        return <<<TXT
GUEST APP FEATURES (guide guest here when it solves the request; do not invent prices/menus):
- This Concierge chat (AI first; guest can request live reception via "Connect to reception")
- Room service: order breakfast / lunch / dinner from the app
- Service requests: housekeeping, amenities/supplies, maintenance/repairs
- Interactive map & trip planner with places of interest
- Hotel info: facilities, parking, transport, room types
- Restaurants & bars, wellness/spa, sport/fitness sections
- Guest profile: stay details, order history, concierge history
When helpful, tell the guest which section of the app to open AND attach matching AVAILABLE ACTIONS so the app shows tappable buttons.
If a request needs staff action beyond the app, escalate.

AVAILABLE ACTIONS (pick 0–3 by id only; optional custom label in guest language):
{$actionsBlock}
TXT;
    }

    /**
     * Whitelist navigací pro interaktivní bot karty.
     *
     * @return array<string, array{id: string, label: string, hint: string, type: string, screen?: string, params?: array<string, mixed>}>
     */
    private function buildActionCatalog(?Hotel $hotel): array
    {
        $catalog = [];

        $static = [
            [
                'id' => 'restaurants_and_bars',
                'label' => 'Restaurants & bars',
                'hint' => 'Open restaurants and bars list',
                'type' => 'navigate',
                'screen' => 'RestaurantsAndBars',
                'params' => [],
            ],
            [
                'id' => 'room_service',
                'label' => 'Room service',
                'hint' => 'Order breakfast / lunch / dinner',
                'type' => 'navigate',
                'screen' => 'RoomServiceList',
                'params' => [],
            ],
            [
                'id' => 'service_requests',
                'label' => 'Service requests',
                'hint' => 'Housekeeping, amenities, maintenance',
                'type' => 'navigate',
                'screen' => 'RequestPageScreen',
                'params' => [],
            ],
            [
                'id' => 'trip_planner',
                'label' => 'Map & trip planner',
                'hint' => 'Places of interest and trip planner',
                'type' => 'navigate',
                'screen' => 'TripPlanner',
                'params' => [],
            ],
            [
                'id' => 'wellness_spa',
                'label' => 'Wellness & spa',
                'hint' => 'Spa, pool, wellness list',
                'type' => 'navigate',
                'screen' => 'WellnessSpaList',
                'params' => [],
            ],
            [
                'id' => 'escalate_reception',
                'label' => 'Connect to reception',
                'hint' => 'Hand chat over to live reception staff',
                'type' => 'escalate',
            ],
        ];

        foreach ($static as $action) {
            $catalog[$action['id']] = $action;
        }

        if (! $hotel) {
            return $catalog;
        }

        try {
            $venues = Venue::query()
                ->where('hotel_id', $hotel->id)
                ->where('is_active', true)
                ->with(['menus' => function ($q) {
                    $q->where('is_active', true)->orderBy('sort_order')->with(['categories' => function ($cq) {
                        $cq->orderBy('sort_order');
                    }]);
                }])
                ->orderBy('sort_order')
                ->get();

            foreach ($venues as $venue) {
                $venueSlug = (string) $venue->slug;
                $venueTitle = (string) $venue->title;

                foreach ($venue->menus as $menu) {
                    $menuSlug = (string) $menu->slug;
                    $menuTitle = (string) $menu->title;
                    $screen = (string) ($menu->navigation_screen ?: 'RestaurantMenu');
                    if (! in_array($screen, ['LobbyBarMenu', 'RestaurantMenu'], true)) {
                        $screen = $venue->venue_type === 'bar' ? 'LobbyBarMenu' : 'RestaurantMenu';
                    }

                    $menuActionId = Str::slug($venueSlug.'_'.$menuSlug, '_');
                    if ($menuActionId === '') {
                        continue;
                    }

                    $params = [
                        'restaurantId' => $venueSlug,
                        'menuSlug' => $menuSlug,
                    ];

                    $catalog[$menuActionId] = [
                        'id' => $menuActionId,
                        'label' => $venueTitle.' – '.$menuTitle,
                        'hint' => 'Open '.$menuTitle.' for '.$venueTitle,
                        'type' => 'navigate',
                        'screen' => $screen,
                        'params' => $params,
                    ];

                    if ($screen === 'LobbyBarMenu' || $menu->categories->count() > 1) {
                        foreach ($menu->categories as $category) {
                            $catSlug = (string) $category->slug;
                            $catTitle = (string) $category->title;
                            $catActionId = Str::slug($venueSlug.'_'.$menuSlug.'_'.$catSlug, '_');
                            if ($catActionId === '' || isset($catalog[$catActionId])) {
                                continue;
                            }

                            $catalog[$catActionId] = [
                                'id' => $catActionId,
                                'label' => $venueTitle.' – '.$catTitle,
                                'hint' => 'Open '.$catTitle.' section in '.$venueTitle.' menu',
                                'type' => 'navigate',
                                'screen' => $screen,
                                'params' => array_merge($params, ['categorySlug' => $catSlug]),
                            ];
                        }
                    }
                }
            }
        } catch (Throwable $e) {
            Log::warning('Concierge bot: action catalog venues failed', [
                'hotel_id' => $hotel->id,
                'message' => $e->getMessage(),
            ]);
        }

        return $catalog;
    }

    /**
     * @param  array<string, mixed>  $result
     * @param  array<string, array{id: string, label: string, hint: string, type: string, screen?: string, params?: array<string, mixed>}>  $actionCatalog
     * @return array{card?: array{title: string, subtitle?: string}, actions?: list<array<string, mixed>>}
     */
    private function buildMessagePayloadFromLlm(array $result, array $actionCatalog): array
    {
        $actions = $this->sanitizeBotActions($result['actions'] ?? [], $actionCatalog);
        $card = $this->sanitizeBotCard($result['card'] ?? null, $actions);

        $payload = [];
        if ($card !== null) {
            $payload['card'] = $card;
        }
        if ($actions !== []) {
            $payload['actions'] = $actions;
        }

        return $payload;
    }

    /**
     * @param  mixed  $card
     * @param  list<array<string, mixed>>  $actions
     * @return array{title: string, subtitle?: string}|null
     */
    private function sanitizeBotCard(mixed $card, array $actions): ?array
    {
        if (! is_array($card)) {
            if ($actions === []) {
                return null;
            }

            $firstLabel = (string) ($actions[0]['label'] ?? 'Otevřít v appce');

            return [
                'title' => $firstLabel,
                'subtitle' => 'Klepněte pro otevření',
            ];
        }

        $title = trim((string) ($card['title'] ?? ''));
        $subtitle = trim((string) ($card['subtitle'] ?? ''));

        if ($title === '' && $actions !== []) {
            $title = (string) ($actions[0]['label'] ?? 'Otevřít v appce');
        }

        if ($title === '') {
            return null;
        }

        $out = ['title' => mb_substr($title, 0, 80)];
        if ($subtitle !== '') {
            $out['subtitle'] = mb_substr($subtitle, 0, 140);
        }

        return $out;
    }

    /**
     * @param  mixed  $rawActions
     * @param  array<string, array{id: string, label: string, hint: string, type: string, screen?: string, params?: array<string, mixed>}>  $actionCatalog
     * @return list<array<string, mixed>>
     */
    private function sanitizeBotActions(mixed $rawActions, array $actionCatalog): array
    {
        if (! is_array($rawActions)) {
            return [];
        }

        $out = [];
        $seen = [];

        foreach ($rawActions as $item) {
            if (count($out) >= 3) {
                break;
            }

            $id = '';
            $customLabel = '';

            if (is_string($item)) {
                $id = trim($item);
            } elseif (is_array($item)) {
                $id = trim((string) ($item['id'] ?? ''));
                $customLabel = trim((string) ($item['label'] ?? ''));
            }

            if ($id === '' || isset($seen[$id]) || ! isset($actionCatalog[$id])) {
                continue;
            }

            $seen[$id] = true;
            $def = $actionCatalog[$id];
            $label = $customLabel !== '' ? $customLabel : $def['label'];
            $label = mb_substr($label, 0, 60);

            $action = [
                'id' => $def['id'],
                'label' => $label,
                'type' => $def['type'],
            ];

            if ($def['type'] === 'navigate') {
                $action['screen'] = $def['screen'] ?? null;
                $action['params'] = is_array($def['params'] ?? null) ? $def['params'] : [];
            }

            $out[] = $action;
        }

        return $out;
    }

    private function buildHotelContext(?Hotel $hotel): string
    {
        if (! $hotel) {
            return 'No hotel data available.';
        }

        $parts = ["Hotel name: {$hotel->name}"];

        try {
            $topics = HotelInfoTopic::query()
                ->where('hotel_id', $hotel->id)
                ->whereRaw('is_active = true')
                ->with('sections')
                ->orderBy('sort_order')
                ->limit(6)
                ->get();

            foreach ($topics as $topic) {
                $topicLine = "Topic: {$topic->title}";
                if (filled($topic->navigation_screen)) {
                    $topicLine .= ' (app screen: '.$topic->navigation_screen.')';
                }
                $parts[] = $topicLine;
                if ($topic->list_description) {
                    $parts[] = '  Summary: '.mb_substr((string) $topic->list_description, 0, 180);
                }
                foreach ($topic->sections->take(4) as $section) {
                    $line = "  - {$section->title}";
                    if ($section->description) {
                        $line .= ': '.mb_substr((string) $section->description, 0, 120);
                    }
                    $parts[] = $line;
                }
            }

            $places = HotelPlace::query()
                ->where('hotel_id', $hotel->id)
                ->whereRaw('is_active = true')
                ->orderByDesc('is_recommended')
                ->orderBy('sort_order')
                ->limit(6)
                ->get(['name', 'category', 'description', 'address', 'opening_hours', 'is_recommended']);

            if ($places->isNotEmpty()) {
                $parts[] = 'Places (also in app Map / Trip planner):';
                foreach ($places as $place) {
                    $bits = array_filter([
                        $place->name,
                        $place->category,
                        $place->is_recommended ? 'recommended' : null,
                        $place->description ? mb_substr((string) $place->description, 0, 80) : null,
                        $place->address ? 'addr: '.mb_substr((string) $place->address, 0, 60) : null,
                        $place->opening_hours ? 'hours: '.mb_substr((string) $place->opening_hours, 0, 60) : null,
                    ]);
                    $parts[] = '  - '.implode(' | ', $bits);
                }
            }
        } catch (Throwable $e) {
            Log::warning('Concierge bot: hotel context se nepodařilo načíst', [
                'hotel_id' => $hotel->id,
                'message' => $e->getMessage(),
            ]);
            $parts[] = 'Hotel knowledge temporarily unavailable — answer from general hotel etiquette.';
        }

        $text = implode("\n", $parts);

        // Lokální / LAN LM Studio snáší kratší kontext lépe (rychlost + stabilita).
        // Guest + app bloky jsou zvlášť; hotel knowledge držíme kratší.
        $base = (string) config('openai.base_url');
        $host = (string) (parse_url($base, PHP_URL_HOST) ?: '');
        $isLocalOrLan = str_contains($base, '127.0.0.1')
            || str_contains($base, 'localhost')
            || (bool) preg_match('/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/', $host);
        $limit = $isLocalOrLan ? 2800 : 10000;

        return mb_substr($text, 0, $limit);
    }

    /**
     * @return list<array{role: string, content: string}>
     */
    private function buildChatHistory(HotelConciergeConversation $conversation): array
    {
        $messages = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->reverse()
            ->values();

        $history = [];
        foreach ($messages as $msg) {
            if ($msg->sender_type === 'system') {
                continue;
            }
            if ($msg->sender_type === 'guest') {
                $history[] = ['role' => 'user', 'content' => $msg->body];
            } else {
                $content = $msg->body_translated ?: $msg->body;
                $history[] = ['role' => 'assistant', 'content' => $content];
            }
        }

        // Poslední user message pošleme zvlášť — odeber duplicitu.
        if ($history !== [] && end($history)['role'] === 'user') {
            array_pop($history);
        }

        return $history;
    }

    private function guestRequestsHuman(string $body): bool
    {
        $normalized = mb_strtolower($body);
        $needles = [
            'mluvit s člověkem',
            'mluvit s clovekem',
            'mluvit s recepcí',
            'mluvit s recepci',
            'chci recepci',
            'chci člověka',
            'spojit s recepcí',
            'spojit s recepci',
            'živou obsluhu',
            'zivou obsluhu',
            'talk to reception',
            'talk to a human',
            'talk to someone',
            'speak to someone',
            'speak to a human',
            'real person',
            'human agent',
            'live agent',
            'mitarbeiter sprechen',
            'mit der rezeption sprechen',
            'menschlichen mitarbeiter',
        ];

        foreach ($needles as $needle) {
            if (str_contains($normalized, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function isLlmTimeout(Throwable $e): bool
    {
        $msg = $e->getMessage();

        return str_contains($msg, 'cURL error 28')
            || str_contains($msg, 'Operation timed out')
            || str_contains($msg, 'timed out after');
    }

    /** LM Studio / OpenAI endpoint není dostupný (síť, firewall, server vypnutý). */
    private function isLlmUnreachable(Throwable $e): bool
    {
        $msg = $e->getMessage();

        return str_contains($msg, 'cURL error 7')
            || str_contains($msg, 'Failed to connect')
            || str_contains($msg, 'Could not connect to server')
            || str_contains($msg, 'Connection refused')
            || str_contains($msg, 'No route to host');
    }

    private function isTransientDbError(Throwable $e): bool
    {
        $msg = $e->getMessage();

        // Pozor: „Could not connect“ je i u LLM — to řeší isLlmUnreachable().
        return str_contains($msg, 'prepared statement')
            || str_contains($msg, 'SQLSTATE[26000]')
            || str_contains($msg, 'SQLSTATE[08P01]')
            || str_contains($msg, 'boolean = integer')
            || str_contains($msg, 'server closed the connection')
            || str_contains($msg, "Can't assign requested address");
    }

    /**
     * Jednorázová informace hostovi + recepci, když LM Studio nejde.
     * Chat zůstává v bot módu — ensure-reply / další zpráva zkusí znovu.
     */
    private function notifyLlmOffline(HotelConciergeConversation $conversation): void
    {
        $metadata = is_array($conversation->metadata) ? $conversation->metadata : [];
        $lastAt = data_get($metadata, 'llm_offline_notified_at');
        if (is_string($lastAt) && $lastAt !== '') {
            try {
                if (\Illuminate\Support\Carbon::parse($lastAt)->greaterThan(now()->subSeconds(120))) {
                    return;
                }
            } catch (Throwable) {
                // continue
            }
        }

        $locale = $conversation->guest_locale ?: 'cs';
        $guestNotices = [
            'cs' => 'Omlouváme se, digitální asistent je dočasně nedostupný. Zkuste to za chvíli, nebo použijte tlačítko pro spojení s recepcí.',
            'en' => 'Sorry — the digital assistant is temporarily unavailable. Please try again shortly, or use the button to connect with reception.',
            'de' => 'Entschuldigung — der digitale Assistent ist vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich erneut oder verbinden Sie sich mit der Rezeption.',
            'fr' => 'Désolé — l’assistant numérique est temporairement indisponible. Réessayez sous peu ou contactez la réception.',
            'pl' => 'Przepraszamy — asystent cyfrowy jest chwilowo niedostępny. Spróbuj ponownie za chwilę lub połącz się z recepcją.',
        ];
        $guestNotice = $guestNotices[$locale] ?? $guestNotices['en'];
        $staffNotice = 'LM Studio nedostupné ('.config('openai.base_url').') — AI neodpověděla. Chat zůstává u bota; po obnovení spojení zkusí znovu. Nebo převeď kontrolu.';

        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'body' => $staffNotice,
            'body_original' => $staffNotice,
            'body_translated' => $guestNotice,
            'locale' => 'cs',
            'staff_display_name' => null,
            'created_at' => now(),
        ]);

        $metadata['llm_offline_notified_at'] = now()->toIso8601String();
        $conversation->update(['metadata' => $metadata]);
        $this->pushGuestConcierge($conversation, $guestNotice, 'system');
    }

    private function escalationNoticeForStaff(string $reason): string
    {
        return match ($reason) {
            'staff_takeover' => 'Recepce převzala kontrolu nad chatem. Host už čeká na živou odpověď.',
            'guest_button', 'guest_request' => 'Host chce živou recepci — čeká na převzetí chatu.',
            'bot_error' => 'AI selhala (technická chyba) — host čeká na recepci.',
            'empty_bot_reply' => 'AI nevrátila odpověď — host čeká na recepci.',
            'openai_missing' => 'AI není nakonfigurovaná (OPENAI_*) — host čeká na recepci.',
            'bot_handoff' => 'AI předala chat recepci — host čeká.',
            'llm_offline' => 'LM Studio / AI server není dostupný — host čeká na recepci.',
            default => 'Host byl předán recepci. Důvod: '.$reason.'.',
        };
    }

    private function escalationNoticeForGuest(string $locale, string $reason = ''): string
    {
        if ($reason === 'staff_takeover') {
            return match ($locale) {
                'de' => 'Ein Mitarbeiter der Rezeption hat das Gespräch übernommen und wird Ihnen gleich antworten.',
                'en' => 'A reception staff member has taken over this chat and will reply to you shortly.',
                'fr' => 'Un membre de la réception a pris en charge cette conversation et vous répondra bientôt.',
                'pl' => 'Pracownik recepcji przejął tę rozmowę i wkrótce Ci odpowie.',
                default => 'Člen recepce převzal tento chat a brzy vám odpoví.',
            };
        }

        // Guest požádal o živou obsluhu / bot handoff → čekací zpráva
        return match ($locale) {
            'de' => 'Ich verbinde Sie jetzt mit der Live-Rezeption. Bitte haben Sie einen Moment Geduld — ein Mitarbeiter meldet sich gleich.',
            'en' => 'Connecting you to live reception now. Please wait a moment — a staff member will join this chat shortly.',
            'fr' => 'Je vous connecte à la réception en direct. Merci de patienter un instant — un membre du personnel va bientôt rejoindre le chat.',
            'pl' => 'Łączę Cię teraz z żywą recepcją. Proszę chwilę poczekać — pracownik wkrótce dołączy do rozmowy.',
            default => 'Přepojuji vás na živou recepci. Chvilku strpení — člen obsluhy se brzy připojí do chatu.',
        };
    }
}
