import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AVAILABILITY_LABELS = {
    available: 'Dostupný/á',
    busy: 'Zaneprázdněný/á',
    offline: 'Offline',
};

export function UserMenu() {
    const {
        user,
        logout,
        switchUser,
        demoUserSwitcher,
        profiles,
        loadProfiles,
        hasPermission,
    } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [switchOpen, setSwitchOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (!rootRef.current?.contains(e.target)) {
                setOpen(false);
                setSwitchOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setSwitchOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    useEffect(() => {
        if (open && demoUserSwitcher && profiles.length === 0) {
            loadProfiles().catch(() => {});
        }
    }, [open, demoUserSwitcher, profiles.length, loadProfiles]);

    if (!user) return null;

    const badge = user.user_type?.badge_label;
    const typeName = user.user_type?.name || user.job_title || 'Uživatel';

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const handleSwitch = async (profileId) => {
        if (profileId === user.id) {
            setSwitchOpen(false);
            setOpen(false);
            return;
        }
        setSwitching(true);
        try {
            await switchUser(profileId);
            setSwitchOpen(false);
            setOpen(false);
            window.location.reload();
        } catch (err) {
            console.error(err);
            setSwitching(false);
        }
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-gray-700/60"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                    {user.initials}
                </span>
                <span className="hidden min-w-0 sm:block">
                    <span className="block truncate text-sm font-medium text-white">{user.name}</span>
                    <span className="block truncate text-xs text-gray-400">{user.job_title || typeName}</span>
                </span>
                {badge ? (
                    <span className="hidden rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300 lg:inline">
                        {badge}
                    </span>
                ) : null}
                <span className="material-symbols-outlined text-[18px] text-gray-400">expand_more</span>
            </button>

            {open ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                                {user.initials}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                                <p className="truncate text-xs text-gray-500">{typeName}</p>
                                <p className="text-[11px] text-emerald-600">
                                    {AVAILABILITY_LABELS[user.availability_status] || user.availability_status}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="py-1">
                        <Link
                            to="/nastaveni/profil"
                            onClick={() => setOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <span className="material-symbols-outlined text-[20px] text-gray-400">manage_accounts</span>
                            Nastavení profilu
                        </Link>

                        {hasPermission('users.manage_types') ? (
                            <Link
                                to="/nastaveni/uzivatele"
                                onClick={() => setOpen(false)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-400">admin_panel_settings</span>
                                Typy uživatelů
                            </Link>
                        ) : null}

                        {demoUserSwitcher ? (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setSwitchOpen((v) => !v)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-gray-400">swap_horiz</span>
                                    <span className="flex-1 text-left">Přepnout uživatele</span>
                                    <span className="material-symbols-outlined text-[18px] text-gray-400">
                                        {switchOpen ? 'expand_less' : 'expand_more'}
                                    </span>
                                </button>
                                {switchOpen ? (
                                    <div className="max-h-56 overflow-y-auto border-t border-gray-50 bg-gray-50/80 py-1">
                                        {profiles.map((p) => {
                                            const active = p.id === user.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    disabled={switching}
                                                    onClick={() => handleSwitch(p.id)}
                                                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-white disabled:opacity-50 ${
                                                        active ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                                                    }`}
                                                >
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                                                        {p.initials}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate font-medium">{p.name}</span>
                                                        <span className="block truncate text-[11px] text-gray-500">
                                                            {p.user_type?.name || p.job_title}
                                                        </span>
                                                    </span>
                                                    {active ? (
                                                        <span className="material-symbols-outlined text-[16px] text-orange-500">
                                                            check
                                                        </span>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
                        >
                            <span className="material-symbols-outlined text-[20px] text-gray-700">logout</span>
                            Odhlásit
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
