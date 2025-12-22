# Quickstart: Merlin Split Intel Mode

**Feature**: 011-merlin-split-intel
**Date**: 2025-12-22

## Overview

This guide provides a quick reference for implementing the Merlin Split Intel Mode feature.

## Prerequisites

- Feature 002 (Special Roles) ✅ Complete
- Feature 009 (Merlin Decoy) ✅ Complete
- Supabase database access
- Development environment configured

## Quick Implementation Checklist

### 1. Database Migration (5 min)

```bash
# Apply migration
npx supabase migration up

# Or manually run:
# supabase/migrations/014_merlin_split_intel.sql
```

**Schema changes**:
```sql
ALTER TABLE games ADD COLUMN split_intel_certain_evil_ids UUID[];
ALTER TABLE games ADD COLUMN split_intel_mixed_evil_id UUID REFERENCES players(id);
ALTER TABLE games ADD COLUMN split_intel_mixed_good_id UUID REFERENCES players(id);
```

### 2. Type Updates (10 min)

**`src/types/role-config.ts`**:
```typescript
export interface RoleConfig {
  // ... existing fields ...
  merlin_split_intel_enabled?: boolean;  // ADD THIS
}
```

**`src/types/game.ts`**:
```typescript
export interface Game {
  // ... existing fields ...
  split_intel_certain_evil_ids: string[] | null;  // ADD
  split_intel_mixed_evil_id: string | null;       // ADD
  split_intel_mixed_good_id: string | null;       // ADD
}

// ADD NEW INTERFACE
export interface SplitIntelVisibility {
  enabled: true;
  certainEvil: Array<{ id: string; name: string }>;
  mixedIntel: Array<{ id: string; name: string }>;
  hiddenCount: number;
  certainLabel: string;
  mixedLabel: string;
}
```

### 3. Domain Logic (20 min)

**Create `src/lib/domain/split-intel.ts`**:
```typescript
import { shuffleArray } from './decoy-selection';
import type { RoleAssignment } from './visibility';
import type { RoleConfig } from '@/types/role-config';

export interface SplitIntelGroups {
  certainEvilIds: string[];
  mixedEvilId: string;
  mixedGoodId: string;
}

export function canUseSplitIntelMode(
  assignments: RoleAssignment[],
  roleConfig: RoleConfig
): { viable: boolean; visibleEvilCount: number; reason?: string } {
  const visibleEvil = assignments.filter(a =>
    a.role === 'evil' &&
    a.specialRole !== 'mordred' &&
    a.specialRole !== 'oberon_chaos'
  );

  if (visibleEvil.length === 0) {
    return {
      viable: false,
      visibleEvilCount: 0,
      reason: 'No visible evil players due to Mordred and/or Oberon Chaos.',
    };
  }

  return { viable: true, visibleEvilCount: visibleEvil.length };
}

export function distributeSplitIntelGroups(
  assignments: RoleAssignment[]
): SplitIntelGroups | null {
  // Get visible evil
  const visibleEvil = assignments.filter(a =>
    a.role === 'evil' &&
    a.specialRole !== 'mordred' &&
    a.specialRole !== 'oberon_chaos'
  );

  if (visibleEvil.length === 0) return null;

  const shuffledEvil = shuffleArray([...visibleEvil]);

  // Distribute based on count
  let certainEvilIds: string[];
  let mixedEvilId: string;

  if (shuffledEvil.length === 1) {
    certainEvilIds = [];
    mixedEvilId = shuffledEvil[0].playerId;
  } else if (shuffledEvil.length === 2) {
    certainEvilIds = [shuffledEvil[0].playerId];
    mixedEvilId = shuffledEvil[1].playerId;
  } else {
    certainEvilIds = [shuffledEvil[0].playerId, shuffledEvil[1].playerId];
    mixedEvilId = shuffledEvil[2].playerId;
  }

  // Select good player for mixed group
  const eligibleGood = assignments.filter(a =>
    a.role === 'good' && a.specialRole !== 'merlin'
  );
  const shuffledGood = shuffleArray([...eligibleGood]);
  const mixedGoodId = shuffledGood[0].playerId;

  return { certainEvilIds, mixedEvilId, mixedGoodId };
}
```

### 4. Visibility Update (15 min)

**Update `src/lib/domain/visibility.ts`**:
```typescript
// Add new function
export function getSplitIntelVisibility(
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig,
  certainEvilIds: string[],
  mixedEvilId: string,
  mixedGoodId: string
): SplitIntelVisibilityResult {
  // Build Certain Evil group
  const certainEvil = certainEvilIds.map(id => {
    const player = allAssignments.find(a => a.playerId === id);
    return { id, name: player?.playerName || 'Unknown' };
  });

  // Build Mixed Intel group (shuffled)
  const mixedPlayers = [mixedEvilId, mixedGoodId].map(id => {
    const player = allAssignments.find(a => a.playerId === id);
    return { id, name: player?.playerName || 'Unknown' };
  });
  const mixedIntel = shuffleArray(mixedPlayers);

  // Hidden count
  const hiddenCount =
    (roleConfig.mordred ? 1 : 0) +
    (roleConfig.oberon === 'chaos' ? 1 : 0);

  return {
    certainEvil,
    mixedIntel,
    hiddenCount,
    certainLabel: '🎯 Certain Evil',
    certainDescription: 'These players are definitely evil',
    mixedLabel: '❓ Mixed Intel',
    mixedDescription: 'One is evil, one is good - you don\'t know which',
    hiddenWarning: hiddenCount > 0
      ? `${hiddenCount} evil player${hiddenCount > 1 ? 's are' : ' is'} hidden from you`
      : undefined,
  };
}
```

### 5. API Updates (20 min)

