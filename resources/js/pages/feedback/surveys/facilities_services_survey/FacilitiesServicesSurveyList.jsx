import React, { useState } from 'react';
import { FacilitiesServicesSurvey } from './FacilitiesServicesSurvey';

const SectionDivider = ({ title }) => (
    <div className="flex items-center mt-12 mb-6">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
        <div className="px-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-full px-8 py-2 bg-white dark:bg-gray-800 text-[14px] font-bold text-gray-500 dark:text-gray-400 shadow-sm">
                {title}
            </div>
        </div>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
    </div>
);

const SurveyCard = ({ title, status = 'active', disabledText = null, icon, onDoubleClick }) => {
    return (
        <div 
            onDoubleClick={status === 'active' ? () => onDoubleClick(title) : undefined}
            className={`relative w-40 h-[13.5rem] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center transition-all group shrink-0 ${status === 'active' ? 'cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600' : 'cursor-not-allowed opacity-80'}`}
        >
            {/* Status icon top right */}
            {status === 'active' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-teal-400 rounded-full flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-white text-[13px] font-bold">check</span>
                </div>
            )}
            {status === 'disabled' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-white text-[13px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                </div>
            )}
            
            {/* Illustration */}
            <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center mb-5 mt-2 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                <span className={`material-symbols-outlined text-[3rem] ${status === 'disabled' ? 'text-gray-300 dark:text-gray-600' : 'text-slate-300 dark:text-slate-400'}`} style={{ fontVariationSettings: "'wght' 200" }}>
                    {icon}
                </span>
            </div>

            {/* Title */}
            <span className={`font-bold text-[15px] ${status === 'disabled' ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {title}
            </span>
            {disabledText && (
                <span className="text-xs text-gray-400 mt-1 font-medium">{disabledText}</span>
            )}
        </div>
    );
};

export function FacilitiesServicesSurveyList() {
    const [activeSurveyTitle, setActiveSurveyTitle] = useState(null);

    const handleDoubleClick = (title) => {
        setActiveSurveyTitle(title);
    };

    if (activeSurveyTitle) {
        return (
            <FacilitiesServicesSurvey 
                title={activeSurveyTitle} 
                onBack={() => setActiveSurveyTitle(null)} 
            />
        );
    }

    return (
        <div className="p-8 w-full">
            <h1 className="text-[28px] font-bold text-gray-800 dark:text-white mb-2">Facilities and services survey</h1>

            {/* Facilities Section */}
            <SectionDivider title="Facilities" />
            <div className="flex flex-wrap justify-between gap-4 mb-16 px-8">
                <SurveyCard title="Restaurants" icon="restaurant" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Spa" icon="spa" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Sports" icon="sports_tennis" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Other facilities" icon="domain" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Pools" icon="pool" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Attractions" status="disabled" disabledText="Not available" icon="attractions" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Shops" icon="shopping_cart" onDoubleClick={handleDoubleClick} />
            </div>

            {/* Services Section */}
            <SectionDivider title="Services" />
            <div className="flex flex-wrap justify-between gap-4 mb-16 px-8">
                <SurveyCard title="Other services" icon="room_service" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Issues" icon="report_problem" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Amenities" icon="coffee_maker" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Housekeeping" icon="cleaning_services" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Room service" icon="room_preferences" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Laundry" icon="local_laundry_service" onDoubleClick={handleDoubleClick} />
                <SurveyCard title="Checkout" icon="badge" onDoubleClick={handleDoubleClick} />
            </div>
        </div>
    );
}
