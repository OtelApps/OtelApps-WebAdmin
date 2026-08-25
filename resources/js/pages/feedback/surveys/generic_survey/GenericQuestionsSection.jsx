import React from 'react';

const CATEGORIES = [
    'Overall assessment',
    'Decoration',
    'Entertainment',
    'Facilities',
    'Food',
    'Food & Beverage',
    'Front desk',
    'Location',
    'Service',
    'Staff'
];

export function GenericQuestionsSection({
    title, setTitle,
    subtitle, setSubtitle,
    questions, setQuestions,
    thankYouMessages, setThankYouMessages
}) {
    const updateThankYouMessage = (score, text) => {
        setThankYouMessages(msgs => msgs.map(m => m.score === score ? { ...m, text } : m));
    };

    const addQuestion = () => {
        if (questions.length >= 7) return;
        setQuestions([
            ...questions,
            { id: Date.now(), text: '', category: CATEGORIES[0] }
        ]);
    };

    const removeQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Questionnaire</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create questions for your survey and associate a category to each one. You can add a maximum of 7 questions per survey.
                    </p>
                </div>

                {/* Title and Subtitle */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
                            <div className="flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-600">
                                <span className="material-symbols-outlined text-gray-400 text-[20px]">flag</span>
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 px-4 py-2.5 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subtitle</label>
                        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
                            <div className="flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-600">
                                <span className="material-symbols-outlined text-gray-400 text-[20px]">flag</span>
                            </div>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                className="flex-1 px-4 py-2.5 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Questions</h3>
                    <div className="space-y-4">
                        {questions.map((q) => (
                            <div key={q.id} className="flex gap-4 items-start">
                                <div className="flex-1 flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
                                    <div className="flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-600">
                                        <span className="material-symbols-outlined text-gray-400 text-[20px]">flag</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={q.text}
                                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                        className="flex-1 px-4 py-2.5 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="w-64">
                                    <select
                                        value={q.category}
                                        onChange={(e) => updateQuestion(q.id, 'category', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-purple-900/50 outline-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    onClick={() => removeQuestion(q.id)}
                                    className="p-2.5 text-blue-300 hover:text-red-500 transition-colors mt-0.5"
                                >
                                    <span className="material-symbols-outlined text-[22px]">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {questions.length < 7 && (
                        <button 
                            onClick={addQuestion}
                            className="mt-6 flex items-center gap-2 text-blue-400 hover:text-blue-500 font-medium text-sm transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Add question
                        </button>
                    )}
                </div>
            </div>

            {/* Thank-you messages card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Thank-you messages</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You can add a thank-you message to appear after completing a survey and customize it according to the score received.
                    </p>
                </div>
                <div className="space-y-4">
                    {thankYouMessages.map(msg => (
                        <div key={msg.score} className="flex gap-4 items-center">
                            <div className="flex items-center justify-between w-28 shrink-0">
                                <span className="font-bold text-gray-900 dark:text-white">{msg.score}</span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <svg key={star} className={`w-4 h-4 ${star <= msg.score ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
                                <div className="flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-600">
                                    <span className="material-symbols-outlined text-gray-400 text-[20px]">flag</span>
                                </div>
                                <input
                                    type="text"
                                    value={msg.text}
                                    onChange={(e) => updateThankYouMessage(msg.score, e.target.value)}
                                    className="flex-1 px-4 py-2.5 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
