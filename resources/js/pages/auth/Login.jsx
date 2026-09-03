import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('superadmin@otelapps.test');
    const [password, setPassword] = useState('SuperAdmin');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/ukoly" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password, true);
            navigate('/ukoly', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Přihlášení se nezdařilo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <img src="/logo.png" alt="OtelApps" className="mx-auto mb-3 h-12 w-12 object-contain" />
                    <h1 className="text-2xl font-semibold text-gray-900">OtelApps</h1>
                    <p className="mt-1 text-sm text-gray-500">Přihlášení do hotelové administrace</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
                            Heslo
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                            required
                        />
                    </div>

                    {error ? (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        {loading ? 'Přihlašuji…' : 'Přihlásit se'}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Demo: superadmin@otelapps.test / SuperAdmin
                </p>
            </div>
        </div>
    );
}
