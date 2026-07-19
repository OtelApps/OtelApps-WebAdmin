import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

export function NotificationToasts() {
    const { toasts, dismissToast, openNotification } = useNotifications();

    if (toasts.length === 0) return null;

    return (
        <div className="pointer-events-none fixed bottom-6 right-6 z-[10002] flex max-w-sm flex-col gap-3">
            {toasts.map((toast) => (
                <div
                    key={toast.toastId}
                    className="pointer-events-auto animate-[slideIn_0.25s_ease-out] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-600 dark:bg-gray-800"
                    style={{
                        animation: 'otelToastIn 0.28s ease-out',
                    }}
                >
                    <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
                    <div className="flex gap-3 p-4">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                toast.source === 'concierge'
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {toast.source === 'concierge' ? 'chat' : 'notifications_active'}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                {toast.source === 'concierge' ? 'Concierge' : 'Activity'}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</p>
                            {toast.body && (
                                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{toast.body}</p>
                            )}
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        openNotification(toast);
                                        dismissToast(toast.toastId);
                                    }}
                                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                                >
                                    Otevřít
                                </button>
                                <button
                                    type="button"
                                    onClick={() => dismissToast(toast.toastId)}
                                    className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Zavřít
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes otelToastIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
