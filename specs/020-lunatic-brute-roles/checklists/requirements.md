# Specification Quality Checklist: Lunatic & Brute Evil Characters

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-01-01
**Updated**: 2026-01-01 (after clarification session)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Clarification Session Summary (2026-01-01)

10 questions asked and answered:

1. **Lunatic + Assassin**: Mutually exclusive (separate players)
2. **Brute + Assassin**: Mutually exclusive (separate players)
3. **UI for constrained options**: Show disabled/greyed out (visible but not clickable)
4. **Auto-submit behavior**: No, require manual click
5. **Merlin visibility**: Standard evil visibility (Merlin sees them)
6. **Role emojis**: Lunatic 🤪, Brute 👊
7. **Minimum player count**: 7+ players (requires 3+ Evil slots)
8. **Oberon combination**: Mutually exclusive special roles
9. **Role description text**: Custom text provided
10. **Watcher visibility**: No role visibility during game, revealed at end

## Notes

All validation items pass. The specification is fully clarified and ready for `/speckit.plan`.

### Key Design Decisions

1. **Role Exclusivity**: Lunatic/Brute cannot be Assassin or Oberon—all are separate special roles
2. **Player Requirement**: 7+ players minimum (need 3+ Evil slots)
3. **UI Treatment**: Disabled buttons shown (not hidden), manual click required
4. **Visibility**: Standard evil visibility to Merlin, standard evil teammate visibility
5. **Watcher Mode**: No role visibility during game (consistent with existing behavior)
