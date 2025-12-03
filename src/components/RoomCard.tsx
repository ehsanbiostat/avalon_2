'use client';

import { Button } from '@/components/ui/Button';
import type { RoomListItem } from '@/types/room';

interface RoomCardProps {
  room: RoomListItem;
  onJoin: (code: string) => void;
  isJoining?: boolean;
}

/**
 * Single room card for the room list
 */
export function RoomCard({ room, onJoin, isJoining = false }: RoomCardProps) {
  const isFull = room.current_players >= room.expected_players;

  return (
    <div className="card hover:border-avalon-gold/30 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Room Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-avalon-gold text-lg tracking-wider">
              {room.code}
            </span>
            {isFull && (
              <span className="badge bg-avalon-silver/20 text-avalon-silver text-xs">
                Full
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-avalon-silver">
            <span className="flex items-center gap-1">
              <span>👑</span>
              <span className="truncate">{room.manager_nickname}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>👥</span>
              <span>
                {room.current_players}/{room.expected_players}
              </span>
            </span>
          </div>
        </div>

        {/* Join Button */}
        <Button
          variant={isFull ? 'ghost' : 'primary'}
          size="sm"
          onClick={() => onJoin(room.code)}
          disabled={isFull || isJoining}
          isLoading={isJoining}
        >
          {isFull ? 'Full' : 'Join'}
        </Button>
      </div>

      {/* Player slots visualization */}
      <div className="mt-3 pt-3 border-t border-avalon-silver/10">
        <div className="flex gap-1">
          {Array.from({ length: room.expected_players }).map((_, i) => (
            <div
              key={i}
              className={`
                flex-1 h-1.5 rounded-full
                ${i < room.current_players
                  ? 'bg-avalon-gold'
                  : 'bg-avalon-silver/20'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
