import React from 'react';
import { formatMoney, CATEGORY_BAR_COLORS } from '../utils/formatMoney';

/**
 * Sdílený panel tržeb z Activity (dashboard + Insights → Revenue).
 */
export function RevenueUpsellPanel({
    data,
    loading,
    error,
    activityEnabled,
    compact = false,
    showPeriodLabel = false,
}) {
    if (!activityEnabled) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                Zapněte modul Activity pro přehled tržeb z objednávek hostů.
            </p>
        );
    }

    if (loading) {
        return <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Načítání tržeb…</p>;
    }

    if (error) {
        return <p className="text-sm text-red-600 dark:text-red-400 py-2">{error}</p>;
    }

    if (!data) {
        return null;
    }

    const currency = data.currency ?? 'CZK';
    const categories = data.categories ?? [];
    const categoriesSum = categories.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const total =
        Number(data.period_total) > 0
            ? Number(data.period_total)
            : Number(data.categories_total) > 0
              ? Number(data.categories_total)
              : categoriesSum > 0
                ? categoriesSum
                : Number(data.today_total) || 0;
    const orderCount = data.order_count ?? 0;

    const periodLabels = {
        today: 'dnes',
        week: 'tento týden',
        month: 'tento měsíc',
    };

    return (
        <div className={compact ? '' : 'flex-1'}>
            <div className={compact ? 'mb-3' : 'mb-4'}>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {showPeriodLabel
                        ? `Tržby (${periodLabels[data.period] ?? data.period})`
                        : "Today's Revenue"}
                </p>
                <p className={`font-bold text-gray-900 dark:text-white ${compact ? 'text-2xl' : 'text-3xl'}`}>
                    {formatMoney(total, currency)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {orderCount} {orderCount === 1 ? 'objednávka' : orderCount < 5 ? 'objednávky' : 'objednávek'} z Activity
                </p>
            </div>

            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Top Services</p>
                {categories.length === 0 ? (
                    <p className="text-xs text-gray-400">
                        Zatím žádné kategorie — přidejte ceny v metadata (např. room_service → total_amount).
                    </p>
                ) : (
                    <>
                        <div className="flex h-8 rounded-lg overflow-hidden">
                            {categories.slice(0, 5).map((cat, i) => {
                                const width = Math.max(cat.percent || 0, cat.percent > 0 ? 8 : 0);
                                if (width <= 0) return null;
                                return (
                                    <div
                                        key={cat.key}
                                        className={`${CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-semibold px-0.5 min-w-0`}
                                        style={{ width: `${width}%` }}
                                        title={`${cat.label}: ${formatMoney(cat.amount, currency)}`}
                                    >
                                        {width >= 18 ? cat.label : ''}
                                    </div>
                                );
                            })}
                        </div>
                        <ul className="mt-2 space-y-1">
                            {categories.slice(0, 5).map((cat, i) => (
                                <li
                                    key={cat.key}
                                    className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300"
                                >
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]}`}
                                        />
                                        <span className="truncate">{cat.label}</span>
                                        <span className="text-gray-400">({cat.count})</span>
                                    </span>
                                    <span className="font-medium shrink-0 ml-2">
                                        {cat.amount > 0
                                            ? formatMoney(cat.amount, currency)
                                            : '—'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
}
