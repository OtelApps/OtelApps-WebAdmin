import React from 'react';

export const STATUS_ORDER = ['new', 'pending', 'in_progress', 'solved', 'rejected', 'archived'];

export const STATUS_FILTERS = [
    { key: 'new', label: 'New', dot: 'bg-[#3B82F6]', bg: 'bg-blue-500/10', text: 'text-[#3B82F6]' },
    { key: 'pending', label: 'Pending', dot: 'bg-amber-400', bg: 'bg-amber-400/15', text: 'text-amber-600' },
    { key: 'in_progress', label: 'In progress', dot: 'bg-[#FF9F00]', bg: 'bg-orange-400/15', text: 'text-orange-600' },
    { key: 'solved', label: 'Solved', dot: 'bg-[#10B981]', bg: 'bg-emerald-500/12', text: 'text-emerald-600' },
    { key: 'rejected', label: 'Rejected', dot: 'bg-[#EF4444]', bg: 'bg-red-500/10', text: 'text-red-600' },
    { key: 'archived', label: 'Archived', dot: 'bg-gray-600', bg: 'bg-gray-500/12', text: 'text-gray-600' },
];

export const STATUS_CELL = {
    new: { icon: 'schedule', label: 'New', iconClass: 'text-[#3B82F6]', textClass: 'text-[#3B82F6]' },
    pending: { icon: 'hourglass_top', label: 'Pending', iconClass: 'text-amber-500', textClass: 'text-amber-600' },
    in_progress: { icon: 'progress_activity', label: 'In progress', iconClass: 'text-[#FF9F00]', textClass: 'text-orange-600' },
    solved: { icon: 'check_circle', label: 'Solved', iconClass: 'text-[#10B981]', textClass: 'text-[#10B981]' },
    rejected: { icon: 'cancel', label: 'Rejected', iconClass: 'text-red-500', textClass: 'text-red-600' },
    archived: { icon: 'inventory_2', label: 'Archived', iconClass: 'text-gray-500', textClass: 'text-gray-600' },
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
            {note ? <span className="text-xs text-gray-400 pl-[26px]">{note}</span> : null}
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                title="Změnit status"
                className={`group flex flex-col gap-0.5 rounded-lg px-1 py-0.5 text-left transition hover:bg-gray-100 dark:hover:bg-gray-700/50 ${className}`}
            >
                {inner}
            </button>
        );
    }

    return <div className={`flex flex-col gap-0.5 ${className}`}>{inner}</div>;
}
