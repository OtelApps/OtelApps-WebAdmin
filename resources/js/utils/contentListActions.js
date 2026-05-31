import axios from 'axios';
import { slugify } from './slugify';

function parentSlug(meta) {
    return (
        meta?.parentSlug ??
        meta?.suppliesSlug ??
        meta?.housekeepingSlug ??
        meta?.maintenanceSlug
    );
}

function editPath({ moduleType, moduleKey, moduleArea, target, hash = '' }) {
    if (moduleArea) {
        return `/module/${moduleType}/${moduleKey}/${moduleArea}/${target}/edit${hash}`;
    }
    return `/module/${moduleType}/${moduleKey}/${target}/edit${hash}`;
}

function confirmDelete(title) {
    return window.confirm(`Opravdu smazat „${title}"? Tuto akci nelze vrátit zpět.`);
}

/** Konfigurace ADD modalu a API pro modul. */
export function getAddConfig(moduleKey, section, meta) {
    switch (moduleKey) {
        case 'restaurants_bars':
            return {
                modalTitle: 'Nový podnik',
                fields: [
                    {
                        name: 'title',
                        label: 'Název',
                        placeholder: 'Např. Hotelová restaurace',
                        required: true,
                    },
                    {
                        name: 'venue_type',
                        label: 'Typ',
                        type: 'select',
                        defaultValue: section?.id === 'bars' ? 'bar' : 'restaurant',
                        options: [
                            { value: 'restaurant', label: 'Restaurace' },
                            { value: 'bar', label: 'Bar' },
                        ],
                    },
                ],
                submit: async (values) => {
                    const slug = slugify(values.title);
                    const { data } = await axios.post('/api/venues', {
                        slug,
                        title: values.title.trim(),
                        venue_type: values.venue_type,
                    });
                    return data.venue?.slug ?? slug;
                },
            };
        case 'relax_sport':
            if (meta?.area === 'wellness-spa') {
                return {
                    modalTitle: 'Nové wellness zařízení',
                    fields: [{ name: 'title', label: 'Název', required: true }],
                    submit: async (values) => {
                        const slug = slugify(values.title);
                        await axios.post('/api/wellness/facilities', {
                            slug,
                            title: values.title.trim(),
                        });
                        return slug;
                    },
                };
            }
            if (meta?.area === 'gym-sport') {
                return {
                    modalTitle: 'Nové sportovní zařízení',
                    fields: [{ name: 'title', label: 'Název', required: true }],
                    submit: async (values) => {
                        const slug = slugify(values.title);
                        await axios.post('/api/fitness/facilities', {
                            slug,
                            title: values.title.trim(),
                        });
                        return slug;
                    },
                };
            }
            return null;
        case 'hotel_info':
            return {
                modalTitle: 'Nové téma',
                fields: [{ name: 'title', label: 'Název', required: true }],
                submit: async (values) => {
                    const slug = slugify(values.title);
                    await axios.post('/api/hotel-info/topics', {
                        slug,
                        title: values.title.trim(),
                    });
                    return slug;
                },
            };
        case 'hotel_rooms':
            return {
                modalTitle: 'Nový typ pokoje',
                fields: [{ name: 'title', label: 'Název', required: true }],
                submit: async (values) => {
                    const slug = slugify(values.title);
                    await axios.post('/api/hotel-rooms/types', {
                        slug,
                        title: values.title.trim(),
                    });
                    return slug;
                },
            };
        case 'parking':
            return {
                modalTitle: 'Nové parkování',
                fields: [{ name: 'title', label: 'Název', required: true }],
                submit: async (values) => {
                    const slug = slugify(values.title);
                    await axios.post('/api/hotel-parking/topics', {
                        slug,
                        title: values.title.trim(),
                    });
                    return slug;
                },
            };
        case 'amenities':
        case 'laundry':
        case 'issues_repairs':
            return {
                modalTitle: 'Nová položka katalogu',
                fields: [{ name: 'title', label: 'Název', required: true }],
                submit: async (values, { section, meta: m }) => {
                    const slug = parentSlug(m);
                    if (!slug || !section?.id) {
                        throw new Error('Chybí kontext kategorie.');
                    }
                    const label = values.title.trim();
                    const itemSlug = slugify(label);
                    const apiBase =
                        moduleKey === 'amenities'
                            ? `/api/hotel-supplies/${slug}/catalog`
                            : moduleKey === 'laundry'
                              ? `/api/hotel-housekeeping/${slug}/catalog`
                              : `/api/hotel-maintenance/${slug}/catalog`;
                    const body =
                        moduleKey === 'laundry'
                            ? { slug: itemSlug, title: label }
                            : moduleKey === 'issues_repairs'
                              ? { slug: itemSlug, label }
                              : { slug: itemSlug, name: label };
                    await axios.post(`${apiBase}/categories/${section.id}/items`, body);
                    return null;
                },
            };
        default:
            return null;
    }
}

export function canDeleteItem(moduleKey) {
    return !['room_service'].includes(moduleKey);
}

export function canAddItem(moduleKey) {
    return !['room_service'].includes(moduleKey);
}

export async function deleteListItem({ moduleKey, moduleType, moduleArea, item, meta }) {
    const slug = item.slug ?? item.id;

    switch (moduleKey) {
        case 'restaurants_bars':
            await axios.delete(`/api/venues/${slug}`);
            return;
        case 'relax_sport':
            if (moduleArea === 'wellness-spa' || meta?.area === 'wellness-spa') {
                await axios.delete(`/api/wellness/facilities/${slug}`);
            } else {
                await axios.delete(`/api/fitness/facilities/${slug}`);
            }
            return;
        case 'hotel_info':
            await axios.delete(`/api/hotel-info/topics/${slug}`);
            return;
        case 'hotel_rooms':
            await axios.delete(`/api/hotel-rooms/types/${slug}`);
            return;
        case 'parking':
            await axios.delete(`/api/hotel-parking/topics/${slug}`);
            return;
        case 'amenities':
        case 'laundry':
        case 'issues_repairs': {
            const slug = parentSlug(meta);
            const recordId = item.record_id;
            if (!slug || !recordId) {
                throw new Error('Položku nelze smazat (chybí ID).');
            }
            const apiBase =
                moduleKey === 'amenities'
                    ? `/api/hotel-supplies/${slug}/catalog`
                    : moduleKey === 'laundry'
                      ? `/api/hotel-housekeeping/${slug}/catalog`
                      : `/api/hotel-maintenance/${slug}/catalog`;
            await axios.delete(`${apiBase}/items/${recordId}`);
            return;
        }
        default:
            throw new Error('Mazání není pro tento modul podporováno.');
    }
}

export { editPath, confirmDelete };
