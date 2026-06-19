import React, { useEffect, useState } from 'react';
import http from '../../../lib/http';
import { CRM_SEGMENTS, formatDateTime, SECTION_META, TASK_PRIORITY, TASK_STATUS, TASK_TYPES } from '../crmHubConfig';
import { CrmIcon, CrmShell } from '../CrmShell';

const SEG = CRM_SEGMENTS.find((s) => s.key === 'tasks');

const EMPTY_FORM = {
    title: '',
    description: '',
    priority: 'normal',
    task_type: 'follow_up',
    assigned_staff_name: '',
    due_at: '',
};

export function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [counts, setCounts] = useState({});
    const [guestNames, setGuestNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('open');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        setError(null);
        http.get('/api/crm/tasks', { params: { status: filter } })
            .then((res) => {
                setTasks(res.data.tasks ?? []);
                setCounts(res.data.counts ?? {});
                setGuestNames(res.data.guest_names ?? {});
            })
            .catch((err) => {
                setTasks([]);
                setError(err.response?.data?.message || 'Úkoly se nepodařilo načíst. Spusť hotel_crm_extended.sql v Supabase.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [filter]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            await http.post('/api/crm/tasks', {
                ...form,
                due_at: form.due_at || null,
            });
            setForm(EMPTY_FORM);
            setShowForm(false);
            load();
        } catch (err) {
            window.alert(err.response?.data?.message || 'Vytvoření úkolu se nezdařilo.');
        } finally {
            setSaving(false);
        }
    };

    const toggleDone = async (task) => {
        const next = task.status === 'open' ? 'done' : 'open';
        try {
            await http.put(`/api/crm/tasks/${task.id}`, { status: next });
            load();
        } catch {
            window.alert('Změna stavu se nezdařila.');
        }
    };

    return (
        <CrmShell
            title={SEG.label}
            segmentKey="tasks"
            subtitle={SECTION_META.tasks.description}
            loading={loading}
            error={error}
            actions={
                <button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600"
                >
                    <CrmIcon name="add" className="text-lg" />
                    Nový úkol
                </button>
            }
        >
            <div className="mb-6 flex flex-wrap items-center gap-3">
                {[
                    { key: 'open', label: 'Otevřené', count: counts.open },
                    { key: 'done', label: 'Hotové', count: counts.done },
                    { key: 'all', label: 'Vše' },
                ].map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            filter === f.key
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {f.label}
                        {f.count != null ? ` (${f.count})` : ''}
                    </button>
                ))}
                {(counts.overdue ?? 0) > 0 && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {counts.overdue} po termínu
                    </span>
                )}
            </div>

            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="mb-6 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-600 dark:bg-gray-900/40"
                >
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Název úkolu</label>
                        <input
                            required
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Typ</label>
                            <select
                                value={form.task_type}
                                onChange={(e) => setForm((f) => ({ ...f, task_type: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                {TASK_TYPES.map((t) => (
                                    <option key={t.key} value={t.key}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Priorita</label>
                            <select
                                value={form.priority}
                                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                {Object.entries(TASK_PRIORITY).map(([key, p]) => (
                                    <option key={key} value={key}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Termín</label>
                            <input
                                type="datetime-local"
                                value={form.due_at}
                                onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Popis</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={2}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm text-gray-600">
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {saving ? 'Ukládání…' : 'Vytvořit'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600">
                        Žádné úkoly v tomto filtru.
                    </p>
                ) : (
                    tasks.map((task) => {
                        const statusMeta = TASK_STATUS[task.status] ?? TASK_STATUS.open;
                        const priorityMeta = TASK_PRIORITY[task.priority] ?? TASK_PRIORITY.normal;

                        return (
                            <div
                                key={task.id}
                                className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-800/90 ${
                                    task.is_overdue
                                        ? 'border-red-300 dark:border-red-800'
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleDone(task)}
                                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                                task.status === 'done'
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-gray-300 hover:border-orange-400'
                                            }`}
                                            aria-label={task.status === 'done' ? 'Označit jako otevřené' : 'Označit jako hotové'}
                                        >
                                            {task.status === 'done' ? <CrmIcon name="check" className="text-sm" /> : null}
                                        </button>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3
                                                    className={`font-semibold text-gray-900 dark:text-white ${
                                                        task.status === 'done' ? 'line-through opacity-60' : ''
                                                    }`}
                                                >
                                                    {task.title}
                                                </h3>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}>
                                                    {statusMeta.label}
                                                </span>
                                                <span className={`text-xs font-medium ${priorityMeta.className}`}>
                                                    {task.priority_label}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                                            )}
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                <span>{task.task_type_label}</span>
                                                {task.guest_key && (
                                                    <span>Host: {guestNames[task.guest_key] ?? task.guest_key}</span>
                                                )}
                                                {task.assigned_staff_name && <span>{task.assigned_staff_name}</span>}
                                                {task.due_at && (
                                                    <span className={task.is_overdue ? 'text-red-600' : ''}>
                                                        Termín: {formatDateTime(task.due_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </CrmShell>
    );
}
