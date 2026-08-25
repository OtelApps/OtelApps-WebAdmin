export function formatMoney(amount, currency = 'CZK') {
    const value = Number(amount) || 0;
    if (currency === 'CZK') {
        return `${value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Kč`;
    }
    if (currency === 'EUR') {
        return `${value.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    }
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export const CATEGORY_BAR_COLORS = [
    'bg-purple-500',
    'bg-purple-700',
    'bg-blue-500',
    'bg-orange-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-600',
];
