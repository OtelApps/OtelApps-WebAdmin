import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

const NotificationContext = createContext(null);

const SEEN_KEY = 'otelapps_seen_notification_fps';
const BASE_TITLE = typeof document !== 'undefined' ? document.title : 'Otel Apps Hotel';

export const DEFAULT_NOTIFICATION_PREFS = {
    activity_enabled: true,
    activity_statuses: ['new', 'pending', 'in_progress'],
    concierge_enabled: true,
    toast_enabled: true,
    browser_notifications: true,
    sound_enabled: true,
    poll_interval_seconds: 15,
    guest_push_enabled: true,
    guest_push_on_status_change: true,
};

function loadSeenFingerprints() {
    try {
        const raw = sessionStorage.getItem(SEEN_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveSeenFingerprints(ids) {
    try {
        sessionStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-300)));
    } catch {
        // ignore
    }
}

function fingerprint(n) {
    return `${n.id}|${n.title}|${n.body || ''}`;
}

function getBrowserPermission() {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
}

let audioCtx = null;

function ensureAudioContext() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        if (!audioCtx) {
            audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    } catch {
        return null;
    }
}

export function unlockNotificationAudio() {
    ensureAudioContext();
}

export function playNotificationSound() {
    try {
        const ctx = ensureAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const playTone = (freq, start, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        };
        playTone(880, now, 0.14);
        playTone(1175, now + 0.15, 0.2);
    } catch {
        // ignore
    }
}

