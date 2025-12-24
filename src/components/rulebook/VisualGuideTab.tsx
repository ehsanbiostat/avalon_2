'use client';

import { VISUAL_INDICATORS } from '@/lib/domain/rulebook-content';

/**
 * Visual Guide tab content - explains all UI indicators, colors, and symbols
 */
export function VisualGuideTab() {
  const avatarIndicators = VISUAL_INDICATORS.filter(i => i.category === 'avatar');
  const colorIndicators = VISUAL_INDICATORS.filter(i => i.category === 'color');
  const questIndicators = VISUAL_INDICATORS.filter(i => i.category === 'quest');

  return (
    <div
      role="tabpanel"
      id="tabpanel-visual"
      aria-labelledby="tab-visual"
      className="space-y-6 animate-fade-in"
    >
      {/* Avatar Indicators */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-display font-bold text-avalon-gold mb-4">
          <span>👤</span>
          <span>Player Indicators</span>
        </h3>
        <div className="grid gap-2">
          {avatarIndicators.map((indicator) => (
            <IndicatorRow key={indicator.id} indicator={indicator} />
          ))}
        </div>
      </section>

      {/* Team Colors */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-display font-bold text-avalon-gold mb-4">
          <span>🎨</span>
          <span>Team Colors</span>
        </h3>
        <div className="grid gap-2">
          {colorIndicators.map((indicator) => (
            <ColorRow key={indicator.id} indicator={indicator} />
          ))}
        </div>
      </section>

      {/* Quest Symbols */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-display font-bold text-avalon-gold mb-4">
          <span>🏆</span>
          <span>Quest Symbols</span>
        </h3>
        <div className="grid gap-2">
          {questIndicators.map((indicator) => (
            <IndicatorRow key={indicator.id} indicator={indicator} />
          ))}
        </div>
      </section>
    </div>
  );
}

interface IndicatorRowProps {
  indicator: {
    symbol: string;
    name: string;
    description: string;
  };
}

function IndicatorRow({ indicator }: IndicatorRowProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-avalon-midnight/30 border border-avalon-silver/10">
      <span className="text-xl w-8 text-center flex-shrink-0">{indicator.symbol}</span>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-avalon-text">{indicator.name}</span>
        <span className="text-avalon-text-muted mx-2">—</span>
        <span className="text-sm text-avalon-text-muted">{indicator.description}</span>
      </div>
    </div>
  );
}

interface ColorRowProps {
  indicator: {
    id: string;
    symbol: string;
    name: string;
    description: string;
  };
}

function ColorRow({ indicator }: ColorRowProps) {
  // Map to actual CSS colors for preview
  const colorClasses: Record<string, string> = {
    good_color: 'bg-good',
    evil_color: 'bg-evil',
    gold_color: 'bg-avalon-gold',
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-avalon-midnight/30 border border-avalon-silver/10">
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 ${colorClasses[indicator.id] || 'bg-avalon-silver'}`}
      />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-avalon-text">{indicator.name}</span>
        <span className="text-avalon-text-muted mx-2">—</span>
        <span className="text-sm text-avalon-text-muted">{indicator.description}</span>
      </div>
    </div>
  );
}

