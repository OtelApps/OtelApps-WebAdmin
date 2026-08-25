import React, { useEffect, useState } from 'react';
import {
    DEFAULT_NOTIFICATION_PREFS,
    playNotificationSound,
    unlockNotificationAudio,
    useNotifications,
} from '../../context/NotificationContext';

const ACTIVITY_STATUSES = [
    { key: 'new', label: 'Nové' },
    { key: 'pending', label: 'Čekající' },
    { key: 'in_progress', label: 'V řešení' },
];

const POLL_OPTIONS = [
    { value: 10, label: 'Každých 10 s' },
    { value: 15, label: 'Každých 15 s (doporučeno)' },
    { value: 30, label: 'Každých 30 s' },
    { value: 60, label: 'Každou 1 min' },
];

function Toggle({ checked, onChange, label, description }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-4 last:border-0 dark:border-gray-700">
            <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                {description && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => {
                    unlockNotificationAudio();
                    onChange(!checked);
                }}
                className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
                    checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
}

function Section({ title, icon, children, hint }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
            <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                </span>
                <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                    {hint && <p className="text-xs text-gray-500">{hint}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

function PermissionBadge({ status }) {
    const map = {
        granted: {
            label: 'Povoleno',
            className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
        },
        denied: {
            label: 'Zakázáno v prohlížeči',
            className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
        },
        default: {
            label: 'Čeká na povolení',
            className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
        },
        unsupported: {
            label: 'Nepodporováno',
            className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        },
    };
    const meta = map[status] ?? map.default;
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}>
            {meta.label}
        </span>
    );
}

/**
 * Velký modal nastavení oznámení.
 * open/onClose řídí Layout (spolehlivé otevření mimo dropdown stacking context).
 */
