import React, { useCallback, useEffect, useRef, useState } from 'react';
import http from '../../lib/http';
import { useModules } from '../../context/ModulesContext';
import { NotFound } from '../shared/NotFound';
import { GuestLocaleFlag } from './GuestLocaleFlag';
import { GuestOpsModal } from './GuestOpsModal';
import { BanGuestModal } from './BanGuestModal';
import { ConciergeBanDetail, ConciergeBanList } from './ConciergeBans';
import { GuestPresenceBadge, WaitingForGuestEyes } from './GuestPresenceBadge';
import { GUEST_LOCALES, localeMeta } from './conciergeLocales';
import {
    isNearBottom,
    messagesFingerprint,
    useVisibilityPolling,
} from './useConciergePolling';
import { useConciergeLiveChannel } from './useConciergeLiveChannel';
import { useConciergeRealtime } from './useConciergeRealtime';

const PRIMARY_ORANGE = '#FF9F00';
const THREAD_FALLBACK_POLL_MS = 5000;
const LIST_FALLBACK_POLL_MS = 8000;

const HANDLER_MODE_META = {
    bot: {
        label: 'AI chatbot',
        short: 'AI',
        icon: 'smart_toy',
        border: '#8B5CF6',
        avatar: '#7C3AED',
        badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
        row: 'bg-violet-50/50 dark:bg-violet-950/20',
        active: 'bg-violet-100 dark:bg-violet-950/40',
        previewPrefix: 'AI',
    },
    waiting: {
        label: 'Žádá člověka',
        short: 'Čeká',
        icon: 'person_raised_hand',
        border: '#F59E0B',
        avatar: '#D97706',
        badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100',
        row: 'bg-amber-50/70 dark:bg-amber-950/25',
        active: 'bg-amber-100 dark:bg-amber-950/45',
        previewPrefix: 'Čeká na recepci',
    },
    staff: {
        label: 'Řeší člověk',
        short: 'Staff',
        icon: 'support_agent',
        border: '#F97316',
        avatar: '#EA580C',
        badge: 'bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100',
        row: 'bg-orange-50/40 dark:bg-orange-950/15',
        active: 'bg-orange-50 dark:bg-orange-950/35',
        previewPrefix: 'Staff',
    },
};

function resolveHandlerMode(value) {
    if (value === 'waiting' || value === 'staff') return value;
    return 'bot';
}

