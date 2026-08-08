import React from 'react';
import { CLEANING_LABELS, formatDateTime, formatMoney, OCCUPANCY_LABELS } from '../receptionLabels';

export function OverviewTab({ detail, onToggleRequest, onOpenInvoices }) {
    const stay = detail?.stay;
    const guest = detail?.guest;
    const requests = detail?.requests ?? [];
    const room = detail?.room;

    if (!stay) {
        return (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <p>Pokoj je momentálně bez aktivního pobytu.</p>
                <Section title="Úklid">
                    <p className="font-medium text-gray-900 dark:text-white">
                        {CLEANING_LABELS[room?.cleaning_status] || room?.cleaning_status}
                    </p>
                    {room?.cleaning_note && (
                        <p className="text-gray-500 mt-1">{room.cleaning_note}</p>
                    )}
                </Section>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Section title="Pobyt">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <dt className="text-gray-500">Příjezd</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{formatDateTime(stay.check_in_at)}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Odjezd</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{formatDateTime(stay.check_out_at)}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Nocí</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{stay.nights}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Stav</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">
                            {OCCUPANCY_LABELS[room?.occupancy_status] || room?.occupancy_status}
                        </dd>
                    </div>
                </dl>
            </Section>

            <Section title="Host">
                {guest ? (
                    <dl className="space-y-1.5 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{guest.display_name}</div>
                        {guest.phone && <div className="text-gray-600 dark:text-gray-300">{guest.phone}</div>}
                        {guest.email && <div className="text-gray-600 dark:text-gray-300">{guest.email}</div>}
                    </dl>
                ) : (
                    <p className="text-sm text-gray-500">Bez údajů o hostovi.</p>
                )}
            </Section>

            <Section title="Požadavky hosta">
                {requests.length === 0 ? (
                    <p className="text-sm text-gray-500">Žádné požadavky.</p>
                ) : (
                    <ul className="space-y-2">
                        {requests.map((req) => (
                            <li key={req.id} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={Boolean(req.is_checked)}
                                    onChange={(e) => onToggleRequest?.(req.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-gray-800 dark:text-gray-200">{req.label}</span>
                                {req.is_new && (
                                    <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                                        Nové
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Section>

            <Section title="Úklid">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {CLEANING_LABELS[room?.cleaning_status] || room?.cleaning_status}
                </p>
                {room?.cleaning_note && (
                    <p className="mt-1 text-sm text-gray-500">{room.cleaning_note}</p>
                )}
            </Section>

            <Section title="Zůstatek pokoje">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                    {formatMoney(detail?.balance?.amount, detail?.balance?.currency)}
                </p>
                <button
                    type="button"
                    onClick={() => onOpenInvoices?.()}
                    className="mt-1 text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                    Detail účtu
                </button>
            </Section>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
            {children}
        </section>
    );
}
