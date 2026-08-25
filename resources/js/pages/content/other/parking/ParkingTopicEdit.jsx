import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ModuleEditLayout } from '../../../../components/layout/ModuleEditLayout';
import { SectionCard, Field } from '../../../../components/ui/LayoutBlocks';
import { FormSaveBar } from '../../../../components/ui/FormSaveBar';

export function ParkingTopicEdit() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [topic, setTopic] = useState(null);
    const [imageKeys, setImageKeys] = useState([]);
    const [navigationScreen, setNavigationScreen] = useState('ParkingDetail');

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`/api/hotel-parking/topics/${slug}`)
            .then((res) => {
                setTopic(res.data.topic);
                setImageKeys(res.data.image_keys ?? []);
                setNavigationScreen(res.data.navigation_screen ?? 'ParkingDetail');
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Položku se nepodařilo načíst.');
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

    const buildPayload = (next) => ({
        title: next.title,
        list_description: next.list_description,
        detail_info: next.link_type === 'external' ? next.detail_info : next.detail_info,
        list_image_key: next.list_image_key,
        detail_image_key: next.detail_image_key,
        link_type: next.link_type,
        external_url: next.link_type === 'external' ? next.external_url : null,
        navigation_screen: next.link_type === 'detail' ? navigationScreen : null,
        sort_order: next.sort_order,
        is_active: next.is_active,
    });

    const saveTopic = async (payload) => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.put(`/api/hotel-parking/topics/${slug}`, payload);
            setTopic(data.topic);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const updateField = (field, value) => {
        setTopic((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const setLinkType = (linkType) => {
        setTopic((prev) =>
            prev
                ? {
                      ...prev,
                      link_type: linkType,
                      external_url: linkType === 'external' ? prev.external_url || '' : null,
                      detail_info: linkType === 'detail' ? prev.detail_info || '' : prev.detail_info,
                  }
                : prev
        );
    };

    const saveInformation = () => {
        if (!topic) return;
        saveTopic(buildPayload(topic));
    };

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
                <p className="text-red-600 mb-4">{error || 'Položka nenalezena.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/module/other/parking')}
                    className="text-orange-500 hover:underline"
                >
                    ← Zpět na parkování
                </button>
            </div>
        );
    }

    const isExternal = topic.link_type === 'external';

    const inputClass =
        'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

    return (
        <ModuleEditLayout
            title={topic.title}
            subtitle={`${isExternal ? 'Externí odkaz' : navigationScreen} · ${topic.slug}`}
            backTo="/module/other/parking"
            backLabel="Parkování"
            saveStatus={saveStatus}
            onSave={saveInformation}
        >
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

                    <Field label="Typ položky">
                        <div className="flex flex-wrap gap-4 mt-1">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="link_type"
                                    checked={!isExternal}
                                    onChange={() => setLinkType('detail')}
                                    className="text-orange-500"
                                />
                                Detail v aplikaci ({navigationScreen})
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="link_type"
                                    checked={isExternal}
                                    onChange={() => setLinkType('external')}
                                    className="text-orange-500"
                                />
                                Externí odkaz
                            </label>
                        </div>
                    </Field>

                    {isExternal ? (
                        <Field label="URL (otevře se v prohlížeči)">
                            <input
                                className={inputClass}
                                type="url"
                                value={topic.external_url || ''}
                                onChange={(e) => updateField('external_url', e.target.value)}
                                placeholder="https://parking.praha.eu"
                            />
                        </Field>
                    ) : (
                        <Field label="Text na detailu v aplikaci">
                            <textarea
                                className={inputClass}
                                rows={8}
                                value={topic.detail_info || ''}
                                onChange={(e) => updateField('detail_info', e.target.value)}
                            />
                        </Field>
                    )}

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
                        {!isExternal && (
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
                        )}
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
        </ModuleEditLayout>
    );
}
