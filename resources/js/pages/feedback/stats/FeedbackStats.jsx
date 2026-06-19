import React from 'react';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);

const ScoreColumn = ({ title, score, stars, responses }) => {
    return (
        <div className="flex-1 px-8 relative border-r border-gray-100 last:border-r-0">
            <h3 className="font-bold text-gray-600 mb-4">{title}</h3>
            <div className="flex items-end gap-3 mb-1">
                <span className="text-[42px] leading-none font-bold text-[#2D2A3E]">{score}</span>
                <div className="pb-2">
                    <div className="flex gap-0.5 text-[15px] mb-0.5 tracking-widest">
                        {stars.map((type, i) => (
                            <span key={i} className={type === 'empty' ? 'text-gray-200' : 'text-yellow-400'}>
                                ★
                            </span>
                        ))}
                    </div>
                    <span className="text-[11px] text-gray-400 font-semibold">{responses} responses</span>
                </div>
            </div>
            <button className="text-[12px] font-bold text-[#45B8D1] hover:text-cyan-600 mt-2">View more</button>
        </div>
    );
};

const ChartMockup = () => {
    const dates = ['20/05', '21/05', '22/05', '23/05', '24/05', '25/05', '26/05', '27/05', '28/05', '29/05', '30/05', '31/05', '01/06', '02/06', '03/06', '04/06', '05/06', '06/06', '07/06', '08/06', '09/06', '10/06', '11/06', '12/06', '13/06', '14/06', '15/06', '16/06', '17/06', '18/06', '19/06', '20/06', '21/06', '22/06', '23/06', '24/06'];
    const yLabels = ['2.0', '1.8', '1.6', '1.4', '1.2', '1.0', '0.8', '0.6', '0.4', '0.2', '0'];
    
    const dx = 1000 / 35;

    return (
        <div className="relative w-full h-[320px] flex text-gray-400 text-[10px] pb-10">
            {/* Y Axis */}
            <div className="flex flex-col justify-between h-[250px] pr-4 items-end font-medium">
                {yLabels.map(label => <span key={label}>{label}</span>)}
            </div>
            
            {/* Graph Area */}
            <div className="relative flex-1 h-[250px] border-b border-gray-200">
                {/* Horizontal Grid Lines */}
                {yLabels.map((_, i) => (
                    <div key={i} className="absolute w-full border-t border-gray-100 border-dashed" style={{ top: `${(i / 10) * 100}%` }}></div>
                ))}

                {/* Bars and Line SVG Overlay */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 250">
                    <defs>
                        <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#c5b2ea" />
                            <stop offset="100%" stopColor="#e5dcf7" />
                        </linearGradient>
                    </defs>
                    
                    {/* Bars */}
                    <rect x={9*dx - 8} y="125" width="16" height="125" fill="url(#barGradient)" rx="8" />
                    <rect x={10*dx - 8} y="125" width="16" height="125" fill="url(#barGradient)" rx="8" />
                    <rect x={23*dx - 8} y="125" width="16" height="125" fill="url(#barGradient)" rx="8" />
                    <rect x={24*dx - 8} y="0" width="16" height="250" fill="url(#barGradient)" rx="8" />

                    {/* Smooth Line connecting points */}
                    <path 
                        d={`M 0 250 
                            L ${8*dx} 250 
                            C ${8.5*dx} 250, ${8.5*dx} 125, ${9*dx} 125
                            C ${9.5*dx} 125, ${9.5*dx} 125, ${10*dx} 125
                            C ${10.5*dx} 125, ${10.5*dx} 250, ${11*dx} 250
                            L ${22*dx} 250
                            C ${22.5*dx} 250, ${22.5*dx} 125, ${23*dx} 125
                            C ${23.5*dx} 125, ${23.5*dx} 0, ${24*dx} 0
                            C ${24.5*dx} 0, ${24.5*dx} 250, ${25*dx} 250
                            L 1000 250`} 
                        fill="none" stroke="#4a3b52" strokeWidth="2"
                    />

                    {/* Data Points (Circles) */}
                    {[...Array(36)].map((_, i) => {
                        let cy = 250;
                        if (i === 9 || i === 10 || i === 23) cy = 125;
                        if (i === 24) cy = 0;
                        return <circle key={i} cx={i*dx} cy={cy} r="4" fill="white" stroke="#4a3b52" strokeWidth="2" />
                    })}
                </svg>

                {/* X Axis Labels */}
                <div className="absolute -bottom-10 left-0 w-full h-10">
                    {dates.map((date, i) => (
                        <div key={date} className="absolute top-0" style={{ left: `${(i/35)*100}%` }}>
                            <div className="origin-top-left whitespace-nowrap mt-3 -translate-x-1/2 rotate-[315deg] text-[10px]">
                                {date}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export function FeedbackStats() {
    return (
        <div className="p-4 md:p-6 w-full">
            {/* Header Area */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-[32px] font-bold text-[#3B384A] mb-2 tracking-tight">Overview</h1>
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
                        Last update 24/06/2024 - 12:42
                        <InfoIcon />
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-full bg-[#8A63D2] hover:bg-[#7a57bc] flex items-center justify-center text-white shadow-sm transition-colors">
                            <DownloadIcon />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors shadow-sm tracking-wider">
                            <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-gray-500 text-[10px] font-bold">?</div>
                            HELP
                        </button>
                    </div>
                    
                    <div className="flex items-center border border-gray-200 rounded px-4 py-2 bg-white text-sm shadow-sm text-gray-600 mt-2">
                        <CalendarIcon />
                        <span className="ml-3 font-medium">2024-05-20 - 2024-06-24</span>
                    </div>
                </div>
            </div>

            {/* User Types & Channels Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* User types card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 flex justify-between shadow-sm">
                    <div className="flex-1">
                        <h3 className="font-bold text-[#3B384A] mb-6">User types</h3>
                        
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#3ebcb1]"></div>
                                <span className="font-semibold text-gray-700 text-[13px]">Guest</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-[#2D2A3E] text-lg">0.0</span>
                                <div className="flex text-[11px] text-gray-200 tracking-widest">
                                    ★★★★★
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold ml-2">No data available</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#8A63D2]"></div>
                                <span className="font-semibold text-gray-700 text-[13px]">Anonymous user</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-[#2D2A3E] text-lg">4.4</span>
                                <div className="flex text-[11px] text-yellow-400 tracking-widest">
                                    ★★★★★
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold ml-2">
                                    <span>5</span>
                                    <span className="text-gray-300">|</span>
                                    <span>100 %</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Placeholder Icon */}
                    <div className="flex items-center justify-center pl-6">
                        <div className="w-[100px] h-[100px] rounded-full bg-gray-50 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden relative">
                            <div className="absolute w-12 h-10 border-2 border-gray-300 rounded rotate-[-15deg] bg-white translate-x-1 translate-y-1"></div>
                            <div className="absolute w-12 h-10 border-2 border-gray-300 rounded rotate-12 bg-white flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-300">
                                    <polyline points="3 14 8 9 13 14 20 5" />
                                    <polyline points="15 5 20 5 20 10" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channels card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 flex justify-between shadow-sm">
                    <div className="flex-1">
                        <h3 className="font-bold text-[#3B384A] mb-8">Channels</h3>
                        
                        <div className="space-y-5">
                            <div className="flex justify-between items-center pr-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#c5b2ea]"></div>
                                    <span className="font-semibold text-gray-700 text-[13px]">Web Portal (PWA)</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold">
                                    <span>5</span>
                                    <span className="text-gray-300">|</span>
                                    <span>100 %</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pr-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#FFD166]"></div>
                                    <span className="font-semibold text-gray-700 text-[13px]">Native App</span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold">No data available</span>
                            </div>

                            <div className="flex justify-between items-center pr-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#3ebcb1]"></div>
                                    <span className="font-semibold text-gray-700 text-[13px]">Embed App</span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold">No data available</span>
                            </div>
                        </div>
                    </div>

                    {/* Donut Chart Placeholder */}
                    <div className="flex items-center justify-center pl-6 pr-4">
                        <div className="relative w-[110px] h-[110px]">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path
                                    className="text-[#c5b2ea]"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    strokeDasharray="99.5, 100"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Average Scores Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm mb-6">
                <h2 className="text-xl font-bold text-[#3B384A] mb-8">Average scores</h2>
                
                <div className="flex flex-col lg:flex-row -mx-8">
                    <ScoreColumn 
                        title="Welcome" 
                        score="0.0" 
                        stars={['empty', 'empty', 'empty', 'empty', 'empty']} 
                        responses={0} 
                    />
                    <ScoreColumn 
                        title="Generic" 
                        score="4.7" 
                        stars={['full', 'full', 'full', 'full', 'full']} // Note: showing 5 full stars to match the spirit, or half for the last one
                        responses={4} 
                    />
                    <ScoreColumn 
                        title="Facilities & Services" 
                        score="3.5" 
                        stars={['full', 'full', 'full', 'full', 'empty']} 
                        responses={1} 
                    />
                    <ScoreColumn 
                        title="Checkout" 
                        score="0.0" 
                        stars={['empty', 'empty', 'empty', 'empty', 'empty']} 
                        responses={0} 
                    />
                </div>
            </div>
            
            {/* Property Score Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-[#3B384A] mb-4">Property score</h2>
                        <div className="flex items-end gap-3 mb-1">
                            <span className="text-[42px] leading-none font-bold text-[#2D2A3E]">4.4</span>
                            <div className="pb-2">
                                <div className="flex gap-0.5 text-[15px] mb-0.5 tracking-widest text-yellow-400">
                                    <span>★</span><span>★</span><span>★</span><span>★</span><span className="opacity-50">★</span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold">5 responses</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex rounded-md border border-gray-200 overflow-hidden shadow-sm">
                        <button className="px-5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 bg-white transition-colors">Month</button>
                        <div className="w-px bg-gray-200"></div>
                        <button className="px-5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 bg-white transition-colors">Week</button>
                        <div className="w-px bg-gray-200"></div>
                        <button className="px-5 py-2 text-xs font-bold text-blue-600 bg-[#e8f0fe]">Day</button>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="mt-8 border border-gray-100 rounded-lg p-6 pt-5">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-gray-600 text-sm">Responses</h3>
                        <div className="flex items-center gap-6 text-[11px] font-bold tracking-wide text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#8A63D2]"></div>
                                Anonymous user
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#4a3b52] bg-white z-10"></div>
                                    <div className="w-4 h-[1.5px] bg-[#4a3b52] -mx-0.5"></div>
                                    <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#4a3b52] bg-white z-10"></div>
                                </div>
                                Total
                            </div>
                        </div>
                    </div>

                    <ChartMockup />
                </div>
            </div>
        </div>
    );
}
