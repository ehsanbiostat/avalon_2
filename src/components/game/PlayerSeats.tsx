'use client';

/**
 * PlayerSeats Component
 * Circular display of players around a table
 * T042, T043: Updated for Phase 6 to show disconnect status
 */

import type { GamePlayer } from '@/types/game';

interface PlayerSeatsProps {
  players: GamePlayer[];
  currentPlayerId: string | null;
  selectedTeam?: string[];
  onPlayerClick?: (playerId: string) => void;
  selectable?: boolean;
  maxSelectable?: number;
  ladyHolderId?: string | null;
  /** Disable selection for these player IDs (e.g., previous Lady holders) */
  disabledPlayerIds?: string[];
}

export function PlayerSeats({
  players,
  currentPlayerId,
  selectedTeam = [],
  onPlayerClick,
  selectable = false,
  maxSelectable = 0,
  ladyHolderId,
  disabledPlayerIds = [],
}: PlayerSeatsProps) {
  const angleStep = (2 * Math.PI) / players.length;
  const radius = 140; // Distance from center (increased)

  const getPlayerPosition = (index: number) => {
    // Start from top (subtract PI/2 to rotate)
    const angle = angleStep * index - Math.PI / 2;
    const x = Math.cos(angle) * radius + 170; // Center X (increased)
    const y = Math.sin(angle) * radius + 170; // Center Y (increased)
    return { x, y };
  };

  const isSelected = (playerId: string) => selectedTeam.includes(playerId);
  const canSelect = selectable && selectedTeam.length < maxSelectable;
  const isDisabled = (playerId: string) => disabledPlayerIds.includes(playerId);

  return (
    <div className="relative w-[340px] h-[340px] mx-auto">
      {/* Center table */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 border-4 border-amber-700 shadow-lg flex items-center justify-center">
        <span className="text-amber-500 text-xs font-bold">ROUND TABLE</span>
      </div>

      {/* Players */}
      {players.map((player, index) => {
        const { x, y } = getPlayerPosition(index);
        const isMe = player.id === currentPlayerId;
        const selected = isSelected(player.id);
        const disabled = isDisabled(player.id);
        const clickable = selectable && !disabled && (selected || canSelect || !isMe);
        const hasLady = ladyHolderId === player.id;
        // T042: Check connection status
        const isDisconnected = !player.is_connected;

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
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              {/* Avatar */}
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center text-base font-bold
                  border-3 transition-all duration-300
                  ${isMe ? 'border-yellow-400 bg-yellow-900 text-yellow-200' : 'border-slate-400 bg-slate-700 text-slate-200'}
                  ${player.is_leader ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}
                  ${player.is_on_team ? 'border-green-400 bg-green-800 text-green-200' : ''}
                  ${selected ? 'border-cyan-300 bg-cyan-700 text-cyan-100 shadow-lg shadow-cyan-400/50' : ''}
                  ${isDisconnected ? 'opacity-50 grayscale' : ''}
                `}
                style={{ borderWidth: '3px' }}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>

              {/* Crown for leader */}
              {player.is_leader && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">
                  👑
                </div>
              )}

              {/* Lady of the Lake token */}
              {hasLady && (
                <div className="absolute -bottom-1 -left-2 text-xl" title="Lady of the Lake">
                  🌊
                </div>
              )}

              {/* T042, T043: Disconnect indicator */}
              {isDisconnected && (
                <div
                  className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  title="Disconnected"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}

              {/* Shield for team member */}
              {player.is_on_team && !selected && (
                <div className="absolute -top-1 -right-1 text-lg">
                  🛡️
                </div>
              )}

              {/* Checkmark for selection */}
              {selected && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  ✓
                </div>
              )}

              {/* Vote indicator */}
              {player.has_voted && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-black font-bold">
                  ✓
                </div>
              )}

              {/* Name */}
              <span
                className={`
                  mt-2 text-sm font-medium max-w-[70px] truncate
                  ${isMe ? 'text-yellow-300 font-bold' : 'text-slate-200'}
                  ${isDisconnected ? 'text-red-400' : ''}
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
