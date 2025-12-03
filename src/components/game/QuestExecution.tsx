'use client';

/**
 * QuestExecution Component
 * For team members to submit success/fail
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { GamePlayer, TeamProposal, QuestRequirement, QuestActionType } from '@/types/game';
import { submitQuestAction } from '@/lib/api/game';

interface QuestExecutionProps {
  gameId: string;
  players: GamePlayer[];
  currentPlayerId: string | null;
  proposal: TeamProposal;
  questNumber: number;
  questRequirement: QuestRequirement;
  amTeamMember: boolean;
  canSubmitAction: boolean;
  hasSubmittedAction: boolean;
  actionsSubmitted: number;
  totalTeamMembers: number;
  playerRole?: 'good' | 'evil';
  onActionSubmitted: () => void;
}

export function QuestExecution({
  gameId,
  players,
  currentPlayerId,
  proposal,
  questNumber,
  questRequirement,
  amTeamMember,
  canSubmitAction,
  hasSubmittedAction,
  actionsSubmitted,
  totalTeamMembers,
  playerRole,
  onActionSubmitted,
}: QuestExecutionProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamMembers = players.filter((p) => proposal.team_member_ids.includes(p.id));
  const canFail = playerRole === 'evil';

  const handleAction = async (action: QuestActionType) => {
    if (!canSubmitAction || submitting) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      await submitQuestAction(gameId, action);
      onActionSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit action');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-avalon-gold mb-1">
          Quest {questNumber} in Progress
        </h2>
        <p className="text-avalon-silver/80 text-sm">
          {questRequirement.fails === 2 ? (
            <span className="text-amber-400">⚠️ This quest requires 2 fails to fail!</span>
          ) : (
            'One fail card will doom this quest'
          )}
        </p>
      </div>

      {/* Quest Team */}
      <div className="bg-avalon-dark-blue/50 rounded-xl p-4 border border-avalon-silver/20">
        <p className="text-sm text-avalon-silver/60 mb-3 text-center">Quest Team:</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {teamMembers.map((member) => {
            const isMe = member.id === currentPlayerId;
            return (
              <div
                key={member.id}
                className={`
                  flex flex-col items-center p-2 rounded-lg
                  ${isMe ? 'bg-avalon-gold/20 border border-avalon-gold/40' : 'bg-emerald-500/10'}
                `}
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                    ${isMe ? 'bg-avalon-gold/30 text-avalon-gold' : 'bg-emerald-500/20 text-emerald-400'}
                  `}
                >
                  {member.nickname.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs mt-1 ${isMe ? 'text-avalon-gold' : 'text-avalon-silver/80'}`}>
                  {isMe ? 'You' : member.nickname}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div className="text-center">
        <p className="text-avalon-silver/60 text-sm mb-2">
          {actionsSubmitted} / {totalTeamMembers} actions submitted
        </p>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto h-2 bg-avalon-dark-blue rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${(actionsSubmitted / totalTeamMembers) * 100}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {amTeamMember ? (
        hasSubmittedAction ? (
          <div className="text-center">
            <p className="text-emerald-400 mb-2">✓ Action submitted!</p>
            <p className="text-avalon-silver/60 text-sm animate-pulse">
              Waiting for other team members...
            </p>
          </div>
        ) : canSubmitAction ? (
          <div className="space-y-4">
            <p className="text-center text-avalon-silver/80 text-sm">
              Choose your action:
            </p>
            
            <div className="flex justify-center gap-4">
              <Button
                variant="primary"
                onClick={() => handleAction('success')}
                disabled={submitting}
                isLoading={submitting}
                className="!bg-emerald-600 hover:!bg-emerald-500 min-w-[140px]"
              >
                ✓ Success
              </Button>
              
              {canFail && (
                <Button
                  variant="primary"
                  onClick={() => handleAction('fail')}
                  disabled={submitting}
                  isLoading={submitting}
                  className="!bg-red-600 hover:!bg-red-500 min-w-[140px]"
                >
                  ✗ Fail
                </Button>
              )}
            </div>
            
            {!canFail && (
              <p className="text-center text-avalon-silver/60 text-xs">
                As a loyal servant of Arthur, you can only play Success
              </p>
            )}
          </div>
        ) : null
      ) : (
        <div className="text-center text-avalon-silver/60">
          <p>You are not on this quest team.</p>
          <p className="text-sm animate-pulse mt-2">
            Waiting for the team to complete the quest...
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}

