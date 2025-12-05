'use client';

/**
 * PlayerSeats Component
 * Circular display of players around a table
 * T042, T043: Updated for Phase 6 to show disconnect status
 */

import type { GamePlayer, CenterMessage, GamePhase } from '@/types/game';

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
  /** Feature 008: Game context for center messages */
  gamePhase?: GamePhase;
  questNumber?: number;
  questRequirement?: { size: number };
  isCurrentPlayerLeader?: boolean;
  isOnQuestTeam?: boolean;
  lastQuestResult?: 'success' | 'failed' | null;
  gameWinner?: 'good' | 'evil' | null;
  isAssassin?: boolean;
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
  gamePhase,
  questNumber,
  questRequirement,
  isCurrentPlayerLeader = false,
  isOnQuestTeam = false,
  lastQuestResult,
  gameWinner,
  isAssassin = false,
}: PlayerSeatsProps) {
  const angleStep = (2 * Math.PI) / players.length;
  const radius = 180; // Distance from center (increased for bigger layout)

  /**
   * Feature 008: Get dynamic center message based on game state
   * T006: getCenterMessage() skeleton
   * T011: Enhanced with leader context
   * T013-T018: All phase messages
   * T020: Defensive checks for missing/null data
   */
  const getCenterMessage = (): CenterMessage => {
    // T020: Defensive checks - provide safe defaults
    const phase = gamePhase || 'team_building';
    const quest = questNumber || 1;
    const teamSize = questRequirement?.size || 0;
    
    // T020: Safely get leader name
    const leader = players.find((p) => p.is_leader);
    let leaderName = leader?.nickname || 'Leader';
    
    // T020: Safely get Lady holder name
    const ladyHolder = players.find((p) => p.id === ladyHolderId);
    let ladyName = ladyHolder?.nickname || 'Player';
    
    // T012: Truncate long nicknames to 15 chars + "..."
    if (leaderName.length > 15) {
      leaderName = leaderName.slice(0, 15) + '...';
    }
    if (ladyName.length > 15) {
      ladyName = ladyName.slice(0, 15) + '...';
    }

    // T007, T011: Team building phase (enhanced with leader context)
    if (phase === 'team_building') {
      return {
        line1: `Quest ${quest}`,
        line2: isCurrentPlayerLeader
          ? `Select ${teamSize} players for the quest`
          : `${leaderName} is selecting a team`,
      };
    }

    // T008: Voting phase
    if (phase === 'voting') {
      return {
        line1: `Quest ${quest}`,
        line2: 'Vote on the proposed team',
      };
    }

    // T014: Quest execution phase
    if (phase === 'quest') {
      return {
        line1: `Quest ${quest}`,
        line2: isOnQuestTeam
          ? 'Submit your quest action'
          : 'Quest team is deciding...',
      };
    }

    // T015: Quest result phase
    if (phase === 'quest_result') {
      return {
        line1: `Quest ${quest}`,
        line2: lastQuestResult === 'success'
          ? 'Quest succeeded!'
          : 'Quest failed!',
      };
    }

    // T016: Assassin phase
    if (phase === 'assassin') {
      return {
        line1: 'Assassin Phase',
        line2: isAssassin
          ? 'Select your target'
          : 'The Assassin is choosing...',
      };
    }

    // T017: Lady of the Lake phase
    if (phase === 'lady_of_lake') {
      const isLadyHolder = ladyHolderId === currentPlayerId;
      return {
        line1: 'Lady of the Lake',
        line2: isLadyHolder
          ? 'Select a player to investigate'
          : `${ladyName} is investigating...`,
      };
    }

    // T018: Game over phase
    if (phase === 'game_over') {
      return {
        line1: 'Game Over',
        line2: gameWinner === 'good' ? 'Good Wins!' : 'Evil Wins!',
      };
    }

    // T019: Fallback for unknown phases
    return {
      line1: `Quest ${quest}`,
      line2: 'Game in progress...',
    };
  };

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

  // T009: Get dynamic center message
  const centerMessage = getCenterMessage();

  return (
    <div className="relative w-[440px] h-[440px] mx-auto">
      {/* Feature 008: Dynamic center messages */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 border-4 border-amber-700 shadow-lg">
        <div className="flex flex-col items-center justify-center h-full text-center px-2">
          <span className="text-lg font-bold text-amber-500 leading-tight">
            {centerMessage.line1}
          </span>
          <span className="text-sm text-amber-400 leading-tight mt-1">
            {centerMessage.line2}
          </span>
        </div>
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