**Update `src/app/api/rooms/[code]/distribute/route.ts`**:
```typescript
// After role assignments, before saving game:

if (roleConfig.merlin_split_intel_enabled) {
  const viability = canUseSplitIntelMode(assignments, roleConfig);

  if (!viability.viable) {
    return NextResponse.json(
      { error: 'SPLIT_INTEL_BLOCKED', message: viability.reason },
      { status: 400 }
    );
  }

  const groups = distributeSplitIntelGroups(assignments);
  if (groups) {
    // Store in games table
    await supabase.from('games').update({
      split_intel_certain_evil_ids: groups.certainEvilIds,
      split_intel_mixed_evil_id: groups.mixedEvilId,
      split_intel_mixed_good_id: groups.mixedGoodId,
    }).eq('id', gameId);
  }
}
```

### 6. UI Components (30 min)

**Update `RoleConfigPanel.tsx`** - Add toggle with mutual exclusivity:
```tsx
// Add to config options
<Toggle
  label="Merlin Split Intel Mode"
  description="Merlin sees two groups: certain evil, and a mixed group with one evil and one good."
  checked={config.merlin_split_intel_enabled ?? false}
  onChange={(checked) => {
    updateConfig({
      ...config,
      merlin_split_intel_enabled: checked,
      merlin_decoy_enabled: checked ? false : config.merlin_decoy_enabled,
    });
  }}
  disabled={config.merlin_decoy_enabled}
/>
```

**Update `RoleRevealModal.tsx`** - Two-group display:
```tsx
{splitIntel?.enabled && (
  <div className="space-y-4">
    {/* Certain Evil Group */}
    {splitIntel.certainEvil.length > 0 && (
      <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-4">
        <h4 className="text-red-400 font-bold">{splitIntel.certainLabel}</h4>
        <p className="text-red-300 text-sm">{splitIntel.certainDescription}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {splitIntel.certainEvil.map(p => (
            <span key={p.id} className="px-3 py-1 bg-red-800/50 rounded">
              {p.name}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Mixed Intel Group */}
    <div className="bg-amber-900/30 border border-amber-500/40 rounded-lg p-4">
      <h4 className="text-amber-400 font-bold">{splitIntel.mixedLabel}</h4>
      <p className="text-amber-300 text-sm">{splitIntel.mixedDescription}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {splitIntel.mixedIntel.map(p => (
          <span key={p.id} className="px-3 py-1 bg-amber-800/50 rounded">
            {p.name}
          </span>
        ))}
      </div>
    </div>

    {/* Hidden warning */}
    {splitIntel.hiddenWarning && (
      <p className="text-slate-400 text-sm">
        ⚠️ {splitIntel.hiddenWarning}
      </p>
    )}
  </div>
)}
```

### 7. Testing (15 min)

**Create `tests/unit/domain/split-intel.test.ts`**:
```typescript
import { describe, it, expect } from 'vitest';
import { distributeSplitIntelGroups, canUseSplitIntelMode } from '@/lib/domain/split-intel';

describe('Split Intel Mode', () => {
  it('distributes 3 visible evil into 2 certain + 1 mixed', () => {
    const assignments = [
      { playerId: '1', role: 'evil', specialRole: 'assassin' },
      { playerId: '2', role: 'evil', specialRole: 'morgana' },
      { playerId: '3', role: 'evil', specialRole: 'minion' },
      { playerId: '4', role: 'good', specialRole: 'merlin' },
      { playerId: '5', role: 'good', specialRole: 'servant' },
    ];

    const groups = distributeSplitIntelGroups(assignments);

    expect(groups).not.toBeNull();
    expect(groups!.certainEvilIds.length).toBe(2);
    expect(groups!.mixedEvilId).toBeDefined();
    expect(groups!.mixedGoodId).toBe('5'); // Only eligible good player
  });

  it('returns null when 0 visible evil', () => {
    const assignments = [
      { playerId: '1', role: 'evil', specialRole: 'mordred' },
      { playerId: '2', role: 'evil', specialRole: 'oberon_chaos' },
      { playerId: '3', role: 'good', specialRole: 'merlin' },
    ];

    const groups = distributeSplitIntelGroups(assignments);
    expect(groups).toBeNull();
  });
});
```

## Key Files Changed

| File | Type | Description |
|------|------|-------------|
| `migrations/014_merlin_split_intel.sql` | New | Schema changes |
| `types/role-config.ts` | Modify | Add `merlin_split_intel_enabled` |
| `types/game.ts` | Modify | Add split intel fields |
| `lib/domain/split-intel.ts` | New | Group distribution logic |
| `lib/domain/visibility.ts` | Modify | Add `getSplitIntelVisibility` |
| `app/api/rooms/[code]/distribute/route.ts` | Modify | Group selection |
| `app/api/rooms/[code]/role/route.ts` | Modify | Return groups |
| `components/RoleConfigPanel.tsx` | Modify | Add toggle |
| `components/RoleRevealModal.tsx` | Modify | Two-group display |
| `components/game/GameOver.tsx` | Modify | Mixed group reveal |

## Common Issues

### Issue: Both modes enabled
**Solution**: Add mutual exclusivity check in UI and API validation.

### Issue: Game starts with 0 visible evil
**Solution**: Check `canUseSplitIntelMode()` in distribute API and return 400 error.

### Issue: Groups not persisted
**Solution**: Ensure games table update includes all three split intel columns.

## Next Steps

After implementing:
1. Run unit tests: `npm run test:unit`
2. Test manually in browser with different role configurations
3. Verify mutual exclusivity works in UI
4. Test all visibility combinations (Mordred, Oberon Chaos)
5. Verify game-over reveal shows mixed group indicator