function ConversationListItem({ item, active, onClick }) {
    const mode = resolveHandlerMode(item.handler_mode);
    const meta = HANDLER_MODE_META[mode];
    const unread = mode !== 'bot' && item.unread_count > 0;
    const initials = (item.guest_name || '?')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative flex w-full gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition dark:border-gray-700 ${
                active ? meta.active : `${meta.row} hover:brightness-[0.98] dark:hover:brightness-110`
            } ${unread ? 'ring-inset ring-1 ring-red-200/80 dark:ring-red-900/40' : ''}`}
        >
            <span
                className="absolute bottom-0 left-0 top-0 w-1.5"
                style={{ backgroundColor: meta.border }}
                aria-hidden
            />
            <div className="relative shrink-0 pl-1">
                <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: meta.avatar }}
                    title={meta.label}
                >
                    {mode === 'staff' ? (
                        initials
                    ) : (
                        <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
                    )}
                </div>
                {unread ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {item.unread_count > 9 ? '9+' : item.unread_count}
                    </span>
                ) : null}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`truncate text-sm ${unread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-gray-200'}`}
                    >
                        {item.guest_name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">{item.last_message_at}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {item.status === 'closed' ? (
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                            Closed
                        </span>
                    ) : (
                        <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}
                        >
                            <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                            {meta.label}
                        </span>
                    )}
                    <GuestLocaleFlag locale={item.guest_locale} size="sm" />
                    {item.guest_room ? (
                        <span className="text-xs text-gray-400">pokoj {item.guest_room}</span>
                    ) : null}
                    {item.guest_banned ? (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800 dark:bg-red-900/50 dark:text-red-200">
                            Zabanován
                        </span>
                    ) : null}
                </div>
                <p
                    className={`mt-1 line-clamp-2 text-xs ${unread ? 'font-medium text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <span className="font-semibold opacity-80">{meta.previewPrefix}</span>
                    {' · '}
                    {item.preview || '—'}
                </p>
            </div>
        </button>
    );
}

function MessageBubble({ message, guestLocale }) {
    const isStaff = message.is_staff;
    const isBot = message.is_bot;
    const isSystem = message.is_system;
    const guestMeta = localeMeta(guestLocale);
    const isSatisfaction = Boolean(message.is_satisfaction_check);
    const satisfactionAnswer = message.satisfaction_answer;

    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div
                    className={`max-w-[90%] rounded-2xl px-4 py-2 text-center text-xs ${
                        isSatisfaction
                            ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100'
                            : 'rounded-full bg-gray-200/90 py-1.5 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                    {isSatisfaction ? (
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                            Kontrola spokojenosti
                        </p>
                    ) : null}
                    <p>{message.body}</p>
                    {message.body_translated && message.body_translated !== message.body ? (
                        <span className="mt-0.5 block text-[10px] opacity-80">
                            Pro hosta ({guestMeta.flag} {(guestLocale || '—').toUpperCase()}):{' '}
                            {message.body_translated}
                        </span>
                    ) : null}
                    {isSatisfaction ? (
                        <p className="mt-1.5 text-[11px] font-medium">
                            {satisfactionAnswer === 'yes'
                                ? 'Host: Ano — chat archivován'
                                : satisfactionAnswer === 'no'
                                  ? 'Host: Ne — potřebuje další pomoc'
                                  : 'Čeká se na odpověď Ano / Ne…'}
                        </p>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isBot
                        ? 'rounded-br-md bg-violet-600 text-white'
                        : isStaff
                          ? 'rounded-br-md bg-orange-500 text-white'
                          : 'rounded-bl-md bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                }`}
            >
                {isBot ? (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase opacity-80">
                        Concierge AI
                    </p>
                ) : isStaff && message.staff_display_name ? (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase opacity-80">
                        {message.staff_display_name}
                    </p>
                ) : null}
                {/* Staff/bot: hlavní text česky; guest: CS překlad nahoře, originál pod tím */}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {!isStaff && message.body_translated
                        ? message.body_translated
                        : message.body}
                </p>
                {isBot && Array.isArray(message.payload?.actions) && message.payload.actions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.payload.actions.map((action) => (
                            <span
                                key={action.id || action.label}
                                className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium"
                                title={
                                    action.type === 'navigate'
                                        ? `Navigace: ${action.screen || '—'}`
                                        : 'Spojit s recepcí'
                                }
                            >
                                {action.label}
                            </span>
                        ))}
                    </div>
                ) : null}
                {!isStaff && !message.body_translated && message.locale && message.locale !== 'cs' ? (
                    <p className="mt-1 text-[10px] italic text-amber-600 dark:text-amber-400">
                        Překládám do češtiny…
                    </p>
                ) : null}
                {!isStaff && message.body_translated && message.body_translated !== message.body ? (
                    <p className="mt-2 border-t border-gray-200 pt-2 text-xs italic text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        Originál hosta ({(message.locale || '—').toUpperCase()}): {message.body}
                    </p>
                ) : null}
                {isStaff && message.body_translated ? (
                    <p className="mt-2 border-t border-white/30 pt-2 text-xs italic opacity-90">
                        Pro hosta ({guestMeta.flag} {(guestLocale || '—').toUpperCase()}):{' '}
                        {message.body_translated}
                    </p>
                ) : null}
                <p
                    className={`mt-1 text-[10px] ${
                        isStaff ? 'text-white/70' : 'text-gray-400'
                    }`}
                >
                    {message.time}
                </p>
            </div>
        </div>
    );
}

