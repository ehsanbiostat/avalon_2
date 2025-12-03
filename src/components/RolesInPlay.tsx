'use client';

import { SPECIAL_ROLES } from '@/lib/utils/constants';
import type { RoleConfig } from '@/types/role-config';

interface RolesInPlayProps {
  rolesInPlay: string[];
  roleConfig?: RoleConfig;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * T033: Display list of active special roles in the game
 * Shown to all players in lobby before and after role distribution
 */
export function RolesInPlay({
  rolesInPlay,
  roleConfig,
  showTitle = true,
  compact = false,
  className = '',
}: RolesInPlayProps) {
  if (rolesInPlay.length === 0) {
    return null;
  }

  // Separate roles by team for better display
  const goodRoles = rolesInPlay.filter(name => {
    const key = normalizeRoleName(name);
    return SPECIAL_ROLES[key]?.team === 'good';
  });

  const evilRoles = rolesInPlay.filter(name => {
    const key = normalizeRoleName(name);
    return SPECIAL_ROLES[key]?.team === 'evil';
  });

  // T035: Check for Oberon mode
  const oberonMode = roleConfig?.oberon;
  const hasOberon = rolesInPlay.some(r => r.includes('Oberon'));

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {rolesInPlay.map((role) => (
          <RoleBadge key={role} name={role} small />
        ))}
      </div>
    );
  }

  return (
    <div className={`p-4 bg-avalon-midnight/50 rounded-lg border border-avalon-silver/20 ${className}`}>
      {showTitle && (
        <h4 className="font-display text-avalon-gold text-sm mb-3">
          🎭 Roles in This Game
        </h4>
      )}

      <div className="space-y-3">
        {/* Good Team Roles */}
        {goodRoles.length > 0 && (
          <div>
            <span className="text-xs text-good-light/60 uppercase tracking-wide">Good Team</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {goodRoles.map((role) => (
                <RoleBadge key={role} name={role} team="good" />
              ))}
            </div>
          </div>
        )}

        {/* Evil Team Roles */}
        {evilRoles.length > 0 && (
          <div>
            <span className="text-xs text-evil-light/60 uppercase tracking-wide">Evil Team</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {evilRoles.map((role) => (
                <RoleBadge key={role} name={role} team="evil" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* T035: Oberon mode indicator */}
      {hasOberon && oberonMode && (
        <div className="mt-3 pt-3 border-t border-avalon-silver/10">
          <div className="flex items-center gap-2 text-xs">
            {oberonMode === 'chaos' ? (
              <>
                <span className="text-purple-400">👻</span>
                <span className="text-purple-300">Chaos Mode: Oberon is hidden from everyone!</span>
              </>
            ) : (
              <>
                <span className="text-avalon-silver">👤</span>
                <span className="text-avalon-silver/70">Standard Mode: Oberon visible to Merlin</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RoleBadgeProps {
  name: string;
  team?: 'good' | 'evil';
  small?: boolean;
}

function RoleBadge({ name, team, small }: RoleBadgeProps) {
  const roleKey = normalizeRoleName(name);
  const roleInfo = SPECIAL_ROLES[roleKey];
  const emoji = roleInfo?.emoji || '❓';
  const actualTeam = team || roleInfo?.team || 'good';

  const sizeClasses = small 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded font-medium
        ${sizeClasses}
        ${actualTeam === 'good'
          ? 'bg-good/20 text-good-light border border-good/30'
          : 'bg-evil/20 text-evil-light border border-evil/30'
        }
      `}
      title={roleInfo?.description}
    >
      <span>{emoji}</span>
      <span>{name}</span>
    </span>
  );
}

/**
 * Normalize role name to match SPECIAL_ROLES keys
 */
function normalizeRoleName(name: string): keyof typeof SPECIAL_ROLES {
  const normalized = name
    .toLowerCase()
    .replace(' (chaos)', '_chaos')
    .replace(/\s+/g, '_') as keyof typeof SPECIAL_ROLES;
  
  // Handle special cases
  if (normalized === 'oberon') return 'oberon_standard';
  if (normalized === 'loyal_servant_of_arthur') return 'servant';
  if (normalized === 'loyal_servant') return 'servant';
  if (normalized === 'the_assassin') return 'assassin';
  if (normalized === 'minion_of_mordred') return 'minion';
  
  return normalized;
}

