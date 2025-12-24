'use client';

import { RULEBOOK_TABS, type RulebookTabId } from '@/lib/domain/rulebook-content';

interface RulebookTabsProps {
  activeTab: RulebookTabId;
  onTabChange: (tabId: RulebookTabId) => void;
}

/**
 * Tab navigation component for the rulebook
 * Implements WAI-ARIA tab pattern for accessibility
 */
export function RulebookTabs({ activeTab, onTabChange }: RulebookTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Rulebook sections"
      className="flex gap-1 overflow-x-auto pb-2 border-b border-avalon-silver/20 scrollbar-hide"
    >
      {RULEBOOK_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg
              font-medium text-sm whitespace-nowrap
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-avalon-gold/50
              ${isActive
                ? 'bg-avalon-navy border-b-2 border-avalon-gold text-avalon-gold'
                : 'text-avalon-text-muted hover:text-avalon-text-secondary hover:bg-avalon-midnight/50'
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

