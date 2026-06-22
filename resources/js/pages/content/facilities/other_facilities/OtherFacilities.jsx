import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ContentCardsLayout } from '../../../../components/layout/ContentCardsLayout';

export function OtherFacilities() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reloadSections = () =>
        axios.get('/api/other-facilities/topics').then((response) => {
            setSections(response.data.sections ?? []);
        });

    const load = () => {
        setLoading(true);
        setError(null);
        reloadSections()
            .catch((err) => {
                // If the backend doesn't have the API yet, we can mock it or show a specific message
                const status = err.response?.status;
                if (status === 404) {
                    // Mock data with 3 static cards until backend is ready
                    setSections([{ 
                        id: 'other_facilities_main', 
                        title: 'Seznam ostatních prostor', 
                        items: [
                            {
                                id: '1',
                                title: 'Konferenční sály',
                                list_label: 'Prostory pro firemní akce a meetingy',
                                image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            },
                            {
                                id: '2',
                                title: 'Dětský koutek',
                                list_label: 'Herna pro nejmenší hosty',
                                image: 'https://images.unsplash.com/photo-1566454544259-f4b9f44f8440?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            },
                            {
                                id: '3',
                                title: 'Zahrada a terasa',
                                list_label: 'Venkovní odpočinková zóna s posezením',
                                image: 'https://images.unsplash.com/photo-1523315802525-41e97de696f5?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            }
                        ] 
                    }]); 
                } else {
                    const message =
                        err.response?.data?.message ||
                        'Nepodařilo se načíst sekci ostatních prostor. Zkontrolujte připojení k databázi.';
                    setError(message);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[40vh]">
                <p className="text-gray-600 dark:text-gray-400">Načítání ostatních prostor…</p>
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
            title="Ostatní prostory"
            hideSectionTitle
            sections={sections}
            moduleKey="other_facilities"
            onReload={reloadSections}
        />
    );
}
