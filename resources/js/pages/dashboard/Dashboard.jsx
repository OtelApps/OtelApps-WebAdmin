import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../lib/http';
import { NotFound } from '../shared/NotFound';
import { STATUS_CELL } from '../activity/activityStatus';
import { DEFAULT_LAYOUT, reorderWidgets } from './dashboardWidgetConfig';
import { DashboardCustomizeBar, DashboardWidgetShell } from './DashboardCustomizeBar';
import { renderDashboardWidget } from './DashboardWidgets';

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
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{label}</span>
    );
}

export function Dashboard() {
    const navigate = useNavigate();
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bootstrapLoading, setBootstrapLoading] = useState(false);

    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    const [draftLayout, setDraftLayout] = useState(DEFAULT_LAYOUT);
    const [catalog, setCatalog] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [layoutSaving, setLayoutSaving] = useState(false);
    const [dragId, setDragId] = useState(null);

    const [activityEnabled, setActivityEnabled] = useState(false);
    const [conciergeEnabled, setConciergeEnabled] = useState(false);
    const [crmEnabled, setCrmEnabled] = useState(false);
    const [insightsEnabled, setInsightsEnabled] = useState(false);

    const [guestRequests, setGuestRequests] = useState([]);
    const [openCount, setOpenCount] = useState(0);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState(null);

    const [revenueData, setRevenueData] = useState(null);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [revenueError, setRevenueError] = useState(null);

    const [weekRevenueData, setWeekRevenueData] = useState(null);
    const [weekRevenueLoading, setWeekRevenueLoading] = useState(false);
    const [weekRevenueError, setWeekRevenueError] = useState(null);

    const [overviewData, setOverviewData] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [overviewError, setOverviewError] = useState(null);

    const [conciergeUnread, setConciergeUnread] = useState(0);
    const [conciergeLoading, setConciergeLoading] = useState(false);
    const [conciergeError, setConciergeError] = useState(null);

    const [crmKpis, setCrmKpis] = useState(null);
    const [crmLoading, setCrmLoading] = useState(false);
    const [crmError, setCrmError] = useState(null);

    const activeWidgets = isEditing ? draftLayout : layout;

    useEffect(() => {
        http.get('/api/modules/check/dashboard')
            .then((response) => {
                setIsEnabled(response.data.enabled);
            })
            .catch(() => {
                setIsEnabled(false);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!isEnabled) return;

        setBootstrapLoading(true);
        http.get('/api/dashboard/bootstrap')
            .then((res) => {
                const modules = res.data.modules ?? {};
                setActivityEnabled(Boolean(modules.activity));
                setConciergeEnabled(Boolean(modules.concierge));
                setCrmEnabled(Boolean(modules.crm));
                setInsightsEnabled(Boolean(modules.insights));

                const layoutData = res.data.layout ?? {};
                const widgets = layoutData.widgets ?? DEFAULT_LAYOUT;
                setLayout(widgets);
                setDraftLayout(widgets);
                setCatalog(layoutData.catalog ?? []);

                setOverviewData(res.data.overview ?? null);
                setOverviewError(null);
            })
            .catch((err) => {
                setLayout(DEFAULT_LAYOUT);
                setDraftLayout(DEFAULT_LAYOUT);
                setOverviewData(null);
                setOverviewError(err.response?.data?.message || 'Přehled hotelu se nepodařilo načíst.');
            })
            .finally(() => {
                setBootstrapLoading(false);
                setOverviewLoading(false);
            });
    }, [isEnabled]);

    useEffect(() => {
        if (!activityEnabled) {
            setGuestRequests([]);
            setOpenCount(0);
            return;
        }
        setRequestsLoading(true);
        http.get('/api/activity/requests', { params: { limit: PREVIEW_LIMIT } })
            .then((res) => {
                const list = res.data.requests ?? [];
                const counts = res.data.status_counts ?? {};
                setGuestRequests(list);
                setOpenCount(OPEN_STATUSES.reduce((sum, key) => sum + (Number(counts[key]) || 0), 0));
            })
            .catch((err) => {
                setGuestRequests([]);
                setOpenCount(0);
                setRequestsError(err.response?.data?.message || 'Požadavky se nepodařilo načíst.');
            })
            .finally(() => setRequestsLoading(false));
    }, [activityEnabled]);

    useEffect(() => {
        if (!activityEnabled) {
            setRevenueData(null);
            return;
        }
        setRevenueLoading(true);
        http.get('/api/activity/revenue-summary', { params: { period: 'today' } })
            .then((res) => setRevenueData(res.data))
            .catch((err) => setRevenueError(err.response?.data?.message || 'Tržby se nepodařilo načíst.'))
            .finally(() => setRevenueLoading(false));
    }, [activityEnabled]);

    useEffect(() => {
        if (!activityEnabled || !activeWidgets.includes('insights_revenue')) {
            setWeekRevenueData(null);
            return;
        }
        setWeekRevenueLoading(true);
        http.get('/api/activity/revenue-summary', { params: { period: 'week' } })
            .then((res) => setWeekRevenueData(res.data))
            .catch((err) => setWeekRevenueError(err.response?.data?.message || 'Tržby se nepodařilo načíst.'))
            .finally(() => setWeekRevenueLoading(false));
    }, [activityEnabled, activeWidgets]);

    useEffect(() => {
        if (!conciergeEnabled || !activeWidgets.includes('concierge_inbox')) {
            setConciergeUnread(0);
            return;
        }
        setConciergeLoading(true);
        http.get('/api/concierge/conversations')
            .then((res) => setConciergeUnread(res.data.unread_total ?? 0))
            .catch((err) => setConciergeError(err.response?.data?.message || 'Concierge data se nepodařilo načíst.'))
            .finally(() => setConciergeLoading(false));
    }, [conciergeEnabled, activeWidgets]);

    useEffect(() => {
        if (!crmEnabled || !activeWidgets.includes('crm_snapshot')) {
            setCrmKpis(null);
            return;
        }
        setCrmLoading(true);
        http.get('/api/crm/overview')
            .then((res) => setCrmKpis(res.data.kpis ?? null))
            .catch((err) => setCrmError(err.response?.data?.message || 'CRM data se nepodařilo načíst.'))
            .finally(() => setCrmLoading(false));
    }, [crmEnabled, activeWidgets]);

    const widgetProps = useMemo(
        () => ({
            onNavigate: navigate,
            overviewData,
            overviewLoading,
            overviewError,
            activityEnabled,
            revenueData,
            revenueLoading,
            revenueError,
            conciergeEnabled,
            conciergeUnread,
            conciergeLoading,
            conciergeError,
            crmEnabled,
            crmKpis,
            crmLoading,
            crmError,
            insightsEnabled,
            weekRevenueData,
            weekRevenueLoading,
            weekRevenueError,
            guestRequestsProps: {
                activityEnabled,
                openCount,
                guestRequests,
                loading: requestsLoading,
                error: requestsError,
                onNavigate: navigate,
                RequestStatusBadge,
            },
        }),
        [
            navigate,
            overviewData,
            overviewLoading,
            overviewError,
            activityEnabled,
            revenueData,
            revenueLoading,
            revenueError,
            conciergeEnabled,
            conciergeUnread,
            conciergeLoading,
            conciergeError,
            crmEnabled,
            crmKpis,
            crmLoading,
            crmError,
            insightsEnabled,
            weekRevenueData,
            weekRevenueLoading,
            weekRevenueError,
            openCount,
            guestRequests,
            requestsLoading,
            requestsError,
        ],
    );

    const handleSaveLayout = async () => {
        setLayoutSaving(true);
        try {
            const { data } = await http.put('/api/dashboard/layout', { widgets: draftLayout });
            setLayout(data.widgets ?? draftLayout);
            setDraftLayout(data.widgets ?? draftLayout);
            setCatalog(data.catalog ?? catalog);
            setIsEditing(false);
        } catch (err) {
            window.alert(err.response?.data?.message || 'Uložení layoutu se nezdařilo.');
        } finally {
            setLayoutSaving(false);
        }
    };

    const handleDrop = useCallback(
        (targetId) => {
            if (!dragId) return;
            setDraftLayout((prev) => reorderWidgets(prev, dragId, targetId));
            setDragId(null);
        },
        [dragId],
    );

    if (loading || bootstrapLoading) {
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
        <div className="mx-auto max-w-screen-2xl px-0.5 py-8 sm:px-1 lg:px-1.5">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage your hotel app</h1>
            </div>

            <DashboardCustomizeBar
                isEditing={isEditing}
                onStart={() => {
                    setDraftLayout(layout);
                    setIsEditing(true);
                }}
                onCancel={() => {
                    setDraftLayout(layout);
                    setIsEditing(false);
                    setDragId(null);
                }}
                onSave={handleSaveLayout}
                onReset={() => {
                    const defaults = DEFAULT_LAYOUT.filter(
                        (id) => catalog.some((c) => c.id === id) || id === 'hotel_overview',
                    );
                    setDraftLayout(defaults.length ? defaults : ['hotel_overview']);
                }}
                saving={layoutSaving}
                catalog={catalog}
                activeWidgets={draftLayout}
                onAddWidget={(id) => setDraftLayout((prev) => (prev.includes(id) ? prev : [...prev, id]))}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeWidgets.map((widgetId) => (
                    <DashboardWidgetShell
                        key={widgetId}
                        widgetId={widgetId}
                        isEditing={isEditing}
                        onRemove={(id) =>
                            setDraftLayout((prev) => (prev.length <= 1 ? prev : prev.filter((w) => w !== id)))
                        }
                        onDragStart={setDragId}
                        onDragOver={() => {}}
                        onDrop={handleDrop}
                    >
                        {renderDashboardWidget(widgetId, widgetProps)}
                    </DashboardWidgetShell>
                ))}

                {!isEditing && (
                    <div className="flex h-full flex-col items-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-700/50">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                            <span className="material-symbols-outlined text-3xl text-gray-600 dark:text-gray-400">
                                dashboard_customize
                            </span>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Customize Dashboard</h3>
                        <p className="mb-4 flex-1 text-center text-sm text-gray-600 dark:text-gray-400">
                            Přidejte widgety a seřaďte si je podle potřeb recepce
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setDraftLayout(layout);
                                setIsEditing(true);
                            }}
                            className="mt-auto rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                            UPRAVIT WIDGETY
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
