import React, { useState } from 'react';
import { NewAlertModal } from './NewAlertModal';

export function Alerts() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="w-full h-full p-4 md:p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-[32px] font-bold text-gray-600 tracking-tight">Alerts</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-[#FFA200] hover:bg-orange-400 text-white text-[13px] font-bold rounded-full shadow-sm transition-colors tracking-wide">
                        New Alert
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-[13px] font-bold rounded-full shadow-sm transition-colors tracking-wide">
                        <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-gray-400 flex items-center justify-center text-[11px] font-bold">?</div>
                        HELP
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-1 z-10 relative">
                <button className="px-5 py-2.5 border border-gray-200 bg-white text-gray-500 font-semibold text-[13px] relative rounded-t-[4px]">
                    Timetable
                    <div className="absolute -bottom-[2px] left-0 w-full h-[3px] bg-white"></div>
                </button>
            </div>

            {/* Calendar Component */}
            <div className="bg-white border border-gray-200 flex flex-col flex-1 min-h-[600px] relative z-0 rounded-b-md rounded-tr-md">
                {/* Calendar Toolbar */}
                <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button className="px-4 py-1.5 rounded-md bg-[#E2E6EC] hover:bg-gray-300 text-[13px] font-semibold text-gray-700 transition-colors tracking-wide">
                            May 27 - June 2, 2024
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="text-[#3B384A] font-bold text-[15px] tracking-wide pr-2">
                        May 27 - June 2, 2024
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 grid grid-cols-7 min-w-[800px]">
                        {[
                            { day: 'MONDAY', date: '27' },
                            { day: 'TUESDAY', date: '28' },
                            { day: 'WEDNESDAY', date: '29', active: true },
                            { day: 'THURSDAY', date: '30' },
                            { day: 'FRIDAY', date: '31' },
                            { day: 'SATURDAY', date: '1' },
                            { day: 'SUNDAY', date: '2' },
                        ].map((col, i) => (
                            <div key={i} className={`flex flex-col border-r border-gray-200 last:border-r-0 ${col.active ? 'bg-[#DDEBFA]' : 'bg-white'}`}>
                                <div className="text-center pt-5 pb-4 border-b border-gray-200 bg-white">
                                    <div className="text-[10px] font-bold text-gray-600 tracking-[0.05em] mb-1.5 uppercase">{col.day}</div>
                                    <div className="text-[22px] font-bold text-[#3B384A]">{col.date}</div>
                                </div>
                                <div className="flex-1 relative">
                                    {/* Empty cells for events */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <NewAlertModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
