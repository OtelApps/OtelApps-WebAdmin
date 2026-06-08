import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';

const ACTIVITY_STATUSES = [
    { key: 'new', label: 'Nové' },
    { key: 'pending', label: 'Čekající' },
    { key: 'in_progress', label: 'V řešení' },
];

const POLL_OPTIONS = [
    { value: 10, label: '10 s' },
    { value: 15, label: '15 s' },
    { value: 30, label: '30 s' },
    { value: 60, label: '60 s' },
];

function Toggle({ checked, onChange, label, description }) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
            <div>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
            />
        </label>
    );
}

export function NotificationSettingsModal() {
    const {
        settingsOpen,
        setSettingsOpen,
        preferences,
        saveSettings,
        requestBrowserPermission,
    } = useNotifications();

    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [browserStatus, setBrowserStatus] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    );

    useEffect(() => {
        if (preferences) {
            setForm({ ...preferences });
        }
    }, [preferences, settingsOpen]);

    if (!settingsOpen || !form) return null;

    const toggleStatus = (key) => {
        setForm((f) => ({ ...f, [key]: !f[key] }));
    };

    const toggleActivityStatus = (status) => {
        setForm((f) => {
            const current = f.activity_statuses ?? [];
            const next = current.includes(status)
                ? current.filter((s) => s !== status)
                : [...current, status];
            return { ...f, activity_statuses: next.length ? next : ['new'] };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveSettings(form);
            setSettingsOpen(false);
        } catch (err) {
            window.alert(err.response?.data?.message || 'Uložení nastavení se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    const handleBrowserPermission = async () => {
        const result = await requestBrowserPermission();
        setBrowserStatus(result);
        if (result === 'granted') {
            setForm((f) => ({ ...f, browser_notifications: true }));
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[10000] bg-black/30"
                onClick={() => setSettingsOpen(false)}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Nastavení notifikací"
                className="fixed inset-0 z-[10001] flex items-start justify-center px-4 pt-16"
                onClick={() => setSettingsOpen(false)}
            >
                <div
                    className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nastavení notifikací</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Upozornění na nové požadavky v Activity a zprávy v Concierge.
                        </p>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto px-6 py-2">
                        <div className="border-b border-gray-100 dark:border-gray-700">
                            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-orange-500">Activity</p>
                            <Toggle
                                checked={form.activity_enabled}
                                onChange={() => toggleStatus('activity_enabled')}
                                label="Notifikace z Activity"
                                description="Nové hostovské požadavky"
                            />
                            {form.activity_enabled && (
                                <div className="pb-3 pl-1">
                                    <p className="mb-2 text-xs text-gray-500">Stavy požadavků:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {ACTIVITY_STATUSES.map((s) => (
                                            <button
                                                key={s.key}
                                                type="button"
                                                onClick={() => toggleActivityStatus(s.key)}
                                                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                                    (form.activity_statuses ?? []).includes(s.key)
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-b border-gray-100 dark:border-gray-700">
                            <p className="pt-4 text-xs font-semibold uppercase tracking-wide text-orange-500">Concierge</p>
                            <Toggle
                                checked={form.concierge_enabled}
                                onChange={() => toggleStatus('concierge_enabled')}
                                label="Notifikace z Concierge"
                                description="Nepřečtené zprávy od hostů"
                            />
                        </div>

                        <div className="border-b border-gray-100 dark:border-gray-700">
                            <p className="pt-4 text-xs font-semibold uppercase tracking-wide text-orange-500">Zobrazení</p>
                            <Toggle
                                checked={form.toast_enabled}
                                onChange={() => toggleStatus('toast_enabled')}
                                label="Toast v aplikaci"
                                description="Vyskakovací okno vpravo dole"
                            />
                            <Toggle
                                checked={form.browser_notifications}
                                onChange={() => toggleStatus('browser_notifications')}
                                label="Prohlížečové notifikace"
                                description="Systémová upozornění (vyžaduje povolení)"
                            />
                            {form.browser_notifications && browserStatus !== 'granted' && (
                                <button
                                    type="button"
                                    onClick={handleBrowserPermission}
                                    className="mb-3 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                >
                                    Povolit notifikace v prohlížeči
                                </button>
                            )}
                            <Toggle
                                checked={form.sound_enabled}
                                onChange={() => toggleStatus('sound_enabled')}
                                label="Zvukové upozornění"
                            />
                        </div>

                        <div className="py-4">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-orange-500">
                                Interval kontroly
                            </label>
                            <select
                                value={form.poll_interval_seconds}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, poll_interval_seconds: Number(e.target.value) }))
                                }
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                {POLL_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setSettingsOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Zrušit
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                            {saving ? 'Ukládání…' : 'Uložit'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
