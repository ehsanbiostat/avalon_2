# Quickstart: Oberon Split Intel Mode

**Feature**: 018-oberon-split-intel
**Date**: 2025-12-26

## Quick Reference

### What This Feature Does

Adds a new game mode where Merlin sees **Oberon** mixed with a random good player (Mixed Intel group), while all other visible evil players (Morgana, Assassin) are shown as certain evil (Certain Evil group).

**Key Difference from Standard Split Intel (011)**:
- Standard Split Intel: **Random** evil player goes to mixed group
- Oberon Split Intel: **Oberon always** goes to mixed group

### Prerequisites

| Requirement | Status |
|-------------|--------|
| Oberon Standard enabled | ✅ Required |
| Oberon Chaos NOT selected | ❌ Incompatible |
| Merlin Decoy Mode | ❌ Mutually exclusive |
| Standard Split Intel Mode | ❌ Mutually exclusive |

### Key Files

| File | Change |
|------|--------|
| `src/types/role-config.ts` | Add `oberon_split_intel_enabled` |
| `src/types/game.ts` | Add `oberon_split_intel_*` fields |
| `src/lib/domain/oberon-split-intel.ts` | NEW: Group selection logic |
| `src/lib/domain/role-config.ts` | Add prerequisite + mutual exclusivity |
| `src/lib/domain/visibility.ts` | Add `getOberonSplitIntelVisibility()` |
| `src/components/RoleConfigPanel.tsx` | Add toggle with prerequisites |
| `src/components/RoleRevealModal.tsx` | Handle oberon_split_intel groups |
| `src/app/api/rooms/[code]/distribute/route.ts` | Distribute groups |
| `src/app/api/rooms/[code]/role/route.ts` | Return group data |
| `supabase/migrations/018_oberon_split_intel.sql` | Schema changes |

### Testing Checklist

#### Test 1: Toggle Prerequisites
1. Create a room WITHOUT Oberon
2. View role configuration
3. **Expected**: Oberon Split Intel toggle is **disabled** with tooltip "Requires Oberon (Standard)"

#### Test 2: Oberon Chaos Incompatibility
1. Create a room with Oberon Chaos
2. View role configuration
3. **Expected**: Oberon Split Intel toggle is **disabled** with tooltip "Not available with Oberon (Chaos)"

#### Test 3: Enable Mode
1. Create a room with Oberon Standard + Morgana + Assassin
2. Enable Oberon Split Intel Mode
3. **Expected**: Toggle enables successfully

#### Test 4: Triple Mutual Exclusivity
1. Enable Oberon Split Intel Mode
2. Try to enable Merlin Decoy Mode
3. **Expected**: Merlin Decoy toggle is disabled (only one intel mode allowed)

#### Test 5: Auto-Disable on Oberon Removal
1. Enable Oberon Standard
2. Enable Oberon Split Intel Mode
3. Disable Oberon Standard
4. **Expected**: Oberon Split Intel Mode auto-disables with notification

#### Test 6: Merlin's View
1. Start a game with Oberon Split Intel enabled (7 players)
2. View Merlin's role reveal
3. **Expected**:
   - Certain Evil group: Morgana, Assassin
   - Mixed Intel group: 2 players (one is Oberon, one is good)
   - Clear labels and styling

#### Test 7: Edge Case - Only Oberon Visible
1. Create room with Mordred + Oberon Standard (no Morgana)
2. Enable Oberon Split Intel Mode
3. Start game as Merlin
4. **Expected**:
   - Certain Evil group: Empty (or message "No certain evil visible")
   - Mixed Intel group: 2 players

#### Test 8: Game End Reveal
1. Complete a game with Oberon Split Intel
2. View game over screen
3. **Expected**: Good player in mixed group shown with "👤🔀 Mixed with Oberon" indicator

### Code Snippets

#### Role Config Type Extension
```typescript
// src/types/role-config.ts
interface RoleConfig {
  // ... existing fields ...

  // Feature 018: Oberon Split Intel Mode
  // Oberon always in mixed group with one good player
  // Prerequisite: oberon === 'standard'
  // Mutually exclusive with merlin_decoy_enabled AND merlin_split_intel_enabled
  oberon_split_intel_enabled?: boolean;
}
```

