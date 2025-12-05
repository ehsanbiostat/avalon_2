'use client';

/**
 * VotingPanel Component
 * For players to vote on proposed team
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlayerSeats } from './PlayerSeats';
import type { GamePlayer, TeamProposal, VoteChoice } from '@/types/game';
import { submitVote } from '@/lib/api/game';

interface VotingPanelProps {
  gameId: string;
  players: GamePlayer[];
  currentPlayerId: string | null;
  proposal: TeamProposal;
  myVote: VoteChoice | null;
  votesSubmitted: number;
  totalPlayers: number;
  onVoteSubmitted: () => void;
  ladyHolderId?: string | null;
  /** Feature 008: Game context for center messages */
  questNumber?: number;
}

export function VotingPanel({
  gameId,
  players,
  currentPlayerId,
  proposal,
  myVote,
  votesSubmitted,
  totalPlayers,
  onVoteSubmitted,
  ladyHolderId,
  questNumber,
}: VotingPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leader = players.find((p) => p.id === proposal.leader_id);
  const teamMembers = players.filter((p) => proposal.team_member_ids.includes(p.id));
  const hasVoted = myVote !== null;

  const handleVote = async (vote: VoteChoice) => {
    if (hasVoted || submitting) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      await submitVote(gameId, vote);
      onVoteSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Proposed Team Display */}
      <div className="bg-avalon-dark-blue/50 rounded-xl p-4 border border-avalon-silver/20">
        <p className="text-sm text-avalon-silver/60 mb-2 text-center">
          <span className="text-amber-500">{leader?.nickname}</span> proposes:
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          {teamMembers.map((member) => (
            <span
              key={member.id}
              className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-sm"
            >
              {member.nickname}
            </span>
          ))}
        </div>
      </div>

      {/* Player Circle with vote indicators */}
      <PlayerSeats
        players={players}
        currentPlayerId={currentPlayerId}
        ladyHolderId={ladyHolderId}
        gamePhase="voting"
        questNumber={questNumber}
      />

      {/* Vote Progress */}
      <div className="text-center">
        <p className="text-avalon-silver/60 text-sm mb-2">
          {votesSubmitted} / {totalPlayers} votes submitted
        </p>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto h-2 bg-avalon-dark-blue rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-avalon-gold to-amber-500 transition-all duration-300"
            style={{ width: `${(votesSubmitted / totalPlayers) * 100}%` }}
          />
        </div>
      </div>

      {/* Voting Buttons */}
      {!hasVoted ? (
        <div className="flex justify-center gap-4">
          <Button
            variant="primary"
            onClick={() => handleVote('approve')}
            disabled={submitting}
            isLoading={submitting}
            className="!bg-emerald-600 hover:!bg-emerald-500 min-w-[120px]"
          >
            👍 Approve
          </Button>
          
          <Button
            variant="primary"
            onClick={() => handleVote('reject')}
            disabled={submitting}
            isLoading={submitting}
            className="!bg-red-600 hover:!bg-red-500 min-w-[120px]"
          >
            👎 Reject
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-avalon-silver/80">
            You voted: {' '}
            <span className={myVote === 'approve' ? 'text-emerald-400' : 'text-red-400'}>
              {myVote === 'approve' ? '👍 Approve' : '👎 Reject'}
            </span>
          </p>
          <p className="text-avalon-silver/60 text-sm animate-pulse mt-2">
            Waiting for others to vote...
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}

