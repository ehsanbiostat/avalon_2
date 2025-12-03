'use client';

/**
 * GameBoard Component
 * Main game UI container
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { QuestTracker } from './QuestTracker';
import { TeamProposal } from './TeamProposal';
import { VotingPanel } from './VotingPanel';
import { QuestExecution } from './QuestExecution';
import { QuestResultDisplay } from './QuestResultDisplay';
import { VoteResultReveal } from './VoteResultReveal';
import { AssassinPhase } from './AssassinPhase';
import { GameOver } from './GameOver';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getPhaseName, getPhaseDescription } from '@/lib/domain/game-state-machine';
import { getQuestRequirement } from '@/lib/domain/quest-config';

interface GameBoardProps {
  gameId: string;
}

export function GameBoard({ gameId }: GameBoardProps) {
  const { gameState, currentPlayerId, playerRole, specialRole, loading, error, refetch } = useGameState(gameId);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showVoteReveal, setShowVoteReveal] = useState(false);
  const lastSeenProposalId = useRef<string | null>(null);

  // Show vote reveal when there's a new resolved proposal
  useEffect(() => {
    if (gameState?.last_vote_result) {
      const proposalId = gameState.last_vote_result.proposal_id;
      // Only show if this is a new proposal we haven't seen
      if (proposalId !== lastSeenProposalId.current) {
        lastSeenProposalId.current = proposalId;
        setShowVoteReveal(true);
      }
    }
  }, [gameState?.last_vote_result]);

  const handleVoteRevealComplete = useCallback(() => {
    setShowVoteReveal(false);
  }, []);

  const handleAction = useCallback(() => {
    // Refetch after any action to get latest state
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-avalon-gold border-t-transparent mx-auto mb-4" />
          <p className="text-avalon-silver/80">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load game'}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { game, players, current_proposal, quest_requirement } = gameState;
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isLeader = currentPlayer?.is_leader || false;

  // Game Over
  if (game.phase === 'game_over' && game.winner) {
    return (
      <div className="max-w-2xl mx-auto">
        <GameOver
          winner={game.winner}
          winReason={game.win_reason || ''}
          questResults={game.quest_results}
          playerRole={playerRole}
          players={players}
          currentPlayerId={currentPlayerId ?? undefined}
        />
      </div>
    );
  }
  
  // Assassin Phase
  if (game.phase === 'assassin' && gameState.assassin_phase) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Quest Tracker - still show progress */}
        <QuestTracker
          playerCount={game.player_count}
          currentQuest={game.current_quest}
          questResults={game.quest_results}
          voteTrack={game.vote_track}
        />
        
        {/* Assassin Phase UI */}
        <AssassinPhase
          gameId={gameId}
          players={players}
          assassinPhase={gameState.assassin_phase}
          isAssassin={gameState.is_assassin}
          currentPlayerId={currentPlayerId ?? ''}
          onGuessSubmitted={handleAction}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-avalon-gold">
            {getPhaseName(game.phase)}
          </h1>
          <p className="text-sm text-avalon-silver/70">
            {getPhaseDescription(game.phase)}
          </p>
        </div>
        
        {/* View Role Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowRoleModal(true)}
        >
          View My Role
        </Button>
      </div>

      {/* Quest Tracker */}
      <QuestTracker
        playerCount={game.player_count}
        currentQuest={game.current_quest}
        questResults={game.quest_results}
        voteTrack={game.vote_track}
      />

      {/* Phase-specific content */}
      <div className="bg-avalon-dark-blue/30 rounded-xl p-6 border border-avalon-silver/10">
        {/* Team Building */}
        {game.phase === 'team_building' && (
          <TeamProposal
            gameId={gameId}
            players={players}
            currentPlayerId={currentPlayerId}
            questNumber={game.current_quest}
            questRequirement={quest_requirement}
            voteTrack={game.vote_track}
            isLeader={isLeader}
            onProposalSubmitted={handleAction}
          />
        )}

        {/* Voting */}
        {game.phase === 'voting' && current_proposal && (
          <VotingPanel
            gameId={gameId}
            players={players}
            currentPlayerId={currentPlayerId}
            proposal={current_proposal}
            myVote={gameState.my_vote}
            votesSubmitted={gameState.votes_submitted}
            totalPlayers={gameState.total_players}
            onVoteSubmitted={handleAction}
          />
        )}

        {/* Quest */}
        {game.phase === 'quest' && current_proposal && (
          <QuestExecution
            gameId={gameId}
            players={players}
            currentPlayerId={currentPlayerId}
            proposal={current_proposal}
            questNumber={game.current_quest}
            questRequirement={quest_requirement}
            amTeamMember={gameState.am_team_member}
            canSubmitAction={gameState.can_submit_action}
            hasSubmittedAction={gameState.has_submitted_action}
            actionsSubmitted={gameState.actions_submitted}
            totalTeamMembers={gameState.total_team_members}
            playerRole={playerRole}
            onActionSubmitted={handleAction}
          />
        )}

        {/* Quest Result */}
        {game.phase === 'quest_result' && game.quest_results.length > 0 && (
          <QuestResultDisplay
            gameId={gameId}
            questResult={game.quest_results[game.quest_results.length - 1]}
            failsRequired={getQuestRequirement(game.player_count, game.quest_results.length).fails}
            onContinue={handleAction}
          />
        )}
      </div>

      {/* Vote Result Reveal Overlay */}
      {showVoteReveal && gameState.last_vote_result && (
        <VoteResultReveal
          votes={gameState.last_vote_result.votes}
          isApproved={gameState.last_vote_result.is_approved}
          approveCount={gameState.last_vote_result.approve_count}
          rejectCount={gameState.last_vote_result.reject_count}
          onComplete={handleVoteRevealComplete}
        />
      )}

      {/* Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Your Role"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div
            className={`
              w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl
              ${playerRole === 'good'
                ? 'bg-emerald-500/20 border-2 border-emerald-500'
                : 'bg-red-500/20 border-2 border-red-500'}
            `}
          >
            {playerRole === 'good' ? '🛡️' : '🗡️'}
          </div>
          
          <div>
            <h3
              className={`text-2xl font-bold ${playerRole === 'good' ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {playerRole === 'good' ? 'Good' : 'Evil'}
            </h3>
            {specialRole && (
              <p className="text-avalon-gold capitalize mt-1">{specialRole.replace(/_/g, ' ')}</p>
            )}
          </div>
          
          <p className="text-avalon-silver/70 text-sm">
            {playerRole === 'good'
              ? 'Help the quests succeed. Watch for saboteurs!'
              : 'Sabotage the quests. Stay hidden!'}
          </p>
        </div>
      </Modal>
    </div>
  );
}

