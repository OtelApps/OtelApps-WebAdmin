import React, { useState } from 'react';

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transform -rotate-45">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
);

const GoogleLogo = () => (
    <div className="w-[68px] h-[68px] rounded-lg border border-gray-200 flex flex-col items-center justify-center bg-white shrink-0">
        <span className="text-2xl font-bold mb-0.5" style={{ color: '#4285F4' }}>G</span>
        <div className="flex gap-[1.5px]">
            {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 bg-yellow-400" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}/>)}
        </div>
    </div>
);

const TripadvisorLogo = () => (
    <div className="w-[68px] h-[68px] rounded-lg border border-gray-200 flex items-center justify-center bg-white shrink-0">
        <div className="flex flex-col items-center justify-center text-[#34E0A1]">
            <div className="flex gap-0.5 items-end">
                <div className="w-[18px] h-[18px] border-[3px] border-current rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"/></div>
                <div className="w-2 h-2 border-2 border-current rounded-full mb-1" />
                <div className="w-[18px] h-[18px] border-[3px] border-current rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"/></div>
            </div>
            <span className="text-[9px] font-bold mt-1 text-black tracking-tight">Tripadvisor</span>
        </div>
    </div>
);

const BookingLogo = () => (
    <div className="w-[68px] h-[68px] rounded-lg border border-gray-200 flex flex-col items-center justify-center bg-[#003580] shrink-0">
        <span className="text-white font-bold text-[11px] leading-[1.2] text-center tracking-tight">Booking<br/>.com</span>
    </div>
);

const PlatformInput = ({ title, logo: Logo, value, onChange }) => (
    <div className="flex items-start gap-4">
        <Logo />
        <div className="flex-1 max-w-2xl mt-0.5">
            <div className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-2">{title}</div>
            <div className="flex items-center w-full border border-gray-200 dark:border-gray-600 rounded overflow-hidden focus-within:ring-1 focus-within:ring-teal-400 focus-within:border-teal-400 bg-white dark:bg-gray-800 transition-colors">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center">
                    <LinkIcon />
                </div>
                <input 
                    type="text" 
                    placeholder="Enter URL" 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 w-full"
                />
            </div>
        </div>
    </div>
);

const MobilePreview = () => (
    <div className="relative w-[280px] h-[580px] bg-white rounded-[40px] border-[8px] border-[#4a3b52] shadow-2xl overflow-hidden flex flex-col shrink-0">
        {/* Header Image (placeholder background) */}
        <div className="relative h-40 bg-slate-800 shrink-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80")' }}>
            <div className="absolute top-4 right-4 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center text-white text-xs cursor-pointer backdrop-blur-sm">✕</div>
        </div>
        
        {/* Content */}
        <div className="flex-1 bg-gray-50 flex flex-col px-4 relative pb-8">
            {/* Floating Rating Card */}
            <div className="bg-white rounded-lg shadow-sm p-5 text-center -mt-10 relative z-10 mx-2 border border-gray-100">
                <div className="text-gray-800 font-bold text-[13px] mb-2">Your rating</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">5</div>
                <div className="flex justify-center gap-1.5 text-yellow-400 text-sm">
                    ★ ★ ★ ★ ★
                </div>
            </div>

            <div className="text-center mt-6">
                <h3 className="font-bold text-gray-900 text-[15px] mb-2">Thank you!</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed px-4">
                    We are thrilled you had a great experience with us. We hope to see you again soon!
                </p>
            </div>

            <div className="mt-auto pt-6 text-center">
                <p className="text-[12px] font-bold text-gray-700 mb-4">Share your experience on these platforms</p>
                <div className="flex justify-center gap-3">
                    <div className="w-[64px] h-[72px] bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                        <div className="w-[32px] h-[32px] rounded border border-gray-200 flex flex-col items-center justify-center bg-[#003580] mb-1.5">
                            <span className="text-white font-bold text-[6px] leading-[1.2] text-center tracking-tight">Booking<br/>.com</span>
                        </div>
                        <span className="text-[9px] font-semibold text-gray-500">Booking.com</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default function ExternalPlatforms() {
    const [promoteReviewsActive, setPromoteReviewsActive] = useState(true);
    const [scoreThreshold, setScoreThreshold] = useState("5 stars");
    const [googleUrl, setGoogleUrl] = useState("");
    const [tripadvisorUrl, setTripadvisorUrl] = useState("");
    const [bookingUrl, setBookingUrl] = useState("");

    return (
        <div className="p-4 md:p-6 w-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200">External platforms</h1>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">?</div>
                    HELP
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 p-8 flex flex-col xl:flex-row gap-12">
                <div className="flex-1">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">Promote reviews on external platforms</h2>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            Make it easy for guests to leave a review on open platforms. Use these links to redirect them to other sites. Note: we do not share any data with third parties.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setPromoteReviewsActive(!promoteReviewsActive)}
                                className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors ${promoteReviewsActive ? 'bg-[#3ebcb1]' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promoteReviewsActive ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                            <span className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                                Show links to external platforms if overall score is equal to or higher than
                            </span>
                        </div>
                        <div className="w-28 sm:ml-2 shrink-0">
                            <select
                                disabled={!promoteReviewsActive}
                                value={scoreThreshold}
                                onChange={(e) => setScoreThreshold(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                            >
                                <option value="1 star">1 star</option>
                                <option value="2 stars">2 stars</option>
                                <option value="3 stars">3 stars</option>
                                <option value="4 stars">4 stars</option>
                                <option value="5 stars">5 stars</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-14 pl-1 pb-4">
                        <PlatformInput 
                            title="Google Reviews" 
                            logo={GoogleLogo} 
                            value={googleUrl} 
                            onChange={setGoogleUrl} 
                        />
                        <PlatformInput 
                            title="Tripadvisor" 
                            logo={TripadvisorLogo} 
                            value={tripadvisorUrl} 
                            onChange={setTripadvisorUrl} 
                        />
                        <PlatformInput 
                            title="Booking.com" 
                            logo={BookingLogo} 
                            value={bookingUrl} 
                            onChange={setBookingUrl} 
                        />
                    </div>
                </div>

                {/* Mobile Phone Preview */}
                <div className="hidden xl:flex justify-center items-start pt-4 xl:pr-12">
                    <MobilePreview />
                </div>
            </div>
        </div>
    );
}
