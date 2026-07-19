import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ContentCardsLayout } from '../../../components/layout/ContentCardsLayout';
import { useHttpQuery } from '../../../hooks/useHttpQuery';

const MOCK_SECTIONS = [
    {
        id: 'other_main',
        title: 'Ostatní služby a nabídky',
        items: [
            {
                id: '1',
                title: 'Doprava a Transfery',
                list_label: 'Taxi, letištní transfery, lístky na MHD',
                image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
            {
                id: '2',
                title: 'Půjčovna vybavení',
                list_label: 'Elektrokola, koloběžky, sportovní náčiní',
                image: 'https://images.unsplash.com/photo-1520690274706-e0ce14801ed6?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
            {
                id: '3',
                title: 'Lokální partneři a výlety',
                list_label: 'Vstupenky, exkurze, partnerské restaurace',
                image: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
            {
                id: '4',
                title: 'Často kladené dotazy (FAQ)',
                list_label: 'Heslo na Wi-Fi, časy snídaní, klimatizace',
                image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
            {
                id: '5',
                title: 'Dárkové poukazy',
                list_label: 'Prodej voucherů na pobyty a wellness',
                image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
            {
                id: '6',
                title: 'Ekologie a Udržitelnost',
                list_label: 'Zrušení úklidu za odměnu, třídění odpadu',
                image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
                is_active: true,
            },
        ],
    },
];

export function Other() {
    const queryClient = useQueryClient();
    const key = ['content-list', '/api/other/topics'];
    const query = useHttpQuery(key, '/api/other/topics', { retry: false });

    const is404 = query.error?.response?.status === 404;
    const sections = is404 ? MOCK_SECTIONS : (query.data?.sections ?? []);
    const showError = query.isError && !is404;

    return (
        <ContentCardsLayout
            title="Ostatní"
            hideSectionTitle
            sections={sections}
            moduleKey="generic_other"
            moduleType="other"
            loading={query.isPending}
            error={
                showError
                    ? query.error?.response?.data?.message ||
                      'Nepodařilo se načíst sekci Ostatní. Zkontrolujte připojení k databázi.'
                    : null
            }
            onReload={() => queryClient.invalidateQueries({ queryKey: key })}
            onRetry={() => query.refetch()}
        />
    );
}
