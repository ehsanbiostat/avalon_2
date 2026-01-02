# Research: Lunatic & Brute Evil Characters

**Feature**: 020-lunatic-brute-roles
**Date**: 2026-01-01

## Research Summary

All technical decisions for this feature are resolved. The implementation follows established patterns from previous special role additions (Morgana, Mordred, Oberon).

## Decision 1: Quest Action Validation Architecture

**Decision**: Extend existing `validateQuestAction` function in `quest-resolver.ts` with specialRole parameter

**Rationale**:
- The function already validates Good players cannot submit Fail
- Adding specialRole parameter follows single responsibility principle
- Keeps all quest action validation logic centralized
- API route already has access to player's specialRole from database

**Alternatives Considered**:
1. ❌ Separate validation function per role - Too fragmented, harder to maintain
2. ❌ Validation in UI only - Security risk, API must enforce constraints
3. ✅ Extended validateQuestAction - Clean, testable, follows existing pattern

## Decision 2: UI Constraint Approach

**Decision**: Show disabled/greyed-out buttons for unavailable actions, require manual click

**Rationale**:
- Maintains player agency and game immersion
- Clear visual feedback about role constraints
- Consistent with how other constrained UI states work in the app
- Prevents confusion from auto-submit behavior

**Alternatives Considered**:
1. ❌ Auto-submit - Removes player agency, confusing UX
2. ❌ Hide unavailable buttons - Confusing, players wonder where button went
3. ✅ Greyed-out + manual click - Clear, consistent, maintains engagement

## Decision 3: Role Configuration Placement

**Decision**: Add Lunatic/Brute toggles in Evil Team Roles section, visible only for 7+ players

**Rationale**:
- Follows existing pattern for optional evil roles (Morgana, Mordred, Oberon)
- 7+ player restriction ensures 3+ evil slots for Assassin + new role
- Clear separation from Game Options section (which has modes, not characters)

**Alternatives Considered**:
1. ❌ New "Big Box Roles" section - Over-complicated, these are just evil roles
2. ❌ Available at all player counts - Would conflict with Assassin requirement
3. ✅ Evil section with player count gating - Follows established pattern

## Decision 4: Database Migration Approach

**Decision**: Single migration adding 'lunatic' and 'brute' to special_role CHECK constraint

**Rationale**:
- PostgreSQL enum-like CHECK constraint is already in place
- Single ALTER TABLE statement is sufficient
- No data migration needed (new roles only)

**Alternatives Considered**:
1. ❌ PostgreSQL native ENUM - Would require DROP/CREATE, more complex
2. ✅ CHECK constraint modification - Simple, matches existing pattern

## Decision 5: Error Codes

**Decision**: Add specific error codes for role-specific validation failures

**Rationale**:
- Allows precise error messages in UI
- Enables role-specific error handling if needed
- Follows existing ERROR_CODES pattern in constants.ts

**Error Codes Added**:
- `LUNATIC_MUST_FAIL` - When Lunatic tries to submit Success
- `BRUTE_CANNOT_FAIL_LATE_QUEST` - When Brute tries to Fail on Quest 4/5

## Decision 6: Visibility Integration

**Decision**: Standard evil visibility (visible to Merlin, know teammates)

**Rationale**:
- Confirmed in clarification session
- No special visibility properties needed
- Integrates with existing Evil Ring mode automatically

**Configuration**:
```typescript
lunatic: {
  knownToMerlin: true,   // Visible to Merlin
  knowsTeammates: true,  // Knows evil teammates
}
brute: {
  knownToMerlin: true,   // Visible to Merlin
  knowsTeammates: true,  // Knows evil teammates
}
```

## Decision 7: Role Exclusivity

**Decision**: Lunatic/Brute mutually exclusive with Assassin and Oberon

**Rationale**:
- Confirmed in clarification session
- Prevents role combination conflicts
- Assassin has special end-game ability
- Oberon has special visibility isolation

**Validation Logic**:
- One player = one special role
- Role config validation counts required slots
- Error if more special evil roles than evil player slots

## Unresolved Items

None. All technical decisions are resolved through spec clarifications and codebase analysis.
