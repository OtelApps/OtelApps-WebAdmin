import React, { useCallback, useEffect, useRef, useState } from 'react';
import http from '../../lib/http';
import { useModules } from '../../context/ModulesContext';
import { NotFound } from '../shared/NotFound';
import { GuestLocaleFlag } from './GuestLocaleFlag';
import { GUEST_LOCALES, localeMeta } from './conciergeLocales';
import {
    isNearBottom,
    messagesFingerprint,
    useVisibilityPolling,
} from './useConciergePolling';
import { useConciergeRealtime } from './useConciergeRealtime';

const PRIMARY_ORANGE = '#FF9F00';
const GUEST_NAME_BLUE = '#4A90E2';
const THREAD_FALLBACK_POLL_MS = 3000;
const LIST_FALLBACK_POLL_MS = 6000;

function ConversationListItem({ item, active, onClick }) {
    const unread = item.unread_count > 0;
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
            className={`flex w-full gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition dark:border-gray-700 ${
                active
                    ? 'bg-orange-50/90 dark:bg-orange-950/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
            } ${unread ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}`}
        >
            <div className="relative shrink-0">
                <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: unread ? GUEST_NAME_BLUE : '#9CA3AF' }}
                >
                    {initials}
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
                <div className="mt-0.5 flex items-center gap-2">
                    <GuestLocaleFlag locale={item.guest_locale} size="sm" />
                    {item.guest_room ? (
                        <span className="text-xs text-gray-400">pokoj {item.guest_room}</span>
                    ) : null}
                    {item.status === 'closed' ? (
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                            Closed
                        </span>
                    ) : null}
                </div>
                <p
                    className={`mt-1 line-clamp-2 text-xs ${unread ? 'font-medium text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    {item.preview || '—'}
                </p>
            </div>
        </button>
    );
}

function MessageBubble({ message, guestLocale }) {
    const isStaff = message.is_staff;
    const guestMeta = localeMeta(guestLocale);

    return (
        <div className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isStaff
                        ? 'rounded-br-md bg-orange-500 text-white'
                        : 'rounded-bl-md bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                }`}
            >
                {isStaff && message.staff_display_name ? (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase opacity-80">
                        {message.staff_display_name}
                    </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                {isStaff && message.body_translated ? (
                    <p className="mt-2 border-t border-white/30 pt-2 text-xs italic opacity-90">
                        → {guestMeta.flag} {message.body_translated}
                    </p>
                ) : isStaff ? (
                    <p className="mt-1.5 text-[10px] italic opacity-70">
                        Překlad do {guestMeta.label} — po napojení chatbota
                    </p>
                ) : null}
                <p className={`mt-1 text-[10px] ${isStaff ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.time}
                </p>
            </div>
        </div>
    );
}

function ConversationThread({ conversationId, onListRefresh, realtimeMode, pollThreadRef }) {
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [live, setLive] = useState(true);
    const bottomRef = useRef(null);
    const scrollRef = useRef(null);
    const fingerprintRef = useRef('');
    const markReadPendingRef = useRef(false);

    const scrollToBottom = useCallback((smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    const applyConversation = useCallback(
        (conv, { scrollIfNearBottom = false } = {}) => {
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
        if (!conversationId || sending) return;
        try {
            const { data } = await http.get(`/api/concierge/conversations/${conversationId}`);
            setLive(true);
            const conv = data.conversation;
            const prevFp = fingerprintRef.current;
            const nextFp = messagesFingerprint(conv.messages);
            if (nextFp === prevFp) return;

            const prevCount = prevFp ? Number(prevFp.split(':')[0]) || 0 : 0;
            const nextCount = conv.messages?.length ?? 0;
            const lastMsg = conv.messages?.[nextCount - 1];
            const newGuestMessage =
                nextCount > prevCount && lastMsg && !lastMsg.is_staff;

            applyConversation(conv, { scrollIfNearBottom: true });

            if (newGuestMessage && !markReadPendingRef.current) {
                markReadPendingRef.current = true;
                try {
                    const readRes = await http.post(
                        `/api/concierge/conversations/${conversationId}/read`,
                    );
                    if (readRes.data?.conversation) {
                        applyConversation(readRes.data.conversation, { scrollIfNearBottom: false });
                    }
                    onListRefresh?.({ silent: true });
                } finally {
                    markReadPendingRef.current = false;
                }
            }
        } catch {
            setLive(false);
        }
    }, [conversationId, sending, applyConversation, onListRefresh]);

    useEffect(() => {
        if (pollThreadRef) pollThreadRef.current = pollThread;
        return () => {
            if (pollThreadRef) pollThreadRef.current = null;
        };
    }, [pollThread, pollThreadRef]);

    useVisibilityPolling(
        pollThread,
        THREAD_FALLBACK_POLL_MS,
        Boolean(conversationId) && realtimeMode !== 'realtime',
    );

    const load = () => {
        if (!conversationId) return;
        setLoading(true);
        setError(null);
        http
            .get(`/api/concierge/conversations/${conversationId}`)
            .then((res) => {
                applyConversation(res.data.conversation, { scrollIfNearBottom: false });
                setLive(true);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Konverzaci se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setConversation(null);
        fingerprintRef.current = '';
        if (!conversationId) return;

        setLoading(true);
        setError(null);

        http
            .get(`/api/concierge/conversations/${conversationId}`)
            .then((res) => {
                applyConversation(res.data.conversation, { scrollIfNearBottom: false });
                setLive(true);
                return http.post(`/api/concierge/conversations/${conversationId}/read`);
            })
            .then((res) => {
                if (res?.data?.conversation) {
                    applyConversation(res.data.conversation, { scrollIfNearBottom: false });
                    onListRefresh?.({ silent: true });
                }
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Konverzaci se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, [conversationId, applyConversation, onListRefresh]);

    useEffect(() => {
        if (conversation?.messages?.length) {
            scrollToBottom(false);
        }
    }, [conversationId, scrollToBottom]);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = reply.trim();
        if (!text || !conversationId) return;
        setSending(true);
        try {
            const { data } = await http.post(`/api/concierge/conversations/${conversationId}/messages`, {
                body: text,
            });
            applyConversation(data.conversation, { scrollIfNearBottom: true });
            setReply('');
            onListRefresh?.({ silent: true });
        } catch (err) {
            window.alert(err.response?.data?.message || 'Odeslání se nezdařilo.');
        } finally {
            setSending(false);
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

    if (loading && !conversation) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-gray-500">Načítání konverzace…</p>
            </div>
        );
    }

    if (error && !conversation) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
                <p className="text-red-600">{error}</p>
                <button type="button" onClick={load} className="text-sm text-orange-600 underline">
                    Zkusit znovu
                </button>
            </div>
        );
    }

    if (!conversation) return null;

    const guestMeta = localeMeta(conversation.guest_locale);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                            {conversation.guest_name}
                        </h2>
                        <GuestLocaleFlag locale={conversation.guest_locale} size="lg" showLabel />
                    </div>
                    <p className="text-xs text-gray-500">
                        {conversation.guest_room ? `Pokoj ${conversation.guest_room} · ` : ''}
                        Host preferuje {guestMeta.label}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Obnovit"
                    >
                        <span className="material-symbols-outlined text-[22px]">refresh</span>
                    </button>
                </div>
            </header>

            <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <span className="material-symbols-outlined mr-1 align-middle text-base">translate</span>
                Odpovídáte česky — host uvidí zprávu v jazyce{' '}
                <strong>
                    {guestMeta.flag} {guestMeta.label}
                </strong>{' '}
                po napojení překladového chatbota.
            </div>

            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto bg-gray-100/80 p-4 dark:bg-gray-900/40"
            >
                <div className="mx-auto flex max-w-2xl flex-col gap-3">
                    {(conversation.messages ?? []).map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            guestLocale={conversation.guest_locale}
                        />
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>

            <form
                onSubmit={handleSend}
                className="shrink-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <div className="mx-auto flex max-w-2xl gap-2">
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={2}
                        disabled={sending || conversation.status === 'closed'}
                        placeholder={
                            conversation.status === 'closed'
                                ? 'Konverzace je uzavřená'
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
                        disabled={sending || !reply.trim() || conversation.status === 'closed'}
                        className="flex h-auto shrink-0 items-center justify-center rounded-xl px-4 text-white transition disabled:opacity-50"
                        style={{ backgroundColor: PRIMARY_ORANGE }}
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </form>
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
    const [localeFilter, setLocaleFilter] = useState('');
    const [searchQ, setSearchQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');

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

    if (!isEnabled) {
        return <NotFound />;
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
            {/* --- LEVÝ PANEL (Sidebar) --- */}
            <aside
                className={`flex h-full w-full shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:w-[360px] xl:w-[400px] ${
                    selectedId ? 'hidden lg:flex' : 'flex'
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
                        onClick={() => loadConversations()}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <span className="material-symbols-outlined text-xl">refresh</span>
                    </button>
                </div>
                    <div className="shrink-0 space-y-3 border-b border-gray-100 p-3 dark:border-gray-700">
                        <input
                            type="search"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="Hledat hosta, pokoj…"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
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
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {listLoading ? (
                            <p className="p-6 text-center text-sm text-gray-500">Načítání…</p>
                        ) : conversations.length === 0 ? (
                            <p className="p-6 text-center text-sm text-gray-500">Žádné konverzace.</p>
                        ) : (
                            conversations.map((c) => (
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
                        selectedId ? 'flex' : 'hidden lg:flex'
                    }`}
                >


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
                        conversationId={selectedId}
                        onListRefresh={loadConversations}
                        realtimeMode={realtimeMode}
                        pollThreadRef={pollThreadRef}
                    />
                </main>
        </div>
    );
}
