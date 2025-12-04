'use client';

/**
 * TeamProposal Component
 * For leader to select team members
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlayerSeats } from './PlayerSeats';
import type { GamePlayer, QuestRequirement } from '@/types/game';
import { proposeTeam } from '@/lib/api/game';

interface TeamProposalProps {
  gameId: string;
  players: GamePlayer[];
  currentPlayerId: string | null;
  questNumber: number;
  questRequirement: QuestRequirement;
  voteTrack: number;
  isLeader: boolean;
  onProposalSubmitted: () => void;
  ladyHolderId?: string | null;
}

export function TeamProposal({
  gameId,
  players,
  currentPlayerId,
  questNumber,
  questRequirement,
  voteTrack,
  isLeader,
  onProposalSubmitted,
  ladyHolderId,
}: TeamProposalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leader = players.find((p) => p.is_leader);
  const requiredSize = questRequirement.size;

  const handlePlayerClick = (playerId: string) => {
    if (!isLeader) return;
    
    setSelectedTeam((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.length < requiredSize) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (selectedTeam.length !== requiredSize) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      await proposeTeam(gameId, selectedTeam);
      setSelectedTeam([]);
      onProposalSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to propose team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-avalon-gold mb-1">
          Quest {questNumber}
        </h2>
        <p className="text-avalon-silver/80">
          {isLeader ? (
            `Select ${requiredSize} players for the quest`
          ) : (
            <>
              <span className="text-amber-500">{leader?.nickname}</span> is selecting a team
            </>
          )}
        </p>
        
        {voteTrack > 0 && (
          <p className="text-sm text-amber-400 mt-1">
            Proposal #{voteTrack + 1} of 5
          </p>
        )}
      </div>

      {/* Player Selection Circle */}
      <PlayerSeats
        players={players}
        currentPlayerId={currentPlayerId}
        selectedTeam={selectedTeam}
        onPlayerClick={handlePlayerClick}
        selectable={isLeader}
        maxSelectable={requiredSize}
        ladyHolderId={ladyHolderId}
      />

      {/* Selection Status */}
      {isLeader && (
        <div className="text-center">
          <p className="text-avalon-silver/60 text-sm">
            {selectedTeam.length} / {requiredSize} selected
          </p>
          
          {/* Selected Players Preview */}
          {selectedTeam.length > 0 && (
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              {selectedTeam.map((id) => {
                const player = players.find((p) => p.id === id);
                return (
                  <span
                    key={id}
                    className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-400 text-sm"
                  >
                    {player?.nickname || 'Unknown'}
                  </span>
                );
              })}
            </div>
          )}
          
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
          
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedTeam.length !== requiredSize || submitting}
            isLoading={submitting}
            className="mt-4"
          >
            Propose Team
          </Button>
        </div>
      )}
      
      {/* Waiting message for non-leaders */}
      {!isLeader && (
        <div className="text-center text-avalon-silver/60 animate-pulse">
          Waiting for {leader?.nickname} to propose a team...
        </div>
      )}
    </div>
  );
}

