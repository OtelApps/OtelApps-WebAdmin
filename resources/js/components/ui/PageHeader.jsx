import React from 'react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({ 
    title, 
    subtitle, 
    backLabel, 
    backTo, 
    saveStatus,
    onBack,
    headerActions 
}) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backTo) {
            navigate(backTo);
        }
    };

    return (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
                {(backLabel || backTo) && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm text-gray-500 hover:text-orange-500 mb-2"
                    >
                        ← {backLabel || 'Zpět'}
                    </button>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
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
                        {saveStatus === 'error' && 'Chyba ukládání'}
                    </span>
                )}
                {headerActions && <div>{headerActions}</div>}
            </div>
        </div>
    );
}
