'use client';

/**
 * QuestTracker Component
 * Shows quest progress (5 quest slots with results)
 */

import { getQuestRequirement, requiresTwoFails } from '@/lib/domain/quest-config';
import type { QuestResult } from '@/types/game';

interface QuestTrackerProps {
  playerCount: number;
  currentQuest: number;
  questResults: QuestResult[];
  voteTrack: number;
}

export function QuestTracker({
  playerCount,
  currentQuest,
  questResults,
  voteTrack,
}: QuestTrackerProps) {
  const quests = [1, 2, 3, 4, 5];
  
  const getQuestStatus = (questNum: number): 'pending' | 'current' | 'success' | 'fail' => {
    const result = questResults.find((r) => r.quest === questNum);
    if (result) {
      return result.result === 'success' ? 'success' : 'fail';
    }
    if (questNum === currentQuest) {
      return 'current';
    }
    return 'pending';
  };

  const goodWins = questResults.filter((r) => r.result === 'success').length;
  const evilWins = questResults.filter((r) => r.result === 'fail').length;

  return (
    <div className="bg-avalon-dark-blue/50 rounded-xl p-4 border border-avalon-silver/20">
      {/* Quest Slots */}
      <div className="flex justify-center gap-3 mb-4">
        {quests.map((questNum) => {
          const status = getQuestStatus(questNum);
          const requirement = getQuestRequirement(playerCount, questNum);
          const needsTwoFails = requiresTwoFails(playerCount, questNum);
          
          return (
            <div key={questNum} className="flex flex-col items-center">
              <div
                className={`
                  relative w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold
                  border-2 transition-all duration-300
                  ${status === 'pending' ? 'border-avalon-silver/30 bg-avalon-dark-blue text-avalon-silver/50' : ''}
                  ${status === 'current' ? 'border-avalon-gold bg-avalon-gold/20 text-avalon-gold animate-pulse' : ''}
                  ${status === 'success' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : ''}
                  ${status === 'fail' ? 'border-red-500 bg-red-500/20 text-red-400' : ''}
                `}
              >
                {status === 'success' && '✓'}
                {status === 'fail' && '✗'}
                {(status === 'pending' || status === 'current') && questNum}
                
                {/* Two fails required indicator */}
                {needsTwoFails && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    2!
                  </div>
                )}
              </div>
              
              {/* Team size */}
              <span className="text-xs text-avalon-silver/60 mt-1">
                {requirement.size} players
              </span>
            </div>
          );
        })}
      </div>

      {/* Score Bar */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-emerald-400 font-bold">{goodWins}</span>
          <span className="text-avalon-silver/60 text-sm">Good</span>
        </div>
        
        <div className="text-avalon-silver/40 text-sm">vs</div>
        
        <div className="flex items-center gap-2">
          <span className="text-avalon-silver/60 text-sm">Evil</span>
          <span className="text-red-400 font-bold">{evilWins}</span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>
      </div>

      {/* Vote Track */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-avalon-silver/60">Vote Track:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((pos) => (
            <div
              key={pos}
              className={`
                w-5 h-5 rounded-full border flex items-center justify-center text-xs
                transition-all duration-300
                ${pos <= voteTrack 
                  ? 'border-red-500 bg-red-500/30 text-red-400' 
                  : 'border-avalon-silver/30 bg-avalon-dark-blue text-avalon-silver/40'}
                ${pos === 5 && pos <= voteTrack ? 'animate-pulse' : ''}
              `}
            >
              {pos}
            </div>
          ))}
        </div>
        {voteTrack >= 4 && (
          <span className="text-xs text-red-400 animate-pulse ml-2">
            {voteTrack === 4 ? 'Danger!' : 'Evil Wins!'}
          </span>
        )}
      </div>
    </div>
  );
}

