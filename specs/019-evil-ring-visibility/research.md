# Research: Evil Ring Visibility Mode

**Feature**: 019-evil-ring-visibility
**Date**: 2025-12-30

## Research Topics

### 1. Ring Formation Algorithm

**Decision**: Use circular linked list pattern with random shuffle

**Rationale**:
- Simple O(n) algorithm for formation
- Shuffle ensures random order (not based on join order, seating, or role)
- Circular pattern guarantees each player knows exactly one and is known by exactly one
- Existing `shuffleArray()` utility provides sufficient randomness

**Alternatives Considered**:
- **Random pair selection**: Rejected - doesn't guarantee circular chain
- **Graph-based approach**: Rejected - overcomplicated for max 4 players
- **Deterministic ordering**: Rejected - predictable patterns exploitable

**Implementation**:
```typescript
function formEvilRing(playerIds: string[]): Record<string, string> {
  const shuffled = shuffleArray([...playerIds]);
  const ring: Record<string, string> = {};
  for (let i = 0; i < shuffled.length; i++) {
    ring[shuffled[i]] = shuffled[(i + 1) % shuffled.length];
  }
  return ring;
}
```

### 2. Prerequisite Calculation

**Decision**: Calculate non-Oberon evil count from player count and role config

**Rationale**:
- Evil count is derived from `ROLE_RATIOS[playerCount].evil`
- If Oberon enabled (standard or chaos), subtract 1 from count
- Minimum 3 non-Oberon evil required for meaningful ring

**Player Count Matrix**:

| Players | Total Evil | With Oberon | Ring Available? |
|---------|------------|-------------|-----------------|
| 5       | 2          | 1           | ❌ No           |
| 6       | 2          | 1           | ❌ No           |
| 7       | 3          | 2           | ❌ No (with Oberon) |
| 7       | 3          | 3           | ✅ Yes (no Oberon) |
| 8       | 3          | 2           | ❌ No (with Oberon) |
| 8       | 3          | 3           | ✅ Yes (no Oberon) |
| 9       | 3          | 2           | ❌ No (with Oberon) |
| 9       | 3          | 3           | ✅ Yes (no Oberon) |
| 10      | 4          | 3           | ✅ Yes           |

**Implementation**:
```typescript
function canEnableEvilRingVisibility(playerCount: number, oberon: boolean): boolean {
  const totalEvil = ROLE_RATIOS[playerCount].evil;
  const nonOberonEvil = oberon ? totalEvil - 1 : totalEvil;
  return nonOberonEvil >= 3;
}
```

### 3. Storage Pattern

**Decision**: Use JSONB column similar to split intel groups

**Rationale**:
- Consistent with existing `split_intel_*` and `oberon_split_intel_*` columns
- JSONB allows flexible key-value storage for ring assignments
- Server-side only - never sent to clients in full

**Alternatives Considered**:
- **Separate table**: Rejected - overcomplicated for simple key-value pairs
- **Array columns**: Rejected - doesn't capture player→teammate relationship
- **In-memory only**: Rejected - doesn't survive server restarts

**Schema**:
```sql
ALTER TABLE games ADD COLUMN evil_ring_assignments JSONB;
-- Example: {"pid1": "pid2", "pid2": "pid3", "pid3": "pid1"}
```

### 4. UI Toggle Pattern

**Decision**: Follow Oberon Split Intel pattern with dynamic disable

**Rationale**:
- Consistent with existing toggle patterns in `RoleConfigPanel.tsx`
- Dynamic enable/disable based on calculated prerequisites
- Auto-disable with notification when config changes invalidate it

**Existing Pattern** (from Oberon Split Intel):
```tsx
const canEnableOberonSplitIntel = roleConfig.oberon === 'standard';
// Toggle disabled when prerequisite not met
// Auto-disables when Oberon changed
```

**New Pattern**:
```tsx
const nonOberonEvilCount = calculateNonOberonEvilCount(expectedPlayers, roleConfig);
const canEnableEvilRingVisibility = nonOberonEvilCount >= 3;
// Toggle disabled when < 3 non-Oberon evil
// Auto-disables when player count or Oberon changes
```

### 5. Visibility Display Pattern

**Decision**: Create new section in role reveal for ring info

**Rationale**:
- Evil players need distinct display from standard teammate list
- Must show name only (not role) per clarification
- Must show hidden count including Oberon

**Existing Evil Visibility**:
```tsx
// Shows: "Your Evil Teammates" with names and roles
knownPlayers: [{ id, name, role }]
```

**New Ring Visibility**:
```tsx
// Shows: "Your Known Teammate" with name only
{
  enabled: true,
  known_teammate: { id: string; name: string },  // Name only, no role
  hidden_count: number,
  explanation: "Ring Visibility Mode: You only know one teammate."
}
```

### 6. Mode Compatibility

**Decision**: Evil Ring Visibility is independent of Merlin visibility modes

**Rationale**:
- Evil Ring affects evil→evil visibility
- Merlin modes affect Merlin→evil visibility
- No overlap or conflict between these visibility dimensions

**Compatibility Matrix**:

| Mode Combination | Allowed | Notes |
|------------------|---------|-------|
| Evil Ring + Merlin Decoy | ✅ | Different visibility targets |
| Evil Ring + Merlin Split Intel | ✅ | Different visibility targets |
| Evil Ring + Oberon Split Intel | ✅ | Different visibility targets |
| Evil Ring + Lady of the Lake | ✅ | Lady investigations unaffected |

### 7. Watcher Handling

**Decision**: Watchers see nothing about evil team until game ends

**Rationale**:
- Consistent with existing watcher neutrality
- Prevents information leakage if watcher later joins as player
- Aligns with existing `WatcherGameBoard` implementation

**No changes needed**: Existing watcher implementation already hides role information during gameplay.

## Conclusion

All research questions resolved. No technical blockers identified. Implementation can proceed following established patterns from Split Intel and Oberon Split Intel features.
