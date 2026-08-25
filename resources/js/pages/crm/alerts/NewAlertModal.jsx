import React from 'react';
import { PushAlertForm } from './PushAlertForm';

export function NewAlertModal({ isOpen, onClose, onSaved }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nové push oznámení</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Cílená zpráva podle chování hostů — jen na zařízení s aktivní app.
                    </p>
                </div>
                <div className="overflow-y-auto px-6 py-4">
                    <PushAlertForm
                        onSaved={() => {
                            onSaved?.();
                            onClose();
                        }}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
