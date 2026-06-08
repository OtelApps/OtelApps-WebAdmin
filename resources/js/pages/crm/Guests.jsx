import React, { useEffect, useState } from 'react';
import http from '../../lib/http';
import { GuestLocaleFlag } from '../concierge/GuestLocaleFlag';
import { GUEST_LOCALES } from '../concierge/conciergeLocales';
import { CRM_SEGMENTS, GUEST_SEGMENTS, SEGMENT_BADGE, SECTION_META } from './crmHubConfig';
import { CrmIcon, CrmShell } from './CrmShell';
import { GuestDetailModal } from './GuestDetailModal';
import { GuestAddModal } from './GuestAddModal';

const SEG = CRM_SEGMENTS.find((s) => s.key === 'guests');
const META = SECTION_META.guests;

function formatLastSeen(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function Guests() {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [segment, setSegment] = useState('all');
    const [locale, setLocale] = useState('');
    const [selectedKey, setSelectedKey] = useState(null);
    const [addOpen, setAddOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQ), 350);
        return () => clearTimeout(t);
    }, [searchQ]);

    const load = () => {
        setLoading(true);
        setError(null);
        const params = {};
        if (debouncedQ.trim()) params.q = debouncedQ.trim();
        if (segment !== 'all') params.segment = segment;
        if (locale) params.locale = locale;

        http.get('/api/crm/guests', { params })
            .then((res) => setGuests(res.data.guests ?? []))
            .catch((err) => {
                setGuests([]);
                setError(err.response?.data?.message || 'Hosty se nepodařilo načíst. Spusť hotel_crm.sql v Supabase.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [debouncedQ, segment, locale]);

    const handleExport = () => {
        window.location.href = '/api/crm/guests/export/csv';
    };

    return (
        <CrmShell
            title={SEG.label}
            segmentKey="guests"
            subtitle={META.description}
            loading={loading}
            error={error}
            actions={
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                    >
                        <CrmIcon name="person_add" className="text-lg" />
                        Přidat hosta
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <CrmIcon name="download" className="text-lg" />
                        Export CSV
                    </button>
                </div>
            }
        >
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <input
                    type="search"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Hledat jméno, pokoj, e-mail…"
                    className="w-full max-w-md rounded-xl border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <div className="flex flex-wrap gap-2">
                    {GUEST_SEGMENTS.map((s) => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => setSegment(s.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                segment === s.key
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={() => setLocale('')}
                    className={`rounded-full px-2 py-1 text-xs ${!locale ? 'ring-2 ring-orange-400' : 'opacity-60'}`}
                >
                    🌐
                </button>
                {GUEST_LOCALES.map((l) => (
                    <button
                        key={l.code}
                        type="button"
                        onClick={() => setLocale(locale === l.code ? '' : l.code)}
                        className={`rounded-full px-2 py-1 text-base ${locale === l.code ? 'ring-2 ring-orange-400' : 'opacity-60'}`}
                    >
                        {l.flag}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800/90">
                {guests.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-500">Žádní hosté neodpovídají filtru.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-600 dark:bg-gray-900/50">
                                    <th className="px-4 py-3">Host</th>
                                    <th className="px-4 py-3">Pokoj</th>
                                    <th className="px-4 py-3">Segment</th>
                                    <th className="px-4 py-3">Aktivita</th>
                                    <th className="px-4 py-3">Poslední kontakt</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {guests.map((g) => (
                                    <tr
                                        key={g.key}
                                        className="border-b border-gray-100 last:border-0 hover:bg-orange-50/50 dark:border-gray-700 dark:hover:bg-orange-950/20"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <GuestLocaleFlag locale={g.locale} size="sm" />
                                                <span className="font-medium text-gray-900 dark:text-white">{g.name}</span>
                                                {g.in_house && (
                                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                                        IN
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.room}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEGMENT_BADGE[g.segment] ?? SEGMENT_BADGE.standard}`}
                                            >
                                                {g.segment_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {g.requests} pož. · {g.conversations} chat
                                            {g.open_requests > 0 ? (
                                                <span className="ml-1 text-orange-600">({g.open_requests} otevř.)</span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{formatLastSeen(g.last_seen)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedKey(g.key)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {addOpen && (
                <GuestAddModal
                    onClose={() => setAddOpen(false)}
                    onSaved={(guest) => {
                        load();
                        if (guest?.key) {
                            setSelectedKey(guest.key);
                        }
                    }}
                />
            )}

            {selectedKey && (
                <GuestDetailModal
                    guestKey={selectedKey}
                    onClose={() => setSelectedKey(null)}
                    onSaved={() => {
                        load();
                        setSelectedKey(null);
                    }}
                />
            )}
        </CrmShell>
    );
}
