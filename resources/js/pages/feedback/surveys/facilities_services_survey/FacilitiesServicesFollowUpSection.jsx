import React from 'react';

export function FacilitiesServicesFollowUpSection({
    followUpEmailActive, setFollowUpEmailActive,
    followUpEmailScore, setFollowUpEmailScore,
    staffEmails, setStaffEmails,
    responseStatusActive, setResponseStatusActive,
    responseStatusScore, setResponseStatusScore
}) {
    return (
        <div className="space-y-6">
            {/* Follow-up by email card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Follow-up by email</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You can set up an email notification for your staff based on the score received.
                    </p>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => setFollowUpEmailActive(!followUpEmailActive)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${followUpEmailActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${followUpEmailActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-[15px] font-bold text-gray-700 dark:text-gray-200">
                        Send email if overall score is equal to or lower than
                    </span>
                    <div className="w-32 ml-2">
                        <select
                            disabled={!followUpEmailActive}
                            value={followUpEmailScore}
                            onChange={(e) => setFollowUpEmailScore(e.target.value)}
                            className="w-full px-3 py-2 text-[13px] rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 disabled:opacity-50 appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                        >
                            <option value="1 star">1 star</option>
                            <option value="2 stars">2 stars</option>
                            <option value="3 stars">3 stars</option>
                            <option value="4 stars">4 stars</option>
                            <option value="5 stars">5 stars</option>
                        </select>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Staff email addresses</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Enter the email addresses to which notifications will be sent. You can include a maximum of 20.
                    </p>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[120px]">
                        <button className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm transition-colors">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Add email
                        </button>
                    </div>
                </div>
            </div>

            {/* Response status automation card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Response status automation</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You can automate a response status according to the score received. You will see it updated in your survey inbox.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setResponseStatusActive(!responseStatusActive)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${responseStatusActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${responseStatusActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-[15px] font-bold text-gray-700 dark:text-gray-200">
                        Change status to Solved if overall score is equal to or higher than
                    </span>
                    <div className="w-32 ml-2">
                        <select
                            disabled={!responseStatusActive}
                            value={responseStatusScore}
                            onChange={(e) => setResponseStatusScore(e.target.value)}
                            className="w-full px-3 py-2 text-[13px] rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 disabled:opacity-50 appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                        >
                            <option value="1 star">1 star</option>
                            <option value="2 stars">2 stars</option>
                            <option value="3 stars">3 stars</option>
                            <option value="4 stars">4 stars</option>
                            <option value="5 stars">5 stars</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
