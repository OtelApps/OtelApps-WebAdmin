import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../../lib/http';
import { NotFound } from '../shared/NotFound';
import { isModuleUnavailable } from '../../config/unavailableModules';
import {
    modulePath,
    QUICK_START_STEPS,
    SECTION_META,
    SUBMODULE_HINTS,
    submodulePath,
} from './contentHubConfig';

function SectionIcon({ name, className = '' }) {
    return (
        <span className={`material-symbols-outlined ${className}`} aria-hidden>
            {name}
        </span>
    );
}

function SubmoduleChip({ sectionKey, sub, compact = false }) {
    const unavailable = isModuleUnavailable(sub.key);
    const hint = SUBMODULE_HINTS[sub.key] ?? sub.label;

    return (
        <Link
            to={submodulePath(sectionKey, sub.key)}
            title={unavailable ? 'Zatím není implementováno' : hint}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                compact ? 'py-0.5' : ''
            } ${
                unavailable
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-orange-500'
            }`}
        >
            {sub.label}
            {unavailable ? <span className="text-[9px] uppercase">WIP</span> : null}
        </Link>
    );
}

function ContentSectionCard({ sectionKey, label, submodules = [] }) {
    const meta = SECTION_META[sectionKey] ?? {
        icon: 'folder',
        gradient: 'from-gray-500 to-gray-600',
        description: `Správa obsahu: ${label}`,
        hubPath: modulePath(sectionKey),
    };
    const activeCount = submodules.filter((s) => !isModuleUnavailable(s.key)).length;
    const hasSubmodules = submodules.length > 0;

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg dark:border-gray-600 dark:bg-gray-800/90">
            <div className={`h-1.5 bg-gradient-to-r ${meta.gradient}`} />
            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shadow-md`}
                    >
                        <SectionIcon name={meta.icon} className="text-2xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
                                {label}
                            </h2>
                            {hasSubmodules ? (
                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                    {activeCount}/{submodules.length} aktivní
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {meta.description}
                        </p>
                    </div>
                </div>

                {hasSubmodules ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {submodules.slice(0, 5).map((sub) => (
                            <SubmoduleChip key={sub.key} sectionKey={sectionKey} sub={sub} />
                        ))}
                        {submodules.length > 5 ? (
                            <span className="self-center text-xs text-gray-400">
                                +{submodules.length - 5} dalších
                            </span>
                        ) : null}
                    </div>
                ) : null}

                <div className="mt-auto pt-5">
                    <Link
                        to={meta.hubPath ?? modulePath(sectionKey)}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600"
                    >
                        Otevřít sekci
                        <SectionIcon name="arrow_forward" className="text-lg" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

function GalleryBanner() {
    const meta = SECTION_META.image_gallery;

    return (
        <Link
            to={meta.hubPath}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-orange-500/10 p-6 shadow-sm transition hover:shadow-md dark:border-gray-600 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-orange-950/20"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
                        <SectionIcon name={meta.icon} className="text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Image gallery</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{meta.description}</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition group-hover:border-orange-400 group-hover:text-orange-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:self-center">
                    Spravovat galerii
                    <SectionIcon name="chevron_right" className="text-lg" />
                </span>
            </div>
        </Link>
    );
}

export function Content() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState([]);

    useEffect(() => {
        http.get('/api/modules/check/content')
            .then((res) => setIsEnabled(res.data.enabled))
            .catch(() => setIsEnabled(false));
    }, []);

    useEffect(() => {
        if (!isEnabled) {
            setLoading(false);
            return;
        }
        http.get('/api/modules/sidebar?section=content')
            .then((res) => setModules(res.data?.modules ?? []))
            .catch(() => setModules([]))
            .finally(() => setLoading(false));
    }, [isEnabled]);

    const stats = useMemo(() => {
        let sections = 0;
        let submodules = 0;
        modules.forEach((m) => {
            sections += 1;
            if (m.submodules?.length) submodules += m.submodules.length;
        });
        return { sections, submodules };
    }, [modules]);

    if (isEnabled === null || (isEnabled && loading)) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Načítání obsahu…</p>
                </div>
            </div>
        );
    }

    if (!isEnabled) {
        return <NotFound />;
    }

    const primaryKeys = new Set(['facilities', 'services', 'leisure']);
    const primary = modules.filter((m) => primaryKeys.has(m.key));
    const secondary = modules.filter((m) => !primaryKeys.has(m.key));

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Hero */}
            <header className="relative mb-10 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-amber-500/5 dark:from-orange-500/10" />
                <div className="relative px-6 py-10 sm:px-10 sm:py-12">
                    <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                        Content CMS
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Obsah hotelové{' '}
                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                            mobilní aplikace
                        </span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                        Jeden panel pro vše, co host vidí v appce — od restaurací a wellness po pokojovou
                        službu a volnočasový program. Upravte texty, fotografie a katalogy; změny se
                        synchronizují do produktů OtelApps.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            <SectionIcon name="folder" className="text-lg text-orange-500" />
                            {stats.sections} hlavních sekcí
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            <SectionIcon name="tune" className="text-lg text-orange-500" />
                            {stats.submodules} podmodulů
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            Live sync s app
                        </span>
                    </div>
                </div>
            </header>

            {/* Hlavní sekce */}
            <section className="mb-10">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Hlavní oblasti
                </h2>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {primary.map((mod) => (
                        <ContentSectionCard
                            key={mod.key}
                            sectionKey={mod.key}
                            label={mod.label}
                            submodules={mod.submodules}
                        />
                    ))}
                </div>
            </section>

            {/* Doplňkové sekce */}
            {secondary.length > 0 ? (
                <section className="mb-10">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Texty a nastavení
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {secondary.map((mod) => (
                            <ContentSectionCard
                                key={mod.key}
                                sectionKey={mod.key}
                                label={mod.label}
                                submodules={mod.submodules}
                            />
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Galerie */}
            <section className="mb-10">
                <GalleryBanner />
            </section>

            {/* Quick start */}
            <section className="rounded-2xl border border-gray-200 bg-gray-50/80 p-6 dark:border-gray-700 dark:bg-gray-900/50">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <SectionIcon name="lightbulb" className="text-orange-500" />
                    Jak začít
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {QUICK_START_STEPS.map((step, i) => (
                        <div
                            key={step.title}
                            className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
                                <span className="text-sm font-bold">{i + 1}</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{step.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
