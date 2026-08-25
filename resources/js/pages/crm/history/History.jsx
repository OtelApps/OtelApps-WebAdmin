import React, { useEffect, useState } from 'react';
import http from '../../../lib/http';
import { CHANNEL_ICONS, CRM_SEGMENTS, formatDateTime, INTERACTION_CHANNELS, SECTION_META } from '../crmHubConfig';
import { CrmIcon, CrmShell } from '../CrmShell';

const SEG = CRM_SEGMENTS.find((s) => s.key === 'history');

const EMPTY_FORM = {
    subject: '',
    body: '',
    channel: 'note',
    direction: 'outbound',
    staff_name: '',
};

export function History() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        setError(null);
        http.get('/api/crm/history')
            .then((res) => setEvents(res.data.events ?? []))
            .catch((err) => {
                setEvents([]);
                setError(err.response?.data?.message || 'Historii se nepodařilo načíst. Spusť hotel_crm_extended.sql v Supabase.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.subject.trim()) return;
        setSaving(true);
        try {
            await http.post('/api/crm/interactions', form);
            setForm(EMPTY_FORM);
            setShowForm(false);
            load();
        } catch (err) {
            window.alert(err.response?.data?.message || 'Záznam se nepodařilo uložit.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <CrmShell
            title={SEG.label}
            segmentKey="history"
            subtitle={SECTION_META.history.description}
            loading={loading}
            error={error}
            actions={
                <button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600"
                >
                    <CrmIcon name="add" className="text-lg" />
                    Nový záznam
                </button>
            }
        >
            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="mb-6 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-600 dark:bg-gray-900/40"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Kanál</label>
                            <select
                                value={form.channel}
                                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                {INTERACTION_CHANNELS.map((c) => (
                                    <option key={c.key} value={c.key}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Směr</label>
                            <select
                                value={form.direction}
                                onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                <option value="inbound">Příchozí</option>
                                <option value="outbound">Odchozí</option>
                                <option value="internal">Interní</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Předmět</label>
                        <input
                            required
                            value={form.subject}
                            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Detail</label>
                        <textarea
                            value={form.body}
                            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm text-gray-600">
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {saving ? 'Ukládání…' : 'Uložit záznam'}
                        </button>
                    </div>
                </form>
            )}

            <div className="relative">
                {events.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600">
                        Zatím žádná historie komunikace.
                    </p>
                ) : (
                    <ul className="space-y-0">
                        {events.map((event, idx) => {
                            const icon = CHANNEL_ICONS[event.channel] ?? CHANNEL_ICONS[event.type] ?? 'forum';

                            return (
                                <li key={`${event.id ?? event.at}-${idx}`} className="relative flex gap-4 pb-8 last:pb-0">
                                    {idx < events.length - 1 && (
                                        <span className="absolute left-5 top-10 h-full w-px bg-gray-200 dark:bg-gray-700" />
                                    )}
                                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
                                        <CrmIcon name={icon} className="text-xl" />
                                    </div>
                                    <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800/90">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                                                {event.channel_label && (
                                                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                        {event.channel_label}
                                                    </span>
                                                )}
                                                {event.meta && (
                                                    <span className="ml-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                                                        {event.meta}
                                                    </span>
                                                )}
                                            </div>
                                            <time className="shrink-0 text-xs text-gray-500">{formatDateTime(event.at)}</time>
                                        </div>
                                        {event.body && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{event.body}</p>
                                        )}
                                        {event.staff_name && (
                                            <p className="mt-2 text-xs text-gray-400">{event.staff_name}</p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </CrmShell>
    );
}
