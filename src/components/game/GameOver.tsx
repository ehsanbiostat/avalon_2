'use client';

/**
 * GameOver Component
 * Shows final game result
 */

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { GameWinner, QuestResult } from '@/types/game';
import { getWinnerAnnouncement, getWinReasonText, countQuestResults } from '@/lib/domain/win-conditions';

interface GameOverProps {
  winner: GameWinner;
  winReason: string;
  questResults: QuestResult[];
  playerRole?: 'good' | 'evil';
}

export function GameOver({
  winner,
  winReason,
  questResults,
  playerRole,
}: GameOverProps) {
  const router = useRouter();
  
  const isWinner = playerRole === winner;
  const score = countQuestResults(questResults);
  const announcement = getWinnerAnnouncement(winner, winReason as '3_quest_successes' | '3_quest_failures' | '5_rejections');
  const reasonText = getWinReasonText(winReason as '3_quest_successes' | '3_quest_failures' | '5_rejections');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
      {/* Winner Banner */}
      <div
        className={`
          w-full max-w-md text-center p-8 rounded-2xl
          ${winner === 'good'
            ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-900/30 border-2 border-emerald-500/50'
            : 'bg-gradient-to-br from-red-500/30 to-red-900/30 border-2 border-red-500/50'}
        `}
      >
        {/* Trophy/Skull Icon */}
        <div className="text-7xl mb-4 animate-bounce">
          {winner === 'good' ? '🏆' : '💀'}
        </div>
        
        {/* Winner Text */}
        <h1
          className={`text-3xl font-bold mb-2 ${winner === 'good' ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {winner === 'good' ? 'Good Wins!' : 'Evil Wins!'}
        </h1>
        
        {/* Announcement */}
        <p className="text-xl text-avalon-silver/90 mb-3">
          {announcement}
        </p>
        
        {/* Reason */}
        <p className="text-avalon-silver/70">
          {reasonText}
        </p>
      </div>

      {/* Personal Result */}
      {playerRole && (
        <div
          className={`
            px-6 py-3 rounded-xl text-lg font-bold
            ${isWinner
              ? 'bg-avalon-gold/20 text-avalon-gold border border-avalon-gold/40'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'}
          `}
        >
          {isWinner ? '🎉 You Win!' : '😔 You Lose'}
          <span className="ml-2 text-sm font-normal">
            (You were {playerRole === 'good' ? 'Good' : 'Evil'})
          </span>
        </div>
      )}

      {/* Final Score */}
      <div className="bg-avalon-dark-blue/50 rounded-xl p-6 border border-avalon-silver/20">
        <h3 className="text-sm text-avalon-silver/60 text-center mb-4">Final Score</h3>
        <div className="flex justify-center gap-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400">{score.good}</div>
            <div className="text-sm text-avalon-silver/60">Good</div>
          </div>
          <div className="text-2xl text-avalon-silver/40 self-center">vs</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">{score.evil}</div>
            <div className="text-sm text-avalon-silver/60">Evil</div>
          </div>
        </div>
      </div>

      {/* Quest Results Summary */}
      <div className="flex justify-center gap-3">
        {questResults.map((result, index) => (
          <div
            key={index}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
              ${result.result === 'success'
                ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                : 'bg-red-500/20 border-2 border-red-500 text-red-400'}
            `}
          >
            {result.result === 'success' ? '✓' : '✗'}
          </div>
        ))}
        {/* Empty slots */}
        {Array(5 - questResults.length).fill(null).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-avalon-dark-blue border-2 border-avalon-silver/20 text-avalon-silver/40"
          >
            -
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/')}
        >
          Back to Home
        </Button>
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
        >
          View Game Again
        </Button>
      </div>
    </div>
  );
}

