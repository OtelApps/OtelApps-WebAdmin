import React from 'react';

export const STATUS_ORDER = ['new', 'pending', 'in_progress', 'solved', 'rejected', 'archived'];

export const STATUS_CELL = {
    new: { icon: 'schedule', label: 'Nový', iconClass: 'text-[#3B82F6]', textClass: 'text-[#3B82F6]' },
    pending: { icon: 'hourglass_top', label: 'Čeká', iconClass: 'text-amber-500', textClass: 'text-amber-600' },
    in_progress: { icon: 'progress_activity', label: 'Probíhá', iconClass: 'text-[#FF9F00]', textClass: 'text-orange-600' },
    solved: { icon: 'check_circle', label: 'Hotovo', iconClass: 'text-[#10B981]', textClass: 'text-[#10B981]' },
    rejected: { icon: 'cancel', label: 'Zamítnuto', iconClass: 'text-red-500', textClass: 'text-red-600' },
    archived: { icon: 'inventory_2', label: 'Archivováno', iconClass: 'text-gray-500', textClass: 'text-gray-600' },
};

export function StatusCell({ status, note, onClick, className = '' }) {
    const c = STATUS_CELL[status] || STATUS_CELL.new;
    const inner = (
        <>
            <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[20px] ${c.iconClass}`}>{c.icon}</span>
                <span className={`text-sm font-medium ${c.textClass}`}>{c.label}</span>
                {onClick ? (
                    <span className="material-symbols-outlined text-base text-gray-400">expand_more</span>
                ) : null}
            </div>
            {note ? <span className="block pl-[26px] text-xs text-gray-400">{note}</span> : null}
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                title="Změnit status"
                className={`group flex flex-col gap-0.5 rounded-lg px-1 py-0.5 text-left transition hover:bg-gray-100 ${className}`}
            >
                {inner}
            </button>
        );
    }

    return <div className={`flex flex-col gap-0.5 ${className}`}>{inner}</div>;
}
