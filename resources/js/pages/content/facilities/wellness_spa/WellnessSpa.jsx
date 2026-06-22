import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';

export function WellnessSpa() {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reloadSections = () =>
        axios.get('/api/wellness/facilities').then((response) => {
            setSections(response.data.sections ?? []);
        });

    const load = () => {
        setLoading(true);
        setError(null);
        reloadSections()
            .catch((err) => {
                const message =
                    err.response?.data?.message ||
                    'Nepodařilo se načíst wellness. Zkontroluj připojení k Supabase (OTELAPPS_DB_CONNECTION v .env).';
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
                <p className="text-gray-600 dark:text-gray-400">Načítání wellness…</p>
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
        <div>

            <ContentCardsLayout
            title="Wellness & SPA"
            hideSectionTitle
            sections={sections}
            moduleKey="wellness_spa"
            onReload={reloadSections}
            headerActions={
                <button
                    type="button"
                    onClick={() =>
                        navigate('/module/facilities/wellness_spa/program/edit')
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Hotelový program →
                </button>
            }
        />
        </div>
    );
}
