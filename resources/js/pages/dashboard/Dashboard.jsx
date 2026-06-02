import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../lib/http';
import { NotFound } from '../shared/NotFound';
import { STATUS_CELL } from '../activity/activityStatus';
import { RevenueUpsellPanel } from '../../components/RevenueUpsellPanel';

const OPEN_STATUSES = ['new', 'pending', 'in_progress'];
const PREVIEW_LIMIT = 3;

const STATUS_BADGE_CLASS = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    solved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
};

function RequestStatusBadge({ status }) {
    const label = STATUS_CELL[status]?.label ?? status;
    const cls = STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.new;
    return (
        <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{label}</span>
    );
}

export function Dashboard() {
    const navigate = useNavigate();
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activityEnabled, setActivityEnabled] = useState(false);
    const [guestRequests, setGuestRequests] = useState([]);
    const [openCount, setOpenCount] = useState(0);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [revenueError, setRevenueError] = useState(null);

    useEffect(() => {
        http.get('/api/modules/check/dashboard')
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        http
            .get('/api/modules/check/activity')
            .then((res) => setActivityEnabled(Boolean(res.data.enabled)))
            .catch(() => setActivityEnabled(false));
    }, []);

    useEffect(() => {
        if (!activityEnabled) {
            setGuestRequests([]);
            setOpenCount(0);
            return;
        }
        setRequestsLoading(true);
        setRequestsError(null);
        http
            .get('/api/activity/requests')
            .then((res) => {
                const list = res.data.requests ?? [];
                const counts = res.data.status_counts ?? {};
                setGuestRequests(list.slice(0, PREVIEW_LIMIT));
                setOpenCount(
                    OPEN_STATUSES.reduce((sum, key) => sum + (Number(counts[key]) || 0), 0),
                );
            })
            .catch((err) => {
                setGuestRequests([]);
                setOpenCount(0);
                setRequestsError(
                    err.response?.data?.message ||
                        'Požadavky se nepodařilo načíst. Zkontroluj Activity v Supabase.',
                );
            })
            .finally(() => setRequestsLoading(false));
    }, [activityEnabled]);

    useEffect(() => {
        if (!activityEnabled) {
            setRevenueData(null);
            return;
        }
        setRevenueLoading(true);
        setRevenueError(null);
        http.get('/api/activity/revenue-summary', { params: { period: 'today' } })
            .then((res) => setRevenueData(res.data))
            .catch((err) => {
                setRevenueData(null);
                setRevenueError(err.response?.data?.message || 'Tržby se nepodařilo načíst.');
            })
            .finally(() => setRevenueLoading(false));
    }, [activityEnabled]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isEnabled) {
        return <NotFound />;
    }
    return (
        <div className="max-w-screen-2xl mx-auto px-0.5 sm:px-1 lg:px-1.5 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Manage your hotel app</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Hotel Overview Card */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-6 flex flex-col h-full">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hotel Overview</h2>
                    <div className="space-y-3 flex-1">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Guests staying:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">84/100</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Arrivals / Departures:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">12 / 8</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Occupancy:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">84%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                            <span className="text-green-500 font-semibold flex items-center">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                +5%
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 flex space-x-3">
                        <button className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            Manage Rooms
                        </button>
                        <button className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                            View Reservations
                        </button>
                    </div>
                </div>

                {/* Guest Requests Card — data z Activity */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Guest Requests</h2>
                        {activityEnabled && openCount > 0 && (
                            <span
                                className="bg-red-500 text-white rounded-full min-w-8 h-8 px-2 flex items-center justify-center text-sm font-semibold"
                                title="Nové, čekající a rozpracované"
                            >
                                {openCount}
                            </span>
                        )}
                    </div>
                    <div className="space-y-3 mb-4 flex-1 min-h-[120px]">
                        {!activityEnabled ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                                Modul Activity není zapnutý.
                            </p>
                        ) : requestsLoading ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Načítání…</p>
                        ) : requestsError ? (
                            <p className="text-sm text-red-600 dark:text-red-400 py-2">{requestsError}</p>
                        ) : guestRequests.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                                Žádné požadavky hostů.
                            </p>
                        ) : (
                            guestRequests.map((row) => (
                                <button
                                    key={row.id}
                                    type="button"
                                    onClick={() => navigate('/activity')}
                                    className="flex w-full items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg text-left transition hover:bg-gray-100 dark:hover:bg-gray-500/80"
                                >
                                    <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                        Pokoj {row.guest_room}: {row.request}
                                    </span>
                                    <RequestStatusBadge status={row.status} />
                                </button>
                            ))
                        )}
                    </div>
                    <div className="flex space-x-3 mt-auto">
                        <button
                            type="button"
                            disabled={!activityEnabled}
                            onClick={() => navigate('/activity')}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create New
                        </button>
                        <button
                            type="button"
                            disabled={!activityEnabled}
                            onClick={() => navigate('/activity')}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            View All
                        </button>
                    </div>
                </div>

                {/* Revenue & Upsell Card — data z Activity */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-6 flex flex-col h-full">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Revenue & Upsell</h2>
                    <div className="flex-1">
                        <RevenueUpsellPanel
                            data={revenueData}
                            loading={revenueLoading}
                            error={revenueError}
                            activityEnabled={activityEnabled}
                            compact
                        />
                    </div>
                    <div className="flex space-x-3 mt-auto">
                        <button
                            type="button"
                            disabled={!activityEnabled}
                            onClick={() => navigate('/activity')}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Activity
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/module/insights/revenue')}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            Open Insights
                        </button>
                    </div>
                </div>

                {/* Add Content Card */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-5 flex flex-col items-center h-full">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Content</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">Enrich your Facilities and Services in just a couple clicks</p>
                    <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mt-auto">
                        ADD CONTENT
                    </button>
                </div>

                {/* Customize your App Card */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-5 flex flex-col items-center h-full">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customize your App</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">Use your Colours, Logo, Images and Icons</p>
                    <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mt-auto">
                        EDIT STYLE
                    </button>
                </div>

                {/* Manage Requests Card */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-5 flex flex-col items-center h-full">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Requests</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">Manage all Requests and Reservations from ACTIVITY</p>
                    <button
                        type="button"
                        disabled={!activityEnabled}
                        onClick={() => navigate('/activity')}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        MANAGE REQUESTS
                    </button>
                </div>
            </div>
        </div>
    );
}

