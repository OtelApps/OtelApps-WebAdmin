import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function ProfileSettings() {
    const { user, updateProfile } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        initials: user?.initials || '',
        job_title: user?.job_title || '',
        availability_status: user?.availability_status || 'available',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            await updateProfile(form);
            setMessage('Profil uložen.');
        } catch (err) {
            setError(err.response?.data?.message || 'Uložení se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="text-2xl font-semibold text-gray-900">Nastavení profilu</h1>
            <p className="mt-1 text-sm text-gray-500">Základní údaje přihlášeného uživatele</p>

            <form onSubmit={save} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Jméno</label>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Iniciály</label>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={form.initials}
                        maxLength={8}
                        onChange={(e) => setForm((f) => ({ ...f, initials: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Pozice</label>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={form.job_title}
                        onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Dostupnost</label>
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={form.availability_status}
                        onChange={(e) => setForm((f) => ({ ...f, availability_status: e.target.value }))}
                    >
                        <option value="available">Dostupný/á</option>
                        <option value="busy">Zaneprázdněný/á</option>
                        <option value="offline">Offline</option>
                    </select>
                </div>

                {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                    {saving ? 'Ukládám…' : 'Uložit'}
                </button>
            </form>
        </div>
    );
}
