export function formatMoney(amount, currency = 'CZK') {
    const value = Number(amount) || 0;
    try {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency}`;
    }
}

export function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const OCCUPANCY_LABELS = {
    vacant: 'Volný',
    occupied: 'Obsazeno',
    ooo: 'Mimo provoz',
};

export const CLEANING_LABELS = {
    clean: 'Uklizeno',
    dirty: 'Neuklizeno',
    in_progress: 'Úklid probíhá',
    inspected: 'Zkontrolováno',
};

export const CLEANING_DOT = {
    clean: 'bg-emerald-500',
    dirty: 'bg-red-500',
    in_progress: 'bg-sky-500',
    inspected: 'bg-violet-500',
};

export const OCCUPANCY_DOT = {
    vacant: 'bg-gray-400',
    occupied: 'bg-emerald-500',
    ooo: 'bg-amber-500',
};
