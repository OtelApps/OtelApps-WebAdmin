import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import http from '../lib/http';
import { useModules } from './ModulesContext';

const AuthContext = createContext(null);

function readBootstrapUser() {
    const data = typeof window !== 'undefined' ? window.__OTELAPPS_BOOTSTRAP__ : null;
    return {
        user: data?.user ?? null,
        demoUserSwitcher: Boolean(data?.demo_user_switcher),
    };
}

export function AuthProvider({ children }) {
    const initial = readBootstrapUser();
    const [user, setUser] = useState(initial.user);
    const [demoUserSwitcher, setDemoUserSwitcher] = useState(initial.demoUserSwitcher);
    const [profiles, setProfiles] = useState([]);
    const { applyBootstrap } = useModules();

    const applyAuthPayload = useCallback(
        (payload) => {
            if (payload?.bootstrap) {
                applyBootstrap(payload.bootstrap);
                if (typeof payload.bootstrap.demo_user_switcher === 'boolean') {
                    setDemoUserSwitcher(payload.bootstrap.demo_user_switcher);
                }
            }
            if (payload?.user) {
                setUser(payload.user);
                if (typeof window !== 'undefined') {
                    window.__OTELAPPS_BOOTSTRAP__ = {
                        ...(window.__OTELAPPS_BOOTSTRAP__ || {}),
                        user: payload.user,
                    };
                }
            }
            if (typeof payload?.demo_user_switcher === 'boolean') {
                setDemoUserSwitcher(payload.demo_user_switcher);
            }
        },
        [applyBootstrap],
    );

    const login = useCallback(
        async (email, password, remember = true) => {
            const { data } = await http.post('/api/auth/login', { email, password, remember });
            applyAuthPayload(data);
            return data.user;
        },
        [applyAuthPayload],
    );

    const logout = useCallback(async () => {
        try {
            await http.post('/api/auth/logout');
        } finally {
            setUser(null);
            setProfiles([]);
            if (typeof window !== 'undefined') {
                window.__OTELAPPS_BOOTSTRAP__ = {
                    ...(window.__OTELAPPS_BOOTSTRAP__ || {}),
                    user: null,
                };
            }
        }
    }, []);

    const switchUser = useCallback(
        async (userId) => {
            const { data } = await http.post(`/api/auth/switch/${userId}`);
            applyAuthPayload(data);
            return data.user;
        },
        [applyAuthPayload],
    );

    const refreshMe = useCallback(async () => {
        const { data } = await http.get('/api/auth/me');
        applyAuthPayload(data);
        return data.user;
    }, [applyAuthPayload]);

    const loadProfiles = useCallback(async () => {
        if (!demoUserSwitcher) return [];
        const { data } = await http.get('/api/auth/profiles');
        setProfiles(data.profiles || []);
        return data.profiles || [];
    }, [demoUserSwitcher]);

    const updateProfile = useCallback(
        async (payload) => {
            const { data } = await http.put('/api/auth/profile', payload);
            setUser(data.user);
            return data.user;
        },
        [],
    );

    const hasPermission = useCallback(
        (key) => {
            if (!user) return false;
            if (user.is_superadmin || (user.permissions || []).includes('*')) return true;
            return (user.permissions || []).includes(key);
        },
        [user],
    );

    const canAccessModule = useCallback(
        (moduleKey) => {
            if (!user) return false;
            if (user.is_superadmin || (user.modules || []).includes('*')) return true;
            return (user.modules || []).includes(moduleKey);
        },
        [user],
    );

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            demoUserSwitcher,
            profiles,
            login,
            logout,
            switchUser,
            refreshMe,
            loadProfiles,
            updateProfile,
            hasPermission,
            canAccessModule,
        }),
        [
            user,
            demoUserSwitcher,
            profiles,
            login,
            logout,
            switchUser,
            refreshMe,
            loadProfiles,
            updateProfile,
            hasPermission,
            canAccessModule,
        ],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
