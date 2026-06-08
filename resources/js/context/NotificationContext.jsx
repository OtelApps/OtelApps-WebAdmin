import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

const NotificationContext = createContext(null);

const SEEN_KEY = 'otelapps_seen_notification_ids';

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

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.08;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch {
        // ignore
    }
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
    const seenRef = useRef(loadSeenIds());
    const pollRef = useRef(null);

    const pushToast = useCallback((notification) => {
        const id = `toast-${notification.id}-${Date.now()}`;
        setToasts((prev) => [...prev, { ...notification, toastId: id }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.toastId !== id));
        }, 6000);
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
            if (prefs.browser_notifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                const notif = new Notification(n.title, {
                    body: n.body || undefined,
                    tag: n.id,
                });
                notif.onclick = () => {
                    window.focus();
                    navigate(n.link_path);
                    notif.close();
                };
            }
        });

        if (prefs.sound_enabled && unseen.length > 0) {
            playNotificationSound();
        }

        saveSeenIds(seenRef.current);
    }, [navigate, pushToast]);

    const fetchSummary = useCallback(async (withSync = false) => {
        try {
            const params = withSync ? { sync: 1 } : undefined;
            const { data } = await http.get('/api/notifications/summary', { params });
            setBadges(data.badges ?? { activity: 0, concierge: 0, total: 0 });
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
            setPreferences(data.preferences ?? null);
            notifyNewItems(data.notifications ?? [], data.preferences ?? {});
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
        pollRef.current = setInterval(() => fetchSummary(false), intervalMs);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [preferences?.poll_interval_seconds, fetchSummary]);

    const markRead = useCallback(async (payload = {}) => {
        try {
            const { data } = await http.post('/api/notifications/read', payload);
            setBadges(data.summary?.badges ?? badges);
            setNotifications(data.summary?.notifications ?? []);
            setUnreadCount(data.summary?.unread_count ?? 0);
        } catch {
            // ignore
        }
    }, [badges]);

    const markAllRead = useCallback(() => markRead({ all: true }), [markRead]);

    const openNotification = useCallback(async (notification) => {
        await markRead({ id: notification.id });
        navigate(notification.link_path);
    }, [markRead, navigate]);

    const saveSettings = useCallback(async (nextPrefs) => {
        const { data } = await http.put('/api/notifications/settings', nextPrefs);
        setPreferences(data.preferences ?? nextPrefs);
        await fetchSummary();
        return data.preferences;
    }, [fetchSummary]);

    const requestBrowserPermission = useCallback(async () => {
        if (typeof Notification === 'undefined') return 'unsupported';
        const result = await Notification.requestPermission();
        return result;
    }, []);

    const value = {
        badges,
        notifications,
        unreadCount,
        preferences,
        toasts,
        loading,
        settingsOpen,
        setSettingsOpen,
        fetchSummary,
        markRead,
        markAllRead,
        openNotification,
        saveSettings,
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
