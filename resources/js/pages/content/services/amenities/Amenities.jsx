import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';

export function Amenities() {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reloadSections = () =>
        axios.get('/api/hotel-supplies').then((response) => {
            setSections(response.data.sections ?? []);
            setMeta({
                title: response.data.title,
                suppliesSlug: response.data.supplies_slug,
                description: response.data.description,
                scheduleSummary: response.data.schedule_summary,
                maxQuantity: response.data.max_quantity_per_item,
                isActive: response.data.is_active,
            });
        });

    const load = () => {
        setLoading(true);
        setError(null);
        reloadSections()
            .then(() => {})
            .catch((err) => {
                const message =
                    err.response?.data?.message ||
                    'Nepodařilo se načíst doplňky. Zkontroluj Supabase (OTELAPPS_DB_CONNECTION) a tabulky hotel_supplies.';
                setError(message);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[40vh]">
                <p className="text-gray-600 dark:text-gray-400">Načítání doplňků…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-xl">
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-red-800 dark:text-red-200">
                    <p className="font-medium mb-2">Chyba načtení dat</p>
                    <p className="text-sm">{error}</p>
                    <button
                        type="button"
                        onClick={load}
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                    >
                        Zkusit znovu
                    </button>
                </div>
            </div>
        );
    }

    const slug = meta?.suppliesSlug || 'doplnky';

    return (
        <div>
            {meta && (
                <div className="px-6 pt-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{meta.title}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{meta.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                {meta.scheduleSummary && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-medium">
                                        {meta.scheduleSummary}
                                    </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                    Max. {meta.maxQuantity} ks / položka
                                </span>
                                {meta.isActive === false && (
                                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 rounded">
                                        Služba neaktivní
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/module/services/amenities/${slug}/edit`)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold shrink-0"
                        >
                            Upravit službu →
                        </button>
                    </div>
                </div>
            )}
            <ContentCardsLayout
                title={meta?.title || 'Doplňky'}
                hideSectionTitle
                sections={sections}
                moduleKey="amenities"
                moduleType="services"
                onReload={reloadSections}
                listMeta={{ suppliesSlug: meta?.suppliesSlug }}
            />
        </div>
    );
}
