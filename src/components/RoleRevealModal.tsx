'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { SplitIntelVisibility, OberonSplitIntelVisibility } from '@/types/game';

// Special role type (Phase 2: includes oberon variants)
type SpecialRole =
  | 'merlin'
  | 'percival'
  | 'servant'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon_standard'
  | 'oberon_chaos'
  | 'minion';

interface RoleRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'good' | 'evil';
  specialRole?: SpecialRole;
  roleName: string;
  roleDescription: string;
  knownPlayers?: string[];
  knownPlayersLabel?: string;
  hiddenEvilCount?: number;
  hasLadyOfLake?: boolean;
  isConfirmed: boolean;
  onConfirm: () => Promise<void>;
  // Feature 009: Merlin Decoy Mode
  hasDecoy?: boolean;
  decoyWarning?: string;
  // Feature 011: Merlin Split Intel Mode
  splitIntel?: SplitIntelVisibility;
  // Feature 018: Oberon Split Intel Mode
  oberonSplitIntel?: OberonSplitIntelVisibility;
}

// Role-specific icons (Phase 2: added oberon variants)
const ROLE_ICONS: Record<SpecialRole, string> = {
  merlin: '🧙',
  percival: '🛡️',
  servant: '⚔️',
  assassin: '🗡️',
  morgana: '🧙‍♀️',
  mordred: '🐍',
  oberon_standard: '👤',
  oberon_chaos: '👻',
  minion: '😈',
};

