import { useCallback, useEffect, useState } from 'react';
import http from '../../lib/http';

/**
 * Načte data z Insights API s volitelným obdobím.
 */
export function useInsightsData(endpoint, { defaultPeriod = 'week' } = {}) {
    const [period, setPeriod] = useState(defaultPeriod);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reload = useCallback(() => {
        setLoading(true);
        setError(null);
        http
            .get(`/api/insights/${endpoint}`, { params: { period } })
            .then((res) => setData(res.data))
            .catch((err) => {
                setData(null);
                setError(
                    err.response?.data?.message ||
                        'Data se nepodařilo načíst. Zkontroluj modul Insights a připojení k databázi.',
                );
            })
            .finally(() => setLoading(false));
    }, [endpoint, period]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { data, loading, error, period, setPeriod, reload };
}
