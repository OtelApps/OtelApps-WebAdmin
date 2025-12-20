import React, { useState } from 'react';

/**
 * Příklad React komponenty
 * Tato komponenta demonstruje základní použití Reactu v aplikaci
 */
export function ExampleComponent() {
    const [count, setCount] = useState(0);
    const [message, setMessage] = useState('');

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
                React Komponenta Příklad
            </h2>
            
            <div className="mb-4">
                <p className="text-gray-600 mb-2">
                    Počet kliknutí: <span className="font-bold text-orange-500">{count}</span>
                </p>
                <button
                    onClick={() => setCount(count + 1)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Zvýšit počet
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Napište zprávu..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {message && (
                    <p className="mt-2 text-gray-700">
                        Vaše zpráva: <strong>{message}</strong>
                    </p>
                )}
            </div>
        </div>
    );
}

