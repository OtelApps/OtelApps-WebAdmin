import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';

export function Laundry() {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reloadSections = () =>
        axios.get('/api/hotel-housekeeping').then((response) => {
            setSections(response.data.sections ?? []);
            setMeta({
                title: response.data.title,
                housekeepingSlug: response.data.housekeeping_slug,
                description: response.data.description,
                scheduleSummary: response.data.schedule_summary,
                isActive: response.data.is_active,
            });
        });

    const load = () => {
        setLoading(true);
        setError(null);
        reloadSections()
            .catch((err) => {
                const message =
                    err.response?.data?.message ||
                    'Nepodařilo se načíst úklid pokoje. Zkontroluj Supabase a tabulky hotel_housekeeping.';
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
                <p className="text-gray-600 dark:text-gray-400">Načítání úklidu pokoje…</p>
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

    const slug = meta?.housekeepingSlug || 'uklid-pokoje';

    return (
        <div>
            {meta && (
                <div className="px-6 pt-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{meta.title}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-line">
                                {meta.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                {meta.scheduleSummary && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-medium">
                                        {meta.scheduleSummary}
                                    </span>
                                )}
                                {meta.isActive === false && (
                                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 rounded">
                                        Služba neaktivní
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/module/services/laundry/${slug}/edit`)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold shrink-0"
                        >
                            Upravit službu →
                        </button>
                    </div>
                </div>
            )}
            <ContentCardsLayout
                title={meta?.title || 'Úklid pokoje'}
                hideSectionTitle
                sections={sections}
                moduleKey="laundry"
                moduleType="services"
                onReload={reloadSections}
                listMeta={{ housekeepingSlug: meta?.housekeepingSlug }}
            />
        </div>
    );
}
