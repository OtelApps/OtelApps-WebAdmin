import React, { useEffect, useState } from 'react';
import http from '../../../lib/http';
import { CRM_SEGMENTS, PROMO_STATUS, SECTION_META } from '../crmHubConfig';
import { CrmIcon, CrmShell } from '../CrmShell';
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
        <div className="w-full h-full p-4 md:p-8 max-w-[1600px] mx-auto bg-[#f8f9fa] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-[32px] font-bold text-gray-600 tracking-tight">Promotions</h1>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            setEditItem(null);
                            setModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-[#FFA200] hover:bg-orange-400 text-white text-[13px] font-bold rounded-full shadow-sm transition-colors tracking-wide"
                    >
                        <span className="text-lg leading-none">+</span> ADD PROMOTION
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-[13px] font-bold rounded-full shadow-sm transition-colors tracking-wide">
                        <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-gray-400 flex items-center justify-center text-[11px] font-bold">?</div>
                        HELP
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search */}
                <div className="p-6 border-b border-gray-100">
                    <div className="relative w-[300px]">
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input 
                            type="text" 
                            placeholder="Search promotions" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-[13px] text-gray-600 focus:outline-none focus:border-[#40C4B8] transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-[13px] font-bold text-gray-600">Name</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-gray-600">Date created</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-gray-600">Start</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-gray-600">End</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-[13px] text-gray-500">
                                        Loading promotions...
                                    </td>
                                </tr>
                            ) : promotions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-[13px] text-gray-500">
                                        No promotions found.
                                    </td>
                                </tr>
                            ) : (
                                promotions.map(promo => {
                                    const st = PROMO_STATUS[promo.status] ?? PROMO_STATUS.draft;
                                    return (
                                        <tr key={promo.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <button 
                                                    onClick={() => {
                                                        setEditItem(promo);
                                                        setModalOpen(true);
                                                    }}
                                                    className="text-[#4A88F6] hover:text-blue-700 text-[13px] font-medium"
                                                >
                                                    {promo.title || 'New promotion'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-[13px] text-gray-600">{promo.created_at ? promo.created_at.substring(0,10) : '2024-08-16'}</td>
                                            <td className="px-6 py-5 text-[13px] text-gray-600">{promo.valid_from ? promo.valid_from.substring(0,10) : '2024-08-16'}</td>
                                            <td className="px-6 py-5 text-[13px] text-gray-600">{promo.valid_to ? promo.valid_to.substring(0,10) : ''}</td>
                                            <td className="px-6 py-5 text-[13px] text-gray-600">{st.label === 'Active' ? 'Activated' : st.label === 'Draft' ? 'Deactivated' : st.label}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3 text-gray-400">
                                                    <button className="hover:text-[#40C4B8] transition-colors">
                                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                                    </button>
                                                    <button className="hover:text-[#40C4B8] transition-colors">
                                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(promo.id)} className="hover:text-red-500 transition-colors">
                                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More */}
                {!loading && promotions.length > 0 && (
                    <div className="py-6 flex justify-center border-t border-gray-50">
                        <button className="text-[#4A88F6] hover:text-blue-700 text-[13px] font-bold transition-colors">
                            Load more
                        </button>
                    </div>
                )}
            </div>

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
        </div>
    );
}
