import React from 'react';
import { formatDateTime, formatMoney } from '../receptionLabels';

export function MinibarTab({ items = [] }) {
    if (!items.length) {
        return <p className="text-sm text-gray-500">Žádná spotřeba z minibaru.</p>;
    }

    const total = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const currency = items[0]?.currency || 'CZK';

    return (
        <div className="space-y-4">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {item.quantity}× {formatMoney(item.unit_price, item.currency)}
                                {' · '}
                                {formatDateTime(item.charged_at)}
                            </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white shrink-0">
                            {formatMoney(item.total, item.currency)}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Celkem minibar</span>
                <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatMoney(total, currency)}
                </span>
            </div>
        </div>
    );
}
