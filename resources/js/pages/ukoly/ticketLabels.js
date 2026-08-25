export const PRIORITY_STYLES = {
    0: { label: 'Nízká', className: 'bg-slate-100 text-slate-700' },
    1: { label: 'Střední', className: 'bg-amber-100 text-amber-800' },
    2: { label: 'Vysoká', className: 'bg-orange-100 text-orange-800' },
    3: { label: 'Kritická', className: 'bg-red-100 text-red-800' },
};

export const SECTION_META = {
    new: { label: 'Nové', key: 'new' },
    in_progress: { label: 'Probíhá', key: 'in_progress' },
    done: { label: 'Hotovo', key: 'done' },
    other: { label: 'Ostatní', key: 'other' },
};

export function formatTicketTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const now = new Date();
    const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    const time = d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return `Dnes ${time}`;
    return `${d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })} ${time}`;
}

export function eventLabel(eventType) {
    const map = {
        created: 'Úkol vytvořen',
        queued: 'Čeká na převzetí',
        claimed: 'Úkol převzat',
        reassigned: 'Přeřazeno',
        note: 'Poznámka',
        status_changed: 'Změna statusu',
        priority_changed: 'Změna priority',
        due_changed: 'Změna termínu',
        completed: 'Úkol dokončen',
    };
    return map[eventType] || eventType;
}