/**
 * Modal for revealing player's assigned role
 * T046: Updated for Phase 2 to show Lady of Lake and hidden evil count
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
  hiddenEvilCount,
  hasLadyOfLake,
  isConfirmed,
  onConfirm,
  hasDecoy,
  decoyWarning,
  splitIntel,
  oberonSplitIntel,
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

        {/* Feature 011: Split Intel Two-Group Display (Merlin only) */}
        {specialRole === 'merlin' && splitIntel?.enabled && (
          <div className="space-y-4">
            {/* T023: Certain Evil Group */}
            {splitIntel.certainEvil.length > 0 && (
              <div className="p-4 rounded-lg bg-red-950/50 border border-red-500/40">
                <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-red-300 flex items-center gap-2">
                  <span>🎯</span>
                  <span>{splitIntel.certainLabel}</span>
                </h3>
                <p className="text-red-300/70 text-xs mb-3">{splitIntel.certainDescription}</p>
                <div className="flex flex-wrap gap-2">
                  {splitIntel.certainEvil.map((player) => (
                    <span
                      key={player.id}
                      className="px-3 py-1.5 rounded-full text-sm bg-red-500/20 text-red-200 border border-red-500/30 font-medium"
                    >
                      {player.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* T024: Mixed Intel Group */}
            <div className="p-4 rounded-lg bg-amber-950/50 border border-amber-500/40">
              <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-amber-300 flex items-center gap-2">
                <span>❓</span>
                <span>{splitIntel.mixedLabel}</span>
              </h3>
              <p className="text-amber-300/70 text-xs mb-3">{splitIntel.mixedDescription}</p>
              <div className="flex flex-wrap gap-2">
                {splitIntel.mixedIntel.map((player) => (
                  <span
                    key={player.id}
                    className="px-3 py-1.5 rounded-full text-sm bg-amber-500/20 text-amber-200 border border-amber-500/30 font-medium"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>

            {/* T025: Hidden Evil Warning (for Split Intel) */}
            {splitIntel.hiddenWarning && (
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-center">
                <p className="text-yellow-300 text-sm">
                  ⚠️ <strong>{splitIntel.hiddenWarning}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feature 018: Oberon Split Intel Two-Group Display (Merlin only) */}
        {specialRole === 'merlin' && oberonSplitIntel?.enabled && (
          <div className="space-y-4">
            {/* Certain Evil Group (Morgana, Assassin - NOT Oberon) */}
            {oberonSplitIntel.certainEvil.length > 0 && (
              <div className="p-4 rounded-lg bg-red-950/50 border border-red-500/40">
                <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-red-300 flex items-center gap-2">
                  <span>🎯</span>
                  <span>{oberonSplitIntel.certainLabel}</span>
                </h3>
                <p className="text-red-300/70 text-xs mb-3">{oberonSplitIntel.certainDescription}</p>
                <div className="flex flex-wrap gap-2">
                  {oberonSplitIntel.certainEvil.map((player) => (
                    <span
                      key={player.id}
                      className="px-3 py-1.5 rounded-full text-sm bg-red-500/20 text-red-200 border border-red-500/30 font-medium"
                    >
                      {player.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Certain Evil Group Message (when only Oberon is visible evil) */}
            {oberonSplitIntel.certainEvil.length === 0 && (
              <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/20">
                <h3 className="font-display text-sm uppercase tracking-wider mb-2 text-red-300/70 flex items-center gap-2">
                  <span>🎯</span>
                  <span>{oberonSplitIntel.certainLabel}</span>
                </h3>
                <p className="text-red-300/50 text-xs italic">
                  No coordinated evil players visible (Oberon is the only visible evil)
                </p>
              </div>
            )}

            {/* Mixed Intel Group (Oberon + good player) */}
            <div className="p-4 rounded-lg bg-teal-950/50 border border-teal-500/40">
              <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-teal-300 flex items-center gap-2">
                <span>❓</span>
                <span>{oberonSplitIntel.mixedLabel}</span>
              </h3>
              <p className="text-teal-300/70 text-xs mb-3">{oberonSplitIntel.mixedDescription}</p>
              <div className="flex flex-wrap gap-2">
                {oberonSplitIntel.mixedIntel.map((player) => (
                  <span
                    key={player.id}
                    className="px-3 py-1.5 rounded-full text-sm bg-teal-500/20 text-teal-200 border border-teal-500/30 font-medium"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Hidden Evil Warning (only Mordred can be hidden in this mode) */}
            {oberonSplitIntel.hiddenWarning && (
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-center">
                <p className="text-yellow-300 text-sm">
                  ⚠️ <strong>{oberonSplitIntel.hiddenWarning}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Known Players Section (for Merlin without Split Intel or Oberon Split Intel, Percival, Evil) */}
        {knownPlayers && knownPlayers.length > 0 && knownPlayersLabel && !splitIntel?.enabled && !oberonSplitIntel?.enabled && (
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

        {/* T046: Lady of the Lake Indicator */}
        {hasLadyOfLake && (
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 text-center">
            <span className="text-2xl mb-2 block">🌊</span>
            <p className="text-blue-300 font-medium">You hold the Lady of the Lake</p>
            <p className="text-blue-300/70 text-xs mt-1">
              Use this token to investigate loyalties in future rounds
            </p>
          </div>
        )}

        {/* Feature 009: Merlin Decoy Warning (only when NOT using split intel or oberon split intel) */}
        {specialRole === 'merlin' && hasDecoy && !splitIntel?.enabled && !oberonSplitIntel?.enabled && (
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-center">
            <p className="text-amber-300 text-sm">
              🃏 <strong>1 good player is hidden among the suspects!</strong>
            </p>
          </div>
        )}

        {/* Hidden Evil Warning (for Merlin without split intel or oberon split intel) */}
        {specialRole === 'merlin' && hiddenEvilCount !== undefined && hiddenEvilCount > 0 && !splitIntel?.enabled && !oberonSplitIntel?.enabled && (
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-center">
            <p className="text-yellow-300 text-sm">
              ⚠️ <strong>{hiddenEvilCount} evil {hiddenEvilCount === 1 ? 'player is' : 'players are'} hidden from you!</strong>
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-avalon-midnight/50 rounded-lg border border-avalon-silver/20">
          <p className="text-avalon-parchment/70 text-sm text-center">
            {specialRole === 'merlin' && oberonSplitIntel?.enabled ? (
              <>
                🧙 <strong>You see the evil team divided!</strong> The Certain Evil group contains
                the coordinated evil (Morgana, Assassin), but Oberon — the lone wolf — is mixed
                with a good player. Deduce who Oberon is! Be careful, the Assassin is hunting you!
              </>
            ) : specialRole === 'merlin' && splitIntel?.enabled ? (
              <>
                🧙 <strong>You see players divided into two groups!</strong> The Certain Evil
                group is guaranteed evil, but the Mixed Intel group contains one evil and one good
                player — you must deduce which is which. Be careful, the Assassin is hunting you!
              </>
            ) : specialRole === 'merlin' ? (
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
                🧙‍♀️ <strong>Deceive Percival!</strong> Appear as Merlin to confuse
                the good team. Sow chaos and sabotage!
              </>
            ) : specialRole === 'mordred' ? (
              <>
                🐍 <strong>Hidden from Merlin!</strong> Even the wizard cannot
                see your evil nature. Lead from the shadows!
              </>
            ) : specialRole === 'oberon_standard' ? (
              <>
                👤 <strong>Work alone!</strong> You don&apos;t know the other evil
                players, and they don&apos;t know you. Merlin can see you.
              </>
            ) : specialRole === 'oberon_chaos' ? (
              <>
                👻 <strong>Complete isolation!</strong> No one knows you are evil —
                not even Merlin! Work alone to sabotage the quests.
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
