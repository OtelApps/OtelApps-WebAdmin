import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ContentCardsLayout } from '../../../components/ContentCardsLayout';

export function Other() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reloadSections = () =>
        axios.get('/api/other/topics').then((response) => {
            setSections(response.data.sections ?? []);
        });

    const load = () => {
        setLoading(true);
        setError(null);
        reloadSections()
            .catch((err) => {
                const status = err.response?.status;
                if (status === 404) {
                    // Mock data with 6 static cards
                    setSections([{ 
                        id: 'other_main', 
                        title: 'Ostatní služby a nabídky', 
                        items: [
                            {
                                id: '1',
                                title: 'Doprava a Transfery',
                                list_label: 'Taxi, letištní transfery, lístky na MHD',
                                image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            },
                            {
                                id: '2',
                                title: 'Půjčovna vybavení',
                                list_label: 'Elektrokola, koloběžky, sportovní náčiní',
                                image: 'https://images.unsplash.com/photo-1520690274706-e0ce14801ed6?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            },
                            {
                                id: '3',
                                title: 'Lokální partneři a výlety',
                                list_label: 'Vstupenky, exkurze, partnerské restaurace',
                                image: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            },
                            {
                                id: '4',
                                title: 'Často kladené dotazy (FAQ)',
                                list_label: 'Heslo na Wi-Fi, časy snídaní, klimatizace',
                                image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            },
                            {
                                id: '5',
                                title: 'Dárkové poukazy',
                                list_label: 'Prodej voucherů na pobyty a wellness',
                                image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            },
                            {
                                id: '6',
                                title: 'Ekologie a Udržitelnost',
                                list_label: 'Zrušení úklidu za odměnu, třídění odpadu',
                                image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
                                is_active: true
                            }
                        ] 
                    }]); 
                } else {
                    const message =
                        err.response?.data?.message ||
                        'Nepodařilo se načíst sekci Ostatní. Zkontrolujte připojení k databázi.';
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
                <p className="text-gray-600 dark:text-gray-400">Načítání ostatních služeb…</p>
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
            title="Ostatní služby a nabídky"
            hideSectionTitle
            sections={sections}
            moduleKey="other"
            onReload={reloadSections}
        />
    );
}
