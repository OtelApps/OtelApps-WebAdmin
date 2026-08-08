import React, { useMemo, useState } from 'react';
import { useHttpQuery } from '../../hooks/useHttpQuery';
import { RoomBoard } from './RoomBoard';
import { RoomDetailPanel } from './RoomDetailPanel';

const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';

export function Recepce() {
    const [floor, setFloor] = useState('');
    const [occupancy, setOccupancy] = useState('');
    const [cleaning, setCleaning] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);

    const params = useMemo(() => {
        const p = {};
        if (floor !== '') p.floor = floor;
        if (occupancy) p.occupancy = occupancy;
        if (cleaning) p.cleaning = cleaning;
        return p;
    }, [floor, occupancy, cleaning]);

    const { data, isLoading, error, refetch } = useHttpQuery(
        ['reception-rooms', params],
        '/api/reception/rooms',
        { params },
    );

    const hotelName = data?.hotel?.name || 'Hotel';
    const floors = data?.floors ?? [];
    const floorOptions = useMemo(() => {
        const fromBoard = (data?.floors ?? []).map((f) => f.floor);
        const unique = [...new Set(fromBoard)].sort((a, b) => b - a);
        return unique.length ? unique : [4, 3, 2, 1, 0];
    }, [data?.floors]);

    return (
        <div className="min-h-full bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Přehled pokojů
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hotelName}</p>
                </header>

                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                        Patro
                        <select
                            className={selectClass}
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                        >
                            <option value="">Všechna patra</option>
                            {floorOptions.map((f) => (
                                <option key={f} value={String(f)}>
                                    {f === 0 ? 'Přízemí' : `${f}. patro`}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                        Stav
                        <select
                            className={selectClass}
                            value={occupancy}
                            onChange={(e) => setOccupancy(e.target.value)}
                        >
                            <option value="">Všechny stavy</option>
                            <option value="occupied">Obsazeno</option>
                            <option value="vacant">Volný</option>
                            <option value="ooo">Mimo provoz</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                        Úklid
                        <select
                            className={selectClass}
                            value={cleaning}
                            onChange={(e) => setCleaning(e.target.value)}
                        >
                            <option value="">Všechny stavy</option>
                            <option value="clean">Uklizeno</option>
                            <option value="dirty">Neuklizeno</option>
                            <option value="in_progress">Úklid probíhá</option>
                            <option value="inspected">Zkontrolováno</option>
                        </select>
                    </label>

                    <button
                        type="button"
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        title="Další filtry zatím nejsou k dispozici"
                    >
                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                        Další filtry
                    </button>
                </div>

                {isLoading && (
                    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                        Načítám pokoje…
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                        {error.response?.data?.message
                            || 'Pokoje se nepodařilo načíst. Spusť hotel_reception.sql v Supabase a php artisan config:clear.'}
                    </div>
                )}

                {!isLoading && !error && (
                    <RoomBoard
                        floors={floors}
                        selectedRoomNumber={selectedRoom}
                        onSelectRoom={(room) => setSelectedRoom(room.room_number)}
                    />
                )}
            </div>

            {selectedRoom && (
                <RoomDetailPanel
                    roomNumber={selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                    onCheckedOut={() => refetch()}
                />
            )}
        </div>
    );
}
