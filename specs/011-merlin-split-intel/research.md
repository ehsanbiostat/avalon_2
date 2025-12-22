# Research: Merlin Split Intel Mode

**Feature**: 011-merlin-split-intel
**Date**: 2025-12-22

## Overview

This document captures research and design decisions for the Merlin Split Intel Mode feature.

## Technical Decisions

### 1. Database Schema: Separate Columns vs Single JSONB

**Decision**: Use separate columns for group assignments

**Rationale**:
- Allows foreign key constraints on player IDs
- Clearer schema documentation
- Easier to query individual groups
- Consistent with existing `merlin_decoy_player_id` pattern

**Alternatives Considered**:
- Single JSONB column: More flexible but loses type safety and FK constraints
- Separate table: Overkill for simple 1:N relationship per game

### 2. Mutual Exclusivity: Decoy Mode vs Split Intel Mode

**Decision**: Make modes mutually exclusive (cannot enable both)

**Rationale**:
- Combining would create complex visibility logic
- Each mode has distinct gameplay purpose
- Simpler for users to understand
- Easier to implement and test

**Alternatives Considered**:
- Allow combining: Would require complex "decoy in which group" logic
- Priority system: One overrides the other - confusing

### 3. Game Start Blocking: 0 Visible Evil Scenario

**Decision**: Block game start with explicit error message

**Rationale**:
- Clarified in spec: user chose Option A (block) over fallback
- Prevents frustrating edge case where mode is enabled but ineffective
- Guides user to fix configuration before game starts
- Clear UX with actionable error message

**Alternatives Considered**:
- Silent fallback to normal Merlin: User wouldn't know mode didn't activate
- Show empty groups: Confusing and provides no value

### 4. Group Distribution Algorithm

**Decision**: Fixed algorithm based on visible evil count

| Visible Evil | Certain Group | Mixed Group |
|--------------|---------------|-------------|
| 1 | 0 (no certain group) | 1 evil + 1 good |
| 2 | 1 evil | 1 evil + 1 good |
| 3+ | 2 evil | 1 evil + 1 good |

**Rationale**:
- Balanced gameplay: always some certainty, some uncertainty
- Scales appropriately with player count
- Simple to implement and understand
- Consistent with spec requirements

**Alternatives Considered**:
- Configurable distribution: Added complexity, out of scope per spec
- More players in mixed group: Would reduce Merlin's useful information

### 5. Visibility Shuffle: Mixed Group Order

**Decision**: Shuffle mixed group player order

**Rationale**:
- Prevents position-based detection (first = evil, second = good)
- Consistent with Merlin Decoy shuffle pattern
- Simple implementation with existing `shuffleArray` utility

### 6. Good Player Selection for Mixed Group

**Decision**: Random selection from all good players except Merlin

**Rationale**:
- Any good player is eligible (including Percival)
- Uniform random distribution
- Consistent with Merlin Decoy selection pattern

**Selection Pool**:
- Included: Loyal Servant, Percival
- Excluded: Merlin (can't see themselves)

## Implementation Patterns

### Existing Patterns to Follow

1. **Role Config Extension**: Follow `merlin_decoy_enabled` pattern in JSONB
2. **Game Column Addition**: Follow `merlin_decoy_player_id` pattern
3. **Visibility Logic**: Extend existing `getVisibilityForRole()` function
4. **UI Toggle**: Follow existing toggle pattern in RoleConfigPanel
5. **Game End Reveal**: Follow decoy reveal pattern in GameOver component

### New Patterns Introduced

1. **Two-Group Display**: New UI pattern for Merlin's role reveal
2. **Mutual Exclusivity**: Toggle disabling pattern in RoleConfigPanel
3. **Game Start Blocking**: Pre-distribution validation check

## Integration Points

### Files to Modify

| File | Changes |
|------|---------|
| `types/role-config.ts` | Add `merlin_split_intel_enabled` |
| `types/game.ts` | Add split intel fields |
| `lib/domain/visibility.ts` | Add `getSplitIntelVisibility()` |
| `lib/domain/role-config.ts` | Add validation + mutual exclusivity |
| `components/RoleConfigPanel.tsx` | Add toggle + mutual exclusivity UI |
| `components/RolesInPlay.tsx` | Add indicator |
| `components/RoleRevealModal.tsx` | Two-group display |
| `components/game/GameOver.tsx` | Mixed group reveal |
| `app/api/rooms/[code]/distribute/route.ts` | Group selection |
| `app/api/rooms/[code]/role/route.ts` | Return groups |

### New Files to Create

| File | Purpose |
|------|---------|
| `lib/domain/split-intel.ts` | Group distribution logic |
| `migrations/014_merlin_split_intel.sql` | Schema changes |
| `tests/unit/domain/split-intel.test.ts` | Unit tests |

## Risk Analysis

### Low Risk
- Schema changes (additive, nullable columns)
- Type extensions (additive)
- API response extensions (additive)

### Medium Risk
- Visibility logic complexity (mitigated by comprehensive tests)
- UI two-group display (new pattern, needs design iteration)

### High Risk (Mitigated)
- Game start blocking (mitigated by clear error message UX)
- Mordred/Oberon combinations (mitigated by thorough test matrix)

## Test Matrix

### Visibility Combinations to Test

| Mordred | Oberon Chaos | Visible Evil | Expected Behavior |
|---------|--------------|--------------|-------------------|
| ❌ | ❌ | 3 (7p) | 2 certain + 1 mixed + 1 good |
| ✅ | ❌ | 2 | 1 certain + 1 mixed + 1 good |
| ❌ | ✅ | 2 | 1 certain + 1 mixed + 1 good |
| ✅ | ✅ | 1 | 0 certain + 1 mixed + 1 good |
| ✅ | ✅ | 0 (5p, 2 evil) | **BLOCKED** - cannot start |

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Block or fallback when 0 visible evil? | Block (user choice in clarification) |
| Can Percival be in mixed group? | Yes, follows Decoy pattern |
| Configurable group sizes? | No, fixed algorithm per spec |
