import { useCallback, useEffect, useRef, useState } from 'react';
import http from '../../lib/http';

const HEARTBEAT_MS = 8000;
const TYPING_IDLE_MS = 2500;

/**
 * Presence přes Laravel heartbeat (spolehlivější než Supabase Realtime Presence).
 */
export function useConciergeLiveChannel({
    conversationId,
    enabled = true,
    busy = false,
}) {
    const [guestOnline, setGuestOnline] = useState(false);
    const [guestTyping, setGuestTyping] = useState(false);
    const typingUntilRef = useRef(0);
    const busyRef = useRef(busy);
    busyRef.current = busy;
    const inFlightRef = useRef(false);

    const resolveStatus = useCallback(() => {
        if (Date.now() < typingUntilRef.current) return 'typing';
        if (busyRef.current || (typeof document !== 'undefined' && document.hidden)) return 'busy';
        return 'in_chat';
    }, []);

    const beat = useCallback(async () => {
        if (!conversationId || inFlightRef.current) return;
        inFlightRef.current = true;
        try {
            const { data } = await http.post(`/api/concierge/conversations/${conversationId}/presence`, {
                status: resolveStatus(),
            });
            setGuestOnline(Boolean(data?.guest_online ?? data?.peer?.online));
            setGuestTyping(Boolean(data?.guest_typing ?? data?.peer?.typing));
        } catch {
            // best-effort
        } finally {
            inFlightRef.current = false;
        }
    }, [conversationId, resolveStatus]);

    const notifyTyping = useCallback(() => {
        typingUntilRef.current = Date.now() + TYPING_IDLE_MS;
        void beat();
    }, [beat]);

    const stopTyping = useCallback(() => {
        typingUntilRef.current = 0;
        void beat();
    }, [beat]);

    useEffect(() => {
        if (!enabled || !conversationId) {
            setGuestOnline(false);
            setGuestTyping(false);
            return undefined;
        }

        void beat();
        const interval = setInterval(() => void beat(), HEARTBEAT_MS);

        const onVisibility = () => void beat();
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibility);
            // Poslední beat jako busy, když admin odejde z vlákna
            typingUntilRef.current = 0;
            http
                .post(`/api/concierge/conversations/${conversationId}/presence`, { status: 'busy' })
                .catch(() => {});
            setGuestOnline(false);
            setGuestTyping(false);
        };
    }, [beat, conversationId, enabled]);

    useEffect(() => {
        if (enabled && conversationId) void beat();
    }, [busy, beat, conversationId, enabled]);

    return {
        guestOnline,
        guestTyping,
        notifyTyping,
        stopTyping,
    };
}
