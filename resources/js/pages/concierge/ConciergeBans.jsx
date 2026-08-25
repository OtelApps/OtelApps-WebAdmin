import React, { useCallback, useEffect, useState } from 'react';
import http from '../../lib/http';

const STATUS_META = {
    active: {
        label: 'Aktivní',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    },
    expired: {
        label: 'Vypršel',
        className: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
    },
    lifted: {
        label: 'Zrušen',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    },
};

const SENDER_LABEL = {
    guest: 'Host',
    staff: 'Recepce',
    bot: 'AI',
    system: 'Systém',
};

function formatWhen(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('cs-CZ', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

export function ConciergeBanList({ searchQ, selectedId, onSelect }) {
    const [bans, setBans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (searchQ.trim()) params.q = searchQ.trim();
            const { data } = await http.get('/api/concierge/bans', { params });
            setBans(data?.bans ?? []);
        } catch (err) {
            setError(err.response?.data?.message || 'Historii banů se nepodařilo načíst.');
        } finally {
            setLoading(false);
        }
    }, [searchQ]);

    useEffect(() => {
        const t = setTimeout(() => {
            void load();
        }, 250);
        return () => clearTimeout(t);
    }, [load]);

    if (loading) {
        return <p className="p-6 text-center text-sm text-gray-500">Načítání…</p>;
    }
    if (error) {
        return <p className="p-6 text-center text-sm text-red-600">{error}</p>;
    }
    if (bans.length === 0) {
        return <p className="p-6 text-center text-sm text-gray-500">Zatím žádné bany.</p>;
    }

    return (
        <div>
            {bans.map((ban) => {
                const meta = STATUS_META[ban.status] || STATUS_META.expired;
                return (
                    <button
                        key={ban.id}
                        type="button"
                        onClick={() => onSelect(ban.id)}
                        className={`flex w-full flex-col gap-1 border-b border-gray-100 px-4 py-3.5 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/80 ${
                            selectedId === ban.id ? 'bg-red-50 dark:bg-red-950/30' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {ban.guest_name || 'Host'}
                            </span>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${meta.className}`}>
                                {meta.label}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ban.guest_room ? `Pokoj ${ban.guest_room} · ` : ''}
                            {ban.duration_label} · {ban.banned_by_label}
                        </p>
                        <p className="text-[11px] text-gray-400">{formatWhen(ban.banned_at)}</p>
                    </button>
                );
            })}
        </div>
    );
}

export function ConciergeBanDetail({ banId, onUnbanned }) {
    const [ban, setBan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!banId) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await http.get(`/api/concierge/bans/${banId}`);
            setBan(data?.ban ?? null);
        } catch (err) {
            setError(err.response?.data?.message || 'Ban se nepodařilo načíst.');
            setBan(null);
        } finally {
            setLoading(false);
        }
    }, [banId]);

    useEffect(() => {
        void load();
    }, [load]);

    const unban = async () => {
        if (!banId || !window.confirm('Zrušit ban a obnovit hostovi přístup k chatu?')) return;
        setBusy(true);
        setError(null);
        try {
            const { data } = await http.post(`/api/concierge/bans/${banId}/unban`);
            setBan(data?.ban ?? null);
            onUnbanned?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Ban se nepodařilo zrušit.');
        } finally {
            setBusy(false);
        }
    };

    if (!banId) {
        return (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
                Vyber ban vlevo
            </div>
        );
    }

    if (loading) {
        return <p className="p-8 text-sm text-gray-500">Načítání…</p>;
    }

    if (!ban) {
        return <p className="p-8 text-sm text-red-600">{error || 'Ban nenalezen.'}</p>;
    }

    const meta = STATUS_META[ban.status] || STATUS_META.expired;
    const snapshot = Array.isArray(ban.chat_snapshot) ? ban.chat_snapshot : [];

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-800">
            <header className="shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {ban.guest_name || 'Host'}
                            </h2>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${meta.className}`}>
                                {meta.label}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {ban.guest_room ? `Pokoj ${ban.guest_room} · ` : ''}
                            {ban.duration_label} · {ban.banned_by_label} · {formatWhen(ban.banned_at)}
                            {ban.expires_at ? ` · do ${formatWhen(ban.expires_at)}` : ''}
                        </p>
                    </div>
                    {ban.status === 'active' ? (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void unban()}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {busy ? 'Ruším…' : 'Zrušit ban'}
                        </button>
                    ) : null}
                </div>
                {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                        Důvod
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap">{ban.reason}</p>
                    {ban.lifted_at ? (
                        <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">
                            Zrušil {ban.lifted_by_label} · {formatWhen(ban.lifted_at)}
                        </p>
                    ) : null}
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Snapshot chatu v okamžiku banu
                </h3>
                {snapshot.length === 0 ? (
                    <p className="text-sm text-gray-500">V chatu v okamžiku banu nebyly žádné zprávy.</p>
                ) : (
                    <ul className="space-y-2">
                        {snapshot.map((m, i) => (
                            <li
                                key={`${m.created_at || i}-${i}`}
                                className={`rounded-xl px-3 py-2 text-sm ${
                                    m.sender_type === 'guest'
                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                                        : m.sender_type === 'bot'
                                          ? 'bg-violet-50 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100'
                                          : 'bg-orange-50 text-orange-950 dark:bg-orange-950/30 dark:text-orange-100'
                                }`}
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                                    {SENDER_LABEL[m.sender_type] || m.sender_type}
                                    {m.created_at ? ` · ${formatWhen(m.created_at)}` : ''}
                                </p>
                                <p className="mt-0.5 whitespace-pre-wrap">{m.text || '—'}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
