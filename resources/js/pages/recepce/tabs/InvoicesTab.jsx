import React from 'react';
import { formatDateTime, formatMoney } from '../receptionLabels';

const CATEGORY_LABELS = {
    room: 'Ubytování',
    minibar: 'Minibar',
    service: 'Služba',
    other: 'Ostatní',
};

export function InvoicesTab({ lines = [], balance }) {
    if (!lines.length) {
        return <p className="text-sm text-gray-500">Účet pokoje je prázdný.</p>;
    }

    return (
        <div className="space-y-4">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {lines.map((line) => (
                    <li key={line.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{line.description}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {CATEGORY_LABELS[line.category] || line.category}
                                {' · '}
                                {formatDateTime(line.posted_at)}
                            </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white shrink-0">
                            {formatMoney(line.amount, line.currency)}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Celkem</span>
                <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatMoney(balance?.amount, balance?.currency)}
                </span>
            </div>
        </div>
    );
}
