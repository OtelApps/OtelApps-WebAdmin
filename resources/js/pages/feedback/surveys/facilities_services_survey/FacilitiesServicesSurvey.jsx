import React, { useState } from 'react';
import { FacilitiesServicesQuestionsSection } from './FacilitiesServicesQuestionsSection';
import { FacilitiesServicesConfigurationSection } from './FacilitiesServicesConfigurationSection';
import { FacilitiesServicesFollowUpSection } from './FacilitiesServicesFollowUpSection';

export function FacilitiesServicesSurvey({ title, onBack }) {
    const [activeTab, setActiveTab] = useState('questions');
    const [isActive, setIsActive] = useState(false);
    
    // Questions state
    const [surveyTitle, setSurveyTitle] = useState('You recently visited our restaurant.');
    const [subtitle, setSubtitle] = useState('Your opinion is important for us!');
    const [questions, setQuestions] = useState([
        { id: 1, text: 'How was your experience?', category: 'Overall assessment' },
        { id: 2, text: 'How would you rate the quality and variety of food and drinks options?', category: 'Food & Beverage' },
        { id: 3, text: 'How would you rate the quality of the provided service?', category: 'Service' },
        { id: 4, text: 'How would you rate the value for money of the service?', category: 'Value for money' }
    ]);

    const [thankYouMessages, setThankYouMessages] = useState([
        { score: 1, text: "Oh! We're sorry to hear that your experience did not go as expected. We take note to continue improving our services. Our..." },
        { score: 2, text: "Oh! We're sorry to hear that your experience did not go as expected. We take note to continue improving our services. Our..." },
        { score: 3, text: "We really appreciate your feedback, it helps us to keep improving. We hope to see you soon." },
        { score: 4, text: "We are glad you enjoyed our service. We will keep working to offer you an even better experience on your next visit." },
        { score: 5, text: "We are thrilled you had a great experience with us. We hope to see you again soon!" }
    ]);

    // Configuration state (mocked for now, reusing Generic)
    const [showAfterActive, setShowAfterActive] = useState(true);
    const [showAfterVal, setShowAfterVal] = useState('0 min.');
    const [repeatInActive, setRepeatInActive] = useState(true);
    const [repeatInVal, setRepeatInVal] = useState('0 min.');
    const [renotificationsActive, setRenotificationsActive] = useState(false);
    const [renotificationsVal, setRenotificationsVal] = useState('3');
    const [displayLayout, setDisplayLayout] = useState('pop-up'); // 'top-banner', 'pop-up', 'full-screen'
    const [showToAllUsers, setShowToAllUsers] = useState(true);
    const [promptSignInActive, setPromptSignInActive] = useState(false);
    const [promptSignInRequired, setPromptSignInRequired] = useState(false);
    const [commentFieldActive, setCommentFieldActive] = useState(false);
    const [commentFieldPos, setCommentFieldPos] = useState('after star rating');
    const [commentFieldRequired, setCommentFieldRequired] = useState('Optional');
    const [addCommentActive, setAddCommentActive] = useState(false);
    const [addCommentScore, setAddCommentScore] = useState('3 stars');
    const [addCommentRequired, setAddCommentRequired] = useState('Optional');
    const [proactiveModeActive, setProactiveModeActive] = useState(false);

    // Follow-up state (mocked)
    const [followUpEmailActive, setFollowUpEmailActive] = useState(false);
    const [followUpEmailScore, setFollowUpEmailScore] = useState('5 stars');
    const [staffEmails, setStaffEmails] = useState([]);
    const [responseStatusActive, setResponseStatusActive] = useState(false);
    const [responseStatusScore, setResponseStatusScore] = useState('5 stars');

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/30 transition-colors text-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    HELP
                </button>
            </div>

            {/* Navigation and Toggle */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 mb-8">
                <div className="flex gap-6">
                    {['questions', 'configuration', 'follow-up'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-2 py-4 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                                activeTab === tab
                                    ? 'border-teal-500 text-gray-900 dark:text-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isActive ? 'Activated' : 'Deactivated'}
                    </span>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'questions' && (
                <FacilitiesServicesQuestionsSection 
                    title={surveyTitle} setTitle={setSurveyTitle}
                    subtitle={subtitle} setSubtitle={setSubtitle}
                    questions={questions} setQuestions={setQuestions}
                    thankYouMessages={thankYouMessages} setThankYouMessages={setThankYouMessages}
                />
            )}

            {activeTab === 'configuration' && (
                <FacilitiesServicesConfigurationSection 
                    showAfterActive={showAfterActive} setShowAfterActive={setShowAfterActive}
                    showAfterVal={showAfterVal} setShowAfterVal={setShowAfterVal}
                    repeatInActive={repeatInActive} setRepeatInActive={setRepeatInActive}
                    repeatInVal={repeatInVal} setRepeatInVal={setRepeatInVal}
                    renotificationsActive={renotificationsActive} setRenotificationsActive={setRenotificationsActive}
                    renotificationsVal={renotificationsVal} setRenotificationsVal={setRenotificationsVal}
                    displayLayout={displayLayout} setDisplayLayout={setDisplayLayout}
                    showToAllUsers={showToAllUsers} setShowToAllUsers={setShowToAllUsers}
                    promptSignInActive={promptSignInActive} setPromptSignInActive={setPromptSignInActive}
                    promptSignInRequired={promptSignInRequired} setPromptSignInRequired={setPromptSignInRequired}
                    commentFieldActive={commentFieldActive} setCommentFieldActive={setCommentFieldActive}
                    commentFieldPos={commentFieldPos} setCommentFieldPos={setCommentFieldPos}
                    commentFieldRequired={commentFieldRequired} setCommentFieldRequired={setCommentFieldRequired}
                    addCommentActive={addCommentActive} setAddCommentActive={setAddCommentActive}
                    addCommentScore={addCommentScore} setAddCommentScore={setAddCommentScore}
                    addCommentRequired={addCommentRequired} setAddCommentRequired={setAddCommentRequired}
                    proactiveModeActive={proactiveModeActive} setProactiveModeActive={setProactiveModeActive}
                />
            )}

            {activeTab === 'follow-up' && (
                <FacilitiesServicesFollowUpSection 
                    followUpEmailActive={followUpEmailActive} setFollowUpEmailActive={setFollowUpEmailActive}
                    followUpEmailScore={followUpEmailScore} setFollowUpEmailScore={setFollowUpEmailScore}
                    staffEmails={staffEmails} setStaffEmails={setStaffEmails}
                    responseStatusActive={responseStatusActive} setResponseStatusActive={setResponseStatusActive}
                    responseStatusScore={responseStatusScore} setResponseStatusScore={setResponseStatusScore}
                />
            )}
        </div>
    );
}
