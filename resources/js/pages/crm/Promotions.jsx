import React, { useEffect, useState } from 'react';
import http from '../../lib/http';
import { CRM_SEGMENTS, PROMO_STATUS, SECTION_META } from './crmHubConfig';
import { CrmIcon, CrmShell } from './CrmShell';
import { PromotionModal } from './PromotionModal';

const SEG = CRM_SEGMENTS.find((s) => s.key === 'promotions');

export function Promotions() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const load = () => {
        setLoading(true);
        setError(null);
        http.get('/api/crm/promotions')
            .then((res) => setPromotions(res.data.promotions ?? []))
            .catch((err) => {
                setPromotions([]);
                setError(err.response?.data?.message || 'Promo akce se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Smazat tuto promo akci?')) return;
        try {
            await http.delete(`/api/crm/promotions/${id}`);
            load();
        } catch {
            window.alert('Smazání se nezdařilo.');
        }
    };

    return (
        <CrmShell
            title={SEG.label}
            segmentKey="promotions"
            subtitle={SECTION_META.promotions.description}
            loading={loading}
            error={error}
            actions={
                <button
                    type="button"
                    onClick={() => {
                        setEditItem(null);
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600"
                >
                    <CrmIcon name="add" className="text-lg" />
                    Nová akce
                </button>
            }
        >
            {promotions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                    <CrmIcon name="campaign" className="mb-3 text-5xl text-gray-300" />
                    <p className="text-gray-500">Zatím žádné promo akce. Vytvořte první nabídku pro hosty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {promotions.map((promo) => {
                        const st = PROMO_STATUS[promo.status] ?? PROMO_STATUS.draft;
                        return (
                            <article
                                key={promo.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-600 dark:bg-gray-800/90"
                            >
                                <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 px-5 py-4 dark:border-gray-700">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${st.className}`}>
                                            {st.label}
                                        </span>
                                        <span className="text-xs text-gray-500">{promo.segment_label}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{promo.title}</h3>
                                    {promo.subtitle && (
                                        <p className="mt-1 text-sm text-gray-500">{promo.subtitle}</p>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col p-5">
                                    {promo.body && (
                                        <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                                            {promo.body}
                                        </p>
                                    )}
                                    <div className="mt-auto flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditItem(promo);
                                                setModalOpen(true);
                                            }}
                                            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-600 dark:border-gray-600 dark:text-gray-200"
                                        >
                                            Upravit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(promo.id)}
                                            className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                                        >
                                            <CrmIcon name="delete" className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {modalOpen && (
                <PromotionModal
                    item={editItem}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => {
                        setModalOpen(false);
                        load();
                    }}
                />
            )}
        </CrmShell>
    );
}
