'use client';

import { PlayerCard } from './PlayerCard';
import type { RoomPlayerInfo } from '@/types/room';

interface PlayerListProps {
  players: RoomPlayerInfo[];
  currentPlayerId: string;
  expectedPlayers: number;
}

/**
 * List of players in the room lobby
 */
export function PlayerList({
  players,
  currentPlayerId,
  expectedPlayers,
}: PlayerListProps) {
  // Sort players: manager first, then by join time
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.is_manager) return -1;
    if (b.is_manager) return 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  const emptySlots = expectedPlayers - players.length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-avalon-gold text-sm uppercase tracking-wider">
          Knights at the Table
        </h3>
        <span className="text-avalon-silver text-sm">
          {players.length}/{expectedPlayers}
        </span>
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {sortedPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayerId}
          />
        ))}

        {/* Empty slots */}
        {emptySlots > 0 && (
          <>
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-avalon-silver/20"
              >
                <div className="w-10 h-10 rounded-full bg-avalon-midnight/30 flex items-center justify-center">
                  <span className="text-avalon-silver/30 text-lg">?</span>
                </div>
                <span className="text-avalon-silver/40 italic">
                  Waiting for knight...
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
