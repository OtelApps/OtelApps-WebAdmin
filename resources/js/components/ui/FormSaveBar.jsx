import React from 'react';

/** Tlačítko Uložit pod formulářem (bez autosave při psaní). */
export function FormSaveBar({ onSave, saveStatus, label = 'Uložit', disabled = false }) {
    return (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
                type="button"
                onClick={onSave}
                disabled={disabled || saveStatus === 'saving'}
                className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-60 text-sm font-semibold"
            >
                {saveStatus === 'saving' ? 'Ukládám…' : label}
            </button>
        </div>
    );
}
