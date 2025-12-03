'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface RoleRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'good' | 'evil';
  roleName: string;
  roleDescription: string;
  evilTeammates?: string[];
  isConfirmed: boolean;
  onConfirm: () => Promise<void>;
}

/**
 * Modal for revealing player's assigned role
 */
export function RoleRevealModal({
  isOpen,
  onClose,
  role,
  roleName,
  roleDescription,
  evilTeammates,
  isConfirmed,
  onConfirm,
}: RoleRevealModalProps) {
  const isEvil = role === 'evil';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Your Role"
      size="md"
    >
      <div className="space-y-6">
        {/* Role Card */}
        <div
          className={`
            p-6 rounded-xl text-center
            ${isEvil
              ? 'bg-gradient-to-br from-evil/30 to-evil-dark/30 border border-evil/50'
              : 'bg-gradient-to-br from-good/30 to-good-dark/30 border border-good/50'
            }
          `}
        >
          {/* Role Icon */}
          <div className="text-5xl mb-4">
            {isEvil ? '🗡️' : '🛡️'}
          </div>

          {/* Role Name */}
          <h2
            className={`
              text-2xl font-display font-bold mb-2
              ${isEvil ? 'text-evil-light' : 'text-good-light'}
            `}
          >
            {roleName}
          </h2>

          {/* Role Description */}
          <p
            className={`
              text-sm
              ${isEvil ? 'text-evil-light/80' : 'text-good-light/80'}
            `}
          >
            {roleDescription}
          </p>
        </div>

        {/* Evil Teammates (only for Evil players) */}
        {isEvil && evilTeammates && evilTeammates.length > 0 && (
          <div className="p-4 bg-avalon-midnight/50 rounded-lg border border-evil/30">
            <h3 className="font-display text-evil-light text-sm uppercase tracking-wider mb-3">
              Your Fellow Minions
            </h3>
            <div className="flex flex-wrap gap-2">
              {evilTeammates.map((name) => (
                <span
                  key={name}
                  className="px-3 py-1 bg-evil/20 text-evil-light rounded-full text-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-avalon-midnight/50 rounded-lg border border-avalon-silver/20">
          <p className="text-avalon-parchment/70 text-sm text-center">
            {isEvil ? (
              <>
                🤫 <strong>Keep your identity secret!</strong> Work with your
                fellow minions to sabotage the quests without being discovered.
              </>
            ) : (
              <>
                ⚔️ <strong>Stay vigilant!</strong> Work with your fellow knights
                to complete the quests and root out the traitors.
              </>
            )}
          </p>
        </div>

        {/* Confirm Button */}
        {!isConfirmed ? (
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={onConfirm}
          >
            I Understand My Role
          </Button>
        ) : (
          <div className="text-center">
            <span className="badge bg-good/20 text-good">
              ✓ Role Confirmed
            </span>
            <Button
              variant="secondary"
              fullWidth
              className="mt-4"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
