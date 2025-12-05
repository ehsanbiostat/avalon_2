'use client';

/**
 * ReclaimConfirmation Component
 * Phase 6: Player Recovery & Reconnection
 *
 * Modal for confirming seat reclaim in a room.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { getPlayerId } from '@/lib/utils/player-id';
import type { ReclaimSuccessResponse, ReclaimErrorResponse } from '@/types/player';

interface ReclaimConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  nicknameToReclaim: string;
}

export function ReclaimConfirmation({
  isOpen,
  onClose,
  roomCode,
  nicknameToReclaim,
}: ReclaimConfirmationProps) {
  const router = useRouter();
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gracePeriod, setGracePeriod] = useState<number | null>(null);
  const [autoRetryIn, setAutoRetryIn] = useState<number | null>(null);

  // T060: Auto-retry countdown
  useEffect(() => {
    if (gracePeriod !== null && gracePeriod > 0) {
      setAutoRetryIn(gracePeriod);
    }
  }, [gracePeriod]);

  // Countdown timer for auto-retry
  useEffect(() => {
    if (autoRetryIn === null || autoRetryIn <= 0) return;

    const timer = setInterval(() => {
      setAutoRetryIn((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRetryIn]);

  // T060: Auto-retry when countdown reaches 0
  useEffect(() => {
    if (autoRetryIn === 0) {
      handleReclaim();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRetryIn]);

  const handleReclaim = useCallback(async () => {
    setIsReclaiming(true);
    setError(null);
    setGracePeriod(null);

    try {
      const playerId = getPlayerId();

      const response = await fetch(`/api/rooms/${roomCode}/reclaim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': playerId,
        },
        body: JSON.stringify({ nickname: nicknameToReclaim }),
      });

      const data = await response.json() as ReclaimSuccessResponse | ReclaimErrorResponse;

      if (data.success) {
        // T053: Redirect to room or game
        const successData = data as ReclaimSuccessResponse;
        if (successData.game_id) {
          router.push(`/game/${successData.game_id}`);
        } else {
          router.push(`/rooms/${successData.room_code}`);
        }
        onClose();
      } else {
        // T054, T058, T059: Handle errors
        const errorData = data as ReclaimErrorResponse;

        if (errorData.error === 'PLAYER_ACTIVE') {
          setError('This player is currently active. They must disconnect first.');
        } else if (errorData.error === 'GRACE_PERIOD' && errorData.grace_period_remaining) {
          setError(`Please wait ${Math.ceil(errorData.grace_period_remaining)} seconds...`);
          setGracePeriod(errorData.grace_period_remaining);
        } else {
          setError(errorData.message);
        }
      }
    } catch {
      setError('Failed to reclaim seat. Please try again.');
    } finally {
      setIsReclaiming(false);
    }
  }, [roomCode, nicknameToReclaim, router, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reclaim Your Seat"
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-avalon-text-secondary">
            You are about to reclaim the seat for:
          </p>
          <p className="text-xl font-bold text-avalon-gold">
            {nicknameToReclaim}
          </p>
          <p className="text-sm text-avalon-text-muted">
            in room <span className="font-mono font-bold">{roomCode}</span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* T059: Grace period countdown */}
        {gracePeriod !== null && autoRetryIn !== null && autoRetryIn > 0 && (
          <div className="text-center">
            <p className="text-sm text-avalon-text-muted">
              Auto-retrying in {autoRetryIn} seconds...
            </p>
            <div className="mt-2 h-1 bg-avalon-dark-lighter rounded-full overflow-hidden">
              <div
                className="h-full bg-avalon-accent transition-all duration-1000"
                style={{
                  width: `${(autoRetryIn / gracePeriod) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isReclaiming}
            className="flex-1 py-2 px-4 rounded-lg border border-avalon-dark-border text-avalon-text-secondary hover:bg-avalon-dark-lighter transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReclaim}
            disabled={isReclaiming || (autoRetryIn !== null && autoRetryIn > 0)}
            className="flex-1 py-2 px-4 rounded-lg bg-avalon-accent hover:bg-avalon-accent-hover text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReclaiming ? 'Reclaiming...' : 'Reclaim Seat'}
          </button>
        </div>

        <p className="text-xs text-center text-avalon-text-muted">
          This will transfer the seat from the disconnected player to your current session.
        </p>
      </div>
    </Modal>
  );
}
