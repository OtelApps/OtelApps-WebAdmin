import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const SOURCE_LABELS = {
    activity: 'Activity',
    concierge: 'Concierge',
};

function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function NotificationBell() {
    const {
        notifications,
        unreadCount,
        openNotification,
        markAllRead,
    } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDocClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className="relative text-gray-300 hover:text-white"
                aria-label="Notifikace"
            >
                <span className="material-symbols-outlined text-[26px]">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full z-[9999] mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-600 dark:bg-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifikace</h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllRead()}
                                className="text-xs font-medium text-orange-500 hover:text-orange-600"
                            >
                                Označit vše jako přečtené
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-gray-500">Žádné notifikace</p>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => {
                                        openNotification(n);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 ${
                                        !n.read_at ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                                    }`}
                                >
                                    <span
                                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                            !n.read_at ? 'bg-orange-500' : 'bg-transparent'
                                        }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                {n.title}
                                            </span>
                                            <span className="shrink-0 text-[10px] uppercase text-gray-400">
                                                {SOURCE_LABELS[n.source] ?? n.source}
                                            </span>
                                        </div>
                                        {n.body && (
                                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                                {n.body}
                                            </p>
                                        )}
                                        <p className="mt-1 text-[10px] text-gray-400">{formatTime(n.created_at)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-700">
                        <Link
                            to="/activity"
                            onClick={() => setOpen(false)}
                            className="block py-1.5 text-xs text-gray-500 hover:text-orange-500"
                        >
                            Activity
                        </Link>
                        <Link
                            to="/concierge"
                            onClick={() => setOpen(false)}
                            className="block py-1.5 text-xs text-gray-500 hover:text-orange-500"
                        >
                            Concierge
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export function NavBadge({ count }) {
    if (!count || count <= 0) return null;
    return (
        <span className="absolute -right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
            {count > 9 ? '9+' : count}
        </span>
    );
}
