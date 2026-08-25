import React from 'react';
import { ContentListPage } from '../../../shared/ContentListPage';

export function Sports() {
    return (
        <ContentListPage
            title="Posilovna & Sport"
            endpoint="/api/fitness/facilities"
            moduleKey="sports"
            hideSectionTitle
            errorFallback="Nepodařilo se načíst posilovnu a sport. Zkontroluj Supabase a tabulky fitness_facilities."
        />
    );
}
