import React from 'react';

function TrendBadge({ trend }) {
    if (trend === null || trend === undefined) {
        return <span className="font-semibold text-gray-400">—</span>;
    }

    const up = trend >= 0;

    return (
        <span
            className={`font-semibold flex items-center ${up ? 'text-green-500' : 'text-red-500'}`}
        >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {up ? (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                ) : (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                )}
            </svg>
            {up ? '+' : ''}
            {trend}%
        </span>
    );
}

const SOURCE_HINTS = {
    crm_stays: 'Data z CRM profilů (check-in / check-out)',
    activity_rooms: 'Odhad z aktivních pokojů v Activity a Concierge',
    none: 'Doplňte pobyty v CRM nebo spusťte hotel_crm_extended.sql',
};

export function HotelOverviewCard({ data, loading, error, onManageRooms, onViewGuests }) {
    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-500 p-6 flex flex-col h-full">
            <div className="mb-4 flex items-start justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hotel Overview</h2>
                {data?.hotel_name && (
                    <span className="truncate text-xs text-gray-400">{data.hotel_name}</span>
                )}
            </div>

            <div className="space-y-3 flex-1">
                {loading ? (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Načítání…</p>
                ) : error ? (
                    <p className="py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : data ? (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Guests staying:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {data.guests_staying}/{data.room_capacity}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Arrivals / Departures:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {data.arrivals_today} / {data.departures_today}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Occupancy:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {data.occupancy_percent}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Trend (vs. včera):</span>
                            <TrendBadge trend={data.occupancy_trend} />
                        </div>

                        {(data.highlights ?? []).length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-600">
                                {data.highlights.map((item) => (
                                    <div key={item.label} className="flex justify-between text-xs">
                                        <span className="text-gray-500">{item.label}</span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="pt-1 text-[10px] text-gray-400">
                            {SOURCE_HINTS[data.data_source] ?? SOURCE_HINTS.none}
                        </p>
                    </>
                ) : null}
            </div>

            <div className="mt-6 flex space-x-3">
                <button
                    type="button"
                    disabled={!data?.links?.rooms}
                    onClick={onManageRooms}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Manage Rooms
                </button>
                <button
                    type="button"
                    disabled={!data}
                    onClick={onViewGuests}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {data?.crm_enabled ? 'View Guests' : 'View Activity'}
                </button>
            </div>
        </div>
    );
}
