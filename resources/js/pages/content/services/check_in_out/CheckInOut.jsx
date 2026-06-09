import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FormSaveBar } from '../../../../components/FormSaveBar';

export function CheckInOut() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    
    // Default configuration state
    const [config, setConfig] = useState({
        enable_online_checkin: false,
        enable_online_checkout: false,
        checkin_available_hours: 48,
        standard_checkin_time: '14:00',
        standard_checkout_time: '10:00',
        require_id_upload: false,
        require_signature: false,
        require_credit_card: false,
        key_pickup_instructions: '',
        key_dropoff_instructions: '',
    });

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get('/api/check-in-out/config')
            .then((res) => {
                if (res.data.config) {
                    setConfig(res.data.config);
                }
            })
            .catch((err) => {
                // If backend is not implemented yet, just swallow 404 and use default state
                if (err.response?.status !== 404) {
                    setError('Nepodařilo se načíst konfiguraci. Zkontrolujte připojení k databázi.');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleToggle = (key) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const saveConfig = () => {
        setSaveStatus('saving');
        axios
            .post('/api/check-in-out/config', { config })
            .then(() => setSaveStatus('success'))
            .catch(() => setSaveStatus('error'))
            .finally(() => {
                setTimeout(() => setSaveStatus(null), 3000);
            });
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[40vh]">
                <p className="text-gray-600 dark:text-gray-400">Načítání konfigurace…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-4xl">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                    <p className="font-medium mb-2">Chyba</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={load} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
                        Zkusit znovu
                    </button>
                </div>
            </div>
        );
    }

    // UI Helper Components
    const ToggleField = ({ label, description, name, checked, onChange }) => (
        <div className="flex items-start justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 first:pt-0">
            <div className="pr-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
                {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(name)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    checked ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );

    const SelectField = ({ label, name, value, options, onChange }) => (
        <div className="py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full sm:w-1/2 block rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    const TimeField = ({ label, name, value, onChange }) => (
        <div className="py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
                type="time"
                name={name}
                value={value}
                onChange={onChange}
                className="w-full sm:w-1/3 block rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            />
        </div>
    );

    const TextField = ({ label, description, name, value, onChange }) => (
        <div className="py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 first:pt-0">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</label>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>}
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={4}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Zadejte instrukce..."
            />
        </div>
    );

    return (
        <div className="p-6 max-w-4xl pb-24">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Online Check-in / Check-out</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Nastavení podmínek a instrukcí pro samoobslužný proces ubytování přes mobilní aplikaci.
                </p>
            </div>

            <div className="space-y-6">
                {/* Status Toggles */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aktivace modulů</h3>
                    <ToggleField 
                        label="Povolit Online Check-in" 
                        description="Hosté se budou moci odbavit v aplikaci před příjezdem a ušetří tak čas na recepci."
                        name="enable_online_checkin" 
                        checked={config.enable_online_checkin} 
                        onChange={handleToggle} 
                    />
                    <ToggleField 
                        label="Povolit Online Check-out" 
                        description="Hosté budou moci potvrdit svůj odjezd a uhradit účet elektronicky."
                        name="enable_online_checkout" 
                        checked={config.enable_online_checkout} 
                        onChange={handleToggle} 
                    />
                </div>

                {/* Timing and Deadlines */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Časová pravidla</h3>
                    <div className="space-y-2">
                        <SelectField
                            label="Otevřít Check-in (hodin před příjezdem)"
                            name="checkin_available_hours"
                            value={config.checkin_available_hours}
                            onChange={handleChange}
                            options={[
                                { value: 24, label: '24 hodin' },
                                { value: 48, label: '48 hodin' },
                                { value: 72, label: '72 hodin' },
                                { value: 168, label: '7 dní' },
                            ]}
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <TimeField label="Standardní čas Check-inu" name="standard_checkin_time" value={config.standard_checkin_time} onChange={handleChange} />
                            <TimeField label="Čas pro Check-out (do)" name="standard_checkout_time" value={config.standard_checkout_time} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Requirements for Guest */}
                {(config.enable_online_checkin || config.enable_online_checkout) && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Požadavky na hosta</h3>
                        <ToggleField 
                            label="Nahrání průkazu totožnosti" 
                            description="Host musí před dokončením Check-inu nahrát fotku občanského průkazu nebo pasu."
                            name="require_id_upload" 
                            checked={config.require_id_upload} 
                            onChange={handleToggle} 
                        />
                        <ToggleField 
                            label="Elektronický podpis" 
                            description="Vyžadovat podpis registrační karty přímo na displeji mobilu."
                            name="require_signature" 
                            checked={config.require_signature} 
                            onChange={handleToggle} 
                        />
                        <ToggleField 
                            label="Garance platební kartou" 
                            description="Aplikace vyzve hosta k uložení a předautorizaci platební karty (např. pro minibar a případné škody)."
                            name="require_credit_card" 
                            checked={config.require_credit_card} 
                            onChange={handleToggle} 
                        />
                    </div>
                )}

                {/* Instructions */}
                {(config.enable_online_checkin || config.enable_online_checkout) && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instrukce pro hosty</h3>
                        {config.enable_online_checkin && (
                            <TextField 
                                label="Instrukce po dokončení Check-inu" 
                                description="Tento text se zobrazí hostům, jakmile úspěšně projdou online check-inem. Typicky se zde popisuje, jak získají klíč od pokoje (např. automat, PIN kód, zrychlená přepážka na recepci)."
                                name="key_pickup_instructions" 
                                value={config.key_pickup_instructions} 
                                onChange={handleChange} 
                            />
                        )}
                        {config.enable_online_checkout && (
                            <TextField 
                                label="Instrukce pro Check-out" 
                                description="Informace o tom, kam mají hosté odevzdat fyzický klíč po opuštění pokoje."
                                name="key_dropoff_instructions" 
                                value={config.key_dropoff_instructions} 
                                onChange={handleChange} 
                            />
                        )}
                    </div>
                )}
            </div>

            <FormSaveBar status={saveStatus} onSave={saveConfig} />
        </div>
    );
}
