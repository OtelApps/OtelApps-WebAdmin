import React, { createContext, useCallback, useContext, useMemo } from 'react';

const ModulesContext = createContext(null);

function readBootstrap() {
    const data = typeof window !== 'undefined' ? window.__OTELAPPS_BOOTSTRAP__ : null;
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

export function ModulesProvider({ children }) {
    const bootstrap = useMemo(() => readBootstrap(), []);

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
        }),
        [bootstrap, isEnabled, isModuleRouteEnabled, getSidebar],
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
