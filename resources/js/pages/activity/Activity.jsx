import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';

const PRIMARY_ORANGE = '#FF9F00';
const GUEST_NAME_BLUE = '#4A90E2';

const STATUS_FILTERS = [
    { key: 'new', label: 'New', dot: 'bg-[#3B82F6]', bg: 'bg-blue-500/10', text: 'text-[#3B82F6]' },
    { key: 'pending', label: 'Pending', dot: 'bg-amber-400', bg: 'bg-amber-400/15', text: 'text-amber-600' },
    { key: 'in_progress', label: 'In progress', dot: 'bg-[#FF9F00]', bg: 'bg-orange-400/15', text: 'text-orange-600' },
    { key: 'solved', label: 'Solved', dot: 'bg-[#10B981]', bg: 'bg-emerald-500/12', text: 'text-emerald-600' },
    { key: 'rejected', label: 'Rejected', dot: 'bg-[#EF4444]', bg: 'bg-red-500/10', text: 'text-red-600' },
    { key: 'archived', label: 'Archived', dot: 'bg-gray-600', bg: 'bg-gray-500/12', text: 'text-gray-600' },
];

const MOCK_ROWS = [
    {
        id: 1,
        serviceIcon: 'fitness_center',
        serviceLabel: 'Sports',
        request: 'Snorkeling underwater',
        guestName: 'Sara',
        guestRoom: '522',
        created: { date: '12/04/25', time: '14:32' },
        modified: { date: '12/04/25', time: '15:10' },
        status: 'new',
        statusNote: 'Message from guest',
    },
    {
        id: 2,
        serviceIcon: 'bed',
        serviceLabel: 'Amenities',
        request: 'Shaving Kit',
        guestName: 'James Miller',
        guestRoom: '118',
        created: { date: '11/04/25', time: '09:15' },
        modified: { date: '12/04/25', time: '08:00' },
        status: 'solved',
        statusNote: null,
    },
    {
        id: 3,
        serviceIcon: 'shopping_bag',
        serviceLabel: 'HH',
        request: 'Poolside cabana — 16:00',
        guestName: 'Elena Rossi',
        guestRoom: '304',
        created: { date: '10/04/25', time: '18:22' },
        modified: { date: '11/04/25', time: '11:45' },
        status: 'in_progress',
        statusNote: null,
    },
    {
        id: 4,
        serviceIcon: 'restaurant',
        serviceLabel: 'Restaurants',
        request: 'Dinner reservation — 8 p.m.',
        guestName: 'Marc Dubois',
        guestRoom: '201',
        created: { date: '09/04/25', time: '12:00' },
        modified: { date: '09/04/25', time: '12:05' },
        status: 'new',
        statusNote: null,
    },
    {
        id: 5,
        serviceIcon: 'fitness_center',
        serviceLabel: 'Sports',
        request: 'Tennis court — 1 hour',
        guestName: 'Anna K.',
        guestRoom: '415',
        created: { date: '08/04/25', time: '07:30' },
        modified: { date: '08/04/25', time: '07:31' },
        status: 'pending',
        statusNote: 'Message from guest',
    },
];

function StatusCell({ status, note }) {
    const configs = {
        new: {
            icon: 'schedule',
            label: 'New',
            iconClass: 'text-[#3B82F6]',
            textClass: 'text-[#3B82F6]',
        },
        solved: {
            icon: 'check_circle',
            label: 'Solved',
            iconClass: 'text-[#10B981]',
            textClass: 'text-[#10B981]',
        },
        in_progress: {
            icon: 'progress_activity',
            label: 'In progress',
            iconClass: 'text-[#FF9F00]',
            textClass: 'text-orange-600',
        },
        pending: {
            icon: 'hourglass_top',
            label: 'Pending',
            iconClass: 'text-amber-500',
            textClass: 'text-amber-600',
        },
    };
    const c = configs[status] || configs.new;
    return (
        <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[20px] ${c.iconClass}`}>{c.icon}</span>
                <span className={`text-sm font-medium ${c.textClass}`}>{c.label}</span>
            </div>
            {note ? <span className="text-xs text-gray-400 pl-[26px]">{note}</span> : null}
        </div>
    );
}

export function Activity() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get('/api/modules/check/activity')
            .then((response) => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isEnabled) {
        return <NotFound />;
    }

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-gray-50 pb-24 dark:bg-gray-900">
            <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100 sm:text-3xl">
                        Requests
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            className="rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:opacity-95"
                            style={{ backgroundColor: PRIMARY_ORANGE }}
                        >
                            + ADD REQUEST
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80"
                        >
                            <span className="material-symbols-outlined text-[20px] text-gray-500">help</span>
                            HELP
                        </button>
                    </div>
                </header>

                {/* Card: filters + table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {/* Filter row 1 */}
                    <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-4 sm:p-5 lg:grid-cols-12 lg:gap-5 dark:border-gray-700">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800 lg:col-span-3">
                            <span className="material-symbols-outlined shrink-0 text-[22px] text-gray-400">calendar_today</span>
                            <span className="text-sm text-gray-400">Filter by date</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800 lg:col-span-5">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="material-symbols-outlined shrink-0 text-[22px] text-gray-400">restaurant</span>
                                <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">Restaurants +15</span>
                            </div>
                            <span className="material-symbols-outlined shrink-0 text-gray-400">expand_more</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800 lg:col-span-4">
                            <span className="material-symbols-outlined shrink-0 text-[22px] text-gray-400">search</span>
                            <span className="text-sm text-gray-400">Search guest</span>
                        </div>
                    </div>

                    {/* Filter row 2 — status pills */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-4 sm:gap-3 sm:px-5 dark:border-gray-700">
                        <span className="mr-1 w-full text-sm text-gray-500 sm:mr-2 sm:w-auto">Filter by status</span>
                        {STATUS_FILTERS.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${s.bg} ${s.text}`}
                            >
                                <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
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
                                {MOCK_ROWS.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/40"
                                    >
                                        <td className="px-4 py-5 sm:px-5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="material-symbols-outlined text-[22px] text-gray-400">
                                                    {row.serviceIcon}
                                                </span>
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    {row.serviceLabel}
                                                </span>
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
                                                    {row.guestName}
                                                </span>
                                                <span className="text-xs text-gray-400">{row.guestRoom}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 sm:px-5">
                                            <div className="flex flex-col gap-0.5 text-sm text-gray-800 dark:text-gray-200">
                                                <span>{row.created.date}</span>
                                                <span className="text-gray-500 dark:text-gray-400">{row.created.time}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 sm:px-5">
                                            <div className="flex flex-col gap-0.5 text-sm text-gray-800 dark:text-gray-200">
                                                <span>{row.modified.date}</span>
                                                <span className="text-gray-500 dark:text-gray-400">{row.modified.time}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 sm:px-5">
                                            <StatusCell status={row.status} note={row.statusNote} />
                                        </td>
                                        <td className="px-4 py-5 sm:px-5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#4A90E2] transition hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                    aria-label="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-[22px]">edit</span>
                                                </button>
                                                <button
                                                    type="button"
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
                    </div>
                </div>
            </div>

            {/* FAB */}
            <button
                type="button"
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:opacity-95 sm:bottom-8 sm:right-8"
                style={{ backgroundColor: PRIMARY_ORANGE }}
                aria-label="Messages"
            >
                <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
            </button>
        </div>
    );
}
