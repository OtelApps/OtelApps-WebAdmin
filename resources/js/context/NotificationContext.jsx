import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

const NotificationContext = createContext(null);

const SEEN_KEY = 'otelapps_seen_notification_ids';
const BASE_TITLE = typeof document !== 'undefined' ? document.title : 'Otel Apps Hotel';

function loadSeenIds() {
    try {
        const raw = sessionStorage.getItem(SEEN_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveSeenIds(ids) {
    try {
        sessionStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-200)));
    } catch {
        // ignore
    }
}

function getBrowserPermission() {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const playTone = (freq, start, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        };
        playTone(880, now, 0.14);
        playTone(1175, now + 0.16, 0.18);
    } catch {
        // ignore
    }
}

function showDesktopNotification(item, { navigate, markRead }) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    const tabHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const options = {
        body: item.body || undefined,
        tag: `otelapps-${item.id}`,
        renotify: true,
        icon: '/logo.png',
        badge: '/logo.png',
        lang: 'cs',
        requireInteraction: tabHidden,
        data: { link_path: item.link_path, id: item.id },
    };

    try {
        const notif = new Notification(item.title, options);
        notif.onclick = () => {
            window.focus();
            if (item.id && markRead) {
                markRead({ id: item.id });
            }
            if (item.link_path) {
                navigate(item.link_path);
            }
            notif.close();
        };
    } catch {
        // ignore (např. insecure context)
    }
}

function updateDocumentTitle(unreadCount) {
    if (typeof document === 'undefined') return;
    document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;
}

export function NotificationProvider({ children }) {
    const navigate = useNavigate();
    const [badges, setBadges] = useState({ activity: 0, concierge: 0, total: 0 });
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferences, setPreferences] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [browserPermission, setBrowserPermission] = useState(getBrowserPermission);
    const seenRef = useRef(loadSeenIds());
    const pollRef = useRef(null);
    const prefsRef = useRef(null);
    const markReadRef = useRef(null);

    useEffect(() => {
        prefsRef.current = preferences;
    }, [preferences]);

    useEffect(() => {
        updateDocumentTitle(unreadCount);
        return () => updateDocumentTitle(0);
    }, [unreadCount]);

    const pushToast = useCallback((notification) => {
        const id = `toast-${notification.id}-${Date.now()}`;
        setToasts((prev) => [...prev, { ...notification, toastId: id }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.toastId !== id));
        }, 8000);
    }, []);

    const notifyNewItems = useCallback((items, prefs) => {
        const unseen = items.filter(
            (n) => !n.read_at && !seenRef.current.includes(n.id),
        );
        if (unseen.length === 0) return;

        unseen.forEach((n) => {
            seenRef.current.push(n.id);
            if (prefs.toast_enabled) {
                pushToast(n);
            }
            if (prefs.browser_notifications) {
                showDesktopNotification(n, {
                    navigate,
                    markRead: (payload) => markReadRef.current?.(payload),
                });
            }
        });

        if (prefs.sound_enabled) {
            playNotificationSound();
        }

        saveSeenIds(seenRef.current);
    }, [navigate, pushToast]);

    const fetchSummary = useCallback(async (withSync = true) => {
        try {
            const params = withSync ? { sync: 1 } : undefined;
            const { data } = await http.get('/api/notifications/summary', { params });
            setBadges(data.badges ?? { activity: 0, concierge: 0, total: 0 });
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
            setPreferences(data.preferences ?? null);
            notifyNewItems(data.notifications ?? [], data.preferences ?? {});
            setBrowserPermission(getBrowserPermission());
        } catch {
            // tabulky nemusí existovat — tichý fallback
        } finally {
            setLoading(false);
        }
    }, [notifyNewItems]);

    useEffect(() => {
        fetchSummary(true);
    }, [fetchSummary]);

    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (!preferences) return undefined;

        const intervalMs = (preferences.poll_interval_seconds ?? 15) * 1000;
        // Sync je na backendu throttlený (30 s) — vždy posíláme sync=1, ať toasty/desktop notifs fungují.
        pollRef.current = setInterval(() => fetchSummary(true), intervalMs);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [preferences?.poll_interval_seconds, fetchSummary]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                setBrowserPermission(getBrowserPermission());
                fetchSummary(true);
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
        };
    }, [fetchSummary]);

    const markRead = useCallback(async (payload = {}) => {
        try {
            const { data } = await http.post('/api/notifications/read', payload);
            setBadges(data.summary?.badges ?? { activity: 0, concierge: 0, total: 0 });
            setNotifications(data.summary?.notifications ?? []);
            setUnreadCount(data.summary?.unread_count ?? 0);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        markReadRef.current = markRead;
    }, [markRead]);

    const markAllRead = useCallback(() => markRead({ all: true }), [markRead]);

    const openNotification = useCallback(async (notification) => {
        await markRead({ id: notification.id });
        navigate(notification.link_path);
    }, [markRead, navigate]);

    const saveSettings = useCallback(async (nextPrefs) => {
        const { data } = await http.put('/api/notifications/settings', nextPrefs);
        setPreferences(data.preferences ?? nextPrefs);
        await fetchSummary(true);
        return data.preferences;
    }, [fetchSummary]);

    const togglePreference = useCallback(async (key) => {
        const current = prefsRef.current;
        if (!current || !(key in current)) return null;
        return saveSettings({ ...current, [key]: !current[key] });
    }, [saveSettings]);

    const requestBrowserPermission = useCallback(async () => {
        if (typeof Notification === 'undefined') {
            setBrowserPermission('unsupported');
            return 'unsupported';
        }
        const result = await Notification.requestPermission();
        setBrowserPermission(result);
        if (result === 'granted' && prefsRef.current) {
            await saveSettings({ ...prefsRef.current, browser_notifications: true });
        }
        return result;
    }, [saveSettings]);

    const value = {
        badges,
        notifications,
        unreadCount,
        preferences,
        toasts,
        loading,
        settingsOpen,
        setSettingsOpen,
        browserPermission,
        fetchSummary,
        markRead,
        markAllRead,
        openNotification,
        saveSettings,
        togglePreference,
        requestBrowserPermission,
        dismissToast: (toastId) => setToasts((prev) => prev.filter((t) => t.toastId !== toastId)),
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return ctx;
}
