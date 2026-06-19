import React, { useState } from 'react';

const SortIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ThumbsUpIcon = () => (
    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
        </svg>
    </div>
);

const SelectInput = ({ value, options, className = '' }) => (
    <select 
        value={value}
        onChange={() => {}}
        className={`px-3 py-1.5 text-sm rounded border border-gray-200 outline-none text-gray-700 bg-white appearance-none cursor-pointer ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
    >
        {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
);

const MOCK_RESPONSES = [
    {
        id: 1,
        surveyType: 'Generic',
        score: '5.0',
        guest: 'Anonymous user',
        date: '17/05/2024',
        time: '15:34',
        fullDate: 'Friday, 17/05/2024 - 15:34',
        status: 'New',
        survey: 'Generic survey',
        service: 'Room service'
    },
    {
        id: 2,
        surveyType: 'Generic',
        score: '5.0',
        guest: 'Anonymous user',
        date: '02/05/2024',
        time: '07:56',
        fullDate: 'Thursday, 02/05/2024 - 07:56',
        status: 'New',
        survey: 'Generic survey',
        service: 'Maintenance & repairs'
    }
];

const ResponseDetailsModal = ({ response, onClose }) => {
    if (!response) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#2D2A3E] px-6 py-4 flex justify-between items-center text-white relative">
                    <h2 className="text-sm font-bold tracking-widest text-center w-full uppercase">Response Details</h2>
                    <button onClick={onClose} className="absolute right-6 text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
                    {/* Left Column */}
                    <div className="w-full md:w-1/2 p-8 border-r border-gray-100 flex flex-col">
                        <div className="flex gap-6 border-b border-gray-200 mb-8">
                            <button className="pb-2 border-b-2 border-[#3ebcb1] font-bold text-gray-800 text-sm">Guest</button>
                            <button className="pb-2 text-gray-500 font-semibold hover:text-gray-700 text-sm transition-colors">Response</button>
                        </div>

                        <div className="mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{response.guest}</h3>
                        </div>
                        
                        <p className="text-sm text-gray-500 font-semibold mb-4">{response.survey}</p>

                        <div className="flex items-center gap-4 mb-10">
                            <span className="text-4xl font-bold text-gray-800">{response.score}</span>
                            <div>
                                <div className="text-yellow-400 text-sm tracking-widest mb-1">★★★★★</div>
                                <div className="text-[11px] text-gray-400 font-semibold">{response.fullDate}</div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <h4 className="font-bold text-gray-800 mb-1 text-sm">Status</h4>
                            <p className="text-xs text-gray-400 mb-4">Select an option to describe the current status of a response</p>
                            
                            <div className="flex flex-wrap gap-3">
                                <button className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-colors ${response.status === 'New' ? 'bg-[#EAE8F3] border-[#EAE8F3] text-[#4a3b52]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <div className="w-3 h-3 rounded-full bg-[#8A63D2]"></div> New
                                </button>
                                <button className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-colors ${response.status === 'Pending' ? 'bg-[#EAE8F3] border-[#EAE8F3] text-[#4a3b52]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <div className="w-3 h-3 rounded-full bg-pink-400"></div> Pending
                                </button>
                                <button className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-colors ${response.status === 'In progress' ? 'bg-[#EAE8F3] border-[#EAE8F3] text-[#4a3b52]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div> In progress
                                </button>
                                <button className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-colors ${response.status === 'Solved' ? 'bg-[#EAE8F3] border-[#EAE8F3] text-[#4a3b52]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <div className="w-3 h-3 rounded-full bg-[#3ebcb1]"></div> Solved
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col bg-gray-50/50">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="font-bold text-gray-600 mt-2">Send a message to the customer</h3>
                            <button className="bg-[#8A63D2] hover:bg-[#7a57bc] text-white px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors shadow-sm">
                                ADD REQUEST
                            </button>
                        </div>

                        <div className="flex-1 min-h-[150px] mb-6">
                            {/* Empty space for chat messages */}
                        </div>

                        <div className="mt-auto">
                            <textarea 
                                className="w-full h-28 p-4 border border-gray-200 rounded-lg text-sm outline-none resize-none placeholder-gray-400 focus:border-[#8A63D2] focus:ring-1 focus:ring-[#8A63D2] transition-all mb-4 bg-white shadow-sm"
                                placeholder="Type here..."
                            ></textarea>

                            <div className="flex justify-end gap-3">
                                <button onClick={onClose} className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-500 font-bold text-[11px] uppercase tracking-wider hover:bg-white hover:text-gray-700 transition-colors bg-transparent">
                                    CANCEL
                                </button>
                                <button className="px-6 py-2.5 rounded-full bg-[#D1C6E8] text-white font-bold text-[11px] uppercase tracking-wider cursor-not-allowed">
                                    SAVE CHANGES
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function FeedbackInbox() {
    const [selectedResponse, setSelectedResponse] = useState(null);
    return (
        <div className="p-4 md:p-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700">Inbox</h1>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-[10px] font-bold">?</div>
                    HELP
                </button>
            </div>

            <div className="bg-white rounded border border-gray-200 p-6">
                {/* Filters Top Row */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center w-full max-w-lg border border-gray-200 rounded overflow-hidden bg-white">
                        <div className="pl-3 text-gray-400">
                            <SearchIcon />
                        </div>
                        <input type="text" placeholder="Search guest or room" className="w-full px-3 py-1.5 text-sm outline-none placeholder-gray-400" />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <button className="text-gray-500 hover:text-gray-700">Clear filters</button>
                        <button className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download file
                        </button>
                    </div>
                </div>

                {/* Filters Second Row */}
                <div className="flex flex-col lg:flex-row w-full items-center gap-4 mb-6">
                    <div className="flex-1 flex items-center border border-gray-200 rounded px-3 py-1.5 text-sm bg-white w-full">
                        <CalendarIcon />
                        <span className="ml-2 text-gray-700">2024-04-29 - 2024-05-29</span>
                    </div>
                    <SelectInput value="All surveys" options={['All surveys', 'Welcome', 'Generic', 'Facilities & Services', 'Checkout']} className="flex-1 w-full" />
                    <SelectInput value="All services" options={['All services', 'Spa', 'Room service', 'Restaurants', 'Sports', 'Issues']} className="flex-1 w-full" />
                    <SelectInput value="5 stars or less" options={['5 stars or less', '4 stars or less', '3 stars or less', '2 stars or less']} className="flex-1 w-full" />
                </div>

                {/* Filter Toggles */}
                <div className="flex flex-wrap items-center gap-10 mb-8 text-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-700 font-semibold mr-2">Filter by mode:</span>
                        <button className="px-5 py-1.5 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">All</button>
                        <button className="px-5 py-1.5 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">Proactive</button>
                        <button className="px-5 py-1.5 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">Post-service</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-700 font-semibold mr-2">Filter by status:</span>
                        <button className="flex items-center gap-2 text-gray-700 font-semibold text-sm hover:text-gray-900 px-2 transition-colors"><div className="w-3 h-3 rounded-full bg-blue-500"></div> New</button>
                        <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"><div className="w-3 h-3 rounded-full bg-pink-500"></div> Pending</button>
                        <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> In progress</button>
                        <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"><div className="w-3 h-3 rounded-full bg-green-500"></div> Solved</button>
                    </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">2 responses found</div>

                {/* Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 min-w-[900px]">
                        <thead className="text-[10px] font-bold text-gray-400 uppercase border-t border-b border-gray-100 bg-white">
                            <tr>
                                <th className="py-3 px-2">SURVEY</th>
                                <th className="py-3 px-2">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-600 w-max">OVERALL SCORE <SortIcon /></div>
                                </th>
                                <th className="py-3 px-2 w-8"></th>
                                <th className="py-3 px-2">GUEST</th>
                                <th className="py-3 px-2">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-600 w-max">DATE <SortIcon /></div>
                                </th>
                                <th className="py-3 px-2">STATUS</th>
                                <th className="py-3 px-2">SURVEY</th>
                                <th className="py-3 px-2">SERVICE</th>
                                <th className="py-3 px-2">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_RESPONSES.map((response) => (
                                <tr key={response.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <ThumbsUpIcon />
                                            <span className="font-semibold text-gray-700">{response.surveyType}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{response.score}</span>
                                            <span className="text-yellow-400 text-xs tracking-widest">★★★★★</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 text-center text-gray-400">-</td>
                                    <td className="py-4 px-2 text-gray-800 font-medium">{response.guest}</td>
                                    <td className="py-4 px-2">
                                        <div className="text-gray-800 font-medium mb-0.5">{response.date}</div>
                                        <div className="text-gray-400 text-[11px]">{response.time}</div>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> {response.status}
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 text-gray-800 font-medium">{response.surveyType}</td>
                                    <td className="py-4 px-2 text-gray-800 font-medium">{response.service}</td>
                                    <td className="py-4 px-2">
                                        <div onClick={() => setSelectedResponse(response)} className="inline-block p-1 rounded-full hover:bg-gray-100 transition-colors">
                                            <EyeIcon />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ResponseDetailsModal response={selectedResponse} onClose={() => setSelectedResponse(null)} />
        </div>
    );
}
