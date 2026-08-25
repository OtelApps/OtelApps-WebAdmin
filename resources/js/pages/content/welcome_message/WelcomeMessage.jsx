import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { FormSaveBar } from '../../../components/ui/FormSaveBar';

export function WelcomeMessage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [welcomeMessage, setWelcomeMessage] = useState({
        title: '',
        message: '',
        is_active: false,
    });

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get('/api/welcome-message')
            .then((res) => {
                setWelcomeMessage(res.data.welcome_message || { title: '', message: '', is_active: false });
            })
            .catch((err) => {
                // Ignore 404 since backend is not implemented yet, just load empty form
                setWelcomeMessage({ title: '', message: '', is_active: false });
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const showSaveStatus = (status) => {
        setSaveStatus(status);
        if (status === 'saved') setTimeout(() => setSaveStatus(null), 2000);
        if (status === 'error') setTimeout(() => setSaveStatus(null), 4000);
    };

    const saveMessage = async () => {
        setSaveStatus('saving');
        try {
            const { data } = await axios.post('/api/welcome-message', welcomeMessage);
            setWelcomeMessage(data.welcome_message || welcomeMessage);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const updateField = (field, value) => {
        setWelcomeMessage((prev) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center min-h-[50vh] items-center">
                <p className="text-gray-600">Načítání…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Uvítací zpráva</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Nastavte zprávu, která se zobrazí uživatelům při prvním otevření aplikace.
                    </p>
                </div>
                {saveStatus && (
                    <span
                        className={`text-sm font-medium ${
                            saveStatus === 'saved'
                                ? 'text-green-600'
                                : saveStatus === 'error'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                        }`}
                    >
                        {saveStatus === 'saving' && 'Ukládám…'}
                        {saveStatus === 'saved' && 'Uloženo'}
                        {saveStatus === 'error' && 'Chyba ukládání (API chybí)'}
                    </span>
                )}
            </div>

            <div className="space-y-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <Field label="Nadpis">
                    <input
                        className={inputClass}
                        value={welcomeMessage.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Např. Vítejte v našem hotelu!"
                    />
                </Field>
                
                <Field label="Zpráva">
                    <textarea
                        className={inputClass}
                        rows={6}
                        value={welcomeMessage.message}
                        onChange={(e) => updateField('message', e.target.value)}
                        placeholder="Zadejte text uvítací zprávy..."
                    />
                </Field>

                <label className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 pt-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={welcomeMessage.is_active}
                        onChange={(e) => updateField('is_active', e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-5 h-5 transition-all"
                    />
                    Zobrazovat zprávu v aplikaci
                </label>

                <div className="pt-2">
                    <FormSaveBar onSave={saveMessage} saveStatus={saveStatus} label="Uložit zprávu" />
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow';
