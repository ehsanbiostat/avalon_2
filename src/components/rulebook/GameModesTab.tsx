'use client';

import { GAME_MODES } from '@/lib/domain/rulebook-content';

/**
 * Game Modes tab content - displays Lady of the Lake, Decoy Mode, Split Intel Mode
 */
export function GameModesTab() {
  return (
    <div
      role="tabpanel"
      id="tabpanel-modes"
      aria-labelledby="tab-modes"
      className="space-y-4 animate-fade-in"
    >
      <p className="text-avalon-text-muted text-sm mb-6">
        Optional game modes that add variety and challenge to your games.
      </p>

      {GAME_MODES.map((mode) => (
        <GameModeCard key={mode.id} mode={mode} />
      ))}
    </div>
  );
}

interface GameModeCardProps {
  mode: {
    id: string;
    name: string;
    emoji: string;
    description: string;
    details: string[];
  };
}

function GameModeCard({ mode }: GameModeCardProps) {
  return (
    <div className="p-4 rounded-lg bg-avalon-midnight/50 border border-avalon-silver/20 hover:border-avalon-silver/40 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{mode.emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-avalon-gold mb-1">
            {mode.name}
          </h4>
          <p className="text-avalon-text-secondary text-sm mb-3">
            {mode.description}
          </p>
          <ul className="space-y-1">
            {mode.details.map((detail, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-avalon-text-muted"
              >
                <span className="text-avalon-gold mt-0.5">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

