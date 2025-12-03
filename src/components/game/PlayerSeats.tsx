'use client';

/**
 * PlayerSeats Component
 * Circular display of players around a table
 */

import type { GamePlayer } from '@/types/game';

interface PlayerSeatsProps {
  players: GamePlayer[];
  currentPlayerId: string | null;
  selectedTeam?: string[];
  onPlayerClick?: (playerId: string) => void;
  selectable?: boolean;
  maxSelectable?: number;
}

export function PlayerSeats({
  players,
  currentPlayerId,
  selectedTeam = [],
  onPlayerClick,
  selectable = false,
  maxSelectable = 0,
}: PlayerSeatsProps) {
  const angleStep = (2 * Math.PI) / players.length;
  const radius = 130; // Distance from center
  
  const getPlayerPosition = (index: number) => {
    // Start from top (subtract PI/2 to rotate)
    const angle = angleStep * index - Math.PI / 2;
    const x = Math.cos(angle) * radius + 150; // Center X
    const y = Math.sin(angle) * radius + 150; // Center Y
    return { x, y };
  };

  const isSelected = (playerId: string) => selectedTeam.includes(playerId);
  const canSelect = selectable && selectedTeam.length < maxSelectable;

  return (
    <div className="relative w-[300px] h-[300px] mx-auto">
      {/* Center table */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-amber-900/40 to-amber-950/60 border-4 border-amber-800/50 shadow-lg flex items-center justify-center">
        <span className="text-amber-600/80 text-xs font-bold">ROUND TABLE</span>
      </div>
      
      {/* Players */}
      {players.map((player, index) => {
        const { x, y } = getPlayerPosition(index);
        const isMe = player.id === currentPlayerId;
        const selected = isSelected(player.id);
        const clickable = selectable && (selected || canSelect || !isMe);
        
        return (
          <div
            key={player.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            <button
              onClick={() => clickable && onPlayerClick?.(player.id)}
              disabled={!clickable}
              className={`
                relative flex flex-col items-center transition-all duration-200
                ${clickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                ${selected ? 'scale-110' : ''}
              `}
            >
              {/* Avatar */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                  border-2 transition-all duration-300
                  ${isMe ? 'border-avalon-gold bg-avalon-gold/20' : 'border-avalon-silver/40 bg-avalon-dark-blue'}
                  ${player.is_leader ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-avalon-navy' : ''}
                  ${player.is_on_team ? 'border-emerald-500 bg-emerald-500/20' : ''}
                  ${selected ? 'border-cyan-400 bg-cyan-500/30 shadow-lg shadow-cyan-500/30' : ''}
                  ${player.has_voted ? 'opacity-80' : ''}
                `}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>
              
              {/* Crown for leader */}
              {player.is_leader && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-amber-500">
                  👑
                </div>
              )}
              
              {/* Shield for team member */}
              {player.is_on_team && !selected && (
                <div className="absolute -top-1 -right-1 text-emerald-500">
                  🛡️
                </div>
              )}
              
              {/* Checkmark for selection */}
              {selected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
              )}
              
              {/* Vote indicator */}
              {player.has_voted && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-avalon-gold rounded-full flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              
              {/* Name */}
              <span
                className={`
                  mt-1 text-xs max-w-[60px] truncate
                  ${isMe ? 'text-avalon-gold font-bold' : 'text-avalon-silver/80'}
                `}
              >
                {isMe ? 'You' : player.nickname}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

