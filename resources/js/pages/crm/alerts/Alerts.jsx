import React, { useEffect, useMemo, useState } from 'react';
import http from '../../../lib/http';
import { ALERT_SEVERITY, CRM_SEGMENTS, SECTION_META, formatDateTime } from '../crmHubConfig';
import { CrmIcon, CrmShell } from '../CrmShell';
import { PushAlertForm } from './PushAlertForm';

const SEG = CRM_SEGMENTS.find((s) => s.key === 'alerts');
const META = SECTION_META.alerts;

export function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [tab, setTab] = useState('active');

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

    const dismiss = async (id) => {
        try {
            await http.post(`/api/crm/alerts/${id}/dismiss`);
            load();
        } catch {
            window.alert('Zavření alertu se nezdařilo.');
        }
    };

    const manualAlerts = alerts.filter((alert) => alert.alert_type === 'manual');

    const visibleAlerts = useMemo(() => {
        if (tab === 'active') {
            return manualAlerts.filter((alert) => alert.status === 'active');
        }
        return manualAlerts.filter((alert) => alert.status !== 'active');
    }, [manualAlerts, tab]);

    const handleSaved = () => {
        setShowForm(false);
        load();
    };

    return (
        <CrmShell
            title={SEG.label}
            segmentKey="alerts"
            subtitle={META.description}
            actions={
                <button
                    type="button"
                    onClick={() => setShowForm((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    <CrmIcon name="add" className="text-lg" />
                    {showForm ? 'Zavřít formulář' : 'Nový alert'}
                </button>
            }
        >
            {showForm && (
                <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-900/50 dark:bg-orange-950/20">
                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Vlastní upozornění</h3>
                    <PushAlertForm
                        compact
                        onSaved={handleSaved}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}

            <div className="mb-4 flex gap-2">
                {[
                    { key: 'active', label: 'Aktivní' },
                    { key: 'history', label: 'Historie' },
                ].map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setTab(item.key)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                            tab === item.key
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-600">
                        Načítám…
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 p-8 text-center text-sm text-red-600 dark:border-red-800">
                        {error}
                    </div>
                ) : visibleAlerts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600">
                        {tab === 'active' ? 'Žádné aktivní alerty.' : 'Žádná historie.'}
                    </div>
                ) : (
                    visibleAlerts.map((alert) => {
                        const severity = ALERT_SEVERITY[alert.severity] ?? ALERT_SEVERITY.info;
                        return (
                            <article
                                key={alert.id}
                                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-gray-600 dark:bg-gray-800/90"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${severity.className}`}
                                        >
                                            {severity.label}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatDateTime(alert.created_at)}
                                        </span>
                                        {alert.status !== 'active' && (
                                            <span className="text-xs font-medium text-gray-500">
                                                {alert.status}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {alert.title}
                                    </h3>
                                    {alert.body && (
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                            {alert.body}
                                        </p>
                                    )}
                                    {alert.guest_key && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Host: <code>{alert.guest_key}</code>
                                        </p>
                                    )}
                                </div>
                                {alert.status === 'active' && (
                                    <button
                                        type="button"
                                        onClick={() => dismiss(alert.id)}
                                        className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
