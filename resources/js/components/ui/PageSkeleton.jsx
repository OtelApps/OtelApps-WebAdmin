import React from 'react';

function SkeletonBlock({ className = '' }) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
            aria-hidden
        />
    );
}

/**
 * Skeleton pro list stránky (content cards) — stránka je vidět hned, data dobíhají.
 */
export function ContentListSkeleton({ title, cardCount = 6 }) {
    return (
        <div className="p-6" aria-busy="true" aria-label="Načítání obsahu">
            <div className="mb-6 flex items-center justify-between gap-3">
                {title ? (
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                ) : (
                    <SkeletonBlock className="h-8 w-56" />
                )}
                <SkeletonBlock className="h-9 w-24" />
            </div>
            <div className="mb-6 flex items-center gap-4">
                <SkeletonBlock className="h-10 w-24" />
                <SkeletonBlock className="h-10 w-20" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: cardCount }).map((_, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        <SkeletonBlock className="h-40 w-full rounded-none" />
                        <div className="space-y-3 p-4">
                            <SkeletonBlock className="h-5 w-3/4" />
                            <SkeletonBlock className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function HubPageSkeleton() {
    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6" aria-busy="true">
            <SkeletonBlock className="mb-6 h-9 w-64" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="mb-4 flex gap-4">
                            <SkeletonBlock className="h-12 w-12 shrink-0 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <SkeletonBlock className="h-6 w-40" />
                                <SkeletonBlock className="h-4 w-full" />
                            </div>
                        </div>
                        <SkeletonBlock className="mt-4 h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="mx-auto max-w-screen-2xl px-0.5 py-8 sm:px-1 lg:px-1.5" aria-busy="true">
            <SkeletonBlock className="mb-6 h-9 w-72" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        <SkeletonBlock className="mb-4 h-5 w-32" />
                        <SkeletonBlock className="mb-2 h-8 w-20" />
                        <SkeletonBlock className="h-24 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PageLoadError({ message, onRetry }) {
    return (
        <div className="p-6 max-w-xl">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                <p className="mb-2 font-medium">Chyba načtení dat</p>
                <p className="text-sm">{message}</p>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                    >
                        Zkusit znovu
                    </button>
                )}
            </div>
        </div>
    );
}
