import React from 'react';
import { HotelOverviewCard } from '../../components/dashboard/HotelOverviewCard';
import { RevenueUpsellPanel } from '../../components/dashboard/RevenueUpsellPanel';
import { WidgetBodySkeleton } from '../../components/ui/PageSkeleton';
import { formatMoney } from '../../utils/formatMoney';

function ShortcutCard({ icon, title, description, primaryLabel, onPrimary, disabled = false, badge = null }) {
    return (
        <div className="flex h-full flex-col rounded-lg border-2 border-gray-300 bg-white p-5 shadow-md dark:border-gray-500 dark:bg-gray-700">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                <span className="material-symbols-outlined text-3xl text-gray-600 dark:text-gray-400">{icon}</span>
            </div>
            <div className="flex flex-1 flex-col">
                <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {badge}
                </div>
                <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onPrimary}
                    className="mt-auto rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {primaryLabel}
                </button>
            </div>
        </div>
    );
}

export function GuestRequestsWidget({
    activityEnabled,
    openCount,
    guestRequests,
    loading,
    error,
    onNavigate,
    RequestStatusBadge,
}) {
    return (
        <div className="flex h-full flex-col rounded-lg border-2 border-gray-300 bg-white p-6 shadow-md dark:border-gray-500 dark:bg-gray-700">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Guest Requests</h2>
                {activityEnabled && openCount > 0 && (
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-red-500 px-2 text-sm font-semibold text-white">
                        {openCount}
                    </span>
                )}
            </div>
            <div className="mb-4 min-h-[120px] flex-1 space-y-3">
                {!activityEnabled ? (
                    <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Modul Activity není zapnutý.</p>
                ) : loading ? (
                    <WidgetBodySkeleton rows={3} />
                ) : error ? (
                    <p className="py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : guestRequests.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Žádné požadavky hostů.</p>
                ) : (
                    guestRequests.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => onNavigate('/activity')}
                            className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500/80"
                        >
                            <span className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                                Pokoj {row.guest_room}: {row.request}
                            </span>
                            <RequestStatusBadge status={row.status} />
                        </button>
                    ))
                )}
            </div>
            <div className="mt-auto flex space-x-3">
                <button
                    type="button"
                    disabled={!activityEnabled}
                    onClick={() => onNavigate('/activity')}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300"
                >
                    Create New
                </button>
                <button
                    type="button"
                    disabled={!activityEnabled}
                    onClick={() => onNavigate('/activity')}
                    className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                    View All
                </button>
            </div>
        </div>
    );
}

export function RevenueUpsellWidget({ activityEnabled, revenueData, loading, error, onNavigate }) {
    return (
        <div className="flex h-full flex-col rounded-lg border-2 border-gray-300 bg-white p-6 shadow-md dark:border-gray-500 dark:bg-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Revenue & Upsell</h2>
            <div className="flex-1">
                <RevenueUpsellPanel
                    data={revenueData}
                    loading={loading}
                    error={error}
                    activityEnabled={activityEnabled}
                    compact
                />
            </div>
            <div className="mt-auto flex space-x-3">
                <button
                    type="button"
                    disabled={!activityEnabled}
                    onClick={() => onNavigate('/activity')}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300"
                >
                    Activity
                </button>
                <button
                    type="button"
                    onClick={() => onNavigate('/module/insights/revenue')}
                    className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
                >
                    Open Insights
                </button>
            </div>
        </div>
    );
}

export function ConciergeInboxWidget({ enabled, unread, loading, error, onNavigate }) {
    return (
        <div className="flex h-full flex-col rounded-lg border-2 border-gray-300 bg-white p-6 shadow-md dark:border-gray-500 dark:bg-gray-700">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                    <span className="material-symbols-outlined text-3xl text-gray-600 dark:text-gray-400">chat</span>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Concierge Inbox</h3>
                    {enabled && unread > 0 && (
                        <span className="text-sm font-medium text-red-500">{unread} nepřečtených</span>
                    )}
                </div>
            </div>
            {!enabled ? (
                <p className="flex-1 text-sm text-gray-500">Modul Concierge není zapnutý.</p>
            ) : loading ? (
                <div className="flex-1">
                    <WidgetBodySkeleton rows={2} />
                </div>
            ) : error ? (
                <p className="flex-1 text-sm text-red-500">{error}</p>
            ) : (
                <p className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                    {unread > 0
                        ? 'Hosté čekají na odpověď recepce.'
                        : 'Všechny konverzace jsou přečtené.'}
                </p>
            )}
            <button
                type="button"
                disabled={!enabled}
                onClick={() => onNavigate('/concierge')}
                className="mt-auto rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
                OPEN CONCIERGE
            </button>
        </div>
    );
}