function ConversationThread({ conversationId, onListRefresh, onLeaveThread, realtimeMode, pollThreadRef }) {
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [takingOver, setTakingOver] = useState(false);
    const [sendingCheck, setSendingCheck] = useState(false);
    const [live, setLive] = useState(true);
    const [guestOpsOpen, setGuestOpsOpen] = useState(false);
    const [banOpen, setBanOpen] = useState(false);
    const [unbanning, setUnbanning] = useState(false);
    const { guestOnline, guestTyping, notifyTyping, stopTyping } = useConciergeLiveChannel({
        conversationId,
        enabled: Boolean(conversationId),
        busy: guestOpsOpen,
    });
    const bottomRef = useRef(null);
    const scrollRef = useRef(null);
    const fingerprintRef = useRef('');
    const markReadPendingRef = useRef(false);
    const conversationIdRef = useRef(conversationId);
    conversationIdRef.current = conversationId;

    const scrollToBottom = useCallback((smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    const applyConversation = useCallback(
        (conv, { scrollIfNearBottom = false } = {}) => {
            if (!conv?.id || conv.id !== conversationIdRef.current) {
                return;
            }

            const fp = messagesFingerprint(conv.messages);
            const changed = fp !== fingerprintRef.current;
            fingerprintRef.current = fp;

            setConversation(conv);

            if (changed && scrollIfNearBottom && isNearBottom(scrollRef.current)) {
                requestAnimationFrame(() => scrollToBottom(true));
            }
        },
        [scrollToBottom],
    );

    const pollThread = useCallback(async () => {
        const id = conversationIdRef.current;
        if (!id || sending || takingOver) return;
        try {
            const { data } = await http.get(`/api/concierge/conversations/${id}`);
            if (id !== conversationIdRef.current) return;

            setLive(true);
            const conv = data.conversation;
            if (!conv || conv.id !== id) return;

            const prevFp = fingerprintRef.current;
            const nextFp = messagesFingerprint(conv.messages);
            if (nextFp === prevFp) return;

            const prevCount = prevFp ? Number(prevFp.split(':')[0]) || 0 : 0;
            const nextCount = conv.messages?.length ?? 0;
            const lastMsg = conv.messages?.[nextCount - 1];
            const newGuestMessage =
                nextCount > prevCount && lastMsg && lastMsg.sender_type === 'guest';

            applyConversation(conv, { scrollIfNearBottom: true });

            if (newGuestMessage && !markReadPendingRef.current) {
                markReadPendingRef.current = true;
                try {
                    const readRes = await http.post(`/api/concierge/conversations/${id}/read`);
                    if (id !== conversationIdRef.current) return;
                    if (readRes.data?.conversation) {
                        applyConversation(readRes.data.conversation, { scrollIfNearBottom: false });
                    }
                    onListRefresh?.({ silent: true });
                } finally {
                    markReadPendingRef.current = false;
                }
            }
        } catch (err) {
            if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
            if (id === conversationIdRef.current) setLive(false);
        }
    }, [sending, takingOver, applyConversation, onListRefresh]);

    useEffect(() => {
        if (pollThreadRef) pollThreadRef.current = pollThread;
        return () => {
            if (pollThreadRef) pollThreadRef.current = null;
        };
    }, [pollThread, pollThreadRef]);

    // Vždy pollovat otevřený thread — realtime INSERT často přijde dřív než
    // doběhne guest→CS překlad (UPDATE body_translated), a UI by zůstalo na originálu.
    useVisibilityPolling(
        pollThread,
        THREAD_FALLBACK_POLL_MS,
        Boolean(conversationId),
    );

    const load = useCallback(() => {
        const id = conversationIdRef.current;
        if (!id) return;
        setLoading(true);
        setError(null);
        http
            .get(`/api/concierge/conversations/${id}`)
            .then((res) => {
                if (id !== conversationIdRef.current) return;
                applyConversation(res.data.conversation, { scrollIfNearBottom: false });
                setLive(true);
            })
            .catch((err) => {
                if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
                if (id !== conversationIdRef.current) return;
                setError(err.response?.data?.message || 'Konverzaci se nepodařilo načíst.');
            })
            .finally(() => {
                if (id === conversationIdRef.current) setLoading(false);
            });
    }, [applyConversation]);

    useEffect(() => {
        const id = conversationId;
        const controller = new AbortController();

        setConversation(null);
        setReply('');
        setError(null);
        setTakingOver(false);
        setGuestOpsOpen(false);
        fingerprintRef.current = '';

        if (!id) {
            setLoading(false);
            return undefined;
        }

        setLoading(true);

        (async () => {
            try {
                const { data } = await http.get(`/api/concierge/conversations/${id}`, {
                    signal: controller.signal,
                });
                if (id !== conversationIdRef.current) return;

                applyConversation(data.conversation, { scrollIfNearBottom: false });
                setLive(true);

                const readRes = await http.post(`/api/concierge/conversations/${id}/read`, null, {
                    signal: controller.signal,
                });
                if (id !== conversationIdRef.current) return;

                if (readRes?.data?.conversation) {
                    applyConversation(readRes.data.conversation, { scrollIfNearBottom: false });
                    onListRefresh?.({ silent: true });
                }
            } catch (err) {
                if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
                if (id !== conversationIdRef.current) return;
                setError(err.response?.data?.message || 'Konverzaci se nepodařilo načíst.');
            } finally {
                if (id === conversationIdRef.current) setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [conversationId, applyConversation, onListRefresh]);

    useEffect(() => {
        if (conversation?.id === conversationId && conversation?.messages?.length) {
            scrollToBottom(false);
        }
    }, [conversationId, conversation?.id, conversation?.messages?.length, scrollToBottom]);

    const handleTakeOver = async () => {
        const id = conversationIdRef.current;
        if (!id || takingOver) return;
        setTakingOver(true);
        try {
            const { data } = await http.post(`/api/concierge/conversations/${id}/take-over`);
            if (id !== conversationIdRef.current) return;
            if (data?.conversation) {
                applyConversation(data.conversation, { scrollIfNearBottom: true });
                onListRefresh?.({ silent: true });
            }
        } catch (err) {
            if (id === conversationIdRef.current) {
                window.alert(err.response?.data?.message || 'Předání se nezdařilo.');
            }
        } finally {
            if (id === conversationIdRef.current) setTakingOver(false);
        }
    };

    const handleReleaseToBot = async () => {
        const id = conversationIdRef.current;
        if (!id || takingOver) return;
        if (!window.confirm('Vrátit chat AI chatbotu? Hostovi se zobrazí oznámení.')) return;
        setTakingOver(true);
        try {
            const { data } = await http.post(`/api/concierge/conversations/${id}/release-to-bot`);
            if (id !== conversationIdRef.current) return;
            if (data?.conversation) {
                applyConversation(data.conversation, { scrollIfNearBottom: true });
                onListRefresh?.({ silent: true });
            }
        } catch (err) {
            if (id === conversationIdRef.current) {
                window.alert(err.response?.data?.message || 'Vrácení chatbotu se nezdařilo.');
            }
        } finally {
            if (id === conversationIdRef.current) setTakingOver(false);
        }
    };

    const handleSatisfactionCheck = async () => {
        const id = conversationIdRef.current;
        if (!id || sendingCheck) return;
        setSendingCheck(true);
        try {
            const { data } = await http.post(`/api/concierge/conversations/${id}/satisfaction-check`);
            if (id !== conversationIdRef.current) return;
            if (data?.conversation) {
                applyConversation(data.conversation, { scrollIfNearBottom: true });
                onListRefresh?.({ silent: true });
            }
        } catch (err) {
            if (id === conversationIdRef.current) {
                window.alert(err.response?.data?.message || 'Kontrolu se nepodařilo odeslat.');
            }
        } finally {
            if (id === conversationIdRef.current) setSendingCheck(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const id = conversationIdRef.current;
        const text = reply.trim();
        if (!text || !id) return;
        stopTyping();
        setSending(true);
        setReply('');
        try {
            const { data } = await http.post(`/api/concierge/conversations/${id}/messages`, {
                body: text,
            });
            if (id !== conversationIdRef.current) return;
            applyConversation(data.conversation, { scrollIfNearBottom: true });
            onListRefresh?.({ silent: true });
        } catch (err) {
            if (id === conversationIdRef.current) {
                setReply(text);
                window.alert(err.response?.data?.message || 'Odeslání se nezdařilo.');
            }
        } finally {
            if (id === conversationIdRef.current) setSending(false);
        }
    };

    if (!conversationId) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-gray-50/80 p-8 text-center dark:bg-gray-900/50">
                <span className="material-symbols-outlined mb-3 text-5xl text-gray-300">forum</span>
                <p className="text-gray-500 dark:text-gray-400">Vyberte konverzaci ze seznamu vlevo</p>
            </div>
        );
    }

    const showingWrongThread = conversation && conversation.id !== conversationId;
    const stillLoading = loading || showingWrongThread || (!conversation && !error);

    if (stillLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-gray-50/80 dark:bg-gray-900/50">
                <p className="text-gray-500">Načítání konverzace…</p>
            </div>
        );
    }

    if (error || !conversation) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
                <p className="text-red-600">{error || 'Konverzaci se nepodařilo načíst.'}</p>
                <button type="button" onClick={load} className="text-sm text-orange-600 underline">
                    Zkusit znovu
                </button>
            </div>
        );
    }

    const guestMeta = localeMeta(conversation.guest_locale);
    const mode =
        conversation.handler_mode === 'waiting' || conversation.handler_mode === 'staff'
            ? conversation.handler_mode
            : 'bot';
    const isBotMode = mode === 'bot';
    const isWaiting = mode === 'waiting';
    const isStaffMode = mode === 'staff';
    const isClosed = conversation.status === 'closed' || conversation.status === 'archived';
    const canCompose = isStaffMode || isWaiting;
    const hasPendingSatisfaction = (conversation.messages ?? []).some(
        (m) => m.is_satisfaction_check && !m.satisfaction_answer,
    );
    const messages = conversation.messages ?? [];
    const lastMsg = messages[messages.length - 1];
    const waitingForGuestReply =
        canCompose &&
        !isClosed &&
        !guestTyping &&
        Boolean(lastMsg) &&
        lastMsg.sender_type !== 'guest';

    return (
        <div
            className={`flex min-h-0 flex-1 flex-col ${
                isBotMode
                    ? 'bg-violet-50/40 dark:bg-violet-950/10'
                    : isWaiting
                      ? 'bg-amber-50/30 dark:bg-amber-950/10'
                      : 'bg-transparent'
            }`}
        >
            <header
                className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 ${
                    isBotMode
                        ? 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/40'
                        : isWaiting
                          ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40'
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
            >
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setGuestOpsOpen(true)}
                            className="group inline-flex max-w-full items-center gap-1 truncate text-left"
                            title="Otevřít kartu hosta a rychlé akce"
                        >
                            <h2 className="truncate text-lg font-semibold text-gray-900 underline-offset-2 group-hover:underline dark:text-white">
                                {conversation.guest_name}
                            </h2>
                            <span className="material-symbols-outlined shrink-0 text-[18px] text-orange-500 opacity-70 group-hover:opacity-100">
                                open_in_new
                            </span>
                        </button>
                        <GuestPresenceBadge online={guestOnline} typing={guestTyping} />
                        <GuestLocaleFlag locale={conversation.guest_locale} size="lg" showLabel />
                        {isBotMode ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                                AI chatbot
                            </span>
                        ) : isWaiting ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                                <span className="material-symbols-outlined text-[14px]">person_raised_hand</span>
                                Žádá člověka
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                                <span className="material-symbols-outlined text-[14px]">support_agent</span>
                                Řeší člověk
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setGuestOpsOpen(true)}
                        className="text-left text-xs text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
                    >
                        {conversation.guest_room ? `Pokoj ${conversation.guest_room} · ` : ''}
                        Host preferuje {guestMeta.label} · klikni pro kartu hosta
                    </button>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {conversation.guest_banned ? (
                        <button
                            type="button"
                            onClick={async () => {
                                if (!window.confirm('Zrušit ban a obnovit hostovi přístup k chatu?')) return;
                                setUnbanning(true);
                                try {
                                    const { data } = await http.post(
                                        `/api/concierge/conversations/${conversation.id}/unban`,
                                    );
                                    if (data?.conversation) applyConversation(data.conversation);
                                    onListRefresh?.({ silent: true });
                                } finally {
                                    setUnbanning(false);
                                }
                            }}
                            disabled={unbanning}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            title="Zrušit ban hosta"
                        >
                            <span className="material-symbols-outlined text-[18px]">lock_open</span>
                            {unbanning ? 'Ruším…' : 'Zrušit ban'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setBanOpen(true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                            title="Zabanovat hosta"
                        >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                            Zabanovat
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setGuestOpsOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                        title="Karta hosta a rychlé akce"
                    >
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                        Karta hosta
                    </button>
                    {isWaiting && !isClosed ? (
                        <button
                            type="button"
                            onClick={handleTakeOver}
                            disabled={takingOver}
                            className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                            {takingOver ? 'Přebírám…' : 'Převzít kontrolu'}
                        </button>
                    ) : null}
                    {(isStaffMode || isWaiting) && !isClosed ? (
                        <button
                            type="button"
                            onClick={handleReleaseToBot}
                            disabled={takingOver}
                            className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                            title="Vrátit chat AI chatbotu"
                        >
                            {takingOver ? 'Vracím…' : 'Vrátit AI'}
                        </button>
                    ) : null}
                    <span
                        className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium sm:inline-flex ${
                            live
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                        title={
                            realtimeMode === 'realtime'
                                ? 'Supabase Realtime — okamžitá obnova'
                                : 'Záložní obnova každé 3 s'
                        }
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-emerald-500' : 'bg-gray-400'}`}
                        />
                        Live
                    </span>
                    <button
                        type="button"
                        onClick={load}
                        className="rounded-lg p-2 text-gray-500 hover:bg-white/70 dark:hover:bg-gray-700"
                        title="Obnovit"
                    >
                        <span className="material-symbols-outlined text-[22px]">refresh</span>
                    </button>
                </div>
            </header>

            {isBotMode ? (
                <div className="shrink-0 border-b border-violet-200 bg-violet-100/80 px-4 py-3 text-sm text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/50 dark:text-violet-100">
                    <p className="mx-auto max-w-2xl text-xs leading-relaxed sm:text-sm">
                        <span className="material-symbols-outlined mr-1 align-middle text-base">
                            smart_toy
                        </span>
                        Chat teď vede <strong>AI chatbot</strong>. Z adminu zatím nemůžeš psát — nejdřív
                        převeď kontrolu na sebe. Host dostane notifikaci jen ve své appce.
                    </p>
                </div>
            ) : isWaiting ? (
                <div className="shrink-0 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-100">
                    <p className="mx-auto max-w-2xl text-xs leading-relaxed sm:text-sm">
                        <span className="material-symbols-outlined mr-1 align-middle text-base animate-pulse">
                            person_raised_hand
                        </span>
                        Host <strong>žádá živou recepci</strong>. AI už neodpovídá. Můžeš rovnou napsat
                        odpověď (tím chat převezmeš), nebo kliknout „Převzít kontrolu“.
                    </p>
                </div>
            ) : conversation.translation_enabled ? (
                <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    <span className="material-symbols-outlined mr-1 align-middle text-base">translate</span>
                    Chat řídíš ty. Hostovy zprávy vidíš v češtině; ty odpovídáš česky — host uvidí překlad do{' '}
                    <strong>
                        {guestMeta.flag} {guestMeta.label}
                    </strong>
                    .
                </div>
            ) : (
                <div className="shrink-0 border-b border-orange-200 bg-orange-50 px-4 py-2 text-xs text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-200">
                    <span className="material-symbols-outlined mr-1 align-middle text-base">support_agent</span>
                    Chat řídíš ty — AI chatbot je vypnutý.
                </div>
            )}

            <div
                ref={scrollRef}
                className={`min-h-0 flex-1 overflow-y-auto p-4 ${
                    isBotMode
                        ? 'bg-violet-50/50 dark:bg-violet-950/20'
                        : isWaiting
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : 'bg-gray-100/80 dark:bg-gray-900/40'
                }`}
            >
                <div className="mx-auto flex max-w-2xl flex-col gap-3">
                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            guestLocale={conversation.guest_locale}
                        />
                    ))}
                    {guestTyping ? (
                        <div
                            className="flex justify-start pl-1"
                            title="Host píše…"
                            aria-label="Host píše"
                        >
                            <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-orange-50 px-3 py-2 text-sm text-orange-800 dark:bg-orange-950/40 dark:text-orange-200">
                                <span className="animate-pulse">✍️</span>
                                <span className="text-[11px] font-medium">píše…</span>
                            </span>
                        </div>
                    ) : (
                        <WaitingForGuestEyes
                            visible={waitingForGuestReply}
                            guestOnline={guestOnline}
                        />
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {isBotMode && !isClosed ? (
                <div className="shrink-0 border-t border-violet-300 bg-gradient-to-t from-violet-100 to-violet-50 px-4 py-5 dark:border-violet-900/50 dark:from-violet-950/60 dark:to-violet-950/30">
                    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow">
                            <span className="material-symbols-outlined text-[28px]">smart_toy</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-violet-950 dark:text-violet-100">
                                AI chatbot je aktivní
                            </p>
                            <p className="mt-1 text-xs text-violet-800 dark:text-violet-200">
                                Psát hostovi můžeš až po převzetí. Chatbot se vypne a host uvidí ve své
                                appce, že živá obsluha převzala kontrolu (tuto zprávu v adminu neuvidíš).
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={handleTakeOver}
                                disabled={takingOver}
                                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:opacity-60"
                            >
                                <span className="material-symbols-outlined">handshake</span>
                                {takingOver ? 'Přebírám kontrolu…' : 'Převzít kontrolu'}
                            </button>
                            {conversation.guest_banned ? null : (
                                <button
                                    type="button"
                                    onClick={() => setBanOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-violet-950/40 dark:text-red-200"
                                >
                                    <span className="material-symbols-outlined">block</span>
                                    Zabanovat hosta
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <form
                    onSubmit={handleSend}
                    className={`shrink-0 border-t p-4 ${
                        isWaiting
                            ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                >
                    <div className="mx-auto flex max-w-2xl flex-col gap-2">
                        {canCompose && !isClosed ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSatisfactionCheck}
                                    disabled={sendingCheck || hasPendingSatisfaction}
                                    title={
                                        hasPendingSatisfaction
                                            ? 'Už čekáš na odpověď hosta'
                                            : 'Pošle hostovi otázku s tlačítky Ano / Ne'
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100"
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        fact_check
                                    </span>
                                    {sendingCheck
                                        ? 'Odesílám…'
                                        : hasPendingSatisfaction
                                          ? 'Čeká na Ano/Ne'
                                          : 'Bylo to vyřešeno?'}
                                </button>
                            </div>
                        ) : null}
                        <div className="flex gap-2">
                            <textarea
                                value={reply}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setReply(next);
                                    if (next.trim()) {
                                        notifyTyping();
                                    } else {
                                        stopTyping();
                                    }
                                }}
                                onBlur={() => stopTyping()}
                                rows={2}
                                disabled={sending || isClosed || !canCompose}
                                placeholder={
                                    isClosed
                                        ? conversation.status === 'archived'
                                          ? 'Konverzace je archivovaná'
                                          : 'Konverzace je uzavřená'
                                        : isWaiting
                                          ? 'Napište odpověď — tím chat převezmete…'
                                          : 'Napište odpověď pro hosta…'
                                }
                                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={sending || !reply.trim() || isClosed || !canCompose}
                                className="flex h-auto shrink-0 items-center justify-center rounded-xl px-4 text-white transition disabled:opacity-50"
                                style={{ backgroundColor: PRIMARY_ORANGE }}
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {guestOpsOpen ? (
                <GuestOpsModal
                    conversationId={conversation.id}
                    guestBanned={Boolean(conversation.guest_banned)}
                    onClose={() => setGuestOpsOpen(false)}
                    onUpdated={(data) => {
                        if (data?.conversation) {
                            setConversation((prev) =>
                                prev
                                    ? {
                                          ...prev,
                                          guest_room: data.conversation.guest_room ?? prev.guest_room,
                                          guest_name: data.conversation.guest_name ?? prev.guest_name,
                                          guest_banned: data.conversation.guest_banned ?? prev.guest_banned,
                                          status: data.conversation.status ?? prev.status,
                                      }
                                    : prev,
                            );
                            onListRefresh?.({ silent: true });
                        }
                    }}
                    onOpenBan={() => {
                        setGuestOpsOpen(false);
                        setBanOpen(true);
                    }}
                    onUnbanned={(conv) => {
                        if (conv) applyConversation(conv);
                        onListRefresh?.({ silent: true });
                    }}
                />
            ) : null}
            {banOpen ? (
                <BanGuestModal
                    conversationId={conversation.id}
                    guestName={conversation.guest_name}
                    onClose={() => setBanOpen(false)}
                    onBanned={() => {
                        onListRefresh?.({ silent: true });
                        onLeaveThread?.();
                    }}
                />
            ) : null}
        </div>
    );
}

export function Concierge() {
    const { isEnabled: checkEnabled } = useModules();
    const isEnabled = checkEnabled('concierge');
    const [conversations, setConversations] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('all');
    const [localeFilter, setLocaleFilter] = useState('');
    const [searchQ, setSearchQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [panel, setPanel] = useState('chat');
    const [selectedBanId, setSelectedBanId] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQ), 400);
        return () => clearTimeout(t);
    }, [searchQ]);

    const loadConversations = useCallback((options = {}) => {
        const silent = options.silent === true;
        if (!silent) {
            setListLoading(true);
            setListError(null);
        }
        const params = {};
        if (filter === 'unread') params.unread_only = 1;
        if (localeFilter) params.locale = localeFilter;
        if (debouncedQ.trim()) params.q = debouncedQ.trim();

        http
            .get('/api/concierge/conversations', { params })
            .then((res) => {
                setConversations(res.data.conversations ?? []);
                setUnreadTotal(res.data.unread_total ?? 0);
            })
            .catch((err) => {
                if (!silent) {
                    setListError(
                        err.response?.data?.message ||
                            'Konverzace se nepodařilo načíst. Spusť SQL hotel_concierge_chat.sql v Supabase.',
                    );
                    setConversations([]);
                }
            })
            .finally(() => {
                if (!silent) setListLoading(false);
            });
    }, [filter, localeFilter, debouncedQ]);

    const pollList = useCallback(() => {
        loadConversations({ silent: true });
    }, [loadConversations]);

    const pollThreadRef = useRef(null);

    const { mode: realtimeMode } = useConciergeRealtime({
        conversationId: selectedId,
        enabled: isEnabled === true,
        onListChange: pollList,
        onThreadChange: () => pollThreadRef.current?.(),
    });

    useVisibilityPolling(pollList, LIST_FALLBACK_POLL_MS, isEnabled === true && realtimeMode !== 'realtime');

    useEffect(() => {
        if (isEnabled) loadConversations();
    }, [isEnabled, loadConversations]);

    useEffect(() => {
        if (!selectedId || listLoading) return;
        if (!conversations.some((c) => c.id === selectedId)) {
            setSelectedId(null);
        }
    }, [conversations, selectedId, listLoading]);

    const modeCounts = conversations.reduce(
        (acc, c) => {
            const mode = resolveHandlerMode(c.handler_mode);
            acc[mode] += 1;
            return acc;
        },
        { bot: 0, waiting: 0, staff: 0 },
    );

    const visibleConversations = conversations
        .filter((c) => (modeFilter === 'all' ? true : resolveHandlerMode(c.handler_mode) === modeFilter))
        .slice()
        .sort((a, b) => {
            const rank = (item) => {
                const mode = resolveHandlerMode(item.handler_mode);
                if (mode === 'waiting') return 0;
                if (mode === 'staff' && item.unread_count > 0) return 1;
                if (mode === 'staff') return 2;
                return 3;
            };
            const diff = rank(a) - rank(b);
            if (diff !== 0) return diff;
            return String(b.last_message_iso || '').localeCompare(String(a.last_message_iso || ''));
        });

    if (!isEnabled) {
        return <NotFound />;
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
            {/* --- LEVÝ PANEL (Sidebar) --- */}
            <aside
                className={`flex h-full w-full shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:w-[360px] xl:w-[400px] ${
                    (panel === 'bans' ? selectedBanId : selectedId) ? 'hidden lg:flex' : 'flex'
                }`}
            >
                {/* Mobilní hlavička (zobrazena pouze na mobilu, pokud není otevřen chat) */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 lg:hidden dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Concierge</h1>
                        {unreadTotal > 0 ? (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                {unreadTotal}
                            </span>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={() => (panel === 'bans' ? null : loadConversations())}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <span className="material-symbols-outlined text-xl">refresh</span>
                    </button>
                </div>
                    <div className="shrink-0 space-y-3 border-b border-gray-100 p-3 dark:border-gray-700">
                        <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                            {[
                                { key: 'chat', label: 'Chat' },
                                { key: 'bans', label: 'Bany' },
                            ].map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => {
                                        setPanel(p.key);
                                        if (p.key === 'chat') setSelectedBanId(null);
                                    }}
                                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                                        panel === p.key
                                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <input
                            type="search"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder={panel === 'bans' ? 'Hledat ban, hosta, důvod…' : 'Hledat hosta, pokoj…'}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                        {panel === 'chat' ? (
                            <>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'Vše' },
                                { key: 'unread', label: 'Nepřečtené' },
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    onClick={() => setFilter(f.key)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                        filter === f.key
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                            {[
                                { key: 'all', label: 'Vše stavy', count: conversations.length },
                                {
                                    key: 'waiting',
                                    label: 'Žádá člověka',
                                    count: modeCounts.waiting,
                                    activeClass: 'bg-amber-500 text-white',
                                },
                                {
                                    key: 'staff',
                                    label: 'Řeší člověk',
                                    count: modeCounts.staff,
                                    activeClass: 'bg-orange-500 text-white',
                                },
                                {
                                    key: 'bot',
                                    label: 'AI chatbot',
                                    count: modeCounts.bot,
                                    activeClass: 'bg-violet-600 text-white',
                                },
                            ].map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    onClick={() => setModeFilter(f.key)}
                                    className={`rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold leading-tight transition ${
                                        modeFilter === f.key
                                            ? f.activeClass || 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    <span className="block truncate">{f.label}</span>
                                    <span className="opacity-80">{f.count}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setLocaleFilter('')}
                                    className={`rounded-full px-2 py-1 text-xs ${
                                        !localeFilter ? 'ring-2 ring-orange-400' : 'opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    🌐
                                </button>
                                {GUEST_LOCALES.map((l) => (
                                    <button
                                        key={l.code}
                                        type="button"
                                        onClick={() => setLocaleFilter(localeFilter === l.code ? '' : l.code)}
                                        title={l.label}
                                        className={`rounded-full px-2 py-1 text-base transition ${
                                            localeFilter === l.code
                                                ? 'ring-2 ring-orange-400'
                                                : 'opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        {l.flag}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => loadConversations()}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-orange-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-orange-500 dark:hover:bg-gray-700"
                                title="Obnovit konverzace"
                            >
                                <span className="material-symbols-outlined text-[16px]">refresh</span>
                                Obnovit
                            </button>
                        </div>
                            </>
                        ) : null}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {panel === 'bans' ? (
                            <ConciergeBanList
                                searchQ={debouncedQ}
                                selectedId={selectedBanId}
                                onSelect={setSelectedBanId}
                            />
                        ) : listLoading ? (
                            <p className="p-6 text-center text-sm text-gray-500">Načítání…</p>
                        ) : visibleConversations.length === 0 ? (
                            <p className="p-6 text-center text-sm text-gray-500">Žádné konverzace.</p>
                        ) : (
                            visibleConversations.map((c) => (
                                <ConversationListItem
                                    key={c.id}
                                    item={c}
                                    active={selectedId === c.id}
                                    onClick={() => setSelectedId(c.id)}
                                />
                            ))
                        )}
                    </div>
                </aside>

                <main
                    className={`flex min-h-0 min-w-0 flex-1 flex-col ${
                        (panel === 'bans' ? selectedBanId : selectedId) ? 'flex' : 'hidden lg:flex'
                    }`}
                >
                    {panel === 'bans' ? (
                        <>
                            {selectedBanId ? (
                                <button
                                    type="button"
                                    onClick={() => setSelectedBanId(null)}
                                    className="flex items-center gap-1 border-b border-gray-200 px-4 py-2 text-sm text-gray-600 lg:hidden dark:border-gray-700"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                    Zpět na seznam
                                </button>
                            ) : null}
                            <ConciergeBanDetail
                                banId={selectedBanId}
                                onUnbanned={() => loadConversations({ silent: true })}
                            />
                        </>
                    ) : (
                        <>
                    {listError ? (
                        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            {listError}
                        </div>
                    ) : null}
                    {selectedId ? (
                        <button
                            type="button"
                            onClick={() => setSelectedId(null)}
                            className="flex items-center gap-1 border-b border-gray-200 px-4 py-2 text-sm text-gray-600 lg:hidden dark:border-gray-700"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Zpět na seznam
                        </button>
                    ) : null}
                    <ConversationThread
                        key={selectedId ?? 'none'}
                        conversationId={selectedId}
                        onListRefresh={loadConversations}
                        onLeaveThread={() => setSelectedId(null)}
                        realtimeMode={realtimeMode}
                        pollThreadRef={pollThreadRef}
                    />
                        </>
                    )}
                </main>
        </div>
    );
}
