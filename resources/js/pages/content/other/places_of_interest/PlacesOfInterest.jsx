import React, { useCallback, useEffect, useMemo, useState } from 'react';
import http from '../../../../lib/http';
import { ContentListSkeleton, PageLoadError } from '../../../../components/ui/PageSkeleton';

const EMPTY_FORM = {
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    opening_hours: '',
    admission: '',
    is_recommended: false,
    category: 'place',
};

function coordsLabel(place) {
    if (place.latitude == null || place.longitude == null) return '—';
    return `${Number(place.latitude).toFixed(5)}, ${Number(place.longitude).toFixed(5)}`;
}

export function PlacesOfInterest() {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);
    const [geocoding, setGeocoding] = useState(false);
    const [filter, setFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await http.get('/api/hotel-places');
            setPlaces(data.places ?? []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Místa se nepodařilo načíst.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const visible = useMemo(() => {
        if (filter === 'recommended') return places.filter((p) => p.is_recommended);
        if (filter === 'active') return places.filter((p) => p.is_active);
        return places;
    }, [places, filter]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (place) => {
        setEditing(place);
        setForm({
            name: place.name || '',
            description: place.description || '',
            address: place.address || '',
            latitude: place.latitude != null ? String(place.latitude) : '',
            longitude: place.longitude != null ? String(place.longitude) : '',
            opening_hours: place.opening_hours || '',
            admission: place.admission || '',
            is_recommended: Boolean(place.is_recommended),
            category: place.category || 'place',
        });
        setFormError(null);
        setModalOpen(true);
    };

    const handleGeocode = async () => {
        if (!form.address.trim()) {
            setFormError('Nejdřív vyplňte adresu.');
            return;
        }
        setGeocoding(true);
        setFormError(null);
        try {
            const { data } = await http.post('/api/hotel-places/geocode', { address: form.address.trim() });
            setForm((f) => ({
                ...f,
                latitude: String(data.latitude),
                longitude: String(data.longitude),
                address: data.display_name || data.address || f.address,
            }));
        } catch (err) {
            setFormError(err.response?.data?.message || 'Adresu se nepodařilo najít.');
        } finally {
            setGeocoding(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError(null);

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            address: form.address.trim() || null,
            latitude: form.latitude !== '' ? Number(form.latitude) : null,
            longitude: form.longitude !== '' ? Number(form.longitude) : null,
            opening_hours: form.opening_hours.trim() || null,
            admission: form.admission.trim() || null,
            is_recommended: Boolean(form.is_recommended),
            category: form.category || 'place',
        };

        if (!payload.name) {
            setFormError('Název je povinný.');
            setSaving(false);
            return;
        }
        if (!payload.address && (payload.latitude == null || payload.longitude == null)) {
            setFormError('Zadejte přesnou adresu, nebo souřadnice.');
            setSaving(false);
            return;
        }

        try {
            if (editing) {
                const { data } = await http.put(`/api/hotel-places/${editing.id}`, payload);
                setPlaces((prev) => prev.map((p) => (p.id === editing.id ? data.place : p)));
            } else {
                const { data } = await http.post('/api/hotel-places', payload);
                setPlaces((prev) => [data.place, ...prev]);
            }
            setModalOpen(false);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Uložení se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    const toggleRecommended = async (place) => {
        const next = !place.is_recommended;
        setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, is_recommended: next } : p)));
        try {
            const { data } = await http.put(`/api/hotel-places/${place.id}`, { is_recommended: next });
            setPlaces((prev) => prev.map((p) => (p.id === place.id ? data.place : p)));
        } catch {
            setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, is_recommended: place.is_recommended } : p)));
        }
    };

    const handleDelete = async (place) => {
        if (!window.confirm(`Odebrat místo „${place.name}“? Hosté ho už neuvidí na mapě ani v trip planneru.`)) {
            return;
        }
        try {
            await http.delete(`/api/hotel-places/${place.id}`);
            setPlaces((prev) => prev.filter((p) => p.id !== place.id));
        } catch (err) {
            window.alert(err.response?.data?.message || 'Smazání se nezdařilo.');
        }
    };

    if (loading) {
        return <ContentListSkeleton title="Památky a místa" cardCount={4} />;
    }

    if (error) {
        return <PageLoadError message={error} onRetry={load} />;
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Památky a místa</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Místa zobrazená hostům na mapě a v trip planneru. Doporučená místa se u hostů zobrazují častěji.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    Přidat místo
                </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {[
                    { id: 'all', label: `Všechna (${places.length})` },
                    { id: 'recommended', label: `Doporučená (${places.filter((p) => p.is_recommended).length})` },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilter(tab.id)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            filter === tab.id
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-600 dark:bg-gray-800">
                    <p className="text-gray-600 dark:text-gray-300">Zatím žádná místa. Přidejte první podle adresy nebo souřadnic.</p>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Přidat místo
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {visible.map((place) => (
                            <li key={place.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                                            {place.name}
                                        </h2>
                                        {place.is_recommended && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                                Doporučené
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                        {place.description || 'Bez popisu'}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {place.address || 'Bez adresy'} · {coordsLabel(place)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleRecommended(place)}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                            place.is_recommended
                                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                                        }`}
                                        title="Doporučit hostům"
                                    >
                                        {place.is_recommended ? '★ Doporučené' : '☆ Doporučit'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(place)}
                                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                    >
                                        Upravit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(place)}
                                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        Odebrat
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                            {editing ? 'Upravit místo' : 'Přidat místo'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Název *</span>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="např. Karlův most"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Krátký popis</span>
                                <textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="Co host uvidí v seznamu"
                                />
                            </label>
                            <div>
                                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Přesná adresa
                                </span>
                                <div className="flex gap-2">
                                    <input
                                        value={form.address}
                                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="ulice, město"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGeocode}
                                        disabled={geocoding}
                                        className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-200 dark:text-gray-900"
                                    >
                                        {geocoding ? 'Hledám…' : 'Najít GPS'}
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Nebo zadejte souřadnice ručně níže.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Zem. šířka</span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={form.latitude}
                                        onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="50.0865"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Zem. délka</span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={form.longitude}
                                        onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="14.4114"
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Otevírací doba</span>
                                    <input
                                        value={form.opening_hours}
                                        onChange={(e) => setForm((f) => ({ ...f, opening_hours: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="10:00–18:00"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Vstupné</span>
                                    <input
                                        value={form.admission}
                                        onChange={(e) => setForm((f) => ({ ...f, admission: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="Zdarma"
                                    />
                                </label>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={form.is_recommended}
                                    onChange={(e) => setForm((f) => ({ ...f, is_recommended: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-orange-500"
                                />
                                Doporučit hostům (častější výskyt na mapě a v trip planneru)
                            </label>

                            {formError && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                                    {formError}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Zrušit
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {saving ? 'Ukládání…' : editing ? 'Uložit' : 'Přidat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
