import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useModules } from '../../context/ModulesContext';
import { useAuth } from '../../context/AuthContext';

function RequireAuth({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

/**
 * ProtectedRoute — sync check z bootstrapu + RBAC modulů.
 */
export function ProtectedRoute({ children, moduleName }) {
    const { isEnabled, mainModules } = useModules();
    const { canAccessModule, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (moduleName && !isEnabled(moduleName)) {
        const fallback = mainModules[0] || 'dashboard';
        return <Navigate to={`/${fallback}`} replace />;
    }

    if (moduleName && !canAccessModule(moduleName)) {
        const fallback = mainModules.find((m) => m !== moduleName) || mainModules[0] || 'dashboard';
        return <Navigate to={`/${fallback}`} replace />;
    }

    return children;
}

/**
 * ProtectedModuleRoute — sync check type + module z bootstrapu.
 */
export function ProtectedModuleRoute({ children }) {
    const { type, module } = useParams();
    const { isModuleRouteEnabled, mainModules } = useModules();
    const { isAuthenticated, canAccessModule } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isModuleRouteEnabled(type, module)) {
        const fallback = mainModules[0] || 'dashboard';
        return <Navigate to={`/${fallback}`} replace />;
    }

    if (type && !canAccessModule(type)) {
        const fallback = mainModules[0] || 'dashboard';
        return <Navigate to={`/${fallback}`} replace />;
    }

    return children;
}

export { RequireAuth };
