import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from './../ui/PageHeader';
import { HashTabs } from './../ui/HashTabs';

export function ModuleEditLayout({
    title,
    subtitle,
    backTo,
    backLabel = 'Zpět',
    saveStatus,
    tabs = [],
    headerActions,
    onSave,
    children,
}) {
    const location = useLocation();
    const navigate = useNavigate();

    // Derived active tab
    const tabIds = tabs.map((t) => t.id);
    const hash = location.hash.replace(/^#/, '');
    const activeTab = tabIds.includes(hash) ? hash : tabIds[0] || '';

    const selectTab = (tabId) => {
        navigate({ hash: tabId }, { replace: true });
    };

    return (
        <div className="p-6">
            <PageHeader
                title={title}
                subtitle={subtitle}
                backLabel={backLabel}
                backTo={backTo}
                saveStatus={saveStatus}
                headerActions={
                    <div className="flex items-center gap-2">
                        {typeof headerActions === 'function' ? headerActions(activeTab) : headerActions}
                        {onSave && (
                            <button
                                type="button"
                                onClick={() => onSave(activeTab)}
                                className="bg-[#FFAA00] hover:bg-orange-500 text-white font-bold text-[13px] px-6 py-2 rounded-full uppercase tracking-wider transition-colors shadow-sm"
                            >
                                Save changes
                            </button>
                        )}
                    </div>
                }
            />

            {tabs.length > 0 && (
                <HashTabs tabs={tabs} activeTab={activeTab} onSelectTab={selectTab} />
            )}

            {/* Content area */}
            <div>{typeof children === 'function' ? children(activeTab) : children}</div>
        </div>
    );
}
