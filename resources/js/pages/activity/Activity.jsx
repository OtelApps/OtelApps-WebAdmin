import React, { useCallback, useEffect, useState } from 'react';
import http from '../../lib/http';
import { useModules } from '../../context/ModulesContext';
import { NotFound } from '../shared/NotFound';
import { RequestAddModal } from './RequestAddModal';
import { RequestEditModal } from './RequestEditModal';
import { RequestStatusModal } from './RequestStatusModal';
import { STATUS_FILTERS, StatusCell } from './activityStatus';

const PRIMARY_ORANGE = '#FF9F00';
const GUEST_NAME_BLUE = '#4A90E2';

export function Activity() {
    const { isEnabled } = useModules();
    const enabled = isEnabled('activity');
    const [rows, setRows] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [statusCounts, setStatusCounts] = useState({});
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);

    const [statusFilter, setStatusFilter] = useState([]);
    const [serviceModule, setServiceModule] = useState('');
    const [searchQ, setSearchQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQ), 400);
        return () => clearTimeout(t);
    }, [searchQ]);

    const [editId, setEditId] = useState(null);
    const [statusRow, setStatusRow] = useState(null);
    const [showAdd, setShowAdd] = useState(false);

    const loadRequests = useCallback(() => {
        setListLoading(true);
        setListError(null);
        const params = {};
        if (statusFilter.length > 0) {
            params.status = statusFilter.join(',');
        }
        if (serviceModule) {
            params.service_module = serviceModule;
        }
        if (debouncedQ.trim()) {
            params.q = debouncedQ.trim();
        }
        if (dateFrom) {
            params.from = dateFrom;
        }
        if (dateTo) {
            params.to = dateTo;
        }
        http
            .get('/api/activity/requests', { params })
            .then((res) => {
                setRows(res.data.requests ?? []);
                setServiceTypes(res.data.service_types ?? []);
                setStatusCounts(res.data.status_counts ?? {});
            })
            .catch((err) => {
                setListError(
                    err.response?.data?.message ||
                        'Nepodařilo se načíst požadavky. Spusť SQL hotel_service_requests.sql v Supabase.',
                );
                setRows([]);
            })
            .finally(() => setListLoading(false));
    }, [statusFilter, serviceModule, debouncedQ, dateFrom, dateTo]);

    useEffect(() => {
        if (enabled) {
            loadRequests();
        }
    }, [enabled, loadRequests]);

    const toggleStatusFilter = (key) => {
        setStatusFilter((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Opravdu smazat tento požadavek?')) return;
        try {
            await http.delete(`/api/activity/requests/${id}`);
            loadRequests();
        } catch {
            window.alert('Smazání se nezdařilo.');
        }
    };

    const selectedTypeLabel = serviceTypes.find((t) => t.module_key === serviceModule);

    if (!enabled) {
        return <NotFound />;
    }

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-gray-50 pb-24 dark:bg-gray-900">
            <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100 sm:text-3xl">
                        Requests
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowAdd(true)}
                            disabled={serviceTypes.length === 0}
                            className="rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                            style={{ backgroundColor: PRIMARY_ORANGE }}
                        >
                            + ADD REQUEST
                        </button>
                        <button
                            type="button"
                            onClick={loadRequests}
                            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                            Refresh
                        </button>
                    </div>
                </header>

                {listError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                        {listError}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-4 sm:p-5 lg:grid-cols-12 lg:gap-5 dark:border-gray-700">
                        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 lg:col-span-3">
                            <span className="material-symbols-outlined shrink-0 text-[22px] text-gray-400">
                                calendar_today
                            </span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 focus:ring-0 p-0"
                                title="From"
                            />
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 lg:col-span-2">
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 focus:ring-0 p-0"
                                title="To"
                            />
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 lg:col-span-3">
                            <span className="material-symbols-outlined shrink-0 text-[22px] text-gray-400">
                                {selectedTypeLabel?.icon_name ?? 'apps'}
                            </span>
                            <select
                                value={serviceModule}
                                onChange={(e) => setServiceModule(e.target.value)}
                                className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 focus:ring-0 p-0"
                            >
                                <option value="">All services</option>
                                {serviceTypes.map((t) => (
                                    <option key={t.module_key} value={t.module_key}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 lg:col-span-4">
                            <span className="material-symbols-outlined shrink-0 text-[22px] text-gray-400">search</span>
                            <input
                                type="search"
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                placeholder="Search guest, room, request…"
                                className="w-full text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 bg-transparent border-0 focus:ring-0 p-0"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-4 sm:gap-3 sm:px-5 dark:border-gray-700">
                        <span className="mr-1 w-full text-sm text-gray-500 sm:mr-2 sm:w-auto">Filter by status</span>
                        {STATUS_FILTERS.map((s) => {
                            const active = statusFilter.includes(s.key);
                            const count = statusCounts[s.key] ?? 0;
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => toggleStatusFilter(s.key)}
                                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${s.bg} ${s.text} ${
                                        active ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                                    {s.label}
                                    <span className="text-xs opacity-70">({count})</span>
                                </button>
                            );
                        })}
                        {statusFilter.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setStatusFilter([])}
                                className="text-xs text-gray-500 underline"
                            >
                                Clear status
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        {listLoading ? (
                            <p className="p-8 text-center text-gray-500">Načítání požadavků…</p>
                        ) : rows.length === 0 ? (
                            <p className="p-8 text-center text-gray-500">Žádné požadavky pro zvolené filtry.</p>
                        ) : (
                            <table className="w-full min-w-[900px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        {['Service type', 'Request', 'Guest', 'Created', 'Modified', 'Status', 'Actions'].map(
                                            (col) => (
                                                <th
                                                    key={col}
                                                    className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-5 dark:text-gray-400"
                                                >
                                                    {col}
                                                </th>
                                            ),
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-4 py-5 sm:px-5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="material-symbols-outlined text-[22px] text-gray-400">
                                                        {row.service_icon}
                                                    </span>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {row.service_label}
                                                        </span>
                                                        {row.request_number && (
                                                            <p className="text-xs text-gray-400">{row.request_number}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-sm text-gray-800 dark:text-gray-200 sm:px-5">
                                                {row.request}
                                            </td>
                                            <td className="px-4 py-5 sm:px-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span
                                                        className="text-sm font-medium"
                                                        style={{ color: GUEST_NAME_BLUE }}
                                                    >
                                                        {row.guest_name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{row.guest_room}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 sm:px-5">
                                                {row.created && (
                                                    <div className="flex flex-col gap-0.5 text-sm text-gray-800 dark:text-gray-200">
                                                        <span>{row.created.date}</span>
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {row.created.time}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-5 sm:px-5">
                                                {row.modified && (
                                                    <div className="flex flex-col gap-0.5 text-sm text-gray-800 dark:text-gray-200">
                                                        <span>{row.modified.date}</span>
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {row.modified.time}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-5 sm:px-5">
                                                <StatusCell
                                                    status={row.status}
                                                    note={row.status_note}
                                                    onClick={() => setStatusRow(row)}
                                                />
                                            </td>
                                            <td className="px-4 py-5 sm:px-5">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditId(row.id)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#4A90E2] transition hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                        aria-label="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-[22px]">edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(row.id)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        aria-label="Remove"
                                                    >
                                                        <span className="material-symbols-outlined text-[22px]">cancel</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {statusRow && (
                <RequestStatusModal
                    row={statusRow}
                    onClose={() => setStatusRow(null)}
                    onSaved={() => loadRequests()}
                />
            )}

            {editId && (
                <RequestEditModal
                    requestId={editId}
                    serviceTypes={serviceTypes}
                    onClose={() => setEditId(null)}
                    onSaved={() => loadRequests()}
                />
            )}

            {showAdd && serviceTypes.length > 0 && (
                <RequestAddModal
                    serviceTypes={serviceTypes}
                    onClose={() => setShowAdd(false)}
                    onSaved={() => loadRequests()}
                />
            )}
        </div>
    );
}
