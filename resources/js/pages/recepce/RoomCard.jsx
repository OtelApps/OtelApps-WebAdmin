import React from 'react';
import {
    CLEANING_DOT,
    CLEANING_LABELS,
    OCCUPANCY_DOT,
    OCCUPANCY_LABELS,
    formatMoney,
} from './receptionLabels';

export function RoomCard({ room, selected, onSelect }) {
    const occupied = room.occupancy_status === 'occupied';

    return (
        <button
            type="button"
            onClick={() => onSelect(room)}
            className={`w-full text-left rounded-xl border bg-white px-3.5 py-3 shadow-sm transition
                hover:border-orange-300 hover:shadow-md
                ${selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}
                dark:bg-gray-900 dark:border-gray-700 dark:hover:border-orange-400`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-semibold text-gray-900 dark:text-white tabular-nums">
                        {room.room_number}
                    </span>
                    <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${OCCUPANCY_DOT[room.occupancy_status] || 'bg-gray-400'}`}
                        />
                        {OCCUPANCY_LABELS[room.occupancy_status] || room.occupancy_status}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-gray-400">
                    {room.has_open_issue && (
                        <span className="material-symbols-outlined text-[18px] text-orange-500" title="Závada">
                            build
                        </span>
                    )}
                    <span className="material-symbols-outlined text-[18px]">search</span>
                </div>
            </div>

            <div className="mt-2 min-h-[1.25rem] text-sm text-gray-800 dark:text-gray-200 truncate">
                {occupied && room.guest_name ? room.guest_name : '\u00a0'}
            </div>

            <div className="mt-2 flex items-end justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                    {occupied && room.guest_count != null && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <span className="material-symbols-outlined text-[16px]">person</span>
                            {room.guest_count}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${CLEANING_DOT[room.cleaning_status] || 'bg-gray-400'}`}
                        />
                        {CLEANING_LABELS[room.cleaning_status] || room.cleaning_status}
                    </span>
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100 tabular-nums shrink-0">
                    {formatMoney(room.balance, room.currency)}
                </span>
            </div>
        </button>
    );
}
