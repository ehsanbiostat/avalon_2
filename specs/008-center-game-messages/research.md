# Research: Center Game Messages

**Feature**: 008-center-game-messages
**Date**: 2025-12-05
**Phase**: 0 - Research & Decisions

## Overview

This document captures research findings and design decisions for replacing the static "ROUND TABLE" label with dynamic game status messages in the center of the player circle.

---

## Decision 1: Message Content & Mapping

**Context**: Need to determine what messages to display for each game phase and who should see them.

**Research Question**: What information is most valuable to players at each game phase?

**Findings**:
- Analyzed existing game phases from codebase:
  - `team_building` - Leader selects team members
  - `voting` - All players vote on proposed team
  - `quest` - Selected team members submit quest actions
  - `quest_result` - Temporary phase showing quest outcome
  - `assassin` - Assassin selects target (guessing Merlin)
  - `lady_of_lake` - Lady holder investigates a player
  - `game_over` - Final game outcome displayed

- User testing insights from spec:
  - Players need to know "whose turn it is"
  - Quest number should be immediately visible
  - Team size requirements reduce confusion
  - Action prompts help players know what to do

**Decision**: **Phase-specific message structure**

**Rationale**:
- Each phase has different information needs
- Some messages are role-specific (leader vs team member vs observer)
- Messages should guide player actions, not just report state

**Message Mapping**:

| Phase | Role | Message Line 1 | Message Line 2 |
|-------|------|----------------|----------------|
| team_building | Leader | "Quest {N}" | "Select {size} players for the quest" |
| team_building | Others | "Quest {N}" | "{Leader} is selecting a team" |
| voting | All | "Quest {N}" | "Vote on the proposed team" |
| quest | Team Member | "Quest {N}" | "Submit your quest action" |
| quest | Observer | "Quest {N}" | "Quest team is deciding..." |
| quest_result | All | "Quest {N}" | "Quest {success/failed}!" |
| assassin | Assassin | "Assassin Phase" | "Select your target" |
| assassin | Others | "Assassin Phase" | "The Assassin is choosing..." |
| lady_of_lake | Holder | "Lady of the Lake" | "Select a player to investigate" |
| lady_of_lake | Others | "Lady of the Lake" | "{Holder} is investigating..." |
| game_over | All | "Game Over" | "{Good/Evil} Wins!" |

**Alternatives Considered**:
- Generic single message for all phases → Rejected: Less helpful, misses opportunity for guidance
- Icon-based indicators → Deferred: Requires more design work, text is clearer for MVP

---

## Decision 2: Implementation Approach

**Context**: Need to decide how to structure the code for message selection and rendering.

**Research Question**: Inline logic vs extracted utility function?

**Findings**:
- Current PlayerSeats component is ~180 lines
- Adding inline conditionals would add ~30-40 lines
- Message logic is display-only, no complex business rules
- Future: May want to internationalize messages

**Decision**: **Inline conditional rendering for MVP, extract to utility if needed later**

**Rationale**:
- Simpler for initial implementation
- Keeps all rendering logic in one place
- Easy to refactor later if complexity grows
- No premature abstraction

**Implementation Pattern**:
```tsx
const getCenterMessage = () => {
  if (game.phase === 'team_building') {
    if (isLeader) return { line1: `Quest ${game.current_quest}`, line2: `Select ${size} players` };
    return { line1: `Quest ${game.current_quest}`, line2: `${leaderName} is selecting` };
  }
  // ... other phases
};

const message = getCenterMessage();
```

**Alternatives Considered**:
- Separate utility file (`lib/utils/game-messages.ts`) → Deferred: Can extract later if needed
- React component for center messages → Rejected: Overkill for simple text display
- Lookup table/map → Considered: Good for i18n later, but inline is simpler for MVP

---

## Decision 3: Styling & Layout

**Context**: Need to ensure messages are readable and fit within the existing center circle.

**Research Question**: Modify existing styles or add new ones?

