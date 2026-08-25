import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentListPage } from '../../../shared/ContentListPage';

export function WellnessSpa() {
    const navigate = useNavigate();

    return (
        <ContentListPage
            title="Wellness & SPA"
            endpoint="/api/wellness/facilities"
            moduleKey="wellness_spa"
            hideSectionTitle
            errorFallback="Nepodařilo se načíst wellness. Zkontroluj připojení k Supabase (OTELAPPS_DB_CONNECTION v .env)."
            headerActions={
                <button
                    type="button"
                    onClick={() => navigate('/module/facilities/wellness_spa/program/edit')}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Hotelový program →
                </button>
            }
        />
    );
}
