import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NotFound } from './NotFound';
import { isModuleUnavailable } from '../../config/unavailableModules';
import { useModules } from '../../context/ModulesContext';

/**
 * Přehled podmodulů (dlaždice) — např. /module/facilities/facilities
 */
export function ModuleSectionHub() {
    const { type } = useParams();
    const { getSidebar } = useModules();

    const { sectionLabel, submodules, error } = useMemo(() => {
        if (!type) {
            return { sectionLabel: '', submodules: [], error: null };
        }

        const modules = getSidebar('content').modules;
        const group = modules.find((m) => m.key === type);

        if (!group?.submodules?.length) {
            return {
                sectionLabel: '',
                submodules: [],
                error: 'Pro tuto sekci nejsou k dispozici žádné podmoduly.',
            };
        }

        return {
            sectionLabel: group.label || type,
            submodules: group.submodules,
            error: null,
        };
    }, [type, getSidebar]);

    if (error) {
        return (
            <div className="p-6 max-w-xl">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (submodules.length === 0) {
        return <NotFound />;
    }

    return (
        <div className="p-6 max-w-6xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{sectionLabel}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Vyberte oblast, kterou chcete upravit.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {submodules.map((sub) => {
                    const unavailable = isModuleUnavailable(sub.key);

                    return (
                        <Link
                            key={sub.key}
                            to={`/module/${type}/${sub.key}`}
                            title={unavailable ? 'Zatím není implementováno' : undefined}
                            className={`group block rounded-xl border p-6 shadow-sm transition-all ${
                                unavailable
                                    ? 'border-red-300 dark:border-red-800/60 bg-red-50/80 dark:bg-red-950/30 hover:border-red-400 hover:shadow-md dark:hover:border-red-600'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-400 hover:shadow-md dark:hover:border-orange-500'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h2
                                    className={`text-lg font-semibold transition-colors ${
                                        unavailable
                                            ? 'text-red-700 dark:text-red-300 group-hover:text-red-800'
                                            : 'text-gray-900 dark:text-white group-hover:text-orange-500'
                                    }`}
                                >
                                    {sub.label}
                                </h2>
                                {unavailable ? (
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                                        WIP
                                    </span>
                                ) : (
                                    <span
                                        className="shrink-0 text-gray-400 group-hover:text-orange-500 transition-colors"
                                        aria-hidden
                                    >
                                        →
                                    </span>
                                )}
                            </div>
                            <p
                                className={`mt-2 text-sm line-clamp-2 ${
                                    unavailable
                                        ? 'text-red-600/80 dark:text-red-400/80'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {unavailable
                                    ? 'Modul zatím není k dispozici.'
                                    : `Správa obsahu: ${sub.label}`}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
