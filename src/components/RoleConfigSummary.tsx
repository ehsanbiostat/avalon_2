'use client';

import { computeRolesInPlay, getRoleDetails } from '@/lib/domain/role-config';
import { SPECIAL_ROLES, ROLE_RATIOS } from '@/lib/utils/constants';
import type { RoleConfig } from '@/types/role-config';

interface RoleConfigSummaryProps {
  config: RoleConfig;
  expectedPlayers: number;
  compact?: boolean;
  className?: string;
}

/**
 * T026: Display summary of selected roles before confirmation
 */
export function RoleConfigSummary({
  config,
  expectedPlayers,
  compact = false,
  className = '',
}: RoleConfigSummaryProps) {
  const rolesInPlay = computeRolesInPlay(config);
  const details = getRoleDetails(config, expectedPlayers);
  const ratio = ROLE_RATIOS[expectedPlayers];

  if (compact) {
    return (
      <div className={`text-sm text-avalon-silver/70 ${className}`}>
        <span className="text-good-light">{details.goodCount} Good</span>
        {' • '}
        <span className="text-evil-light">{details.evilCount} Evil</span>
        {rolesInPlay.length > 2 && (
          <>
            {' • '}
            <span className="text-avalon-gold">
              {rolesInPlay.filter(r => r !== 'Merlin' && r !== 'Assassin').join(', ')}
            </span>
          </>
        )}
        {config.ladyOfLake && (
          <>
            {' • '}
            <span className="text-avalon-silver">👑 Lady</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 bg-avalon-midnight/50 rounded-lg border border-avalon-silver/20 ${className}`}>
      <h4 className="font-display text-avalon-gold text-sm mb-3">Game Configuration</h4>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-avalon-silver/60 uppercase tracking-wide">Good Team</span>
          <p className="text-good-light font-medium">{details.goodCount} Players</p>
          <p className="text-xs text-avalon-silver/60">
            {details.goodSpecialCount} special, {details.servantCount} servants
          </p>
        </div>
        <div>
          <span className="text-xs text-avalon-silver/60 uppercase tracking-wide">Evil Team</span>
          <p className="text-evil-light font-medium">{details.evilCount} Players</p>
          <p className="text-xs text-avalon-silver/60">
            {details.evilSpecialCount} special, {details.minionCount} minions
          </p>
        </div>
      </div>

      <div className="border-t border-avalon-silver/10 pt-3">
        <span className="text-xs text-avalon-silver/60 uppercase tracking-wide mb-2 block">
          Roles in Play
        </span>
        <div className="flex flex-wrap gap-2">
          {rolesInPlay.map((roleName) => {
            const roleKey = roleName.toLowerCase().replace(' (chaos)', '_chaos').replace(' ', '_');
            const roleInfo = SPECIAL_ROLES[roleKey as keyof typeof SPECIAL_ROLES];
            const isGood = roleInfo?.team === 'good';
            
            return (
              <span
                key={roleName}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                  ${isGood 
                    ? 'bg-good/20 text-good-light border border-good/30' 
                    : 'bg-evil/20 text-evil-light border border-evil/30'
                  }
                `}
              >
                {roleInfo?.emoji} {roleName}
              </span>
            );
          })}
        </div>
      </div>

      {config.ladyOfLake && (
        <div className="border-t border-avalon-silver/10 pt-3 mt-3">
          <div className="flex items-center gap-2 text-sm">
            <span>👑</span>
            <span className="text-avalon-silver">Lady of the Lake enabled</span>
          </div>
        </div>
      )}

      {/* Filler roles note */}
      {(details.servantCount > 0 || details.minionCount > 0) && (
        <p className="text-xs text-avalon-silver/50 mt-3 italic">
          + {details.servantCount > 0 ? `${details.servantCount} Loyal Servant(s)` : ''}
          {details.servantCount > 0 && details.minionCount > 0 ? ' and ' : ''}
          {details.minionCount > 0 ? `${details.minionCount} Minion(s)` : ''}
        </p>
      )}
    </div>
  );
}

