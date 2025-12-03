'use client';

/**
 * VoteResultReveal Component
 * Shows voting results for 5 seconds after all votes are in
 */

import { useEffect, useState } from 'react';
import type { VoteInfo } from '@/types/game';

interface VoteResultRevealProps {
  votes: VoteInfo[];
  isApproved: boolean;
  approveCount: number;
  rejectCount: number;
  onComplete: () => void;
}

const DISPLAY_DURATION = 15000; // 15 seconds

export function VoteResultReveal({
  votes,
  isApproved,
  approveCount,
  rejectCount,
  onComplete,
}: VoteResultRevealProps) {
  const [timeLeft, setTimeLeft] = useState(15);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      onComplete();
    }, DISPLAY_DURATION);

    return () => {
      clearInterval(timer);
      clearTimeout(dismissTimer);
    };
  }, [onComplete]);

  const approveVotes = votes.filter((v) => v.vote === 'approve');
  const rejectVotes = votes.filter((v) => v.vote === 'reject');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-avalon-navy border-2 border-avalon-gold/50 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl animate-slide-up">
        {/* Header with Result */}
        <div className="text-center mb-6">
          <div className={`text-5xl mb-3 ${isApproved ? 'animate-bounce' : 'animate-pulse'}`}>
            {isApproved ? '✅' : '❌'}
          </div>
          <h2 className={`text-2xl font-bold ${isApproved ? 'text-emerald-400' : 'text-red-400'}`}>
            Team {isApproved ? 'Approved!' : 'Rejected!'}
          </h2>
          <p className="text-avalon-silver/70 text-sm mt-1">
            {approveCount} approved • {rejectCount} rejected
          </p>
        </div>

        {/* Vote Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Approve Column */}
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
            <h3 className="text-emerald-400 font-bold text-sm mb-3 text-center">
              👍 Approved ({approveCount})
            </h3>
            <div className="space-y-2">
              {approveVotes.map((vote) => (
                <div
                  key={vote.player_id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    {vote.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-avalon-silver/90 truncate">
                    {vote.nickname}
                  </span>
                </div>
              ))}
              {approveVotes.length === 0 && (
                <p className="text-avalon-silver/50 text-xs text-center">No approvals</p>
              )}
            </div>
          </div>

          {/* Reject Column */}
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
            <h3 className="text-red-400 font-bold text-sm mb-3 text-center">
              👎 Rejected ({rejectCount})
            </h3>
            <div className="space-y-2">
              {rejectVotes.map((vote) => (
                <div
                  key={vote.player_id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                    {vote.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-avalon-silver/90 truncate">
                    {vote.nickname}
                  </span>
                </div>
              ))}
              {rejectVotes.length === 0 && (
                <p className="text-avalon-silver/50 text-xs text-center">No rejections</p>
              )}
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-avalon-dark-blue rounded-full">
            <div className="w-2 h-2 rounded-full bg-avalon-gold animate-pulse" />
            <span className="text-avalon-silver/70 text-sm">
              Continuing in {timeLeft}s...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

