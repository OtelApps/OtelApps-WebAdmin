import React, { useState } from 'react';

export function NewAlertModal({ isOpen, onClose }) {
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedDays, setSelectedDays] = useState(['Tuesday', 'Wednesday']);

    const toggleDay = (day) => {
        setSelectedDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setImagePreview(URL.createObjectURL(e.dataTransfer.files[0]));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-sm shadow-xl flex flex-col overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#2D2A3E] px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex-1"></div>
                    <h2 className="text-[13px] font-bold tracking-[0.2em] uppercase">NEW ALERT</h2>
                    <div className="flex-1 flex justify-end">
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Title Input */}
                        <div>
                            <h3 className="font-bold text-[#3B384A] text-[13px] mb-3">Title</h3>
                            <div className="flex border border-gray-300 rounded-sm overflow-hidden">
                                <div className="bg-[#f8f9fa] p-3 border-r border-gray-300 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                                </div>
                                <input type="text" defaultValue="Buy One, Get One Free on Cocktails" className="flex-1 p-3 text-sm text-gray-700 outline-none" />
                            </div>
                        </div>

                        {/* Body Textarea */}
                        <div>
                            <h3 className="font-bold text-[#3B384A] text-[13px] mb-3">Description</h3>
                            <div className="flex border border-gray-300 rounded-sm overflow-hidden">
                                <div className="bg-[#f8f9fa] p-3 border-r border-gray-300 flex items-start justify-center pt-4">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                                </div>
                                <textarea rows="4" defaultValue="Join us for 2-for-1 cocktails! Treat yourself to a piña colada, mojito, margarita, or your drink of choice. Cheers to a great time!" className="flex-1 p-3 text-sm text-gray-700 outline-none resize-none"></textarea>
                            </div>
                        </div>

                        {/* Include URL */}
                        <div className="space-y-3 pt-4">
                            <h3 className="font-bold text-[#3B384A] text-[13px]">Include URL</h3>
                            <div className="relative">
                                <select className="w-full border border-gray-300 rounded-sm p-3 text-[13px] text-gray-600 appearance-none outline-none">
                                    <option>link service</option>
                                </select>
                                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                            <div className="relative">
                                <select className="w-full border border-gray-300 rounded-sm p-3 text-[13px] text-gray-600 appearance-none outline-none">
                                    <option>Il Pazzito</option>
                                </select>
                                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {/* Image Thumbnail */}
                        <div>
                            <label 
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`w-32 h-24 rounded-sm overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-colors relative group border-2 ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-transparent bg-gray-200 hover:border-gray-300'}`}
                            >
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Alert Thumbnail" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                            <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-2">
                                        <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                        <span className="text-[10px] text-gray-500 font-medium">Upload Image</span>
                                    </div>
                                )}
                            </label>
                            <div className="text-[11px] text-gray-500 mt-2 font-medium">Drag & drop or click to replace</div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button className="bg-[#8A63D2] hover:bg-[#7a57bc] text-white text-[11px] font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-sm transition-colors">SAVE</button>
                            <button onClick={onClose} className="bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 text-[11px] font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-sm transition-colors">Cancel</button>
                            <button className="bg-[#8A63D2] hover:bg-[#7a57bc] text-white text-[11px] font-bold px-6 py-2 rounded-full uppercase tracking-wider ml-2 shadow-sm transition-colors">DELETE</button>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Time */}
                        <div>
                            <h3 className="font-bold text-[#3B384A] text-[13px] mb-3">Alert will be sent at</h3>
                            <div className="flex items-center border border-gray-300 rounded-sm p-3 w-48">
                                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <input type="text" defaultValue="18:30" className="text-[13px] text-gray-600 outline-none w-full" />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div>
                            <h3 className="font-bold text-[#3B384A] text-[13px] mb-3">Date range</h3>
                            <div className="flex items-center border border-gray-300 rounded-sm p-3 w-72">
                                <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <input type="text" defaultValue="2024-06-29  /  2024-07-06" className="text-[13px] text-gray-600 outline-none w-full tracking-wide" />
                            </div>
                        </div>

                        {/* Days of week */}
                        <div>
                            <h3 className="font-bold text-[#3B384A] text-[13px] mb-4">Days of the week</h3>
                            <div className="space-y-4">
                                {[
                                    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
                                ].map(day => {
                                    const isChecked = selectedDays.includes(day);
                                    return (
                                        <label key={day} className="flex items-center gap-4 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={isChecked} 
                                                onChange={() => toggleDay(day)} 
                                            />
                                            <div className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-colors ${isChecked ? 'bg-[#40C4B8] border-[#40C4B8]' : 'bg-white border-gray-300'}`}>
                                                {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                            </div>
                                            <span className="text-[13px] font-medium text-gray-500">{day}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
