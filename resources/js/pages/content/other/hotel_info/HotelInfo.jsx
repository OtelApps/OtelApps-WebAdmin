import React from 'react';
import { ContentListPage } from '../../../shared/ContentListPage';

export function HotelInfo() {
    return (
        <ContentListPage
            title="Informace o hotelu"
            endpoint="/api/hotel-info/topics"
            moduleKey="hotel_info"
            moduleType="other"
            hideSectionTitle
            errorFallback="Nepodařilo se načíst informace o hotelu. Zkontroluj připojení k Supabase (OTELAPPS_DB_CONNECTION v .env) a že jsou v DB tabulky hotel_info_topics."
        />
    );
}
