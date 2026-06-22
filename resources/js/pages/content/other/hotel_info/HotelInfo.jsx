import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';

export function HotelInfo() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reloadSections = () =>
        axios.get('/api/hotel-info/topics').then((response) => {
            setSections(response.data.sections ?? []);
        });

    const load = () => {
        setLoading(true);
        setError(null);
        reloadSections()
            .catch((err) => {
                const message =
                    err.response?.data?.message ||
                    'Nepodařilo se načíst informace o hotelu. Zkontroluj připojení k Supabase (OTELAPPS_DB_CONNECTION v .env) a že jsou v DB tabulky hotel_info_topics.';
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
                <p className="text-gray-600 dark:text-gray-400">Načítání informací o hotelu…</p>
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

    return (
        <ContentCardsLayout
            title="Informace o hotelu"
            hideSectionTitle
            sections={sections}
            moduleKey="hotel_info"
            moduleType="other"
            onReload={reloadSections}
        />
    );
}