#### Game Type Extension
```typescript
// src/types/game.ts
interface Game {
  // ... existing fields ...

  // Feature 018: Oberon Split Intel
  oberon_split_intel_certain_evil_ids: string[] | null;
  oberon_split_intel_mixed_good_id: string | null;
}
```

#### Prerequisite Check
```typescript
// src/lib/domain/oberon-split-intel.ts
export function canUseOberonSplitIntelMode(roleConfig: RoleConfig): {
  canUse: boolean;
  reason?: string;
} {
  if (!roleConfig.oberon) {
    return { canUse: false, reason: 'Requires Oberon (Standard) to be enabled' };
  }
  if (roleConfig.oberon === 'chaos') {
    return { canUse: false, reason: 'Not available with Oberon (Chaos) - Oberon must be visible to Merlin' };
  }
  return { canUse: true };
}
```

#### Group Distribution
```typescript
// src/lib/domain/oberon-split-intel.ts
export function distributeOberonSplitIntelGroups(
  assignments: RoleAssignment[]
): OberonSplitIntelGroups {
  // 1. Find Oberon (ALWAYS goes to mixed)
  const oberon = assignments.find(a => a.specialRole === 'oberon_standard');
  if (!oberon) throw new Error('Oberon Standard required');

  // 2. Other visible evil → Certain group
  const certainEvil = assignments.filter(a =>
    a.role === 'evil' &&
    a.specialRole !== 'oberon_standard' &&
    a.specialRole !== 'mordred'
  );

  // 3. Random good player → Mixed group (not Merlin)
  const eligibleGood = assignments.filter(a =>
    a.role === 'good' && a.specialRole !== 'merlin'
  );
  const mixedGood = shuffleArray([...eligibleGood])[0];

  return {
    certainEvilIds: certainEvil.map(a => a.playerId),
    oberonId: oberon.playerId,
    mixedGoodId: mixedGood.playerId,
  };
}
```

#### Mutual Exclusivity Validation
```typescript
// src/lib/domain/role-config.ts
// In validateRoleConfig function:

// Check triple mutual exclusivity for intel modes
const intelModes = [
  config.merlin_decoy_enabled,
  config.merlin_split_intel_enabled,
  config.oberon_split_intel_enabled,
].filter(Boolean).length;

if (intelModes > 1) {
  errors.push('Only one intel mode can be active: Merlin Decoy, Split Intel, or Oberon Split Intel');
}

// Check prerequisite for Oberon Split Intel
if (config.oberon_split_intel_enabled && config.oberon !== 'standard') {
  errors.push('Oberon Split Intel Mode requires Oberon (Standard) to be enabled');
}
```

### Database Migration

```sql
-- 018_oberon_split_intel.sql

-- Store Certain Evil group (Morgana, Assassin - NOT Oberon)
ALTER TABLE games ADD COLUMN oberon_split_intel_certain_evil_ids UUID[];

-- Store good player in Mixed group with Oberon
ALTER TABLE games ADD COLUMN oberon_split_intel_mixed_good_id UUID REFERENCES players(id);

COMMENT ON COLUMN games.oberon_split_intel_certain_evil_ids IS
  'Evil players in Certain group (excludes Oberon). NULL if mode disabled.';
COMMENT ON COLUMN games.oberon_split_intel_mixed_good_id IS
  'Good player in Mixed group with Oberon. NULL if mode disabled.';
```

### Verification Commands

```sql
-- Check if mode is properly configured in a room
SELECT code, role_config->>'oberon_split_intel_enabled' as oberon_split_intel
FROM rooms
WHERE role_config->>'oberon_split_intel_enabled' = 'true';

-- Check group assignments in a game
SELECT
  g.id,
  g.oberon_split_intel_certain_evil_ids,
  g.oberon_split_intel_mixed_good_id,
  (SELECT nickname FROM players WHERE id = g.oberon_split_intel_mixed_good_id) as mixed_good_player
FROM games g
WHERE g.oberon_split_intel_mixed_good_id IS NOT NULL;

-- Find Oberon in a game (always in mixed group for this mode)
SELECT pr.player_id, p.nickname as oberon_name
FROM player_roles pr
JOIN players p ON pr.player_id = p.id
WHERE pr.special_role = 'oberon_standard'
  AND pr.room_id = '<room_id>';
```
