import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';

const FeedbackIcon = ({ name, className = '' }) => (
    <span className={`material-symbols-rounded ${className}`}>{name}</span>
);

function SectionCard({ title, description, icon, path, gradient }) {
    return (
        <Link
            to={path}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800/90"
        >
            <div className={`h-1.5 bg-gradient-to-r ${gradient ?? 'from-gray-500 to-gray-600'}`} />
            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
                        <FeedbackIcon name={icon} className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 transition group-hover:text-yellow-500 dark:text-white">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
                    </div>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-yellow-500">
                    Otevřít <FeedbackIcon name="arrow_forward" className="text-base" />
                </span>
            </div>
        </Link>
    );
}

export function FeedbackHub() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/modules/check/feedback')
            .then((res) => {
                setIsEnabled(res.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
            </div>
        );
    }

    if (!isEnabled) return <NotFound />;

    return (
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="relative mb-10 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/5" />
                <div className="relative px-6 py-10 sm:px-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-yellow-500">Feedback</p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                        Zpětná vazba a{' '}
                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            hodnocení
                        </span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-gray-600 dark:text-gray-300">
                        Správa dotazníků spokojenosti, zpráv od hostů, statistik hodnocení a propojení na externí recenzní platformy.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <SectionCard
                    title="Dotazníky (Surveys)"
                    description="Vytvářejte a spravujte různé typy dotazníků pro hosty, od uvítacího až po check-out."
                    icon="quiz"
                    path="/module/surveys/surveys_welcome"
                    gradient="from-blue-500 to-blue-600"
                />
                <SectionCard
                    title="Externí platformy"
                    description="Propojte hodnocení z externích platforem (Google Reviews, Tripadvisor)."
                    icon="public"
                    path="/module/feedback/external_platforms"
                    gradient="from-teal-400 to-teal-500"
                />
                <SectionCard
                    title="Inbox"
                    description="Zprávy, připomínky a zpětná vazba přímo od hostů."
                    icon="inbox"
                    path="/module/feedback/inbox"
                    gradient="from-purple-500 to-purple-600"
                />
                <SectionCard
                    title="Statistiky (Stats)"
                    description="Přehledy, grafy a analýzy spokojenosti hostů."
                    icon="bar_chart"
                    path="/module/feedback/stats"
                    gradient="from-orange-400 to-orange-500"
                />
            </div>
        </div>
    );
}
