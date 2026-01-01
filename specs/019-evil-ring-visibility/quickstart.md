# Quickstart: Evil Ring Visibility Mode

**Feature**: 019-evil-ring-visibility
**Date**: 2025-12-30

## Overview

Evil Ring Visibility Mode is a game configuration where evil players only know ONE teammate each in a circular chain pattern. Each player sees only their known teammate's name (not role).

## Quick Test

### Prerequisites
- 7+ players configured (for 3+ evil)
- No Oberon enabled (or 10 players for 4 evil with Oberon)

### Steps

1. **Create a room** with 7+ expected players
2. **Enable Evil Ring Visibility** toggle in role configuration
3. **Distribute roles** to all players
4. **As an evil player**, view role reveal:
   - Should see ONE teammate name (e.g., "Alice is Evil")
   - Should see hidden count (e.g., "1 other evil player hidden from you")
   - Should see explanation message

## Key Files

### New Files

| File | Purpose |
|------|---------|
| `src/lib/domain/evil-ring-visibility.ts` | Ring formation and visibility logic |
| `supabase/migrations/019_evil_ring_visibility.sql` | Database schema changes |
| `tests/unit/domain/evil-ring-visibility.test.ts` | Unit tests |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/role-config.ts` | Add `evil_ring_visibility_enabled` |
| `src/types/game.ts` | Add `EvilRingVisibility` types |
| `src/lib/domain/role-config.ts` | Add prerequisite validation |
| `src/lib/domain/visibility.ts` | Add ring visibility logic |
| `src/components/RoleConfigPanel.tsx` | Add toggle UI |
| `src/components/RolesInPlay.tsx` | Add indicator |
| `src/components/RoleRevealModal.tsx` | Add ring display |
| `src/app/api/rooms/[code]/distribute/route.ts` | Form ring during distribution |
| `src/app/api/rooms/[code]/role/route.ts` | Return ring visibility |

## Configuration Matrix

| Players | Evil Count | With Oberon | Ring Available? |
|---------|------------|-------------|-----------------|
| 5-6     | 2          | 1           | ❌ No           |
| 7-9     | 3          | 2           | With Oberon: ❌ No |
| 7-9     | 3          | 3           | No Oberon: ✅ Yes |
| 10      | 4          | 3           | ✅ Yes           |

## API Changes

### GET /api/rooms/[code]/role

For evil players with ring mode enabled:

```json
{
  "role": "evil",
  "specialRole": "assassin",
  "evil_ring_visibility": {
    "enabled": true,
    "known_teammate": {
      "id": "player-uuid",
      "name": "Alice"
    },
    "hidden_count": 1,
    "explanation": "Ring Visibility Mode: You only know one teammate."
  }
}
```

## Common Issues

### Toggle is disabled

**Cause**: Fewer than 3 non-Oberon evil players
**Solution**:
- Increase player count to 7+ (without Oberon) or 10 (with Oberon)
- Or disable Oberon to free up one evil slot

### Toggle auto-disabled

**Cause**: Config changed to invalidate prerequisites
**Triggers**:
- Oberon enabled when only 3 evil
- Player count reduced below 7

### Wrong teammate shown

**Cause**: Ring formation uses random shuffle
**Expected**: Each game creates a new random ring order
**Verification**: Ring assignments should persist for entire game

## Testing Checklist

- [ ] Toggle enabled with 7+ players, no Oberon
- [ ] Toggle disabled with 6 players
- [ ] Toggle disabled with 7 players + Oberon
- [ ] Toggle enabled with 10 players + Oberon
- [ ] Auto-disable when Oberon toggled on
- [ ] Auto-disable when player count reduced
- [ ] Evil player sees exactly 1 teammate name
- [ ] Evil player sees hidden count (includes Oberon)
- [ ] Oberon sees no teammates
- [ ] Ring assignments persist across role reveal views
- [ ] Game end reveals all roles (not just ring structure)
- [ ] Watchers see no evil info until game end
