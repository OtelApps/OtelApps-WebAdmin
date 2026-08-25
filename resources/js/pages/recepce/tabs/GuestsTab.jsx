import React from 'react';

export function GuestsTab({ guests = [] }) {
    if (!guests.length) {
        return <p className="text-sm text-gray-500">Na pokoji nejsou registrovaní hosté.</p>;
    }

    return (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {guests.map((guest) => (
                <li key={guest.id} className="py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {guest.display_name}
                            </p>
                            {guest.phone && (
                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{guest.phone}</p>
                            )}
                            {guest.email && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">{guest.email}</p>
                            )}
                        </div>
                        {guest.is_primary && (
                            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                                Primární
                            </span>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
