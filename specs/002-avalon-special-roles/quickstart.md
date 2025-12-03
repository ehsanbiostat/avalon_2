# Quickstart: Phase 2 – Special Roles & Configurations

**Feature**: 002-avalon-special-roles
**Date**: 2025-12-03
**Prerequisites**: MVP (001-avalon-mvp-lobby) must be deployed and working

## Overview

This guide covers implementing Phase 2: configurable special roles and Lady of the Lake setup.

## Pre-Implementation Checklist

- [ ] MVP is deployed and functional
- [ ] Supabase project accessible
- [ ] Local development environment set up
- [ ] All MVP tests passing

## Step 1: Run Database Migration

### Via Supabase Dashboard

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create new query
3. Paste contents from `supabase/migrations/006_special_roles_config.sql`
4. Click **Run**
5. Verify no errors

### Migration SQL

```sql
-- Extend special_role enum
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'percival';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'morgana';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'mordred';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_standard';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_chaos';

-- Extend rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS role_config JSONB DEFAULT '{}';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS lady_of_lake_enabled BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS lady_of_lake_holder_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Extend player_roles table
ALTER TABLE player_roles ADD COLUMN IF NOT EXISTS has_lady_of_lake BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rooms_lady_holder ON rooms(lady_of_lake_holder_id) WHERE lady_of_lake_enabled = true;
```

## Step 2: Update TypeScript Types

Update `src/types/database.ts`:

```typescript
// Add to SpecialRole type
export type SpecialRole = 
  | 'merlin'
  | 'percival'
  | 'servant'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon_standard'
  | 'oberon_chaos'
  | 'minion';

// Add to Room interface
export interface Room {
  // ... existing fields ...
  role_config: RoleConfig;
  lady_of_lake_enabled: boolean;
  lady_of_lake_holder_id: string | null;
}

// Add to PlayerRole interface
export interface PlayerRole {
  // ... existing fields ...
  has_lady_of_lake: boolean;
}
```

Create `src/types/role-config.ts`:

```typescript
export type OberonMode = 'standard' | 'chaos';

export interface RoleConfig {
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: OberonMode;
  ladyOfLake?: boolean;
}

export interface RoleConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Step 3: Implement Domain Logic

Create `src/lib/domain/role-config.ts`:

```typescript
import { ROLE_RATIOS } from '@/lib/utils/constants';
import type { RoleConfig, RoleConfigValidation } from '@/types/role-config';

