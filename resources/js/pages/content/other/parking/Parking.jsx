import React from 'react';
import { ContentListPage } from '../../../shared/ContentListPage';

export function Parking() {
    return (
        <ContentListPage
            title="Parking"
            endpoint="/api/hotel-parking/topics"
            moduleKey="parking"
            moduleType="other"
            hideSectionTitle
            errorFallback="Nepodařilo se načíst parking. Zkontroluj připojení k Supabase."
        />
    );
}
