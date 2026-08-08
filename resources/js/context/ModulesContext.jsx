import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ModulesContext = createContext(null);

function normalizeBootstrap(data) {
    return {
        enabled: data?.enabled && typeof data.enabled === 'object' ? data.enabled : {},
        mainNavigation: {
            modules: Array.isArray(data?.mainNavigation?.modules) ? data.mainNavigation.modules : [],
            labels: data?.mainNavigation?.labels && typeof data.mainNavigation.labels === 'object'
                ? data.mainNavigation.labels
                : {},
        },
        map: data?.map && typeof data.map === 'object' ? data.map : {},
        sidebars: data?.sidebars && typeof data.sidebars === 'object' ? data.sidebars : {},
    };
}

function readInitialBootstrap() {
    const data = typeof window !== 'undefined' ? window.__OTELAPPS_BOOTSTRAP__ : null;
    return normalizeBootstrap(data);
}

export function ModulesProvider({ children }) {
    const [bootstrap, setBootstrap] = useState(readInitialBootstrap);

    const applyBootstrap = useCallback((data) => {
        if (!data) return;
        const next = normalizeBootstrap(data);
        setBootstrap(next);
        if (typeof window !== 'undefined') {
            window.__OTELAPPS_BOOTSTRAP__ = {
                ...(window.__OTELAPPS_BOOTSTRAP__ || {}),
                ...data,
                enabled: next.enabled,
                mainNavigation: next.mainNavigation,
                map: next.map,
                sidebars: next.sidebars,
            };
        }
    }, []);

    const isEnabled = useCallback(
        (moduleName) => {
            if (!moduleName) return true;
            return Boolean(bootstrap.enabled[moduleName]);
        },
        [bootstrap.enabled],
    );

    const isModuleRouteEnabled = useCallback(
        (type, module) => {
            if (!type || !module) return false;
            return isEnabled(type) && isEnabled(module);
        },
        [isEnabled],
    );

    const getSidebar = useCallback(
        (sectionKey) => {
            if (!sectionKey) return { modules: [], resolvedSection: null };

            const direct = bootstrap.sidebars[sectionKey];
            if (direct) {
                return {
                    modules: Array.isArray(direct.modules) ? direct.modules : [],
                    resolvedSection: direct.resolvedSection || sectionKey,
                };
            }

            const parent = bootstrap.map[sectionKey];
            if (parent && bootstrap.sidebars[parent]) {
                const sidebar = bootstrap.sidebars[parent];
                return {
                    modules: Array.isArray(sidebar.modules) ? sidebar.modules : [],
                    resolvedSection: sidebar.resolvedSection || parent,
                };
            }

            return { modules: [], resolvedSection: null };
        },
        [bootstrap.map, bootstrap.sidebars],
    );

    const value = useMemo(
        () => ({
            enabled: bootstrap.enabled,
            mainModules: bootstrap.mainNavigation.modules,
            labels: bootstrap.mainNavigation.labels,
            moduleMap: bootstrap.map,
            isEnabled,
            isModuleRouteEnabled,
            getSidebar,
            applyBootstrap,
        }),
        [bootstrap, isEnabled, isModuleRouteEnabled, getSidebar, applyBootstrap],
    );

    return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export function useModules() {
    const ctx = useContext(ModulesContext);
    if (!ctx) {
        throw new Error('useModules must be used within ModulesProvider');
    }
    return ctx;
}
