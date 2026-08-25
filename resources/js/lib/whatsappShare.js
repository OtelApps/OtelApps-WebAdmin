import { PRIORITY_STYLES, formatTicketTime } from '../pages/ukoly/ticketLabels';

export function buildTicketWhatsAppText(ticket, room) {
    if (!ticket) return '';

    const roomNumber = ticket.room_number || room?.room_number;
    const request = String(ticket.request_text || ticket.title || '').trim();
    const head = [roomNumber ? `Pokoj ${roomNumber}` : null, request || null].filter(Boolean).join(' — ');

    const priority =
        PRIORITY_STYLES[ticket.priority]?.label || ticket.priority_label || null;
    const due = ticket.due_at ? formatTicketTime(ticket.due_at) : null;
    const meta = [
        ticket.queue_label || ticket.service_label || null,
        priority,
        due ? `termín ${due}` : null,
        ticket.created_by_label || null,
    ].filter(Boolean);

    if (!head && meta.length === 0) return 'Nový úkol';
    if (!meta.length) return head || 'Nový úkol';
    return `${head || 'Nový úkol'} · ${meta.join(' · ')}`;
}

export async function shareTicketToWhatsApp(ticket, room) {
    const text = buildTicketWhatsAppText(ticket, room);
    if (!text) return;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
            await navigator.share({ text });
            return;
        } catch (err) {
            if (err?.name === 'AbortError') return;
        }
    }

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}
