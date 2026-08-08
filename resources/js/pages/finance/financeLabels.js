export const CLOSING_STATUS_LABELS = {
    draft: 'Koncept',
    in_progress: 'Probíhá',
    waiting_for_resolution: 'Čeká na vyřešení',
    completed: 'Dokončeno',
    reopened: 'Znovu otevřeno',
};

export const CLOSING_STEPS = [
    { key: 1, label: 'Kontrola plateb' },
    { key: 2, label: 'Pokladna' },
    { key: 3, label: 'Odvody' },
    { key: 4, label: 'Dokončení' },
];

export function statusTone(status) {
    if (status === 'completed') return 'green';
    if (status === 'waiting_for_resolution' || status === 'reopened') return 'orange';
    if (status === 'in_progress' || status === 'draft') return 'blue';
    return 'gray';
}

export function varianceTone(level) {
    if (level === 'blocking') return 'red';
    if (level === 'warning') return 'orange';
    return 'green';
}

export function formatClosingDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export function formatClosingDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
