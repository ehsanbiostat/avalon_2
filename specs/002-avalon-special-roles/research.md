# Research: Phase 2 – Special Roles & Configurations

**Feature**: 002-avalon-special-roles
**Date**: 2025-12-03

## Overview

This document captures technology decisions and research findings for Phase 2 implementation.

## Decision 1: Role Configuration Storage

**Decision**: Use JSONB column for role configuration

**Rationale**:
- Flexible schema allows adding new roles without migrations
- Easy to query and update individual config values
- PostgreSQL JSONB has excellent performance for small documents
- Default value handles backward compatibility

**Alternatives Considered**:
- Separate `room_roles` table: More normalized but adds complexity for simple config
- Multiple boolean columns: Rigid schema, requires migration for each new role
- Separate config table: Over-engineering for current needs

## Decision 2: Oberon Mode Representation

**Decision**: Use separate enum values (`oberon_standard`, `oberon_chaos`)

**Rationale**:
- Simpler queries without runtime mode checking
- Clear in database what variant is being used
- Easier to extend if more Oberon variants added
- Consistent with existing enum pattern

**Alternatives Considered**:
- Single `oberon` value + separate `oberon_mode` column: More complex joins
- JSON config for mode: Inconsistent with other role storage
- Runtime flag in application only: Lost if data examined directly

## Decision 3: Lady of Lake Storage

**Decision**: Store holder at room level + boolean flag on player_role

**Rationale**:
- Room-level holder allows quick lookup without joining
- Player-level flag enables role-specific display in role reveal
- Supports future phases where holder might change during game
- Clear ownership of token at any point

**Alternatives Considered**:
- Only room-level: Can't easily show on player's role card
- Only player-level: Requires scan to find holder
- Separate `tokens` table: Over-engineering for single token

## Decision 4: Visibility Logic Location

**Decision**: Pure functions in `lib/domain/visibility.ts`

**Rationale**:
- Pure functions are easy to unit test
- Follows existing pattern from MVP (`lib/domain/roles.ts`)
- Can be reused by multiple API endpoints
- Constitution requires domain logic isolation

**Alternatives Considered**:
- Database views/functions: Harder to test, mix of concerns
- Inline in API routes: Duplication, harder to test
- Complex ORM queries: Ties logic to database schema

## Decision 5: Configuration Validation Timing

**Decision**: Validate on room creation AND before distribution

**Rationale**:
- Creation-time validation prevents invalid rooms
- Distribution-time re-validation catches edge cases (player count changes)
- Better UX with immediate feedback on configuration errors
- Prevents wasted games due to config errors

**Alternatives Considered**:
- Only creation-time: Misses edge cases if room state changes
- Only distribution-time: Poor UX, find out too late
- Client-only validation: Can be bypassed, not trustworthy

## Best Practices Applied

### From Avalon Game Rules
- Merlin and Assassin always required
- Standard role ratios per player count
- Visibility rules are absolute (no partial information)
- Lady of Lake starts to manager's left

### From Existing MVP Implementation
- Server-side privileged operations
- Pure domain functions for game logic
- TypeScript strict mode for all new code
- Unit tests for domain logic

### From PostgreSQL/Supabase
- Use JSONB for flexible config
- Add indexes for frequently queried columns
- CASCADE on foreign keys for cleanup
- Comments on columns for documentation

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| How to handle mid-game role config changes? | Not allowed - config locked after room creation |
| What if Lady holder disconnects? | Token stays with them; they reclaim on rejoin |
| Order of players for Lady designation? | Join order (tracked via `joined_at`) |
| Show Oberon mode to all players? | Yes, shown in "Roles in Play" section |

## Future Considerations

- **Phase 3**: Lady of Lake in-game mechanic will need:
  - `lady_of_lake_uses` counter (0-3)
  - `lady_of_lake_history` array (who was checked)
  - API endpoint for using the token
  
- **Phase 3**: Assassin guess will need:
  - `assassin_guess_player_id` column
  - Trigger when good team wins
  - Game outcome determination logic

- **Future roles**: JSONB config supports adding:
  - Lancelot (switches teams mid-game)
  - Guinevere (custom variant)
  - Any homebrew roles

