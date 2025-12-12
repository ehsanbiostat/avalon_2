# Research: Merlin Decoy Configuration

**Feature**: 009-merlin-decoy
**Date**: 2025-12-12

## Research Questions

### Q1: How should decoy selection integrate with existing role distribution?

**Decision**: Decoy selection happens AFTER role distribution, during the same API call.

**Rationale**:
- Role distribution already determines who is Merlin and who is good
- Decoy must be selected from good players (excluding Merlin)
- Single transaction ensures consistency

**Alternatives Considered**:
- Separate decoy selection endpoint → Rejected: adds complexity, timing issues
- Client-side selection → Rejected: security risk, could be manipulated

### Q2: How to handle decoy with existing visibility combinations?

**Decision**: Apply decoy injection AFTER existing visibility rules.

**Rationale**:
- Maintains clean separation of concerns
- Existing Mordred/Oberon logic remains untouched
- Decoy is simply added to the final list

**Implementation**:
```
1. Calculate base evil list (existing getMerlinVisibility)
2. Apply Mordred exclusion (existing)
3. Apply Oberon Chaos exclusion (existing)
4. Add decoy player (NEW)
5. Shuffle final list (NEW - prevents position detection)
```

### Q3: Should the decoy list position be randomized?

**Decision**: Yes, shuffle Merlin's entire evil list when decoy is enabled.

**Rationale**:
- If decoy is always added at the end, position reveals information
- Shuffling prevents any ordering-based detection
- Small performance cost (array shuffle) is negligible

**Alternatives Considered**:
- Fixed position (always last) → Rejected: information leakage
- Insert at random position only → Rejected: still potentially detectable over games

### Q4: How to store decoy identity?

**Decision**: Store `merlin_decoy_player_id` in games table.

**Rationale**:
- Persists for entire game duration
- Revealed at game end (requirement)
- Server-side only (client never sees until game over)
- NULL when decoy mode disabled (clean data model)

**Alternatives Considered**:
- Store in role_config JSONB → Rejected: mixing config with runtime state
- Store in player_roles table → Rejected: not a "role", confuses data model
- Compute on-the-fly → Rejected: must be consistent; can't re-randomize

### Q5: How to generate warning messages?

**Decision**: Combine decoy warning with hidden evil count.

**Rationale**:
- Single consolidated message is clearer
- Existing hidden_count logic can be reused
- Three message variants cover all cases

**Message Templates**:
1. No hidden evil: "⚠️ One of these players is actually good!"
2. 1 hidden (Mordred OR Oberon Chaos): "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."
3. 2 hidden (Mordred AND Oberon Chaos): "⚠️ One of these players is actually good! Also, 2 evil players are hidden from you."

### Q6: How to reveal decoy at game end?

**Decision**: Add `was_decoy` boolean to player objects in game-over response.

**Rationale**:
- Minimal API change
- Easy to display in UI (just add indicator)
- Consistent with how other role info is revealed

**UI Display**: "Alice - Loyal Servant 🎭 Decoy"

### Q7: Can Percival be selected as decoy?

**Decision**: Yes, Percival is eligible.

**Rationale**:
- Percival is a good player, so technically eligible
- No game balance reason to exclude
- More candidates = more unpredictability

**Note**: This means Percival could appear in Merlin's "evil" list while also being known to Percival as a Merlin candidate viewer. This is intentional confusion.

### Q8: What if there's only one eligible decoy candidate?

**Decision**: Still select them (deterministic but unavoidable).

**Rationale**:
- 5-player game: 3 good (Merlin + 2 others) = 2 candidates
- Minimum 2 candidates always available
- Even with Percival, at least 1 Loyal Servant exists

**Edge Case**: Cannot have a game where no decoy candidate exists.

## Technology Decisions

### Random Selection Algorithm

**Decision**: Use `Math.random()` with Fisher-Yates shuffle.

**Rationale**:
- Sufficient randomness for game purposes
- Consistent with existing code patterns
- Not security-critical (game entertainment, not cryptographic)

**Implementation**:
```typescript
function selectDecoyPlayer(eligiblePlayers: string[]): string {
  const index = Math.floor(Math.random() * eligiblePlayers.length);
  return eligiblePlayers[index];
}
```

### Database Migration Approach

**Decision**: Single migration adding column to games table.

**Rationale**:
- Minimal schema change
- No enum modifications needed
- role_config JSONB naturally extends

**Migration**: `012_merlin_decoy.sql`

## Resolved Clarifications

All technical questions resolved. No blocking clarifications remain.

## References

- Existing visibility logic: `src/lib/domain/visibility.ts`
- Role config validation: `src/lib/domain/role-config.ts`
- Role distribution: `src/lib/supabase/roles.ts`
- Game over component: `src/components/game/GameOver.tsx`
