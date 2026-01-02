# Implementation Plan: Lunatic & Brute Evil Characters

**Branch**: `020-lunatic-brute-roles` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-lunatic-brute-roles/spec.md`

## Summary

Add two new Evil special roles from the Avalon Big Box expansion:

1. **Lunatic** 🤪 - Must play Fail on every quest (no choice)
2. **Brute** 👊 - Can only Fail on Quests 1-3; must Success on Quests 4-5

These roles add strategic depth through constrained quest voting, making evil players potentially identifiable through their quest patterns. The implementation extends the existing role system with new special roles, quest action validation, and UI constraints.

## Technical Context

**Language/Version**: TypeScript 5.x with React 18+ (Next.js App Router)
**Primary Dependencies**: Next.js 14+, Supabase, React, Tailwind CSS
**Storage**: Supabase PostgreSQL (player_roles table, role_config JSONB)
**Testing**: Vitest for unit tests, Playwright for E2E
**Target Platform**: Web (desktop-first, mobile-responsive)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Quest action submission < 200ms, UI updates < 100ms
**Constraints**: Must integrate with existing visibility system, Evil Ring mode, Split Intel modes
**Scale/Scope**: 5-10 players per game, 7+ players required for Lunatic/Brute

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| TypeScript strict mode | ✅ PASS | All new types use strict TypeScript |
| Domain logic in lib/domain/ | ✅ PASS | Quest action validation in quest-resolver.ts |
| Component size < 150 lines | ✅ PASS | UI changes are minimal per component |
| RLS/Security server-side | ✅ PASS | Action validation happens in API route |
| Spec-driven development | ✅ PASS | Full spec with clarifications complete |
| No ad-hoc features | ✅ PASS | Following speckit workflow |

## Project Structure

### Documentation (this feature)

```text
specs/020-lunatic-brute-roles/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── database.ts      # ADD: 'lunatic' | 'brute' to SpecialRole union
│   └── role-config.ts   # ADD: lunatic?: boolean, brute?: boolean
├── lib/
│   ├── domain/
│   │   ├── roles.ts           # ADD: Lunatic/Brute to role info & distribution
│   │   ├── role-config.ts     # ADD: Lunatic/Brute validation
│   │   ├── quest-resolver.ts  # MODIFY: validateQuestAction for constraints
│   │   └── visibility.ts      # ADD: Lunatic/Brute to standard evil visibility
│   └── utils/
│       └── constants.ts       # ADD: SPECIAL_ROLES entries for Lunatic/Brute
├── components/
│   ├── RoleConfigPanel.tsx    # ADD: Lunatic/Brute toggles (7+ players only)
│   ├── RoleRevealModal.tsx    # ADD: Lunatic/Brute role descriptions
│   └── game/
│       └── QuestExecution.tsx # MODIFY: Constrained action buttons
└── app/
    └── api/
        └── games/
            └── [gameId]/
                └── quest/
                    └── action/
                        └── route.ts  # MODIFY: Validate Lunatic/Brute constraints

supabase/
└── migrations/
    └── 020_lunatic_brute_roles.sql  # ADD: New special role values

tests/
└── unit/
    └── lunatic-brute.test.ts  # NEW: Unit tests for quest action validation
```

**Structure Decision**: Single Next.js application structure (existing). Changes extend existing files following established patterns from previous role implementations (Morgana, Mordred, Oberon).

## Complexity Tracking

No violations. Implementation follows established patterns for special roles.

## Key Implementation Notes

### 1. Type System Extension

Add `'lunatic' | 'brute'` to `SpecialRole` union in `types/database.ts`. This is the source of truth for special roles.

### 2. Quest Action Validation

The key logic change is in `lib/domain/quest-resolver.ts`:

```typescript
// Extended validateQuestAction function
export function validateQuestAction(
  playerRole: 'good' | 'evil',
  specialRole: SpecialRole,
  action: QuestActionType,
  questNumber: number
): string | null {
  // Good players can only submit success
  if (playerRole === 'good' && action === 'fail') {
    return 'Good players can only submit success';
  }

  // Lunatic MUST fail
  if (specialRole === 'lunatic' && action === 'success') {
    return 'The Lunatic must play Fail on every quest';
  }

  // Brute cannot fail on quests 4-5
  if (specialRole === 'brute' && action === 'fail' && questNumber >= 4) {
    return 'The Brute cannot play Fail on Quest 4 or 5';
  }

  return null;
}
```

### 3. UI Constraints

The `QuestExecution.tsx` component needs to:
- Receive `specialRole` prop (in addition to existing `playerRole`)
- Calculate `canFail` and `canSuccess` based on role + quest number
- Show disabled (greyed out) buttons for unavailable actions

### 4. Role Configuration

- Lunatic and Brute toggles only visible when `expectedPlayers >= 7`
- Both are mutually exclusive with Assassin (separate players)
- Both are mutually exclusive with Oberon (separate players)
- Validation in `lib/domain/role-config.ts`

### 5. Visibility Rules

Lunatic and Brute follow standard evil visibility:
- Visible to Merlin (knownToMerlin: true)
- Know their evil teammates (knowsTeammates: true)
- Subject to Evil Ring Visibility mode if enabled

## Dependencies

| Dependency | Reason | Risk |
|------------|--------|------|
| Existing SpecialRole system | Must extend union type | Low - well-established pattern |
| Quest action API | Must pass specialRole to validation | Low - minor API change |
| Role config validation | New constraints for 7+ players | Low - follows existing pattern |
| UI components | Add constrained button states | Low - React conditional rendering |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing role tests | Medium | Run full test suite after type changes |
| UI confusion with disabled buttons | Low | Clear visual indication + explanatory text |
| Edge case: Both roles + all evil slots used | Low | Validation prevents over-allocation |
