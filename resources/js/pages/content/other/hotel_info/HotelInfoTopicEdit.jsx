import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';
import { HotelInfoSectionsTab } from './HotelInfoSectionsTab';

const BASE_TABS = [
    { id: 'information', label: 'Informace' },
    { id: 'sections', label: 'Podsekce' },
];

export function HotelInfoTopicEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [topic, setTopic] = useState(null);
    const [sections, setSections] = useState([]);
    const [imageKeys, setImageKeys] = useState([]);
    const [navigationScreens, setNavigationScreens] = useState([]);
    const [iconLibraries, setIconLibraries] = useState(['ionicons', 'material-community']);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/hotel-info/topics/${slug}`)
            .then((res) => {
                setTopic(res.data.topic);
                setSections(res.data.sections ?? []);
                setImageKeys(res.data.list_image_keys ?? []);
                setNavigationScreens(res.data.navigation_screens ?? []);
                setIconLibraries(res.data.icon_libraries ?? ['ionicons', 'material-community']);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Téma se nepodařilo načíst.');
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

    const saveTopic = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-info/topics/${slug}`, payload);
            setTopic(data.topic);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const buildTopicPayload = (t) => ({
        title: t.title,
        list_description: t.list_description,
        detail_info: t.detail_info,
        list_image_key: t.list_image_key,
        detail_image_key: t.detail_image_key,
        navigation_screen: t.navigation_screen,
        sort_order: t.sort_order,
        is_active: t.is_active,
    });

    const updateField = (field, value) => {
        setTopic((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveInformation = () => {
        if (!topic) return;
        saveTopic(buildTopicPayload(topic));
    };

    const saveSections = async (sectionsPayload) => {
        const payload = sectionsPayload ?? sections;
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-info/topics/${slug}/sections`, {
                sections: payload,
            });
            setSections(data.sections ?? []);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const isMapTopic = topic?.navigation_screen === 'MapScreen';
    const tabs = isMapTopic ? [BASE_TABS[0]] : BASE_TABS;

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error || !topic) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{error || 'Téma nenalezeno.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/other/hotel_info')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na seznam
                </button>
            </div>
        );
    }

    const inputClass =
        'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

    return (
        <ModuleEditLayout
            title={topic.title}
            subtitle={`${topic.navigation_screen} · ${topic.slug}`}
            backTo="/module/other/hotel_info"
            backLabel="Informace o hotelu"
            saveStatus={saveStatus}
            tabs={tabs}
            onSave={(activeTab) => {
                if (activeTab === 'information') saveInformation();
                if (activeTab === 'sections') saveSections();
            }}
        >
            {(activeTab) => (
                <>
                    {activeTab === 'information' && (
                        <div className="space-y-4">
                            <SectionCard>
                                <Field label="Název">
                                    <input
                                        className={inputClass}
                                        value={topic.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                    />
                                </Field>
                                <Field label="Slug">
                                    <input className={`${inputClass} bg-gray-50 dark:bg-gray-900`} value={topic.slug} readOnly />
                                </Field>
                                <Field label="Popis v seznamu">
                                    <textarea
                                        className={inputClass}
                                        rows={3}
                                        value={topic.list_description || ''}
                                        onChange={(e) => updateField('list_description', e.target.value)}
                                    />
                                </Field>
                                <Field label="Úvodní text na detailu">
                                    <textarea
                                        className={inputClass}
                                        rows={5}
                                        value={topic.detail_info || ''}
                                        onChange={(e) => updateField('detail_info', e.target.value || null)}
                                        placeholder={isMapTopic ? 'Pro mapu obvykle prázdné' : ''}
                                    />
                                </Field>
                                <Field label="Obrazovka v aplikaci">
                                    <select
                                        className={inputClass}
                                        value={topic.navigation_screen}
                                        onChange={(e) => updateField('navigation_screen', e.target.value)}
                                    >
                                        {navigationScreens.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Obrázek v seznamu (klíč)">
                                        <select
                                            className={inputClass}
                                            value={topic.list_image_key || ''}
                                            onChange={(e) => updateField('list_image_key', e.target.value || null)}
                                        >
                                            <option value="">— žádný —</option>
                                            {imageKeys.map((key) => (
                                                <option key={key} value={key}>
                                                    {key}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Obrázek na detailu (klíč)">
                                        <select
                                            className={inputClass}
                                            value={topic.detail_image_key || ''}
                                            onChange={(e) => updateField('detail_image_key', e.target.value || null)}
                                        >
                                            <option value="">— stejný jako v seznamu —</option>
                                            {imageKeys.map((key) => (
                                                <option key={key} value={key}>
                                                    {key}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Pořadí">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={topic.sort_order}
                                        onChange={(e) => updateField('sort_order', parseInt(e.target.value, 10) || 0)}
                                    />
                                </Field>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={topic.is_active}
                                            onChange={(e) => updateField('is_active', e.target.checked)}
                                            className="rounded text-orange-500"
                                        />
                                        Aktivní (zobrazit v aplikaci)
                                    </label>
                                </SectionCard>
                            </div>
                    )}

                    {activeTab === 'sections' && !isMapTopic && (
                        <HotelInfoSectionsTab
                            sections={sections}
                            setSections={setSections}
                            onSave={saveSections}
                            saveStatus={saveStatus}
                            iconLibraries={iconLibraries}
                        />
                    )}
                </>
            )}
        </ModuleEditLayout>
    );
}
