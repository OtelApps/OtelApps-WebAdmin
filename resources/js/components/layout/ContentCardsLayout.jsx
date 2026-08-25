import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddEntityModal } from '../ui/AddEntityModal';
import {
    canAddItem,
    canDeleteItem,
    confirmDelete,
    deleteListItem,
    editPath,
    getAddConfig,
} from '../../utils/contentListActions';
import { ContentCard } from '../ui/ContentCard';
import { ContentListSkeleton, PageLoadError } from '../ui/PageSkeleton';

export function ContentCardsLayout({
    title,
    sections = [],
    moduleKey,
    moduleArea,
    moduleType = 'facilities',
    headerActions,
    hideSectionTitle,
    editTab,
    onReload,
    listMeta,
    loading = false,
    error = null,
    onRetry,
}) {
    const navigate = useNavigate();
    const [archivedState, setArchivedState] = useState({});
    const [addModal, setAddModal] = useState({ open: false, section: null });
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [addError, setAddError] = useState(null);
    const [actionError, setActionError] = useState(null);

    if (loading) {
        return <ContentListSkeleton title={title} />;
    }

    if (error) {
        return <PageLoadError message={error} onRetry={onRetry || onReload} />;
    }

    const showAdd = canAddItem(moduleKey) && onReload;
    const showDelete = canDeleteItem(moduleKey) && onReload;

    const meta = {
        ...listMeta,
        area: moduleArea ?? listMeta?.area,
    };

    const toggleArchived = (sectionId) => {
        setArchivedState((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const handleAddClick = (section) => {
        const config = getAddConfig(moduleKey, section, meta);
        if (!config) {
            const parentSlug = meta?.parentSlug;
            if (parentSlug && editTab) {
                navigate(editPath({
                    moduleType,
                    moduleKey,
                    moduleArea,
                    target: parentSlug,
                    hash: `#${editTab}`,
                }));
            }
            return;
        }
        setAddError(null);
        setAddModal({ open: true, section });
    };

    const handleAddSubmit = async (values) => {
        const config = getAddConfig(moduleKey, addModal.section, meta);
        if (!config) {
            return;
        }
        setAddSubmitting(true);
        setAddError(null);
        try {
            const newSlug = await config.submit(values, { section: addModal.section, meta });
            setAddModal({ open: false, section: null });
            if (onReload) {
                await onReload();
            }
            if (newSlug) {
                navigate(
                    editPath({
                        moduleType,
                        moduleKey,
                        moduleArea,
                        target: newSlug,
                        hash: editTab ? `#${editTab}` : '',
                    })
                );
            }
        } catch (err) {
            const message =
                err.response?.data?.message ||
                (err.response?.data?.errors
                    ? Object.values(err.response.data.errors).flat().join(' ')
                    : null) ||
                err.message ||
                'Nepodařilo se přidat položku.';
            setAddError(message);
        } finally {
            setAddSubmitting(false);
        }
    };

    const handleDelete = async (item) => {
        if (!confirmDelete(item.title)) {
            return;
        }
        setActionError(null);
        try {
            await deleteListItem({
                moduleKey,
                moduleType,
                moduleArea,
                item,
                meta,
            });
            if (onReload) {
                await onReload();
            }
        } catch (err) {
            const message =
                err.response?.data?.message || err.message || 'Nepodařilo se smazat položku.';
            setActionError(message);
        }
    };

    const addConfig = addModal.open ? getAddConfig(moduleKey, addModal.section, meta) : null;

    const handleEdit = (item) => {
        const target = item.edit_slug ?? item.id;
        const hash = editTab ? `#${editTab}` : '';
        navigate(
            editPath({
                moduleType,
                moduleKey,
                moduleArea,
                target,
                hash,
            })
        );
    };

    return (
        <div className="p-6">
            {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                    {actionError}
                    <button
                        type="button"
                        onClick={() => setActionError(null)}
                        className="ml-3 underline"
                    >
                        Zavřít
                    </button>
                </div>
            )}

            {sections.map((section) => (
                <div key={section.id} className="mb-12 last:mb-0">
                    <div className="flex items-center justify-between mb-4 gap-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {hideSectionTitle ? title : section.title}
                        </h2>
                        <div className="flex items-center gap-3 shrink-0">
                            {headerActions}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleArchived(section.id);
                                }}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white whitespace-nowrap"
                            >
                                {archivedState[section.id]
                                    ? 'Hide archived services'
                                    : 'Show archived services'}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        {showAdd && (
                            <button
                                type="button"
                                onClick={() => handleAddClick(section)}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                            >
                                + ADD
                            </button>
                        )}
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            HELP
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                            Preview
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.items.map((item) => (
                            <ContentCard 
                                key={`${section.id}-${item.id}`} 
                                title={item.title}
                                subtitle={item.list_label}
                                image={item.image}
                                scheduleSummary={item.schedule_summary}
                                isActive={item.is_active}
                                onEdit={() => handleEdit(item)}
                                onDelete={showDelete ? () => handleDelete(item) : undefined}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {addConfig && (
                <AddEntityModal
                    open={addModal.open}
                    title={addConfig.modalTitle}
                    fields={addConfig.fields}
                    onClose={() => {
                        if (!addSubmitting) {
                            setAddModal({ open: false, section: null });
                            setAddError(null);
                        }
                    }}
                    onSubmit={handleAddSubmit}
                    submitting={addSubmitting}
                    error={addError}
                />
            )}
        </div>
    );
}
