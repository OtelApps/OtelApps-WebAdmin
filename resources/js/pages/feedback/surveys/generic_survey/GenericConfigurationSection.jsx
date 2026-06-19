import React from 'react';

export function GenericConfigurationSection({
    showAfterActive, setShowAfterActive,
    showAfterVal, setShowAfterVal,
    repeatInActive, setRepeatInActive,
    repeatInVal, setRepeatInVal,
    renotificationsActive, setRenotificationsActive,
    renotificationsVal, setRenotificationsVal,
    showToAllUsers, setShowToAllUsers,
    promptSignInActive, setPromptSignInActive,
    promptSignInRequired, setPromptSignInRequired,
    commentFieldActive, setCommentFieldActive,
    commentFieldPos, setCommentFieldPos,
    commentFieldRequired, setCommentFieldRequired,
    addCommentActive, setAddCommentActive,
    addCommentScore, setAddCommentScore,
    addCommentRequired, setAddCommentRequired
}) {
    return (
        <div className="space-y-6">
            {/* Front page display card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex gap-12 items-stretch">
                    <div className="flex-1 max-w-sm py-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Front page display</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            By default, this survey is displayed in a bottom banner and it's visible to the user at all times (except when scrolling).
                        </p>

                        <div className="space-y-6 mt-8 max-w-sm">
                            {/* Toggle 1 */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowAfterActive(!showAfterActive)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${showAfterActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAfterActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className={`text-sm font-medium ${showAfterActive ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                        Once signed in, show after
                                    </span>
                                </div>
                                <div className="w-24 shrink-0">
                                    <select
                                        disabled={!showAfterActive}
                                        value={showAfterVal}
                                        onChange={(e) => setShowAfterVal(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                                    >
                                        <option value="0 min.">0 min.</option>
                                        <option value="5 min.">5 min.</option>
                                        <option value="10 min.">10 min.</option>
                                    </select>
                                </div>
                            </div>

                            {/* Toggle 2 */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setRepeatInActive(!repeatInActive)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${repeatInActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${repeatInActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className={`text-sm font-medium ${repeatInActive ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                        After first notification, repeat in
                                    </span>
                                </div>
                                <div className="w-24 shrink-0">
                                    <select
                                        disabled={!repeatInActive}
                                        value={repeatInVal}
                                        onChange={(e) => setRepeatInVal(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                                    >
                                        <option value="0 min.">0 min.</option>
                                        <option value="1 hour">1 hour</option>
                                        <option value="1 day">1 day</option>
                                    </select>
                                </div>
                            </div>

                            {/* Toggle 3 */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setRenotificationsActive(!renotificationsActive)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${renotificationsActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${renotificationsActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className={`text-sm font-medium ${renotificationsActive ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                        Re-notifications
                                    </span>
                                </div>
                                <div className="w-24 shrink-0">
                                    <select
                                        disabled={!renotificationsActive}
                                        value={renotificationsVal}
                                        onChange={(e) => setRenotificationsVal(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                                    >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center gap-[150px]">
                        <div className="w-40 hidden md:block invisible pointer-events-none" />
                        <div className="w-40 hidden md:block invisible pointer-events-none" />
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-3 invisible pointer-events-none">
                                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"></div>
                                <span className="text-sm font-bold whitespace-nowrap">Placeholder</span>
                            </div>
                            <div className="w-[160px] h-[17rem] rounded-[14px] border border-gray-100 dark:border-gray-700 bg-[#F1F5F9] dark:bg-slate-800 flex flex-col justify-end p-3 shrink-0 shadow-sm">
                                <div className="w-full h-14 bg-[#CBD5E1] dark:bg-slate-700 rounded-md flex flex-col items-center justify-center gap-1.5">
                                    <div className="w-10 h-[4px] bg-white rounded-full opacity-60" />
                                    <div className="flex gap-1.5">
                                        {[1,2,3,4,5].map(i => <div key={i} className="w-[6px] h-[6px] bg-white rounded-full opacity-60" />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Survey recipients card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Survey recipients</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You can define whether you show the survey to all users or only to signed-in users of the platform.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 mb-8">
                    <button 
                        onClick={() => setShowToAllUsers(!showToAllUsers)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${showToAllUsers ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showToAllUsers ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="font-bold text-gray-700 dark:text-gray-200">
                        Show survey to all users
                    </span>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Prompt to sign in</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Choose if your want to include a sign-in screen during the survey.
                    </p>
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <button 
                            onClick={() => setPromptSignInActive(!promptSignInActive)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${promptSignInActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promptSignInActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className="font-bold text-gray-700 dark:text-gray-200">
                            Activated
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-6 ml-[3.25rem]">
                        <label className={`flex items-center gap-2 cursor-pointer ${!promptSignInActive && 'opacity-50 pointer-events-none'}`}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${promptSignInRequired === 'Required field' ? 'border-gray-400' : 'border-gray-200'}`}>
                                {promptSignInRequired === 'Required field' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                            </div>
                            <span className="text-sm font-medium text-gray-400">Required field</span>
                            <input type="radio" className="hidden" checked={promptSignInRequired === 'Required field'} onChange={() => setPromptSignInRequired('Required field')} />
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer ${!promptSignInActive && 'opacity-50 pointer-events-none'}`}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${promptSignInRequired === 'Optional' ? 'border-gray-400' : 'border-gray-200'}`}>
                                {promptSignInRequired === 'Optional' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                            </div>
                            <span className="text-sm font-medium text-gray-400">Optional</span>
                            <input type="radio" className="hidden" checked={promptSignInRequired === 'Optional'} onChange={() => setPromptSignInRequired('Optional')} />
                        </label>
                    </div>
                </div>
            </div>
            {/* Comments card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Comments</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Set whether your want to allow users to add comments.
                    </p>
                </div>
                
                <div className="space-y-8">
                    {/* Toggle 1 */}
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <button 
                                onClick={() => setCommentFieldActive(!commentFieldActive)}
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${commentFieldActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${commentFieldActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-[15px] font-bold text-gray-700 dark:text-gray-200">
                                Comment field for each question
                            </span>
                            <div className="w-48 ml-2">
                                <select
                                    disabled={!commentFieldActive}
                                    value={commentFieldPos}
                                    onChange={(e) => setCommentFieldPos(e.target.value)}
                                    className="w-full px-3 py-2 text-[13px] rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 disabled:opacity-50 appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                                >
                                    <option value="after star rating">after star rating</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 ml-[3.75rem]">
                            <label className={`flex items-center gap-2 cursor-pointer ${!commentFieldActive && 'opacity-50 pointer-events-none'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${commentFieldRequired === 'Required field' ? 'border-gray-400' : 'border-gray-200'}`}>
                                    {commentFieldRequired === 'Required field' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                                </div>
                                <span className="text-sm font-medium text-gray-400">Required field</span>
                                <input type="radio" className="hidden" checked={commentFieldRequired === 'Required field'} onChange={() => setCommentFieldRequired('Required field')} />
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer ${!commentFieldActive && 'opacity-50 pointer-events-none'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${commentFieldRequired === 'Optional' ? 'border-gray-400' : 'border-gray-200'}`}>
                                    {commentFieldRequired === 'Optional' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                                </div>
                                <span className="text-sm font-medium text-gray-400">Optional</span>
                                <input type="radio" className="hidden" checked={commentFieldRequired === 'Optional'} onChange={() => setCommentFieldRequired('Optional')} />
                            </label>
                        </div>
                    </div>

                    {/* Toggle 2 */}
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <button 
                                onClick={() => setAddCommentActive(!addCommentActive)}
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${addCommentActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addCommentActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-[15px] font-bold text-gray-700 dark:text-gray-200">
                                Additional comment field if score is equal to or lower than
                            </span>
                            <div className="w-32 ml-2">
                                <select
                                    disabled={!addCommentActive}
                                    value={addCommentScore}
                                    onChange={(e) => setAddCommentScore(e.target.value)}
                                    className="w-full px-3 py-2 text-[13px] rounded border border-gray-200 dark:border-gray-600 outline-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 disabled:opacity-50 appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                                >
                                    <option value="1 star">1 star</option>
                                    <option value="2 stars">2 stars</option>
                                    <option value="3 stars">3 stars</option>
                                    <option value="4 stars">4 stars</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 ml-[3.75rem]">
                            <label className={`flex items-center gap-2 cursor-pointer ${!addCommentActive && 'opacity-50 pointer-events-none'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${addCommentRequired === 'Required field' ? 'border-gray-400' : 'border-gray-200'}`}>
                                    {addCommentRequired === 'Required field' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                                </div>
                                <span className="text-sm font-medium text-gray-400">Required field</span>
                                <input type="radio" className="hidden" checked={addCommentRequired === 'Required field'} onChange={() => setAddCommentRequired('Required field')} />
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer ${!addCommentActive && 'opacity-50 pointer-events-none'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${addCommentRequired === 'Optional' ? 'border-gray-400' : 'border-gray-200'}`}>
                                    {addCommentRequired === 'Optional' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                                </div>
                                <span className="text-sm font-medium text-gray-400">Optional</span>
                                <input type="radio" className="hidden" checked={addCommentRequired === 'Optional'} onChange={() => setAddCommentRequired('Optional')} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
