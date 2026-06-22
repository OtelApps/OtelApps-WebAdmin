import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { FormSaveBar } from '../../../components/ui/FormSaveBar';

export function LegalTexts() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [legalTexts, setLegalTexts] = useState({
        terms_and_conditions: null,
        privacy_policy: null,
        house_rules: null,
    });

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get('/api/legal-texts')
            .then((res) => {
                setLegalTexts(res.data.legal_texts || { terms_and_conditions: null, privacy_policy: null, house_rules: null });
            })
            .catch((err) => {
                // Ignore 404 since backend is not implemented yet, just load empty form
                setLegalTexts({ terms_and_conditions: null, privacy_policy: null, house_rules: null });
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

    const saveTexts = async () => {
        setSaveStatus('saving');
        try {
            const formData = new FormData();
            
            // Only append actual files. If string (already uploaded URL), backend can handle or ignore.
            if (legalTexts.terms_and_conditions instanceof File) {
                formData.append('terms_and_conditions', legalTexts.terms_and_conditions);
            }
            if (legalTexts.privacy_policy instanceof File) {
                formData.append('privacy_policy', legalTexts.privacy_policy);
            }
            if (legalTexts.house_rules instanceof File) {
                formData.append('house_rules', legalTexts.house_rules);
            }

            const { data } = await axios.post('/api/legal-texts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLegalTexts(data.legal_texts || legalTexts);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const handleFileChange = (field, file) => {
        setLegalTexts((prev) => ({ ...prev, [field]: file }));
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
        <div className="p-6 w-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Právní texty a podmínky</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Nahrajte PDF dokumenty (obchodní podmínky, zásady ochrany osobních údajů atd.), které se budou zobrazovat hostům v mobilní aplikaci.
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

            <div className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                
                <Field label="Obchodní podmínky" description="Nahrání PDF dokumentu se základními podmínkami ubytování a poskytování služeb.">
                    <FileUploadInput 
                        id="terms_and_conditions"
                        file={legalTexts.terms_and_conditions} 
                        onChange={(file) => handleFileChange('terms_and_conditions', file)} 
                    />
                </Field>
                
                <Field label="Zásady ochrany osobních údajů (GDPR)" description="Nahrání PDF dokumentu s informacemi o zpracování osobních údajů hostů.">
                    <FileUploadInput 
                        id="privacy_policy"
                        file={legalTexts.privacy_policy} 
                        onChange={(file) => handleFileChange('privacy_policy', file)} 
                    />
                </Field>
                
                <Field label="Domovní řád" description="Nahrání PDF dokumentu s pravidly chování a pobytu v hotelu.">
                    <FileUploadInput 
                        id="house_rules"
                        file={legalTexts.house_rules} 
                        onChange={(file) => handleFileChange('house_rules', file)} 
                    />
                </Field>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <FormSaveBar onSave={saveTexts} saveStatus={saveStatus} label="Uložit dokumenty" />
                </div>
            </div>
        </div>
    );
}

function Field({ label, description, children }) {
    return (
        <div className="block p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
            <span className="block text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</span>
            {description && <span className="block text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</span>}
            {children}
        </div>
    );
}

function FileUploadInput({ file, onChange, id }) {
    const isUploadedString = file && !(file instanceof File) && typeof file === 'string';
    const hasFile = file != null;

    const fileName = file instanceof File ? file.name : (isUploadedString ? 'Nahraný dokument (již uložen)' : '');

    const handleClear = (e) => {
        e.preventDefault();
        onChange(null);
    };

    return (
        <div className="relative w-full">
            {!hasFile ? (
                <>
                    <input
                        type="file"
                        id={id}
                        accept=".pdf"
                        onChange={(e) => onChange(e.target.files[0] || null)}
                        className="hidden"
                    />
                    <label
                        htmlFor={id}
                        className="flex flex-col items-center justify-center w-full h-32 px-4 transition-all bg-white border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer dark:bg-gray-800 dark:border-gray-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 dark:hover:border-orange-500 hover:shadow-sm group"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold text-orange-600 dark:text-orange-400">Klikněte pro nahrání</span> PDF
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Max. 10 MB</p>
                        </div>
                    </label>
                </>
            ) : (
                <div className="flex items-center justify-between p-4 bg-orange-50/70 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-2xl transition-all shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm shrink-0">
                            <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 2H13L17.5 6.5V20C17.5 21.1 16.6 22 15.5 22H7C5.9 22 5 21.1 5 20V4C5 2.9 5.9 2 7 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M13 2V6.5H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 13H11C12.1 13 13 12.1 13 11C13 9.9 12.1 9 11 9H8V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 13H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fileName}</p>
                            <p className="text-xs font-medium mt-0.5 flex items-center gap-1.5 text-green-600 dark:text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {isUploadedString ? 'Nahrané na serveru' : 'Připraveno k uložení'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all focus:outline-none shrink-0"
                        title="Odstranit soubor"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
