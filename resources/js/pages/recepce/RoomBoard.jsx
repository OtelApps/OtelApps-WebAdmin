import React from 'react';
import { RoomCard } from './RoomCard';

export function RoomBoard({ floors, selectedRoomNumber, onSelectRoom }) {
    if (!floors?.length) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-gray-500 dark:bg-gray-900 dark:border-gray-700">
                Žádné pokoje neodpovídají filtrům.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {floors.map((floor) => (
                <section key={floor.floor}>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {floor.label}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {floor.rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                selected={selectedRoomNumber === room.room_number}
                                onSelect={onSelectRoom}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
