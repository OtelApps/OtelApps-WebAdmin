import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import http from '../../lib/http';
import { useAuth } from '../../context/AuthContext';

export function UserAdmin() {
    const { hasPermission } = useAuth();
    const [types, setTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [permGroups, setPermGroups] = useState({});
    const [groupLabels, setGroupLabels] = useState({});
    const [selectedId, setSelectedId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const canManage = hasPermission('users.manage_types');

    const load = async () => {
        const [permRes, typesRes, usersRes] = await Promise.all([
            http.get('/api/admin/permissions'),
            http.get('/api/admin/user-types'),
            http.get('/api/admin/users'),
        ]);
        setPermGroups(permRes.data.groups || {});
        setGroupLabels(permRes.data.group_labels || {});
        setTypes(typesRes.data.user_types || []);
        setUsers(usersRes.data.users || []);
        if (!selectedId && typesRes.data.user_types?.[0]) {
            setSelectedId(typesRes.data.user_types[0].id);
        }
    };

    useEffect(() => {
        if (!canManage) return;
        load().catch((err) => setError(err.response?.data?.message || 'Načtení selhalo.'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage]);

    const selected = useMemo(
        () => types.find((t) => t.id === selectedId) || null,
        [types, selectedId],
    );

    useEffect(() => {
        if (selected) {
            setDraft({
                name: selected.name,
                description: selected.description || '',
                badge_label: selected.badge_label || '',
                color: selected.color || '#64748b',
                permission_keys: [...(selected.permission_keys || [])],
            });
        } else {
            setDraft(null);
        }
    }, [selected]);

    if (!canManage) {
        return <Navigate to="/dashboard" replace />;
    }

    const togglePerm = (key) => {
        if (!draft || selected?.slug === 'superadmin') return;
        setDraft((d) => {
            const has = d.permission_keys.includes(key);
            return {
                ...d,
                permission_keys: has
                    ? d.permission_keys.filter((k) => k !== key)
                    : [...d.permission_keys, key],
            };
        });
    };

    const saveType = async () => {
        if (!draft || !selected) return;
        setSaving(true);
        setError('');
        try {
            const { data } = await http.put(`/api/admin/user-types/${selected.id}`, draft);
            setTypes((prev) => prev.map((t) => (t.id === selected.id ? data.user_type : t)));
        } catch (err) {
            setError(err.response?.data?.message || 'Uložení typu selhalo.');
        } finally {
            setSaving(false);
        }
    };

    const createType = async () => {
        const name = window.prompt('Název nového typu uživatele');
        if (!name) return;
        setSaving(true);
        setError('');
        try {
            const { data } = await http.post('/api/admin/user-types', {
                name,
                permission_keys: ['modules.ukoly.view', 'tickets.claim', 'tickets.close'],
            });
            setTypes((prev) => [...prev, data.user_type]);
            setSelectedId(data.user_type.id);
        } catch (err) {
            setError(err.response?.data?.message || 'Vytvoření selhalo.');
        } finally {
            setSaving(false);
        }
    };

    const deleteType = async () => {
        if (!selected || selected.is_system) return;
        if (!window.confirm(`Smazat typ „${selected.name}“?`)) return;
        try {
            await http.delete(`/api/admin/user-types/${selected.id}`);
            setTypes((prev) => prev.filter((t) => t.id !== selected.id));
            setSelectedId(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Smazání selhalo.');
        }
    };

    const updateUserType = async (userId, userTypeId) => {
        await http.put(`/api/admin/users/${userId}`, { user_type_id: Number(userTypeId) || null });
        await load();
    };

    return (
        <div className="mx-auto max-w-6xl p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Typy uživatelů</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Pojmenujte role a nastavte práva k modulům, frontám a akcím tiketů
                    </p>
                </div>
                <button
                    type="button"
                    onClick={createType}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    Nový typ
                </button>
            </div>

            {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <div className="rounded-xl border border-gray-200 bg-white">
                    {types.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedId(t.id)}
                            className={`flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left text-sm last:border-0 ${
                                selectedId === t.id ? 'bg-orange-50 text-orange-800' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span>
                                <span className="block font-medium">{t.name}</span>
                                <span className="block text-[11px] text-gray-400">{t.slug}</span>
                            </span>
                            <span className="text-xs text-gray-400">{t.users_count}</span>
                        </button>
                    ))}
                </div>

                {draft && selected ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Název</label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={draft.name}
                                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Badge</label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={draft.badge_label}
                                    onChange={(e) => setDraft((d) => ({ ...d, badge_label: e.target.value }))}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-medium text-gray-500">Popis</label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={draft.description}
                                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        {selected.slug === 'superadmin' ? (
                            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                Superadmin má automaticky všechna práva.
                            </p>
                        ) : (
                            <div className="mt-6 space-y-5">
                                {Object.entries(permGroups).map(([group, perms]) => (
                                    <div key={group}>
                                        <h3 className="mb-2 text-sm font-semibold text-gray-800">
                                            {groupLabels[group] || group}
                                        </h3>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {perms.map((p) => (
                                                <label
                                                    key={p.key}
                                                    className="flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="mt-0.5"
                                                        checked={draft.permission_keys.includes(p.key)}
                                                        onChange={() => togglePerm(p.key)}
                                                    />
                                                    <span>
                                                        <span className="block font-medium text-gray-800">{p.label}</span>
                                                        <span className="block text-[11px] text-gray-400">{p.key}</span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={saveType}
                                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                Uložit typ
                            </button>
                            {!selected.is_system ? (
                                <button
                                    type="button"
                                    onClick={deleteType}
                                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    Smazat
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-5 py-3">
                    <h2 className="text-sm font-semibold text-gray-900">Uživatelé</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {users.map((u) => (
                        <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                                {u.initials}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                                <p className="truncate text-xs text-gray-500">{u.email}</p>
                            </div>
                            <select
                                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                                value={u.user_type_id || ''}
                                onChange={(e) => updateUserType(u.id, e.target.value)}
                            >
                                <option value="">— typ —</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
