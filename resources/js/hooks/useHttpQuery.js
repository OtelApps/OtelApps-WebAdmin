import { useQuery } from '@tanstack/react-query';
import http from '../lib/http';

/**
 * Sdílený GET přes React Query — cache + okamžitý shell při návratu na stránku.
 */
export function useHttpQuery(queryKey, url, options = {}) {
    const { params, enabled = true, select, staleTime, ...rest } = options;

    return useQuery({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        queryFn: async ({ signal }) => {
            const { data } = await http.get(url, { params, signal });
            return data;
        },
        enabled,
        select,
        staleTime,
        ...rest,
    });
}