export function NotificationSettingsModal({ open, onClose }) {
    const {
        preferences,
        saveSettings,
        requestBrowserPermission,
        browserPermission,
        testNotification,
    } = useNotifications();

    const [form, setForm] = useState({ ...DEFAULT_NOTIFICATION_PREFS });
    const [saving, setSaving] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);
    const [error, setError] = useState(null);
    const [perm, setPerm] = useState(browserPermission);

    useEffect(() => {
        if (!open) return;
        setForm({ ...DEFAULT_NOTIFICATION_PREFS, ...(preferences ?? {}) });
        setPerm(browserPermission);
        setError(null);
        setSavedFlash(false);
        unlockNotificationAudio();
    }, [open, preferences, browserPermission]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    const setKey = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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
        setError(null);
        setSavedFlash(false);
        try {
            await saveSettings(form);
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 3000);
        } catch (err) {
            const timedOut = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');
            const message = timedOut
                ? 'Uložení trvalo příliš dlouho (databáze neodpovídá). Zkus to znovu za chvíli.'
                : err.response?.data?.message ||
                  (err.response?.data?.errors
                      ? Object.values(err.response.data.errors).flat().join(' ')
                      : null) ||
                  err.message ||
                  'Uložení nastavení se nezdařilo.';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    const handleBrowserPermission = async () => {
        const result = await requestBrowserPermission();
        setPerm(result);
        if (result === 'granted') {
            setKey('browser_notifications', true);
        }
    };

    return (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-settings-title"
                className="relative z-10 flex max-h-[min(920px,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-gray-50 shadow-2xl dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                                Nastavení
                            </p>
                            <h2
                                id="notification-settings-title"
                                className="mt-1 text-2xl font-bold text-gray-900 dark:text-white"
                            >
                                Oznámení
                            </h2>
                            <p className="mt-2 max-w-xl text-sm text-gray-500">
                                Komplexní nastavení zvuku, toastů a desktop notifikací pro nové
                                objednávky, změny stavů a zprávy od hostů.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                            aria-label="Zavřít"
                        >
                            <span className="material-symbols-outlined text-[28px]">close</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    <Section
                        title="Zvuk a zobrazení"
                        icon="volume_up"
                        hint="Jak vás WebAdmin upozorní na nové události"
                    >
                        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-900/50">
                            <PermissionBadge status={perm} />
                            <span className="text-xs text-gray-500">Desktop oprávnění prohlížeče</span>
                            <div className="ml-auto flex flex-wrap gap-2">
                                {perm !== 'granted' && perm !== 'unsupported' && (
                                    <button
                                        type="button"
                                        onClick={handleBrowserPermission}
                                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                                    >
                                        Povolit desktop
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => testNotification()}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                >
                                    Vyzkoušet oznámení
                                </button>
                            </div>
                        </div>

                        <Toggle
                            checked={Boolean(form.sound_enabled)}
                            onChange={(v) => {
                                setKey('sound_enabled', v);
                                if (v) playNotificationSound();
                            }}
                            label="Zvukové upozornění"
                            description="Pípnutí při nové objednávce, změně stavu nebo zprávě od hosta"
                        />
                        <Toggle
                            checked={Boolean(form.toast_enabled)}
                            onChange={(v) => setKey('toast_enabled', v)}
                            label="Toast ve WebAdminu"
                            description="Vyskakovací karta vpravo dole přímo v aplikaci"
                        />
                        <Toggle
                            checked={Boolean(form.browser_notifications)}
                            onChange={(v) => setKey('browser_notifications', v)}
                            label="Systémové (desktop) notifikace"
                            description="Upozornění jako na telefonu — i když máte jinou záložku aktivní"
                        />
                    </Section>

                    <Section
                        title="Co hlídat"
                        icon="inbox"
                        hint="Zdroje událostí pro recepci"
                    >
                        <Toggle
                            checked={Boolean(form.activity_enabled)}
                            onChange={(v) => setKey('activity_enabled', v)}
                            label="Activity — objednávky a požadavky"
                            description="Nové požadavky i změny jejich stavu"
                        />
                        {form.activity_enabled && (
                            <div className="mb-3 rounded-xl bg-gray-50 px-3 py-3 dark:bg-gray-900/40">
                                <p className="mb-2 text-xs font-medium text-gray-500">
                                    Stavy, na které upozornit:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {ACTIVITY_STATUSES.map((s) => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => toggleActivityStatus(s.key)}
                                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                                (form.activity_statuses ?? []).includes(s.key)
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-white text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600'
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Toggle
                            checked={Boolean(form.concierge_enabled)}
                            onChange={(v) => setKey('concierge_enabled', v)}
                            label="Concierge — chaty hostů"
                            description="AI chat, žádost o člověka i nové zprávy v Concierge"
                        />
                    </Section>

                    <Section
                        title="Mobilní app (hosté)"
                        icon="smartphone"
                        hint="Oddělené od oznámení recepce — push do telefonu hosta"
                    >
                        <Toggle
                            checked={Boolean(form.guest_push_enabled)}
                            onChange={(v) => setKey('guest_push_enabled', v)}
                            label="Push notifikace hostům"
                            description="CRM a systémové zprávy do mobilní aplikace"
                        />
                        <Toggle
                            checked={Boolean(form.guest_push_on_status_change)}
                            onChange={(v) => setKey('guest_push_on_status_change', v)}
                            label="Push při změně stavu objednávky"
                            description="Host dostane upozornění, když recepce změní stav požadavku"
                        />
                        <Toggle
                            checked={Boolean(form.guest_push_on_concierge)}
                            onChange={(v) => setKey('guest_push_on_concierge', v)}
                            label="Push při zprávě Concierge"
                            description="Host dostane push, když odpoví AI chatbot nebo recepce"
                        />
                    </Section>

                    <Section title="Frekvence kontroly" icon="schedule">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Jak často kontrolovat nové události
                        </label>
                        <select
                            value={form.poll_interval_seconds}
                            onChange={(e) => setKey('poll_interval_seconds', Number(e.target.value))}
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        >
                            {POLL_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </Section>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                            {error}
                        </div>
                    )}
                    {savedFlash && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                            Nastavení oznámení bylo uloženo.
                        </div>
                    )}
                </div>

                <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Zavřít
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                        {saving ? 'Ukládání…' : 'Uložit nastavení'}
                    </button>
                </footer>
            </div>
        </div>
    );
}
