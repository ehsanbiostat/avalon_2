'use client';

/**
 * QuestResultDisplay Component
 * Shows quest result animation after completion
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { QuestResult } from '@/types/game';
import { continueGame } from '@/lib/api/game';

interface QuestResultDisplayProps {
  gameId: string;
  questResult: QuestResult;
  failsRequired: number;
  onContinue: () => void;
}

export function QuestResultDisplay({
  gameId,
  questResult,
  failsRequired,
  onContinue,
}: QuestResultDisplayProps) {
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuccess = questResult.result === 'success';
  const teamSize = questResult.success_count + questResult.fail_count;

  const handleContinue = async () => {
    setContinuing(true);
    setError(null);
    
    try {
      await continueGame(gameId);
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue');
    } finally {
      setContinuing(false);
    }
  };

  // Generate shuffled card display
  const cards: ('success' | 'fail')[] = [
    ...Array(questResult.success_count).fill('success'),
    ...Array(questResult.fail_count).fill('fail'),
  ].sort(() => Math.random() - 0.5);

  return (
    <div className="space-y-6">
      {/* Result Header */}
      <div
        className={`
          text-center p-6 rounded-xl
          ${isSuccess 
            ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30' 
            : 'bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30'}
        `}
      >
        <div className={`text-6xl mb-4 ${isSuccess ? 'animate-bounce' : 'animate-pulse'}`}>
          {isSuccess ? '🏆' : '💀'}
        </div>
        
        <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
          Quest {questResult.quest} {isSuccess ? 'Succeeded!' : 'Failed!'}
        </h2>
        
        <p className="text-avalon-silver/80">
          {isSuccess ? (
            'The loyal servants have completed the quest!'
          ) : failsRequired === 2 ? (
            `${questResult.fail_count} fail cards were played (${failsRequired} required to fail)`
          ) : (
            `${questResult.fail_count} fail card${questResult.fail_count > 1 ? 's' : ''} ${questResult.fail_count > 1 ? 'were' : 'was'} played`
          )}
        </p>
      </div>

      {/* Cards Reveal */}
      <div className="text-center">
        <p className="text-sm text-avalon-silver/60 mb-3">Cards Played:</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`
                w-14 h-20 rounded-lg flex items-center justify-center text-2xl
                transform transition-all duration-500 hover:scale-110
                ${card === 'success' 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30' 
                  : 'bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30'}
              `}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'flip-in 0.5s ease-out forwards',
              }}
            >
              {card === 'success' ? '✓' : '✗'}
            </div>
          ))}
        </div>
      </div>

      {/* Card Count Summary */}
      <div className="flex justify-center gap-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{questResult.success_count}</div>
          <div className="text-xs text-avalon-silver/60">Success</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{questResult.fail_count}</div>
          <div className="text-xs text-avalon-silver/60">Fail</div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="text-center">
        {error && (
          <p className="text-red-400 text-sm mb-2">{error}</p>
        )}
        
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={continuing}
          isLoading={continuing}
        >
          Continue to Next Quest
        </Button>
      </div>

      <style jsx>{`
        @keyframes flip-in {
          0% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          100% {
            transform: rotateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

