import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import http from '../../lib/http';

const FALLBACK_POLL_MS = 8000;

/**
 * Supabase Realtime pro Concierge WebAdmin.
 * Při chybě nebo chybějící konfiguraci vrátí mode === 'polling' (fallback interval).
 */
export function useConciergeRealtime({ conversationId, onListChange, onThreadChange, enabled = true }) {
    const [mode, setMode] = useState('connecting');
    const clientRef = useRef(null);
    const listChannelRef = useRef(null);
    const threadChannelRef = useRef(null);
    const onListRef = useRef(onListChange);
    const onThreadRef = useRef(onThreadChange);

    useEffect(() => {
        onListRef.current = onListChange;
    }, [onListChange]);

    useEffect(() => {
        onThreadRef.current = onThreadChange;
    }, [onThreadChange]);

    useEffect(() => {
        if (!enabled) {
            setMode('polling');
            return undefined;
        }

        let cancelled = false;

        const cleanup = () => {
            if (listChannelRef.current && clientRef.current) {
                clientRef.current.removeChannel(listChannelRef.current);
                listChannelRef.current = null;
            }
            if (threadChannelRef.current && clientRef.current) {
                clientRef.current.removeChannel(threadChannelRef.current);
                threadChannelRef.current = null;
            }
        };

        (async () => {
            try {
                const { data } = await http.get('/api/concierge/realtime-config');
                if (cancelled) return;

                if (!data?.enabled || !data.url || !data.key || !data.access_token || !data.hotel_id) {
                    setMode('polling');
                    return;
                }

                const client = createClient(data.url, data.key, {
                    auth: { persistSession: false, autoRefreshToken: false },
                    global: {
                        headers: { Authorization: `Bearer ${data.access_token}` },
                    },
                });

                if (typeof client.realtime.setAuth === 'function') {
                    await client.realtime.setAuth(data.access_token);
                }

                if (cancelled) return;

                clientRef.current = client;

                const listChannel = client
                    .channel(`concierge-list-${data.hotel_id}`)
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'hotel_concierge_conversations',
                            filter: `hotel_id=eq.${data.hotel_id}`,
                        },
                        () => onListRef.current?.(),
                    )
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') setMode('realtime');
                        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                            setMode('polling');
                        }
                    });

                listChannelRef.current = listChannel;
            } catch {
                if (!cancelled) setMode('polling');
            }
        })();

        return () => {
            cancelled = true;
            cleanup();
            clientRef.current = null;
        };
    }, [enabled]);

    useEffect(() => {
        const client = clientRef.current;
        if (!client || mode !== 'realtime') {
            if (threadChannelRef.current && client) {
                client.removeChannel(threadChannelRef.current);
                threadChannelRef.current = null;
            }
            return undefined;
        }

        if (threadChannelRef.current) {
            client.removeChannel(threadChannelRef.current);
            threadChannelRef.current = null;
        }

        if (!conversationId) return undefined;

        const threadChannel = client
            .channel(`concierge-thread-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'hotel_concierge_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                () => onThreadRef.current?.(),
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'hotel_concierge_conversations',
                    filter: `id=eq.${conversationId}`,
                },
                () => onThreadRef.current?.(),
            )
            .subscribe();

        threadChannelRef.current = threadChannel;

        return () => {
            client.removeChannel(threadChannel);
            if (threadChannelRef.current === threadChannel) {
                threadChannelRef.current = null;
            }
        };
    }, [conversationId, mode]);

    return { mode, fallbackPollMs: FALLBACK_POLL_MS };
}
