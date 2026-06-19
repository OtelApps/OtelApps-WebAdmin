import React from 'react';

export function WelcomeConfigurationSection({
    showAfterActive, setShowAfterActive,
    showAfterVal, setShowAfterVal,
    repeatInActive, setRepeatInActive,
    repeatInVal, setRepeatInVal,
    renotificationsActive, setRenotificationsActive,
    renotificationsVal, setRenotificationsVal,
    displayLayout, setDisplayLayout,
    showToAllUsers, setShowToAllUsers,
    promptSignInActive, setPromptSignInActive,
    commentFieldActive, setCommentFieldActive,
    commentFieldPos, setCommentFieldPos,
    commentFieldRequired, setCommentFieldRequired,
    addCommentActive, setAddCommentActive,
    addCommentScore, setAddCommentScore,
    addCommentRequired, setAddCommentRequired
}) {
    return (
        <div className="space-y-6">
            {/* Display options card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex gap-12">
                    {/* Left side: Heading and Toggles */}
                    <div className="flex-1 max-w-sm">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Display options on the front page</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Choose how you want to display the survey on your app front page.
                            </p>
                        </div>

                        <div className="space-y-6">
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

                {/* Right side: Layout Selection */}
                    <div className="flex-1 flex justify-center gap-[150px]">
                        {/* Top banner */}
                        <label className="cursor-pointer group flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${displayLayout === 'top-banner' ? 'border-teal-400' : 'border-gray-300'}`}>
                                    {displayLayout === 'top-banner' && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                                </div>
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 transition-colors whitespace-nowrap">Top banner</span>
                            </div>
                            <div className={`w-40 h-[17rem] rounded-xl border-2 overflow-hidden bg-slate-50 dark:bg-slate-800 transition-all ${displayLayout === 'top-banner' ? 'border-teal-200 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700'}`}>
                                <div className="w-full h-full p-2.5">
                                    <div className="w-full h-16 bg-slate-200 dark:bg-slate-700 rounded-md p-3 flex flex-col items-center justify-center gap-1.5">
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full" />)}
                                        </div>
                                        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full" />
                                        <div className="w-16 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full" />
                                    </div>
                                </div>
                                <input 
                                    type="radio" 
                                    name="layout" 
                                    value="top-banner"
                                    checked={displayLayout === 'top-banner'}
                                    onChange={() => setDisplayLayout('top-banner')}
                                    className="hidden"
                                />
                            </div>
                        </label>

                        {/* Pop-up */}
                        <label className="cursor-pointer group flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${displayLayout === 'pop-up' ? 'border-teal-400' : 'border-gray-300'}`}>
                                    {displayLayout === 'pop-up' && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                                </div>
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 transition-colors whitespace-nowrap">Pop-up</span>
                            </div>
                            <div className={`w-40 h-[17rem] rounded-xl border-2 overflow-hidden bg-slate-50 dark:bg-slate-800 transition-all flex items-center justify-center ${displayLayout === 'pop-up' ? 'border-teal-200 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700'}`}>
                                <div className="w-20 h-28 bg-slate-200 dark:bg-slate-700 rounded-md p-3 flex flex-col items-center gap-2 mt-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-500 flex items-center justify-center -mt-6 outline outline-4 outline-slate-50 dark:outline-slate-800">
                                        <div className="w-5 h-3 bg-slate-400 dark:bg-slate-400 rounded-sm" />
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full mt-1.5" />
                                    <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full" />
                                    <div className="w-12 h-4 bg-slate-300 dark:bg-slate-500 rounded-full mt-1.5" />
                                </div>
                                <input 
                                    type="radio" 
                                    name="layout" 
                                    value="pop-up"
                                    checked={displayLayout === 'pop-up'}
                                    onChange={() => setDisplayLayout('pop-up')}
                                    className="hidden"
                                />
                            </div>
                        </label>

                        {/* Full screen */}
                        <label className="cursor-pointer group flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${displayLayout === 'full-screen' ? 'border-teal-400' : 'border-gray-300'}`}>
                                    {displayLayout === 'full-screen' && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                                </div>
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 transition-colors whitespace-nowrap">Full screen</span>
                            </div>
                            <div className={`w-40 h-[17rem] rounded-xl border-2 overflow-hidden bg-slate-50 dark:bg-slate-800 transition-all flex flex-col p-3 gap-3 ${displayLayout === 'full-screen' ? 'border-teal-200 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700'}`}>
                                <div className="w-full flex-1 bg-slate-200 dark:bg-slate-700 rounded-md p-3 flex flex-col items-center justify-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-500 flex items-center justify-center">
                                        <div className="w-5 h-3 bg-slate-400 dark:bg-slate-400 rounded-sm" />
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                <div className="w-full h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                <input 
                                    type="radio" 
                                    name="layout" 
                                    value="full-screen"
                                    checked={displayLayout === 'full-screen'}
                                    onChange={() => setDisplayLayout('full-screen')}
                                    className="hidden"
                                />
                            </div>
                        </label>
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

                <div className="flex items-center gap-3">
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