export function validateRoleConfig(
  config: RoleConfig,
  playerCount: number
): RoleConfigValidation {
  const ratio = ROLE_RATIOS[playerCount];
  if (!ratio) {
    return { valid: false, errors: ['Invalid player count'], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Count special roles per team
  let goodSpecialCount = 1; // Merlin always
  let evilSpecialCount = 1; // Assassin always

  if (config.percival) goodSpecialCount++;
  if (config.morgana) evilSpecialCount++;
  if (config.mordred) evilSpecialCount++;
  if (config.oberon) evilSpecialCount++;

  // Validate counts
  if (goodSpecialCount > ratio.good) {
    errors.push(`Too many Good roles (${goodSpecialCount}) for ${playerCount} players (max ${ratio.good})`);
  }
  if (evilSpecialCount > ratio.evil) {
    errors.push(`Too many Evil roles (${evilSpecialCount}) for ${playerCount} players (max ${ratio.evil})`);
  }

  // Warnings for suboptimal configs
  if (config.percival && !config.morgana) {
    warnings.push('Percival without Morgana reduces strategic depth');
  }
  if (config.morgana && !config.percival) {
    warnings.push("Morgana's disguise ability has no effect without Percival");
  }
  if (config.ladyOfLake && playerCount < 7) {
    warnings.push('Lady of the Lake is recommended for 7+ players');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

Create `src/lib/domain/visibility.ts`:

```typescript
import type { SpecialRole } from '@/types/database';
import type { RoleAssignment } from '@/lib/domain/roles';

export interface VisibilityResult {
  knownPlayers: { id: string; nickname: string }[];
  knownPlayersLabel?: string;
  hiddenEvilCount: number;
  abilityNote?: string;
}

export function getVisibilityForRole(
  myRole: SpecialRole,
  myPlayerId: string,
  allAssignments: RoleAssignment[],
  playerNicknames: Map<string, string>
): VisibilityResult {
  switch (myRole) {
    case 'merlin':
      return getMerlinVisibility(allAssignments, playerNicknames);
    case 'percival':
      return getPercivalVisibility(allAssignments, playerNicknames);
    case 'morgana':
    case 'mordred':
    case 'assassin':
    case 'minion':
      return getEvilVisibility(myPlayerId, allAssignments, playerNicknames, myRole);
    case 'oberon_standard':
    case 'oberon_chaos':
      return getOberonVisibility(myRole);
    default:
      return { knownPlayers: [], hiddenEvilCount: 0 };
  }
}

function getMerlinVisibility(
  assignments: RoleAssignment[],
  nicknames: Map<string, string>
): VisibilityResult {
  // Merlin sees all evil EXCEPT Mordred and Oberon (Chaos)
  const visibleEvil = assignments.filter(a => 
    a.role === 'evil' && 
    a.specialRole !== 'mordred' && 
    a.specialRole !== 'oberon_chaos'
  );
  
  const hiddenCount = assignments.filter(a =>
    a.role === 'evil' &&
    (a.specialRole === 'mordred' || a.specialRole === 'oberon_chaos')
  ).length;

  return {
    knownPlayers: visibleEvil.map(a => ({
      id: a.playerId,
      nickname: nicknames.get(a.playerId) || 'Unknown'
    })),
    knownPlayersLabel: 'Evil Players Known to You',
    hiddenEvilCount: hiddenCount,
    abilityNote: hiddenCount > 0 
      ? `${hiddenCount} evil player${hiddenCount > 1 ? 's are' : ' is'} hidden from you!`
      : undefined
  };
}

// ... implement other visibility functions
```

## Step 4: Update API Endpoints

Update `src/app/api/rooms/route.ts` to accept role_config:

```typescript
// In POST handler
const { expected_players, role_config = {} } = await request.json();

// Validate config
const validation = validateRoleConfig(role_config, expected_players);
if (!validation.valid) {
  return NextResponse.json(
    { error: { code: 'INVALID_ROLE_CONFIG', message: validation.errors.join(', ') } },
    { status: 400 }
  );
}

// Store config when creating room
const room = await createRoom(supabase, {
  // ... existing fields ...
  role_config,
  lady_of_lake_enabled: role_config.ladyOfLake || false
});
```

## Step 5: Update UI Components

Update `CreateRoomModal.tsx` to include role configuration panel.

Create `RoleConfigPanel.tsx` for role selection UI.

Update `RoleRevealModal.tsx` for character-specific content.

Update `Lobby.tsx` to show "Roles in Play" section.

## Step 6: Test the Implementation

### Unit Tests

```bash
npm run test tests/unit/domain/role-config.test.ts
npm run test tests/unit/domain/visibility.test.ts
```

### E2E Tests

```bash
npm run test:e2e tests/e2e/role-config.spec.ts
```

### Manual Testing Checklist

- [ ] Create room with default config (MVP behavior)
- [ ] Create room with Percival + Morgana
- [ ] Create room with full config (all roles)
- [ ] Verify Merlin sees correct evil players
- [ ] Verify Percival sees Merlin candidates
- [ ] Verify Mordred is hidden from Merlin
- [ ] Verify Oberon (Standard) is visible to Merlin
- [ ] Verify Oberon (Chaos) is hidden from everyone
- [ ] Verify Lady of Lake holder is designated correctly
- [ ] Verify "Roles in Play" shows in lobby

## Step 7: Deploy

1. Commit all changes
2. Push to main branch
3. Vercel auto-deploys
4. Verify production works

## Troubleshooting

### "Invalid role configuration" error
- Check player count vs role count
- Ensure not selecting more roles than slots allow

### Visibility not working correctly
- Check special_role values match expected enum
- Verify visibility matrix logic
- Check that assignments include specialRole field

### Lady of Lake not appearing
- Verify `lady_of_lake_enabled` is true in room
- Check that holder is designated after distribution
- Verify `has_lady_of_lake` is set on player_role

## Reference

- [spec.md](./spec.md) - Feature specification
- [plan.md](./plan.md) - Implementation plan
- [data-model.md](./data-model.md) - Database schema
- [contracts/api.md](./contracts/api.md) - API contracts