**Findings**:
- Current center circle:
  - Size: 128px diameter (w-32 h-32)
  - Background: gradient-to-br from-amber-800 to-amber-950
  - Border: 4px amber-700
  - Current text: "ROUND TABLE" in text-sm font-bold
- Font sizing for readability:
  - Line 1 (Quest number / phase): text-base to text-lg
  - Line 2 (detail message): text-sm to text-base
- Contrast requirements: 4.5:1 minimum (WCAG AA)

**Decision**: **Maintain existing circle styles, adjust only text content and sizing**

**Rationale**:
- Consistent visual design
- Minimal risk of layout breaks
- Text-amber-500 provides good contrast on dark background (>7:1 ratio)
- Two-line layout fits comfortably in 128px circle

**Styling Approach**:
```tsx
<div className="... existing classes ...">
  <div className="flex flex-col items-center justify-center text-center">
    <span className="text-lg font-bold text-amber-500">{message.line1}</span>
    <span className="text-sm text-amber-400">{message.line2}</span>
  </div>
</div>
```

**Alternatives Considered**:
- Larger center circle → Rejected: Would require repositioning all players
- Icon + text → Deferred: Adds complexity, text-only is clearer
- Animated transitions → Deferred: Nice-to-have, not required for MVP

---

## Decision 4: Error Handling & Edge Cases

**Context**: Need to handle cases where data might be missing or invalid.

**Research Question**: How to handle missing/invalid game state?

**Findings**:
- Edge cases from spec:
  - Long player nicknames (>20 chars)
  - Missing leader data
  - Undefined phase
  - Rapid phase transitions

**Decision**: **Graceful degradation with fallback messages**

**Rationale**:
- Display should never crash or show blank
- Better to show generic message than error
- Log warnings for debugging but keep UI functional

**Fallback Strategy**:
- Unknown phase → "Quest {N}" / "Game in progress..."
- Missing leader → "Quest {N}" / "Waiting for leader..."
- Long nickname → Truncate to 15 chars + "..."
- Rapid transitions → React batch updates handle automatically

**Implementation**:
```tsx
const leaderNickname = leader?.nickname?.slice(0, 15) || 'Unknown';
const questNumber = game.current_quest || 1;
const defaultMessage = { line1: `Quest ${questNumber}`, line2: 'Game in progress...' };
```

**Alternatives Considered**:
- Throw errors → Rejected: Would break UI
- Show error messages to users → Rejected: Not user-friendly
- Skip rendering → Rejected: Empty center looks broken

---

## Decision 5: Testing Strategy

**Context**: How to verify all message variants work correctly?

**Research Question**: Manual testing vs automated tests?

**Findings**:
- 10+ message variants across phases
- Most complexity is in conditional rendering
- No business logic to unit test
- Visual verification is important (contrast, layout)

**Decision**: **Manual testing for MVP, optional component tests later**

**Rationale**:
- Manual testing covers all scenarios quickly
- Visual validation is essential (automated tests won't catch styling issues)
- Component tests add overhead without much value for simple conditional rendering
- Can add tests later if bugs emerge

**Testing Approach**:
1. Create quickstart.md with test scenarios
2. Manually verify each phase message
3. Test edge cases (long names, missing data)
4. Verify on different screen sizes
5. Check contrast ratios with browser tools

**Alternatives Considered**:
- Component tests with React Testing Library → Deferred: Can add if needed
- E2E tests → Rejected: Overkill for UI-only change
- Visual regression tests → Deferred: Good for future but not required now

---

## Summary

**Key Technical Decisions**:
1. ✅ Phase-specific messages with role-based variants
2. ✅ Inline conditional rendering (extract later if needed)
3. ✅ Maintain existing styles, only change text
4. ✅ Graceful fallbacks for edge cases
5. ✅ Manual testing for MVP

**Risk Mitigation**:
- Low risk: Pure UI change, no data/API modifications
- Rollback: Simple revert if issues found
- Testing: Comprehensive manual scenarios in quickstart.md

**Open Questions**: None - all research complete

**Next Phase**: Design & Contracts (data-model.md, contracts/, quickstart.md)

