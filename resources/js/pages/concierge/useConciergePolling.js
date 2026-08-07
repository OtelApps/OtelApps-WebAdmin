import { useCallback, useEffect, useRef } from 'react';

/** Interval v ms; neběží, když je záložka skrytá. */
export function useVisibilityPolling(callback, intervalMs, enabled = true) {
    const savedCallback = useRef(callback);
    const enabledRef = useRef(enabled);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    useEffect(() => {
        if (!enabled || intervalMs <= 0) return undefined;

        const tick = () => {
            if (document.hidden || !enabledRef.current) return;
            savedCallback.current();
        };

        tick();
        const id = window.setInterval(tick, intervalMs);
        const onVisible = () => {
            if (!document.hidden) tick();
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            window.clearInterval(id);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [enabled, intervalMs]);
}

export function messagesFingerprint(messages) {
    if (!messages?.length) return '';
    const last = messages[messages.length - 1];
    // Musí zahrnout překlady a stav kontroly spokojenosti (Ano/Ne).
    const translationSig = messages
        .map(
            (m) =>
                `${m.id}:${m.body_translated ? String(m.body_translated).length : 0}:${m.satisfaction_answer ?? ''}:${m.staff_display_name ?? ''}:${m.payload?.actions?.length ?? 0}`,
        )
        .join('|');
    return `${messages.length}:${last.id}:${last.created_at ?? ''}:${translationSig}`;
}

export function isNearBottom(el, threshold = 120) {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}
