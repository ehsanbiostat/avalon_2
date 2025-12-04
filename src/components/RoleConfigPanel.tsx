'use client';

import { useState, useEffect } from 'react';
import { validateRoleConfig, getRoleDetails } from '@/lib/domain/role-config';
import { SPECIAL_ROLES, LADY_OF_LAKE_MIN_RECOMMENDED } from '@/lib/utils/constants';
import type { RoleConfig, OberonMode } from '@/types/role-config';

interface RoleConfigPanelProps {
  expectedPlayers: number;
  config: RoleConfig;
  onChange: (config: RoleConfig) => void;
  className?: string;
}

/**
 * T025: Role configuration panel for room creation
 * Allows room manager to select which special roles to include
 */
export function RoleConfigPanel({
  expectedPlayers,
  config,
  onChange,
  className = '',
}: RoleConfigPanelProps) {
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>({ valid: true, errors: [], warnings: [] });

  // T029b: Re-validate when player count changes
  useEffect(() => {
    const result = validateRoleConfig(config, expectedPlayers);
    setValidation(result);
  }, [config, expectedPlayers]);

  const roleDetails = getRoleDetails(config, expectedPlayers);

  const handleToggle = (key: keyof RoleConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value || undefined };
    // Clean up undefined values
    if (!newConfig[key]) delete newConfig[key];
    onChange(newConfig);
  };

  // T028: Handle Oberon mode toggle
  const handleOberonChange = (mode: OberonMode | false) => {
    const newConfig = { ...config };
    if (mode) {
      newConfig.oberon = mode;
    } else {
      delete newConfig.oberon;
    }
    onChange(newConfig);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Good Team Roles */}
      <div>
        <h4 className="font-display text-sm text-good-light mb-3 flex items-center gap-2">
          ⚔️ Good Team Roles
          <span className="text-xs text-avalon-silver/60">
            ({roleDetails.goodSpecialCount}/{roleDetails.goodCount} special)
          </span>
        </h4>
        
        <div className="space-y-2">
          {/* Merlin - Always included */}
          <RoleToggle
            role="merlin"
            enabled={true}
            locked
            label="Merlin (Always Included)"
            description={SPECIAL_ROLES.merlin.description}
            emoji={SPECIAL_ROLES.merlin.emoji}
          />
          
          {/* Percival - Optional */}
          <RoleToggle
            role="percival"
            enabled={config.percival || false}
            onChange={(v) => handleToggle('percival', v)}
            label="Percival"
            description={SPECIAL_ROLES.percival.description}
            emoji={SPECIAL_ROLES.percival.emoji}
          />
        </div>
      </div>

      {/* Evil Team Roles */}
      <div>
        <h4 className="font-display text-sm text-evil-light mb-3 flex items-center gap-2">
          🗡️ Evil Team Roles
          <span className="text-xs text-avalon-silver/60">
            ({roleDetails.evilSpecialCount}/{roleDetails.evilCount} special)
          </span>
        </h4>
        
        <div className="space-y-2">
          {/* Assassin - Always included */}
          <RoleToggle
            role="assassin"
            enabled={true}
            locked
            label="Assassin (Always Included)"
            description={SPECIAL_ROLES.assassin.description}
            emoji={SPECIAL_ROLES.assassin.emoji}
          />
          
          {/* Morgana - Optional */}
          <RoleToggle
            role="morgana"
            enabled={config.morgana || false}
            onChange={(v) => handleToggle('morgana', v)}
            label="Morgana"
            description={SPECIAL_ROLES.morgana.description}
            emoji={SPECIAL_ROLES.morgana.emoji}
          />
          
          {/* Mordred - Optional */}
          <RoleToggle
            role="mordred"
            enabled={config.mordred || false}
            onChange={(v) => handleToggle('mordred', v)}
            label="Mordred"
            description={SPECIAL_ROLES.mordred.description}
            emoji={SPECIAL_ROLES.mordred.emoji}
          />
          
          {/* T028: Oberon with mode toggle */}
          <div className="p-3 rounded-lg border border-avalon-silver/20 bg-avalon-midnight/30">
            <div className="flex items-start gap-3">
              <span className="text-xl">{SPECIAL_ROLES.oberon_standard.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-avalon-parchment">Oberon</span>
                  <select
                    value={config.oberon || ''}
                    onChange={(e) => handleOberonChange(e.target.value as OberonMode | '' || false)}
                    className="text-xs bg-avalon-midnight border border-avalon-silver/30 rounded px-2 py-1 text-avalon-silver"
                  >
                    <option value="">Disabled</option>
                    <option value="standard">Standard (Visible to Merlin)</option>
                    <option value="chaos">Chaos (Hidden from Everyone)</option>
                  </select>
                </div>
                <p className="text-xs text-avalon-silver/60 mt-1">
                  {config.oberon === 'chaos' 
                    ? SPECIAL_ROLES.oberon_chaos.description
                    : SPECIAL_ROLES.oberon_standard.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lady of the Lake */}
      <div>
        <h4 className="font-display text-sm text-blue-300 mb-3 flex items-center gap-2">
          🌊 Game Options
        </h4>
        
        <RoleToggle
          role="ladyOfLake"
          enabled={config.ladyOfLake || false}
          onChange={(v) => handleToggle('ladyOfLake', v)}
          label="Lady of the Lake"
          description="Investigate player loyalties after Quest 2, 3, 4"
          emoji="🌊"
        />
        
        {/* T044: Warning for small games */}
        {config.ladyOfLake && expectedPlayers < LADY_OF_LAKE_MIN_RECOMMENDED && (
          <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
            ⚠️ Recommended for {LADY_OF_LAKE_MIN_RECOMMENDED}+ players
          </p>
        )}
      </div>

      {/* T029: Validation warnings */}
      {validation.warnings.length > 0 && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <h5 className="text-sm font-medium text-yellow-400 mb-1">Suggestions</h5>
          <ul className="text-xs text-yellow-300/80 space-y-1">
            {validation.warnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <h5 className="text-sm font-medium text-red-400 mb-1">Configuration Error</h5>
          <ul className="text-xs text-red-300/80 space-y-1">
            {validation.errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface RoleToggleProps {
  role: string;
  enabled: boolean;
  locked?: boolean;
  onChange?: (enabled: boolean) => void;
  label: string;
  description: string;
  emoji: string;
}

function RoleToggle({
  enabled,
  locked,
  onChange,
  label,
  description,
  emoji,
}: RoleToggleProps) {
  return (
    <label 
      className={`
        flex items-start gap-3 p-3 rounded-lg border transition-all
        ${locked 
          ? 'border-avalon-silver/10 bg-avalon-midnight/20 cursor-not-allowed opacity-70' 
          : enabled 
            ? 'border-avalon-gold/50 bg-avalon-gold/10 cursor-pointer' 
            : 'border-avalon-silver/20 bg-avalon-midnight/30 cursor-pointer hover:border-avalon-silver/40'
        }
      `}
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${enabled ? 'text-avalon-gold' : 'text-avalon-parchment'}`}>
            {label}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={locked}
            className="sr-only"
          />
          <div className={`
            w-8 h-5 rounded-full transition-colors
            ${locked ? 'bg-avalon-silver/30' : enabled ? 'bg-avalon-gold' : 'bg-avalon-silver/30'}
          `}>
            <div className={`
              w-4 h-4 rounded-full bg-white transition-transform mt-0.5
              ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}
            `} />
          </div>
        </div>
        <p className="text-xs text-avalon-silver/60 mt-1">{description}</p>
      </div>
    </label>
  );
}

