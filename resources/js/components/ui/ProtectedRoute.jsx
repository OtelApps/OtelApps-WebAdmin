import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useModules } from '../../context/ModulesContext';

/**
 * ProtectedRoute — sync check z bootstrapu (bez HTTP).
 */
export function ProtectedRoute({ children, moduleName }) {
    const { isEnabled } = useModules();

    if (moduleName && !isEnabled(moduleName)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

/**
 * ProtectedModuleRoute — sync check type + module z bootstrapu.
 */
export function ProtectedModuleRoute({ children }) {
    const { type, module } = useParams();
    const { isModuleRouteEnabled } = useModules();

    if (!isModuleRouteEnabled(type, module)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
