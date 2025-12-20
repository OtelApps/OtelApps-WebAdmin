import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';

export function Services() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/modules/check/services')
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

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
        <div className="p-6 bg-white min-h-screen">
            {/* Empty content area - ready for future implementation */}
        </div>
    );
}

