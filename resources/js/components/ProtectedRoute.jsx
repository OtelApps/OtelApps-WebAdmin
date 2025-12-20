import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import axios from 'axios';

/**
 * ProtectedRoute - chrání routes před přístupem k zakázaným modulům
 */
export function ProtectedRoute({ children, moduleName }) {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

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
            .catch(error => {
                console.error('Error checking module:', error);
                setIsEnabled(false);
                setLoading(false);
            });
    }, [moduleName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isEnabled) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

/**
 * ProtectedModuleRoute - chrání module routes (type/module)
 */
export function ProtectedModuleRoute({ children }) {
    const { type, module } = useParams();
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!type || !module) {
            setLoading(false);
            setIsEnabled(false);
            return;
        }

        axios.get(`/api/modules/check/${type}/${module}`)
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error checking module:', error);
                setIsEnabled(false);
                setLoading(false);
            });
    }, [type, module]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isEnabled) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

