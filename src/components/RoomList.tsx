'use client';

import { RoomCard } from './RoomCard';
import type { RoomListItem } from '@/types/room';

interface RoomListProps {
  rooms: RoomListItem[];
  onJoin: (code: string) => void;
  joiningCode?: string | null;
}

/**
 * List of active rooms
 */
export function RoomList({ rooms, onJoin, joiningCode = null }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="space-y-4">
          <div className="text-5xl">🏰</div>
          <h3 className="font-display text-xl text-avalon-gold">
            No Active Rooms
          </h3>
          <p className="text-avalon-silver/70 text-sm">
            Be the first to create a room and gather your knights!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-avalon-gold text-sm uppercase tracking-wider">
          Available Rooms
        </h2>
        <span className="text-avalon-silver text-sm">
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
        </span>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onJoin={onJoin}
            isJoining={joiningCode === room.code}
          />
        ))}
      </div>
    </div>
  );
}
