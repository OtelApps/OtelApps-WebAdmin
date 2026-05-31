import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';

export function Sports() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reloadSections = () =>
        axios.get('/api/fitness/facilities').then((response) => {
            setSections(response.data.sections ?? []);
        });

    const load = () => {
        setLoading(true);
        setError(null);
        reloadSections()
            .catch((err) => {
                const message =
                    err.response?.data?.message ||
                    'Nepodařilo se načíst posilovnu a sport. Zkontroluj Supabase a tabulky fitness_facilities.';
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
                <p className="text-gray-600 dark:text-gray-400">Načítání…</p>
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
            <div className="px-6 pt-6">
                <Link
                    to="/module/facilities/relax_sport"
                    className="text-sm text-orange-500 hover:underline font-medium"
                >
                    ← Relax & Sport
                </Link>
            </div>
            <ContentCardsLayout
                title="Posilovna & Sport"
                hideSectionTitle
                sections={sections}
                moduleKey="relax_sport"
                moduleArea="gym-sport"
                onReload={reloadSections}
            />
        </div>
    );
}