function showDesktopNotification(item, { navigate, markRead }) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    const tabHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    try {
        const notif = new Notification(item.title, {
            body: item.body || undefined,
            tag: `otelapps-${item.id}`,
            renotify: true,
            icon: '/logo.png',
            badge: '/logo.png',
            lang: 'cs',
            requireInteraction: tabHidden,
        });
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
        // ignore
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
    const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [browserPermission, setBrowserPermission] = useState(getBrowserPermission);
    const seenRef = useRef(loadSeenFingerprints());
    const pollRef = useRef(null);
    const summaryInFlightRef = useRef(false);
    const prefsRef = useRef(null);
    const markReadRef = useRef(null);
    const primedRef = useRef(false);

    useEffect(() => {
        prefsRef.current = preferences;
    }, [preferences]);

    useEffect(() => {
        updateDocumentTitle(unreadCount);
        return () => updateDocumentTitle(0);
    }, [unreadCount]);

    // Prohlížeče vyžadují user gesture pro zvuk — odemkneme při první interakci.
    useEffect(() => {
        const unlock = () => unlockNotificationAudio();
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
        return () => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
    }, []);

    const pushToast = useCallback((notification) => {
        const id = `toast-${notification.id}-${Date.now()}`;
        setToasts((prev) => [...prev.slice(-4), { ...notification, toastId: id }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.toastId !== id));
        }, 10000);
    }, []);

    const notifyNewItems = useCallback((items, prefs, { silent = false } = {}) => {
        const list = Array.isArray(items) ? items : [];

        if (silent || !primedRef.current) {
            list.forEach((n) => {
                const fp = fingerprint(n);
                if (!seenRef.current.includes(fp)) {
                    seenRef.current.push(fp);
                }
            });
            saveSeenFingerprints(seenRef.current);
            primedRef.current = true;
            return;
        }

        const unseen = list.filter((n) => !n.read_at && !seenRef.current.includes(fingerprint(n)));
        if (unseen.length === 0) return;

        unseen.forEach((n) => {
            seenRef.current.push(fingerprint(n));
            if (prefs.toast_enabled !== false) {
                pushToast(n);
            }
            if (prefs.browser_notifications !== false) {
                showDesktopNotification(n, {
                    navigate,
                    markRead: (payload) => markReadRef.current?.(payload),
                });
            }
        });

        if (prefs.sound_enabled !== false) {
            playNotificationSound();
        }

        saveSeenFingerprints(seenRef.current);
    }, [navigate, pushToast]);

    const fetchSummary = useCallback(async (withSync = true, { silent = false } = {}) => {
        // php artisan serve je jednovláknový — nepřekládat requesty přes sebe (jinak PUT settings čeká 30s).
        if (summaryInFlightRef.current) return;
        summaryInFlightRef.current = true;
        try {
            const params = withSync ? { sync: 1 } : undefined;
            const { data } = await http.get('/api/notifications/summary', {
                params,
                timeout: 20000,
            });
            setBadges(data.badges ?? { activity: 0, concierge: 0, total: 0 });
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
            const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(data.preferences ?? {}) };
            setPreferences(prefs);
            notifyNewItems(data.notifications ?? [], prefs, { silent: silent || !primedRef.current });
            setBrowserPermission(getBrowserPermission());
        } catch (err) {
            console.warn('[notifications] summary failed', err);
            if (!prefsRef.current) {
                setPreferences({ ...DEFAULT_NOTIFICATION_PREFS });
            }
        } finally {
            summaryInFlightRef.current = false;
            setLoading(false);
        }
    }, [notifyNewItems]);

    useEffect(() => {
        fetchSummary(true, { silent: true });
    }, [fetchSummary]);

    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (!preferences) return undefined;

        const intervalMs = (preferences.poll_interval_seconds ?? 15) * 1000;
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
        if (notification.link_path) {
            navigate(notification.link_path);
        }
    }, [markRead, navigate]);

    const saveSettings = useCallback(async (nextPrefs) => {
        const payload = { ...DEFAULT_NOTIFICATION_PREFS, ...nextPrefs };
        const { data } = await http.put('/api/notifications/settings', payload, {
            timeout: 20000,
        });
        const saved = { ...DEFAULT_NOTIFICATION_PREFS, ...(data.preferences ?? payload) };
        setPreferences(saved);
        // Nečekat na sync/summary — to jen zbytečně blokuje „Ukládání…“
        return saved;
    }, []);

    const togglePreference = useCallback(async (key) => {
        const current = prefsRef.current ?? DEFAULT_NOTIFICATION_PREFS;
        return saveSettings({ ...current, [key]: !current[key] });
    }, [saveSettings]);

    const requestBrowserPermission = useCallback(async () => {
        unlockNotificationAudio();
        if (typeof Notification === 'undefined') {
            setBrowserPermission('unsupported');
            return 'unsupported';
        }
        const result = await Notification.requestPermission();
        setBrowserPermission(result);
        if (result === 'granted') {
            const current = prefsRef.current ?? DEFAULT_NOTIFICATION_PREFS;
            await saveSettings({ ...current, browser_notifications: true });
        }
        return result;
    }, [saveSettings]);

    const testNotification = useCallback(async () => {
        unlockNotificationAudio();
        const prefs = prefsRef.current ?? DEFAULT_NOTIFICATION_PREFS;

        if (prefs.sound_enabled !== false) {
            playNotificationSound();
        }

        const sample = {
            id: `test-${Date.now()}`,
            source: 'activity',
            title: 'Test oznámení · Otel Apps',
            body: 'Takto uvidíte nový požadavek nebo zprávu od hosta.',
            link_path: '/activity',
        };

        if (prefs.toast_enabled !== false) {
            pushToast(sample);
        }

        if (prefs.browser_notifications !== false) {
            let perm = getBrowserPermission();
            if (perm === 'default') {
                perm = await requestBrowserPermission();
            }
            if (perm === 'granted') {
                showDesktopNotification(sample, { navigate, markRead: () => {} });
            }
        }
    }, [navigate, pushToast, requestBrowserPermission]);

    const value = {
        badges,
        notifications,
        unreadCount,
        preferences,
        toasts,
        loading,
        notificationSettingsOpen,
        setNotificationSettingsOpen,
        settingsOpen: notificationSettingsOpen,
        setSettingsOpen: setNotificationSettingsOpen,
        browserPermission,
        fetchSummary,
        markRead,
        markAllRead,
        openNotification,
        saveSettings,
        togglePreference,
        requestBrowserPermission,
        testNotification,
        playNotificationSound,
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
