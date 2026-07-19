import React from 'react';
import { useLocation } from 'react-router-dom';
import { useModules } from '../../context/ModulesContext';
import { NotFound } from './NotFound';

export function Page({ title, children }) {
    const location = useLocation();
    const { isEnabled } = useModules();
    const moduleName = location.pathname.split('/').filter(Boolean)[0];

    if (moduleName && !isEnabled(moduleName)) {
        return <NotFound />;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>
            {children || <p className="text-gray-600 dark:text-gray-400">Page content coming soon...</p>}
        </div>
    );
}
