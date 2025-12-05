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
  /** Feature 007: Draft team selection (leader's tentative selection) */
  draftTeam?: string[] | null;
  /** Feature 007: Whether draft selection is in progress */
  isDraftInProgress?: boolean;
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
  draftTeam,
  isDraftInProgress = false,
}: PlayerSeatsProps) {
  const angleStep = (2 * Math.PI) / players.length;
  const radius = 180; // Distance from center (increased for bigger layout)

  const getPlayerPosition = (index: number) => {
    // Start from top (subtract PI/2 to rotate)
    const angle = angleStep * index - Math.PI / 2;
    const x = Math.cos(angle) * radius + 220; // Center X (increased)
    const y = Math.sin(angle) * radius + 220; // Center Y (increased)
    return { x, y };
  };

  const isSelected = (playerId: string) => selectedTeam.includes(playerId);
  const canSelect = selectable && selectedTeam.length < maxSelectable;
  const isDisabled = (playerId: string) => disabledPlayerIds.includes(playerId);
  
  // Feature 007: Draft team selection state
  // For leader (selectable=true): use local selectedTeam (handled by isSelected)
  // For other players: show draft_team from server
  const isDraftSelected = (playerId: string) => {
    if (selectable) return false; // Leader uses selectedTeam for instant feedback
    return isDraftInProgress && draftTeam && draftTeam.includes(playerId);
  };

  return (
    <div className="relative w-[440px] h-[440px] mx-auto">
      {/* Center table */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 border-4 border-amber-700 shadow-lg flex items-center justify-center">
        <span className="text-amber-500 text-sm font-bold">ROUND TABLE</span>
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
        
        // Feature 007: Determine visual state
        const inDraftSelection = isDraftSelected(player.id);
        const isProposed = player.is_on_team; // Officially proposed team

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
                  w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold
                  border-3 transition-all duration-300
                  ${isMe ? 'border-yellow-400 bg-yellow-900 text-yellow-200' : 'border-slate-400 bg-slate-700 text-slate-200'}
                  ${player.is_leader ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-avalon-midnight' : ''}
                  ${isProposed ? 'border-green-400 bg-green-800 text-green-200' : ''}
                  ${inDraftSelection ? 'border-cyan-400 bg-cyan-900/30 text-cyan-100 animate-pulse shadow-lg shadow-cyan-400/50' : ''}
                  ${selected ? 'border-cyan-300 bg-cyan-700 text-cyan-100 shadow-lg shadow-cyan-400/50' : ''}
                  ${isDisconnected ? 'opacity-50 grayscale' : ''}
                `}
                style={{ borderWidth: '4px' }}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>

              {/* Crown for leader */}
              {player.is_leader && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">
                  👑
                </div>
              )}

              {/* Lady of the Lake token */}
              {hasLady && (
                <div className="absolute -bottom-2 -left-3 text-2xl" title="Lady of the Lake">
                  🌊
                </div>
              )}

              {/* T042, T043: Disconnect indicator */}
              {isDisconnected && (
                <div
                  className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  title="Disconnected"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}

              {/* Shield for proposed team member (not draft) */}
              {isProposed && !selected && !inDraftSelection && (
                <div className="absolute -top-2 -right-2 text-xl">
                  🛡️
                </div>
              )}

              {/* Checkmark for selection (draft or regular selection) */}
              {(selected || inDraftSelection) && (
                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold ${
                  inDraftSelection ? 'bg-cyan-400' : 'bg-cyan-500'
                }`}>
                  ✓
                </div>
              )}

              {/* Vote indicator */}
              {player.has_voted && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-sm text-black font-bold">
                  ✓
                </div>
              )}

              {/* Name - Show full name, no truncation */}
              <span
                className={`
                  mt-3 text-base font-semibold whitespace-nowrap
                  ${isMe ? 'text-yellow-300 font-bold' : 'text-slate-100'}
                  ${isDisconnected ? 'text-red-400' : ''}
                  ${inDraftSelection ? 'text-cyan-300' : ''}
                  ${isProposed && !inDraftSelection ? 'text-green-300' : ''}
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
