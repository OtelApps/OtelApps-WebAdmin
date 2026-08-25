import React from 'react';

export function AddCatalogModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="bg-[#2a2b38] px-6 py-4 flex items-center justify-center relative">
                    <h2 className="text-white text-[13px] font-bold tracking-widest uppercase">
                        ADD CATALOG
                    </h2>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors absolute right-4 p-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 pb-10">
                    
                    {/* Read-only catalogs */}
                    <div className="mb-8">
                        <h3 className="text-[18px] font-medium text-gray-700 mb-4">Read-only catalogs</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Categories */}
                            <div className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors shadow-sm flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-50/50 flex items-center justify-center flex-shrink-0 border border-indigo-50">
                                    <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h.01" strokeWidth="2" stroke="currentColor" />
                                    </svg>
                                </div>
                                <div className="pt-0.5">
                                    <h4 className="text-[15px] font-semibold text-gray-800 mb-1">Categories</h4>
                                    <p className="text-[13px] text-gray-400 leading-snug mb-3">
                                        This products will be grouped in categories
                                    </p>
                                    <button className="text-[14px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                                        Choose
                                    </button>
                                </div>
                            </div>

                            {/* Categories and subcategories */}
                            <div className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors shadow-sm flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-50/50 flex items-center justify-center flex-shrink-0 border border-indigo-50">
                                    <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h.01" strokeWidth="2" stroke="currentColor" />
                                    </svg>
                                </div>
                                <div className="pt-0.5">
                                    <h4 className="text-[15px] font-semibold text-gray-800 mb-1">Categories and subcategories</h4>
                                    <p className="text-[13px] text-gray-400 leading-snug mb-3">
                                        The products will be grouped in subcategories inside each category
                                    </p>
                                    <button className="text-[14px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                                        Choose
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* External Catalogs */}
                    <div>
                        <h3 className="text-[18px] font-medium text-gray-700 mb-4">External Catalogs</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* PDF catalog */}
                            <div className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors shadow-sm flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-50/50 flex items-center justify-center flex-shrink-0 border border-purple-50">
                                    <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6M10 12h4" strokeWidth="1.5" stroke="currentColor" />
                                    </svg>
                                </div>
                                <div className="pt-0.5">
                                    <h4 className="text-[15px] font-semibold text-gray-800 mb-1">PDF catalog</h4>
                                    <p className="text-[13px] text-gray-400 leading-snug mb-3">
                                        Upload your catalog file in PDF format.
                                    </p>
                                    <button className="text-[14px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                                        Choose
                                    </button>
                                </div>
                            </div>

                            {/* Linked catalog */}
                            <div className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors shadow-sm flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-50/50 flex items-center justify-center flex-shrink-0 border border-blue-50">
                                    <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="5" y="4" width="14" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M5 8h14M5 16h14" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="pt-0.5">
                                    <h4 className="text-[15px] font-semibold text-gray-800 mb-1">Linked catalog</h4>
                                    <p className="text-[13px] text-gray-400 leading-snug mb-3">
                                        Add your catalog via an external URL link.
                                    </p>
                                    <button className="text-[14px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                                        Choose
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
