import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ContentCardsLayout } from '../../components/layout/ContentCardsLayout';
import { useHttpQuery } from '../../hooks/useHttpQuery';

/**
 * Shell-first list stránka s React Query cache.
 */
export function ContentListPage({
    title,
    endpoint,
    queryKey,
    moduleKey,
    moduleType = 'facilities',
    moduleArea,
    hideSectionTitle,
    editTab,
    listMeta,
    errorFallback,
    selectSections = (data) => data?.sections ?? [],
    headerActions,
    children,
}) {
    const queryClient = useQueryClient();
    const key = queryKey ?? ['content-list', endpoint];

    const query = useHttpQuery(key, endpoint, {
        select: (data) => ({
            sections: selectSections(data),
            raw: data,
        }),
    });

    const onReload = () => queryClient.invalidateQueries({ queryKey: key });

    const errorMessage =
        query.error?.response?.data?.message ||
        query.error?.message ||
        errorFallback ||
        'Nepodařilo se načíst data.';

    return (
        <>
            {typeof children === 'function' ? children(query.data?.raw, query) : children}
            <ContentCardsLayout
                title={title}
                sections={query.data?.sections ?? []}
                moduleKey={moduleKey}
                moduleType={moduleType}
                moduleArea={moduleArea}
                hideSectionTitle={hideSectionTitle}
                editTab={editTab}
                listMeta={listMeta}
                headerActions={headerActions}
                loading={query.isPending}
                error={query.isError ? errorMessage : null}
                onReload={onReload}
                onRetry={() => query.refetch()}
            />
        </>
    );
}
