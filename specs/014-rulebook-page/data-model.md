# Data Model: Rulebook Page

**Feature**: 014-rulebook-page
**Date**: 2024-12-24

## Overview

This feature uses **static content only** with no database changes. All content is defined in TypeScript constants.

## Existing Data (Reused)

### SPECIAL_ROLES (from `constants.ts`)

```typescript
interface SpecialRoleInfo {
  name: string;
  team: 'good' | 'evil';
  description: string;
  emoji: string;
  knowsEvil: boolean;
  knownToMerlin: boolean;
  knowsMerlin: boolean;
  appearsAsMerlin: boolean;
  knowsTeammates: boolean;
  required: boolean;
  maxPerGame: number;
}

const SPECIAL_ROLES: Record<SpecialRole, SpecialRoleInfo>;
// Keys: merlin, percival, servant, assassin, morgana, mordred, oberon_standard, oberon_chaos, minion
```

## New Types (in `lib/domain/rulebook-content.ts`)

### RulebookTab

```typescript
type RulebookTabId = 'roles' | 'modes' | 'visual' | 'flow';

interface RulebookTab {
  id: RulebookTabId;
  label: string;
  icon: string;
}

const RULEBOOK_TABS: RulebookTab[] = [
  { id: 'roles', label: 'Roles', icon: '🎭' },
  { id: 'modes', label: 'Game Modes', icon: '⚙️' },
  { id: 'visual', label: 'Visual Guide', icon: '👁️' },
  { id: 'flow', label: 'Game Flow', icon: '🔄' },
];
```

### GameModeInfo

```typescript
interface GameModeInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  details?: string[];
}

const GAME_MODES: GameModeInfo[] = [
  {
    id: 'lady',
    name: 'Lady of the Lake',
    emoji: '🌊',
    description: 'Investigate player loyalties after Quests 2, 3, 4',
    details: [
      'Holder chooses a player to investigate',
      'Learns if target is Good or Evil',
      'Cannot investigate same player twice',
      'Token passes to investigated player',
    ],
  },
  // ... decoy, split_intel
];
```

### VisualIndicator

```typescript
interface VisualIndicator {
  id: string;
  symbol: string;
  name: string;
  description: string;
  category: 'avatar' | 'color' | 'quest';
}

const VISUAL_INDICATORS: VisualIndicator[] = [
  { id: 'crown', symbol: '👑', name: 'Crown', description: 'Current team leader', category: 'avatar' },
  { id: 'lady', symbol: '🌊', name: 'Wave', description: 'Lady of the Lake holder', category: 'avatar' },
  // ...
];
```

### GamePhaseInfo

```typescript
interface GamePhaseInfo {
  id: string;
  name: string;
  description: string;
  order: number;
}

const GAME_PHASES: GamePhaseInfo[] = [
  { id: 'team_building', name: 'Team Building', description: 'Leader proposes quest team', order: 1 },
  { id: 'voting', name: 'Voting', description: 'All players approve/reject proposal', order: 2 },
  // ...
];
```

## Database Changes

**None required.** This feature is entirely client-side with static content.

## State Management

| State | Location | Type |
|-------|----------|------|
| Active tab | React `useState` | `RulebookTabId` |
| Modal open | React `useState` (in GameBoard) | `boolean` |

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    DATA FLOW                             │
│                                                          │
│  SPECIAL_ROLES ──────────────┐                          │
│  (constants.ts)              │                          │
│                              ▼                          │
│  GAME_MODES ────────────▶ RulebookContent ──▶ UI       │
│  VISUAL_INDICATORS ─────┘    │                          │
│  GAME_PHASES ───────────────┘                          │
│  (rulebook-content.ts)                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

