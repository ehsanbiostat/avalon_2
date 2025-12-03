'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MIN_PLAYERS, MAX_PLAYERS } from '@/lib/utils/constants';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (expectedPlayers: number) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Modal for creating a new game room
 */
export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  isLoading = false,
}: CreateRoomModalProps) {
  const [expectedPlayers, setExpectedPlayers] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateRoom(expectedPlayers);
  };

  const playerOptions = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, i) => MIN_PLAYERS + i
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a New Room"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-avalon-parchment mb-2">
            Number of Players
          </label>
          <p className="text-sm text-avalon-silver/70 mb-4">
            Select how many knights will join this quest (5-10 players)
          </p>

          <div className="grid grid-cols-3 gap-3">
            {playerOptions.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setExpectedPlayers(num)}
                className={`
                  py-3 px-4 rounded-lg font-display text-lg transition-all
                  ${expectedPlayers === num
                    ? 'bg-avalon-gold text-avalon-midnight ring-2 ring-avalon-gold ring-offset-2 ring-offset-avalon-navy'
                    : 'bg-avalon-midnight border border-avalon-silver/30 text-avalon-silver hover:border-avalon-gold/50'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-avalon-midnight/50 rounded-lg border border-avalon-silver/20">
          <h4 className="font-display text-avalon-gold text-sm mb-2">Team Composition</h4>
          <div className="flex justify-between text-sm">
            <span className="text-good-light">
              Good: {getRoleCount(expectedPlayers, 'good')}
            </span>
            <span className="text-evil-light">
              Evil: {getRoleCount(expectedPlayers, 'evil')}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
          >
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Get role count for display
 */
function getRoleCount(players: number, role: 'good' | 'evil'): number {
  const ratios: Record<number, { good: number; evil: number }> = {
    5: { good: 3, evil: 2 },
    6: { good: 4, evil: 2 },
    7: { good: 4, evil: 3 },
    8: { good: 5, evil: 3 },
    9: { good: 6, evil: 3 },
    10: { good: 6, evil: 4 },
  };
  return ratios[players]?.[role] ?? 0;
}
