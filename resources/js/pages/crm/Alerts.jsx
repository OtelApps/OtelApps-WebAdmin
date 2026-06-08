import React, { useEffect, useState } from 'react';
import http from '../../lib/http';
import { ALERT_SEVERITY, CRM_SEGMENTS, SECTION_META } from './crmHubConfig';
import { CrmIcon, CrmShell } from './CrmShell';

const SEG = CRM_SEGMENTS.find((s) => s.key === 'alerts');

export function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', body: '', severity: 'info' });
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('active');

    const load = () => {
        setLoading(true);
        setError(null);
        http.get('/api/crm/alerts')
            .then((res) => setAlerts(res.data.alerts ?? []))
            .catch((err) => {
                setAlerts([]);
                setError(err.response?.data?.message || 'Alerty se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = alerts.filter((a) => (filter === 'active' ? a.status === 'active' : a.status !== 'active'));

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            await http.post('/api/crm/alerts', form);
            setForm({ title: '', body: '', severity: 'info' });
            setShowForm(false);
            load();
        } catch (err) {
            window.alert(err.response?.data?.message || 'Vytvoření alertu se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    const dismiss = async (id) => {
        try {
            await http.post(`/api/crm/alerts/${id}/dismiss`);
            load();
        } catch {
            window.alert('Alert se nepodařilo zavřít.');
        }
    };

    return (
        <CrmShell
            title={SEG.label}
            segmentKey="alerts"
            subtitle={SECTION_META.alerts.description}
            loading={loading}
            error={error}
            actions={
                <button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600"
                >
                    <CrmIcon name="add" className="text-lg" />
                    Nový alert
                </button>
            }
        >
            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-900/50 dark:bg-orange-950/20"
                >
                    <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Vlastní upozornění</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            required
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Nadpis alertu"
                            className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:col-span-2"
                        />
                        <textarea
                            value={form.body}
                            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                            placeholder="Popis (volitelné)"
                            rows={2}
                            className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:col-span-2"
                        />
                        <select
                            value={form.severity}
                            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                            className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="info">Info</option>
                            <option value="warning">Varování</option>
                            <option value="critical">Kritické</option>
                        </select>
                        <div className="flex gap-2 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-white/80"
                            >
                                Zrušit
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                Vytvořit
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="mb-4 flex gap-2">
                {[
                    { key: 'active', label: 'Aktivní' },
                    { key: 'history', label: 'Historie' },
                ].map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                            filter === f.key ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600">
                        {filter === 'active' ? 'Žádné aktivní alerty.' : 'Žádná historie.'}
                    </p>
                ) : (
                    filtered.map((alert) => {
                        const sev = ALERT_SEVERITY[alert.severity] ?? ALERT_SEVERITY.info;
                        return (
                            <article
                                key={alert.id}
                                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-gray-600 dark:bg-gray-800/90"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sev.className}`}>
                                            {sev.label}
                                        </span>
                                        <span className="text-[10px] uppercase text-gray-400">{alert.alert_type}</span>
                                        {alert.source_module && (
                                            <span className="text-[10px] text-gray-400">· {alert.source_module}</span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{alert.title}</h3>
                                    {alert.body && (
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{alert.body}</p>
                                    )}
                                </div>
                                {alert.status === 'active' && (
                                    <button
                                        type="button"
                                        onClick={() => dismiss(alert.id)}
                                        className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600 dark:border-gray-600 dark:text-gray-300"
                                    >
                                        Zavřít
                                    </button>
                                )}
                            </article>
                        );
                    })
                )}
            </div>
        </CrmShell>
    );
}
