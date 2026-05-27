import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';

export function RestaurantsBars() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = () => {
        setLoading(true);
        setError(null);
        axios
            .get('/api/venues')
            .then((response) => {
                setSections(response.data.sections ?? []);
            })
            .catch((err) => {
                const message =
                    err.response?.data?.message ||
                    'Nepodařilo se načíst podniky. Zkontroluj připojení k Supabase (DB_CONNECTION=supabase v .env).';
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
                <p className="text-gray-600 dark:text-gray-400">Načítání podniků…</p>
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
            title="Restaurants & Bars"
            sections={sections}
            moduleKey="restaurants_bars"
        />
    );
}
