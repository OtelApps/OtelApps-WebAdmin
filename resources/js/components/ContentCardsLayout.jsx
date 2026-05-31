import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddEntityModal } from './AddEntityModal';
import {
    canAddItem,
    canDeleteItem,
    confirmDelete,
    deleteListItem,
    editPath,
    getAddConfig,
} from '../utils/contentListActions';

export function ContentCardsLayout({
    title,
    sections,
    moduleKey,
    moduleArea,
    moduleType = 'facilities',
    headerActions,
    hideSectionTitle,
    editTab,
    onReload,
    listMeta,
}) {
    const navigate = useNavigate();
    const [hoveredCard, setHoveredCard] = useState(null);
    const [archivedState, setArchivedState] = useState({});
    const [addModal, setAddModal] = useState({ open: false, section: null });
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [addError, setAddError] = useState(null);
    const [actionError, setActionError] = useState(null);

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

    const ImageWithFallback = ({ src, alt }) => {
        const [error, setError] = useState(false);

        return (
            <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700">
                {!error && src && (
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover relative z-10"
                        onError={() => setError(true)}
                    />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-0">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            </div>
        );
    };

    const Card = ({ item, sectionId }) => (
        <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative group"
            onMouseEnter={() => setHoveredCard(`${sectionId}-${item.id}`)}
            onMouseLeave={() => setHoveredCard(null)}
        >
            <div className="relative h-48">
                <ImageWithFallback src={item.image} alt={item.title} />

                {hoveredCard === `${sectionId}-${item.id}` && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-3 transition-opacity z-20">
                        <button
                            type="button"
                            onClick={() => {
                                const target = item.edit_slug ?? item.id;
                                const hash =
                                    item.edit_slug && editTab ? `#${editTab}` : '';
                                navigate(
                                    editPath({
                                        moduleType,
                                        moduleKey,
                                        moduleArea,
                                        target,
                                        hash,
                                    })
                                );
                            }}
                            className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Edit
                        </button>
                        {showDelete && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item);
                                }}
                                className="px-6 py-2 bg-white text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                {item.list_label && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.list_label}</p>
                )}
                {item.schedule_summary && (
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                        {item.schedule_summary}
                    </span>
                )}
                {item.is_active === false && (
                    <span className="inline-block ml-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium rounded">
                        Neaktivní
                    </span>
                )}
            </div>
        </div>
    );

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
                            <Card key={`${section.id}-${item.id}`} item={item} sectionId={section.id} />
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
