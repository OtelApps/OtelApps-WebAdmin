<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelConciergeCaseSummary;
use App\Models\HotelConciergeConversation;
use App\Models\HotelConciergeMessage;
use App\Models\HotelInfoTopic;
use App\Models\HotelPlace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        // Idempotent: už máme novější bot/staff/system odpověď po této zprávě.
        if ($this->hasReplyAfter($conversation, $message)) {
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

        try {
            $this->replyAsBot($conversation, $message);
        } catch (Throwable $e) {
            Log::error('Concierge bot selhal', [
                'conversation_id' => $conversation->id,
                'message' => $e->getMessage(),
            ]);

            // Transientní DB chyba u pooleru — zkus ještě jednou, ať neeskalujeme zbytečně.
            if ($this->isTransientDbError($e)) {
                try {
                    usleep(200_000);
                    DB::connection(config('otelapps.db_connection'))->reconnect();
                    $this->replyAsBot($conversation, $message);

                    return;
                } catch (Throwable $retry) {
                    Log::error('Concierge bot retry selhal', [
                        'conversation_id' => $conversation->id,
                        'message' => $retry->getMessage(),
                    ]);
                }
            }

            $this->escalateToStaff($conversation, 'bot_error');
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

        $last = HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        if (! $last || $last->sender_type !== 'guest') {
            return false;
        }

        if ($this->hasReplyAfter($conversation, $last)) {
            return false;
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
        return HotelConciergeMessage::query()
            ->where('conversation_id', $conversation->id)
            ->whereIn('sender_type', ['bot', 'staff', 'system'])
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
        $fallbackCs = $guestLocale === 'cs'
            ? $fallbackGuest
            : mb_substr($fallbackGuest, 0, 90);

        if ($guestBodies === [] || ! $this->openAi->isConfigured()) {
            return ['guest' => $fallbackGuest, 'cs' => $fallbackCs];
        }

        $languageName = $this->localeLabel($guestLocale);
        $joined = implode("\n- ", array_map(fn ($b) => mb_substr((string) $b, 0, 160), $guestBodies));

        try {
            $raw = $this->openAi->chat([
                [
                    'role' => 'system',
                    'content' => <<<PROMPT
Summarize a resolved hotel guest support chat into a short keyword-style title.
Return JSON only:
{"summary":"...in {$languageName}...","summary_cs":"...in Czech..."}
Rules: max 12 words each, no quotes, no trailing period if possible, capture the main problem only.
PROMPT
                ],
                [
                    'role' => 'user',
                    'content' => "Guest messages:\n- {$joined}",
                ],
            ], false);

            $decoded = $this->openAi->tryDecodeJson($raw);
            $guest = trim((string) ($decoded['summary'] ?? ''));
            $cs = trim((string) ($decoded['summary_cs'] ?? ''));

            if ($guest !== '') {
                return [
                    'guest' => mb_substr($guest, 0, 120),
                    'cs' => mb_substr($cs !== '' ? $cs : $guest, 0, 120),
                ];
            }
        } catch (Throwable $e) {
            Log::warning('Concierge: shrnutí chatu selhalo', ['message' => $e->getMessage()]);
        }

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
        $context = $this->buildHotelContext($hotel);
        $history = $this->buildChatHistory($conversation);

        $system = <<<PROMPT
You are a hotel concierge chatbot for "{$hotel?->name}".
CRITICAL: The guest language is {$languageName} (code: {$guestLocale}).
The field "reply" MUST be written entirely in {$languageName}.
The field "reply_cs" MUST be the same meaning in Czech for hotel staff.
Keep answers to 1–3 short sentences. Use hotel knowledge below. Hotel knowledge may be in Czech — still answer the guest in {$languageName}.

Return JSON:
{"reply":"...in {$languageName}...","reply_cs":"...in Czech...","escalate":false,"escalate_reason":null}
If you cannot output JSON, write the guest-facing answer in {$languageName} only (plain text).

HOTEL KNOWLEDGE:
{$context}
PROMPT;

        $userContent = "Guest message ({$languageName}):\n".$message->body;

        $raw = $this->openAi->chat([
            ['role' => 'system', 'content' => $system],
            ...$history,
            ['role' => 'user', 'content' => $userContent],
        ], false);

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
            $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale);
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
                $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale);
            }

            return;
        }

        if ($reply === '' && $replyCsField === '') {
            $plain = trim($raw);
            if ($plain !== '' && ! str_contains($plain, '{')) {
                [$replyGuest, $replyCs] = $this->normalizeBotReplies($plain, null, $guestLocale);
                $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale);
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

        $this->storeBotMessage($conversation, $replyGuest, $replyCs, $guestLocale);
        $conversation->update(['unread_staff_count' => 0]);
        Log::info('Concierge bot: uložena JSON odpověď', [
            'conversation_id' => $conversation->id,
            'guest_locale' => $guestLocale,
            'chars' => mb_strlen($replyGuest),
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
        unset($metadata['escalated_at'], $metadata['escalation_reason']);
        $conversation->update([
            'metadata' => $metadata,
            'unread_staff_count' => 0,
        ]);
        $conversation->refresh();
        Log::info('Concierge: obnoven bot mode (žádná staff odpověď)', [
            'conversation_id' => $conversation->id,
        ]);
    }

    private function storeBotMessage(
        HotelConciergeConversation $conversation,
        string $replyGuestLang,
        string $replyCs,
        string $guestLocale,
    ): void {
        HotelConciergeMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'bot',
            'body' => $replyCs,
            'body_original' => $replyCs,
            'body_translated' => $guestLocale === 'cs' ? null : $replyGuestLang,
            'locale' => 'cs',
            'staff_display_name' => config('openai.bot_display_name', 'Concierge AI'),
            'created_at' => now(),
        ]);

        $preview = $guestLocale === 'cs' ? $replyCs : $replyGuestLang;
        $this->pushGuestConcierge($conversation, $preview, 'bot');
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
                $parts[] = "Topic: {$topic->title}";
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
                ->get(['name', 'category', 'description']);

            if ($places->isNotEmpty()) {
                $parts[] = 'Places:';
                foreach ($places as $place) {
                    $bits = array_filter([
                        $place->name,
                        $place->category,
                        $place->description ? mb_substr((string) $place->description, 0, 100) : null,
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

        // Lokální LM Studio snáší kratší kontext lépe (rychlost + stabilita).
        $limit = str_contains((string) config('openai.base_url'), '127.0.0.1')
            || str_contains((string) config('openai.base_url'), 'localhost')
            ? 3500
            : 12000;

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

    private function isTransientDbError(Throwable $e): bool
    {
        $msg = $e->getMessage();

        return str_contains($msg, 'prepared statement')
            || str_contains($msg, 'SQLSTATE[26000]')
            || str_contains($msg, 'SQLSTATE[08P01]')
            || str_contains($msg, 'boolean = integer')
            || str_contains($msg, 'server closed the connection')
            || str_contains($msg, 'Could not connect')
            || str_contains($msg, "Can't assign requested address");
    }

    private function escalationNoticeForStaff(string $reason): string
    {
        return match ($reason) {
            'staff_takeover' => 'Recepce převzala kontrolu nad chatem. Host už čeká na živou odpověď.',
            'guest_button', 'guest_request' => 'Host chce živou recepci — čeká na převzetí chatu.',
            'bot_error', 'empty_bot_reply', 'openai_missing', 'bot_handoff' => 'AI předalo chat recepci ('.$reason.') — host čeká.',
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
