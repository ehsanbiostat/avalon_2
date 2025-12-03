'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RoleConfigPanel } from '@/components/RoleConfigPanel';
import { RoleConfigSummary } from '@/components/RoleConfigSummary';
import { MIN_PLAYERS, MAX_PLAYERS, ROLE_RATIOS } from '@/lib/utils/constants';
import { validateRoleConfig } from '@/lib/domain/role-config';
import type { RoleConfig } from '@/types/role-config';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (expectedPlayers: number, roleConfig: RoleConfig) => Promise<void>;
  isLoading?: boolean;
}

/**
 * T027: Modal for creating a new game room
 * Updated for Phase 2: Includes role configuration panel
 */
export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  isLoading = false,
}: CreateRoomModalProps) {
  const [expectedPlayers, setExpectedPlayers] = useState(5);
  const [roleConfig, setRoleConfig] = useState<RoleConfig>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateRoom(expectedPlayers, roleConfig);
  };

  // T029b: Reset invalid options when player count changes
  const handlePlayerCountChange = (count: number) => {
    setExpectedPlayers(count);
    // Re-validate and clear invalid options
    const validation = validateRoleConfig(roleConfig, count);
    if (!validation.valid) {
      // Reset to default config if current is invalid
      setRoleConfig({});
    }
  };

  const playerOptions = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, i) => MIN_PLAYERS + i
  );

  const validation = validateRoleConfig(roleConfig, expectedPlayers);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a New Room"
      size="lg"
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
                onClick={() => handlePlayerCountChange(num)}
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

        {/* Team Composition Summary */}
        <div className="p-4 bg-avalon-midnight/50 rounded-lg border border-avalon-silver/20">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-display text-avalon-gold text-sm">Team Composition</h4>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-avalon-silver hover:text-avalon-gold transition-colors"
            >
              {showAdvanced ? '▼ Hide Advanced' : '▶ Advanced Options'}
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-good-light">
              Good: {ROLE_RATIOS[expectedPlayers]?.good ?? 0}
            </span>
            <span className="text-evil-light">
              Evil: {ROLE_RATIOS[expectedPlayers]?.evil ?? 0}
            </span>
          </div>
          
          {/* Compact role summary when advanced is hidden */}
          {!showAdvanced && Object.keys(roleConfig).length > 0 && (
            <RoleConfigSummary 
              config={roleConfig} 
              expectedPlayers={expectedPlayers}
              compact
              className="mt-2 pt-2 border-t border-avalon-silver/10"
            />
          )}
        </div>

        {/* Advanced Role Configuration */}
        {showAdvanced && (
          <div className="border border-avalon-silver/20 rounded-lg p-4 bg-avalon-midnight/30">
            <h4 className="font-display text-avalon-parchment text-sm mb-4">
              Configure Special Roles
            </h4>
            <RoleConfigPanel
              expectedPlayers={expectedPlayers}
              config={roleConfig}
              onChange={setRoleConfig}
            />
            
            {/* Full summary */}
            <RoleConfigSummary 
              config={roleConfig} 
              expectedPlayers={expectedPlayers}
              className="mt-4"
            />
          </div>
        )}

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
            disabled={!validation.valid}
            fullWidth
          >
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
