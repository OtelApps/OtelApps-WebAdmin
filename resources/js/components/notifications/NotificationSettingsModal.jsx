import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';

const ACTIVITY_STATUSES = [
    { key: 'new', label: 'Nové' },
    { key: 'pending', label: 'Čekající' },
    { key: 'in_progress', label: 'V řešení' },
];

const POLL_OPTIONS = [
    { value: 10, label: 'Každých 10 s (nejrychlejší)' },
    { value: 15, label: 'Každých 15 s (doporučeno)' },
    { value: 30, label: 'Každých 30 s' },
    { value: 60, label: 'Každou 1 min' },
];

function Toggle({ checked, onChange, label, description, disabled = false }) {
    return (
        <label
            className={`flex items-start justify-between gap-4 py-3 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
        >
            <div className="min-w-0">
                <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                {description && <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{description}</span>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
                    checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </label>
    );
}

function Section({ title, icon, children, hint }) {
    return (
        <section className="border-b border-gray-100 px-1 py-1 dark:border-gray-700">
            <div className="flex items-center gap-2 pt-3 pb-1">
                <span className="material-symbols-outlined text-[18px] text-orange-500">{icon}</span>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-500">{title}</h3>
            </div>
            {hint && <p className="mb-1 text-xs text-gray-500">{hint}</p>}
            {children}
        </section>
    );
}

function PermissionBadge({ status }) {
    const map = {
        granted: { label: 'Povoleno', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
        denied: { label: 'Zakázáno', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
        default: { label: 'Čeká na povolení', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
        unsupported: { label: 'Nepodporováno', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    };
    const meta = map[status] ?? map.default;
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}>
            {meta.label}
        </span>
    );
}

export function NotificationSettingsModal() {
    const {
        settingsOpen,
        setSettingsOpen,
        preferences,
        saveSettings,
        requestBrowserPermission,
        browserPermission,
    } = useNotifications();

    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [perm, setPerm] = useState(browserPermission);

    useEffect(() => {
        if (preferences) {
            setForm({ ...preferences });
        }
    }, [preferences, settingsOpen]);

    useEffect(() => {
        setPerm(browserPermission);
    }, [browserPermission, settingsOpen]);

    if (!settingsOpen || !form) return null;

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
        setPerm(result);
        if (result === 'granted') {
            setKey('browser_notifications', true);
        }
    };

    const handleTestDesktop = async () => {
        setTesting(true);
        try {
            let status = perm;
            if (status !== 'granted') {
                status = await requestBrowserPermission();
                setPerm(status);
            }
            if (status !== 'granted' || typeof Notification === 'undefined') {
                window.alert('Nejdřív povolte systémové notifikace v prohlížeči.');
                return;
            }
            const notif = new Notification('Test · Otel Apps Hotel', {
                body: 'Desktop upozornění fungují. Nové požadavky a zprávy uvidíte i mimo otevřenou stránku (dokud je WebAdmin v prohlížeči spuštěný).',
                icon: '/logo.png',
                tag: 'otelapps-test',
                requireInteraction: true,
            });
            notif.onclick = () => {
                window.focus();
                notif.close();
            };
            setKey('browser_notifications', true);
        } finally {
            setTesting(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[10000] bg-black/35"
                onClick={() => setSettingsOpen(false)}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Nastavení notifikací"
                className="fixed inset-0 z-[10001] flex items-start justify-center px-4 pt-12 sm:pt-16"
                onClick={() => setSettingsOpen(false)}
            >
                <div
                    className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="border-b border-gray-200 bg-gradient-to-r from-orange-500/10 via-transparent to-amber-400/10 px-6 py-5 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Nastavení oznámení
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Obdoba push notifikací pro recepci — toast, zvuk a systémová upozornění v prohlížeči.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(false)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                                aria-label="Zavřít"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[65vh] overflow-y-auto px-5 py-2 sm:px-6">
                        <Section
                            title="Desktop upozornění"
                            icon="notifications_active"
                            hint="Fungují jako push, dokud máte WebAdmin otevřený v prohlížeči (i na pozadí)."
                        >
                            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900/40">
                                <PermissionBadge status={perm} />
                                <span className="text-xs text-gray-500">Systémová oprávnění prohlížeče</span>
                                <div className="ml-auto flex flex-wrap gap-2">
                                    {perm !== 'granted' && perm !== 'unsupported' && (
                                        <button
                                            type="button"
                                            onClick={handleBrowserPermission}
                                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                                        >
                                            Povolit
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleTestDesktop}
                                        disabled={testing || perm === 'unsupported'}
                                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                                    >
                                        {testing ? 'Test…' : 'Otestovat'}
                                    </button>
                                </div>
                            </div>

                            <Toggle
                                checked={form.browser_notifications}
                                onChange={(v) => setKey('browser_notifications', v)}
                                label="Systémové notifikace (desktop)"
                                description="Upozornění ve stylu push — i když máte jinou záložku aktivní"
                            />
                            <Toggle
                                checked={form.toast_enabled}
                                onChange={(v) => setKey('toast_enabled', v)}
                                label="Toast ve WebAdminu"
                                description="Vyskakovací karta vpravo dole přímo v aplikaci"
                            />
                            <Toggle
                                checked={form.sound_enabled}
                                onChange={(v) => setKey('sound_enabled', v)}
                                label="Zvuk při nové události"
                                description="Krátký tón jako u mobilního push"
                            />
                        </Section>

                        <Section title="Zdroje pro recepci" icon="inbox">
                            <Toggle
                                checked={form.activity_enabled}
                                onChange={(v) => setKey('activity_enabled', v)}
                                label="Activity — nové požadavky"
                                description="Hostovské požadavky ze služeb"
                            />
                            {form.activity_enabled && (
                                <div className="pb-3 pl-1">
                                    <p className="mb-2 text-xs text-gray-500">Upozornit na stavy:</p>
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
                            <Toggle
                                checked={form.concierge_enabled}
                                onChange={(v) => setKey('concierge_enabled', v)}
                                label="Concierge — nové zprávy"
                                description="Nepřečtené chaty od hostů"
                            />
                        </Section>

                        <Section
                            title="Mobilní app (hosté)"
                            icon="smartphone"
                            hint="Expo push do telefonu hosta — oddělené od desktop upozornění recepce."
                        >
                            <Toggle
                                checked={form.guest_push_enabled}
                                onChange={(v) => setKey('guest_push_enabled', v)}
                                label="Push notifikace hostům"
                                description="CRM a systémové zprávy do mobilní aplikace"
                            />
                            <Toggle
                                checked={form.guest_push_on_status_change}
                                onChange={(v) => setKey('guest_push_on_status_change', v)}
                                label="Push při změně stavu objednávky"
                                description="Host dostane upozornění, když recepce změní stav požadavku"
                            />
                        </Section>

                        <Section title="Frekvence kontroly" icon="schedule">
                            <div className="py-3">
                                <select
                                    value={form.poll_interval_seconds}
                                    onChange={(e) => setKey('poll_interval_seconds', Number(e.target.value))}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                >
                                    {POLL_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-xs text-gray-500">
                                    WebAdmin pravidelně kontroluje nové události a zobrazí je jako toast / desktop notifikaci.
                                </p>
                            </div>
                        </Section>
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
                            className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                            {saving ? 'Ukládání…' : 'Uložit nastavení'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
