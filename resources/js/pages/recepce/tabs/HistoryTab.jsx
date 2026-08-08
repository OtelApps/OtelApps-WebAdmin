import React from 'react';
import { formatDateTime } from '../receptionLabels';

export function HistoryTab({ events = [] }) {
    if (!events.length) {
        return <p className="text-sm text-gray-500">Zatím žádné události.</p>;
    }

    return (
        <ol className="relative space-y-4 border-l border-gray-200 pl-4 dark:border-gray-700">
            {events.map((event) => (
                <li key={event.id} className="relative">
                    <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-4 ring-white dark:ring-gray-900" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                    {event.body && (
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{event.body}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        {formatDateTime(event.occurred_at)}
                        {event.actor_name ? ` · ${event.actor_name}` : ''}
                    </p>
                </li>
            ))}
        </ol>
    );
}
