import React from 'react';

const OPTION_TYPES = [
    { id: 'title_description', label: 'Title and description', active: true, column: 'left' },
    { id: 'bullet_list', label: 'Bullet list', active: false, column: 'left' },
    { id: 'dress_code', label: 'Dress code', active: true, column: 'left' },
    { id: 'location', label: 'Location description', active: false, column: 'left' },
    { id: 'video_url', label: 'Video URL', active: false, column: 'left' },
    { id: 'website', label: 'Website', active: true, column: 'left' },
    { id: 'email', label: 'Email', active: true, column: 'right' },
    { id: 'phone', label: 'Phone number', active: true, column: 'right' },
    { id: 'youtube', label: 'Youtube', active: false, column: 'right' },
    { id: 'virtual_tour', label: 'Virtual tour', active: false, column: 'right' },
    { id: 'url_list', label: 'URL list', active: false, column: 'right' },
];

const getIcon = (id, active) => {
    const iconClass = active ? 'text-white w-4 h-4' : 'text-gray-400 w-5 h-5';
    
    switch (id) {
        case 'title_description':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'bullet_list':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>; // Simplified, since it's gray
        case 'dress_code':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case 'location':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        case 'video_url':
        case 'youtube':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'email':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case 'phone':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
        case 'virtual_tour':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case 'website':
        case 'url_list':
            return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
        default:
            return null;
    }
};

export function AdditionalInfoModal({ open, onClose }) {
    if (!open) return null;

    const leftOptions = OPTION_TYPES.filter(o => o.column === 'left');
    const rightOptions = OPTION_TYPES.filter(o => o.column === 'right');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="bg-[#2a2b38] px-6 py-4 flex items-center justify-center relative">
                    <h2 className="text-white text-sm font-bold tracking-widest uppercase">
                        Additional Info
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
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {leftOptions.map(option => (
                                <OptionButton key={option.id} option={option} />
                            ))}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {rightOptions.map(option => (
                                <OptionButton key={option.id} option={option} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OptionButton({ option }) {
    if (option.active) {
        return (
            <button
                type="button"
                className="w-full flex items-center gap-4 px-4 py-3 rounded-full border-2 border-teal-400 bg-white hover:bg-teal-50 transition-colors group"
            >
                <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0">
                    {getIcon(option.id, true)}
                </div>
                <span className="font-semibold text-gray-800">{option.label}</span>
            </button>
        );
    }

    return (
        <button
            type="button"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-full border-2 border-gray-100 bg-white hover:border-gray-200 transition-colors group"
        >
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-gray-300">
                {getIcon(option.id, false)}
            </div>
            <span className="font-semibold text-gray-400 group-hover:text-gray-500">{option.label}</span>
        </button>
    );
}
