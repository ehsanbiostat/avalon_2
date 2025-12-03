'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

// Special role type
type SpecialRole = 'merlin' | 'percival' | 'servant' | 'assassin' | 'morgana' | 'mordred' | 'oberon' | 'minion';

interface RoleRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'good' | 'evil';
  specialRole?: SpecialRole;
  roleName: string;
  roleDescription: string;
  knownPlayers?: string[];
  knownPlayersLabel?: string;
  isConfirmed: boolean;
  onConfirm: () => Promise<void>;
}

// Role-specific icons
const ROLE_ICONS: Record<SpecialRole, string> = {
  merlin: '🧙',
  percival: '⚔️',
  servant: '🛡️',
  assassin: '🗡️',
  morgana: '🔮',
  mordred: '👑',
  oberon: '👤',
  minion: '⚫',
};

/**
 * Modal for revealing player's assigned role
 */
export function RoleRevealModal({
  isOpen,
  onClose,
  role,
  specialRole,
  roleName,
  roleDescription,
  knownPlayers,
  knownPlayersLabel,
  isConfirmed,
  onConfirm,
}: RoleRevealModalProps) {
  const isEvil = role === 'evil';
  const icon = specialRole ? ROLE_ICONS[specialRole] : (isEvil ? '🗡️' : '🛡️');

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
            {icon}
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

          {/* Alignment Badge */}
          <div className="mb-3">
            <span
              className={`
                px-3 py-1 rounded-full text-xs uppercase tracking-wider font-bold
                ${isEvil 
                  ? 'bg-evil/30 text-evil-light border border-evil/50' 
                  : 'bg-good/30 text-good-light border border-good/50'
                }
              `}
            >
              {isEvil ? '⚫ Evil' : '⚪ Good'}
            </span>
          </div>

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

        {/* Known Players Section (for Merlin, Percival, Evil) */}
        {knownPlayers && knownPlayers.length > 0 && knownPlayersLabel && (
          <div 
            className={`
              p-4 rounded-lg border
              ${specialRole === 'merlin' || specialRole === 'percival'
                ? 'bg-avalon-midnight/50 border-good/30'
                : 'bg-avalon-midnight/50 border-evil/30'
              }
            `}
          >
            <h3 
              className={`
                font-display text-sm uppercase tracking-wider mb-3
                ${specialRole === 'merlin' 
                  ? 'text-evil-light' 
                  : specialRole === 'percival'
                    ? 'text-good-light'
                    : 'text-evil-light'
                }
              `}
            >
              {knownPlayersLabel}
            </h3>
            <div className="flex flex-wrap gap-2">
              {knownPlayers.map((name) => (
                <span
                  key={name}
                  className={`
                    px-3 py-1 rounded-full text-sm
                    ${specialRole === 'merlin'
                      ? 'bg-evil/20 text-evil-light'
                      : specialRole === 'percival'
                        ? 'bg-good/20 text-good-light'
                        : 'bg-evil/20 text-evil-light'
                    }
                  `}
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
            {specialRole === 'merlin' ? (
              <>
                🧙 <strong>Use your knowledge wisely!</strong> Guide your team
                but beware — if the Assassin discovers you, all is lost!
              </>
            ) : specialRole === 'assassin' ? (
              <>
                🗡️ <strong>Find Merlin!</strong> If the good team wins, you have
                one chance to assassinate Merlin and steal victory!
              </>
            ) : specialRole === 'percival' ? (
              <>
                ⚔️ <strong>Protect Merlin!</strong> One of the players shown
                is Merlin — but Morgana may be deceiving you!
              </>
            ) : specialRole === 'morgana' ? (
              <>
                🔮 <strong>Deceive Percival!</strong> Appear as Merlin to confuse
                the good team. Sow chaos and sabotage!
              </>
            ) : specialRole === 'mordred' ? (
              <>
                👑 <strong>Hidden from Merlin!</strong> Even the wizard cannot
                see your evil nature. Lead from the shadows!
              </>
            ) : specialRole === 'oberon' ? (
              <>
                👤 <strong>Work alone!</strong> You don't know the other evil
                players. Sabotage carefully without coordination.
              </>
            ) : isEvil ? (
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