export function CrmSnapshotWidget({ enabled, kpis, loading, error, onNavigate }) {
    return (
        <div className="flex h-full flex-col rounded-lg border-2 border-gray-300 bg-white p-6 shadow-md dark:border-gray-500 dark:bg-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">CRM Snapshot</h2>
            {!enabled ? (
                <p className="flex-1 text-sm text-gray-500">Modul CRM není zapnutý.</p>
            ) : loading ? (
                <div className="flex-1">
                    <WidgetBodySkeleton rows={4} />
                </div>
            ) : error ? (
                <p className="flex-1 text-sm text-red-500">{error}</p>
            ) : (
                <div className="grid flex-1 grid-cols-2 gap-3">
                    {[
                        { label: 'Hosté', value: kpis?.guests_total ?? 0 },
                        { label: 'VIP', value: kpis?.vip_guests ?? 0 },
                        { label: 'Alerty', value: kpis?.active_alerts ?? 0 },
                        { label: 'Úkoly', value: kpis?.open_tasks ?? 0 },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-300">{item.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                        </div>
                    ))}
                </div>
            )}
            <button
                type="button"
                disabled={!enabled}
                onClick={() => onNavigate('/crm')}
                className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
                Open CRM
            </button>
        </div>
    );
}

export function InsightsRevenueWidget({ enabled, data, loading, error, onNavigate }) {
    const currency = data?.currency ?? 'CZK';
    const total = Number(data?.period_total ?? data?.today_total ?? 0);

    return (
        <div className="flex h-full flex-col rounded-lg border-2 border-gray-300 bg-white p-6 shadow-md dark:border-gray-500 dark:bg-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Insights Revenue</h2>
            {!enabled ? (
                <p className="flex-1 text-sm text-gray-500">Modul Insights není zapnutý.</p>
            ) : loading ? (
                <div className="flex-1">
                    <WidgetBodySkeleton rows={3} />
                </div>
            ) : error ? (
                <p className="flex-1 text-sm text-red-500">{error}</p>
            ) : (
                <div className="flex-1">
                    <p className="text-sm text-gray-500">Tržby tento týden</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatMoney(total, currency)}</p>
                    <p className="mt-1 text-xs text-gray-400">{data?.order_count ?? 0} objednávek</p>
                </div>
            )}
            <button
                type="button"
                onClick={() => onNavigate('/module/insights/revenue')}
                className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
                Open Insights
            </button>
        </div>
    );
}

export function renderDashboardWidget(id, props) {
    switch (id) {
        case 'hotel_overview':
            return (
                <HotelOverviewCard
                    data={props.overviewData}
                    loading={props.overviewLoading}
                    error={props.overviewError}
                    onManageRooms={() => {
                        if (props.overviewData?.links?.rooms) props.onNavigate(props.overviewData.links.rooms);
                    }}
                    onViewGuests={() => {
                        props.onNavigate(props.overviewData?.links?.guests ?? '/activity');
                    }}
                />
            );
        case 'guest_requests':
            return <GuestRequestsWidget {...props.guestRequestsProps} />;
        case 'revenue_upsell':
            return (
                <RevenueUpsellWidget
                    activityEnabled={props.activityEnabled}
                    revenueData={props.revenueData}
                    loading={props.revenueLoading}
                    error={props.revenueError}
                    onNavigate={props.onNavigate}
                />
            );
        case 'add_content':
            return (
                <ShortcutCard
                    icon="article"
                    title="Add Content"
                    description="Obohaťte Facilities a Services na pár kliknutí"
                    primaryLabel="ADD CONTENT"
                    onPrimary={() => props.onNavigate('/content')}
                />
            );
        case 'manage_requests':
            return (
                <ShortcutCard
                    icon="checklist"
                    title="Manage Requests"
                    description="Spravujte požadavky a rezervace z Activity"
                    primaryLabel="MANAGE REQUESTS"
                    disabled={!props.activityEnabled}
                    onPrimary={() => props.onNavigate('/activity')}
                />
            );
        case 'concierge_inbox':
            return (
                <ConciergeInboxWidget
                    enabled={props.conciergeEnabled}
                    unread={props.conciergeUnread}
                    loading={props.conciergeLoading}
                    error={props.conciergeError}
                    onNavigate={props.onNavigate}
                />
            );
        case 'crm_snapshot':
            return (
                <CrmSnapshotWidget
                    enabled={props.crmEnabled}
                    kpis={props.crmKpis}
                    loading={props.crmLoading}
                    error={props.crmError}
                    onNavigate={props.onNavigate}
                />
            );
        case 'insights_revenue':
            return (
                <InsightsRevenueWidget
                    enabled={props.insightsEnabled}
                    data={props.weekRevenueData}
                    loading={props.weekRevenueLoading}
                    error={props.weekRevenueError}
                    onNavigate={props.onNavigate}
                />
            );
        default:
            return null;
    }
}
