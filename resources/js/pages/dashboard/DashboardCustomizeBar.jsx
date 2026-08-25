import React from 'react';
import { WIDGET_META } from './dashboardWidgetConfig';

export function DashboardCustomizeBar({
    isEditing,
    onStart,
    onCancel,
    onSave,
    onReset,
    saving,
    catalog,
    activeWidgets,
    onAddWidget,
}) {
    const available = (catalog ?? []).filter((w) => !activeWidgets.includes(w.id));

    if (!isEditing) {
        return (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Přizpůsobte si dashboard — přidejte widgety a změňte jejich pořadí.
                </p>
                <button
                    type="button"
                    onClick={onStart}
                    className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
                >
                    <span className="material-symbols-outlined text-lg">dashboard_customize</span>
                    Upravit widgety
                </button>
            </div>
        );
    }

    return (
        <div className="mb-6 rounded-2xl border-2 border-orange-300 bg-orange-50/80 p-4 dark:border-orange-700 dark:bg-orange-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="font-semibold text-orange-700 dark:text-orange-300">Režim úprav dashboardu</p>
                    <p className="mt-1 text-sm text-orange-600/80 dark:text-orange-200/80">
                        Přetáhněte widgety pro změnu pořadí. Odeberte nebo přidejte widgety ze seznamu níže.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onReset}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
                    >
                        Výchozí
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
                    >
                        Zrušit
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                        {saving ? 'Ukládání…' : 'Uložit layout'}
                    </button>
                </div>
            </div>

            {available.length > 0 && (
                <div className="mt-4 border-t border-orange-200 pt-4 dark:border-orange-800">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-300">
                        Přidat widget
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {available.map((widget) => (
                            <button
                                key={widget.id}
                                type="button"
                                onClick={() => onAddWidget(widget.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:border-orange-400 hover:text-orange-600 dark:border-orange-800 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <span className="material-symbols-outlined text-base">
                                    {widget.icon ?? WIDGET_META[widget.id]?.icon ?? 'widgets'}
                                </span>
                                {widget.title}
                                <span className="text-orange-500">+</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function DashboardWidgetShell({
    widgetId,
    isEditing,
    onRemove,
    onDragStart,
    onDragOver,
    onDrop,
    children,
}) {
    const meta = WIDGET_META[widgetId] ?? { title: widgetId };

    return (
        <div
            draggable={isEditing}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                onDragStart(widgetId);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver(widgetId);
            }}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(widgetId);
            }}
            className={`relative h-full transition ${
                isEditing ? 'rounded-xl ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-gray-900' : ''
            }`}
        >
            {isEditing && (
                <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
                    <span
                        className="cursor-grab rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-gray-500 shadow dark:bg-gray-800"
                        title="Přetáhnout"
                    >
                        ⋮⋮
                    </span>
                    <button
                        type="button"
                        onClick={() => onRemove(widgetId)}
                        className="rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-red-500 shadow hover:bg-red-50 dark:bg-gray-800"
                        title="Odebrat widget"
                    >
                        ×
                    </button>
                </div>
            )}
            {isEditing && (
                <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-orange-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    {meta.title}
                </div>
            )}
            {children}
        </div>
    );
}
