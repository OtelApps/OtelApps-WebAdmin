import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FormSaveBar } from '../../../../components/FormSaveBar';
import { HotelRoomFeaturesTab } from './HotelRoomFeaturesTab';
import { HotelRoomGalleryTab } from './HotelRoomGalleryTab';

const TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'features', label: 'Vybavení' },
    { id: 'gallery', label: 'Galerie' },
];

export function HotelRoomTypeEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('information');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [roomType, setRoomType] = useState(null);
    const [features, setFeatures] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [imageKeys, setImageKeys] = useState([]);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/hotel-rooms/types/${slug}`)
            .then((res) => {
                setRoomType(res.data.room_type);
                setFeatures(res.data.features ?? []);
                setGallery(res.data.gallery ?? []);
                setImageKeys(res.data.image_keys ?? []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Typ pokoje se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    const showSaveStatus = (status) => {
        setSaveStatus(status);
        if (status === 'saved') setTimeout(() => setSaveStatus(null), 2000);
        if (status === 'error') setTimeout(() => setSaveStatus(null), 4000);
    };

    const saveRoomType = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-rooms/types/${slug}`, payload);
            setRoomType(data.room_type);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const buildRoomTypePayload = (r) => ({
        title: r.title,
        list_description: r.list_description,
        detail_info: r.detail_info,
        size_text: r.size_text,
        image_key: r.image_key,
        sort_order: r.sort_order,
        is_active: r.is_active,
    });

    const updateField = (field, value) => {
        setRoomType((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveInformation = () => {
        if (!roomType) return;
        saveRoomType(buildRoomTypePayload(roomType));
    };

    const saveFeatures = async (featuresPayload) => {
        const payload = featuresPayload ?? features;
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-rooms/types/${slug}/features`, {
                features: payload,
            });
            setFeatures(data.features ?? []);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const saveGallery = async (galleryPayload) => {
        const payload = galleryPayload ?? gallery;
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-rooms/types/${slug}/gallery`, {
                gallery: payload,
            });
            setGallery(data.gallery ?? []);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !roomType) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Typ pokoje nenalezen.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/services/hotel_rooms')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na seznam
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/module/services/hotel_rooms')}
                        className="text-sm text-gray-500 hover:text-orange-500 mb-2"
                    >
                        ← Nabídka pokojů
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{roomType.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {roomType.size_text ? `${roomType.size_text} · ` : ''}
                        {roomType.slug}
                    </p>
                </div>
                {saveStatus && (
                    <span
                        className={`text-sm font-medium ${
                            saveStatus === 'saved'
                                ? 'text-green-600'
                                : saveStatus === 'error'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                        }`}
                    >
                        {saveStatus === 'saving' && 'Ukládám…'}
                        {saveStatus === 'saved' && 'Uloženo'}
                        {saveStatus === 'error' && 'Chyba ukládání'}
                    </span>
                )}
            </div>

            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            activeTab === tab.id
                                ? 'border-orange-500 text-orange-500'
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'information' && (
                <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <Field label="Název">
                        <input
                            className={inputClass}
                            value={roomType.title}
                            onChange={(e) => updateField('title', e.target.value)}
                        />
                    </Field>
                    <Field label="Slug">
                        <input className={`${inputClass} bg-gray-50 dark:bg-gray-900`} value={roomType.slug} readOnly />
                    </Field>
                    <Field label="Popis v seznamu">
                        <textarea
                            className={inputClass}
                            rows={3}
                            value={roomType.list_description || ''}
                            onChange={(e) => updateField('list_description', e.target.value)}
                        />
                    </Field>
                    <Field label="Detailní popis">
                        <textarea
                            className={inputClass}
                            rows={5}
                            value={roomType.detail_info || ''}
                            onChange={(e) => updateField('detail_info', e.target.value)}
                        />
                    </Field>
                    <Field label="Velikost (zobrazení v seznamu)">
                        <input
                            className={inputClass}
                            value={roomType.size_text || ''}
                            onChange={(e) => updateField('size_text', e.target.value || null)}
                            placeholder="např. 32 m2"
                        />
                    </Field>
                    <Field label="Klíč hlavního obrázku">
                        <select
                            className={inputClass}
                            value={roomType.image_key || ''}
                            onChange={(e) => updateField('image_key', e.target.value || null)}
                        >
                            <option value="">— žádný —</option>
                            {imageKeys.map((key) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Pořadí">
                        <input
                            type="number"
                            className={inputClass}
                            value={roomType.sort_order}
                            onChange={(e) => updateField('sort_order', parseInt(e.target.value, 10) || 0)}
                        />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={roomType.is_active}
                            onChange={(e) => updateField('is_active', e.target.checked)}
                            className="rounded text-orange-500"
                        />
                        Aktivní (zobrazit v aplikaci)
                    </label>
                    <FormSaveBar onSave={saveInformation} saveStatus={saveStatus} label="Uložit informace" />
                </div>
            )}

            {activeTab === 'features' && (
                <HotelRoomFeaturesTab
                    features={features}
                    setFeatures={setFeatures}
                    onSave={saveFeatures}
                    saveStatus={saveStatus}
                />
            )}

            {activeTab === 'gallery' && (
                <HotelRoomGalleryTab
                    gallery={gallery}
                    setGallery={setGallery}
                    onSave={saveGallery}
                    saveStatus={saveStatus}
                    imageKeys={imageKeys}
                />
            )}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';
