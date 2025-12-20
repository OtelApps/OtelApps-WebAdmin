import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { NotFound } from './NotFound';

export function Page({ title, children }) {
    const location = useLocation();
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    // Získej název modulu z URL (např. /activity -> activity)
    const moduleName = location.pathname.split('/').filter(Boolean)[0];

    useEffect(() => {
        if (!moduleName) {
            setLoading(false);
            setIsEnabled(true);
            return;
        }

        axios.get(`/api/modules/check/${moduleName}`)
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, [moduleName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isEnabled) {
        return <NotFound />;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>
            {children || <p className="text-gray-600 dark:text-gray-400">Page content coming soon...</p>}
        </div>
    );
}

