# Component API Contract: PlayerSeats

**Feature**: 008-center-game-messages
**Date**: 2025-12-05
**Phase**: 1 - Design & Contracts
**Component**: `src/components/game/PlayerSeats.tsx`

## Overview

This document defines the component interface contract for the updated `PlayerSeats` component, which now displays dynamic game messages in the center circle.

---

## Component Interface

### Current Props (Unchanged)

```typescript
interface PlayerSeatsProps {
  players: GamePlayer[];              // Array of players in seating order
  currentPlayerId: string | null;     // UUID of current viewing player
  selectedTeam?: string[];            // Currently selected player IDs (for team building)
  onPlayerClick?: (playerId: string) => void; // Callback when player clicked
  selectable?: boolean;               // Whether players can be selected
  maxSelectable?: number;             // Max number of selectable players
  ladyHolderId?: string | null;       // Player holding Lady of the Lake
  disabledPlayerIds?: string[];       // Players that cannot be selected
  draftTeam?: string[] | null;        // Draft team selection (Feature 007)
  isDraftInProgress?: boolean;        // Whether draft selection is active (Feature 007)
}
```

### Proposed Changes

**No prop changes required!** 

The component already receives all necessary data through existing props. The center message logic will use:
- Implicit: `game` state from parent context (GameBoard)
- `players` → to find leader's nickname
- `currentPlayerId` → to determine role-specific messages
- Existing game state passed from parent

**Alternative Approach (if needed)**:

If parent context is insufficient, could add optional props:

```typescript
interface PlayerSeatsProps {
  // ... existing props ...
  
  // NEW: Optional explicit game state props (only if parent context insufficient)
  gamePhase?: GamePhase;              // Explicit phase for message selection
  questNumber?: number;               // Explicit quest number
  leaderId?: string | null;           // Explicit leader ID
  questTeamSize?: number;             // Explicit team size requirement
}
```

**Decision**: Start with implicit state from parent. Add explicit props only if needed during implementation.

---

## Center Circle Rendering Contract

### Message Structure

```typescript
interface CenterMessage {
  line1: string;        // Primary text (max 25 chars recommended)
  line2: string;        // Secondary text (max 35 chars recommended)
}
```

### Message Selection Logic

**Function Signature** (internal to component):

```typescript
function getCenterMessage(
  phase: GamePhase,
  questNumber: number,
  isCurrentPlayerLeader: boolean,
  leaderNickname: string,
  teamSize: number,
  isOnQuestTeam: boolean
): CenterMessage;
```

**Return Guarantees**:
- Always returns a valid CenterMessage (never null/undefined)
- Falls back to default message if phase unknown
- Truncates long nicknames to 15 characters
- Handles missing data gracefully

---

## Message Mapping Specification

### Team Building Phase

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| Is Leader | `Quest ${N}` | `Select ${size} players for the quest` | "Quest 1" / "Select 2 players for the quest" |
| Not Leader | `Quest ${N}` | `${leaderName} is selecting a team` | "Quest 1" / "Alice is selecting a team" |

### Voting Phase

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| All players | `Quest ${N}` | `Vote on the proposed team` | "Quest 2" / "Vote on the proposed team" |

### Quest Execution Phase

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| On quest team | `Quest ${N}` | `Submit your quest action` | "Quest 3" / "Submit your quest action" |
| Not on team | `Quest ${N}` | `Quest team is deciding...` | "Quest 3" / "Quest team is deciding..." |

### Quest Result Phase

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| Quest succeeded | `Quest ${N}` | `Quest succeeded!` | "Quest 1" / "Quest succeeded!" |
| Quest failed | `Quest ${N}` | `Quest failed!` | "Quest 2" / "Quest failed!" |

### Assassin Phase

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| Is Assassin | `Assassin Phase` | `Select your target` | "Assassin Phase" / "Select your target" |
| Not Assassin | `Assassin Phase` | `The Assassin is choosing...` | "Assassin Phase" / "The Assassin is choosing..." |

### Lady of the Lake Phase

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| Is holder | `Lady of the Lake` | `Select a player to investigate` | "Lady of the Lake" / "Select a player to investigate" |
| Not holder | `Lady of the Lake` | `${holderName} is investigating...` | "Lady of the Lake" / "Bob is investigating..." |

### Game Over Phase

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| Good wins | `Game Over` | `Good Wins!` | "Game Over" / "Good Wins!" |
| Evil wins | `Game Over` | `Evil Wins!` | "Game Over" / "Evil Wins!" |

### Fallback (Unknown Phase)

| Condition | Line 1 | Line 2 | Example |
|-----------|--------|--------|---------|
| Any unknown | `Quest ${N}` | `Game in progress...` | "Quest 1" / "Game in progress..." |

---

## Styling Contract

### Layout Structure

```tsx
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 border-4 border-amber-700 shadow-lg">
  <div className="flex flex-col items-center justify-center h-full text-center px-2">
    <span className="text-lg font-bold text-amber-500 leading-tight">
      {message.line1}
    </span>
    <span className="text-sm text-amber-400 leading-tight mt-1">
      {message.line2}
    </span>
  </div>
</div>
```

### CSS Classes

| Element | Classes | Purpose |
|---------|---------|---------|
| Container | `w-32 h-32 rounded-full` | Maintain existing circle size |
| Background | `bg-gradient-to-br from-amber-800 to-amber-950` | Existing gradient |
| Border | `border-4 border-amber-700` | Existing border style |
| Inner wrapper | `flex flex-col items-center justify-center h-full text-center px-2` | Center content |
| Line 1 (primary) | `text-lg font-bold text-amber-500 leading-tight` | Prominent, readable |
| Line 2 (secondary) | `text-sm text-amber-400 leading-tight mt-1` | Subtle, supporting info |

### Accessibility

- **Contrast Ratio**: text-amber-500 on amber-950 background ≥ 7:1 (exceeds WCAG AAA)
- **Font Size**: text-lg (18px) and text-sm (14px) meet minimum readable sizes
- **Text Spacing**: leading-tight prevents overflow while maintaining readability

---

## Behavioral Contract

### Update Behavior

**When props change**:
1. Component re-renders (React default)
2. Message selection logic executes
3. New message displays immediately (no animation for MVP)
4. No flickering or layout shift

**Performance**:
- Message selection: O(1) conditional checks
- Nickname truncation: O(1) string slice
- No additional API calls
- No additional state management

### Error Handling

**Defensive Rendering**:

```typescript
// Fallback values for missing data
const questNumber = game?.current_quest || 1;
const leaderNickname = leader?.nickname?.slice(0, 15) || 'Unknown';
const teamSize = questRequirement?.size || 0;
const phase = game?.phase || 'team_building';

// Never throw errors - always render something
try {
  const message = getCenterMessage(...);
  return <CenterDisplay message={message} />;
} catch (error) {
  console.warn('Failed to generate center message:', error);
  return <CenterDisplay message={{ line1: 'Quest 1', line2: 'Game in progress...' }} />;
}
```

### Backward Compatibility

**Guarantees**:
- Existing PlayerSeats usage remains functional
- No breaking changes to prop interface
- Default behavior: If game state unavailable, shows fallback message
- Can deploy without coordinating with other services

---

## Testing Contract

### Manual Test Scenarios

See [quickstart.md](../quickstart.md) for complete testing guide.

**Required Validations**:

| Test | Expected Outcome | How to Verify |
|------|------------------|---------------|
| Team building (leader) | "Quest 1" / "Select 2 players..." | Start game, verify as leader |
| Team building (non-leader) | "Quest 1" / "{Name} is selecting" | Start game, verify as non-leader |
| Voting phase | "Quest 1" / "Vote on the proposed team" | Propose team, verify message |
| Quest phase (member) | "Quest 1" / "Submit your quest action" | Be on quest team, verify |
| Quest phase (observer) | "Quest 1" / "Quest team is deciding..." | Not on team, verify |
| Long nickname | Truncated to 15 chars + "..." | Create player with 25-char name |
| Unknown phase | "Quest 1" / "Game in progress..." | Simulate invalid phase (dev tools) |
| Rapid phase changes | No flickering, smooth transitions | Click through phases quickly |

### Visual Validation

- [ ] Text is centered horizontally and vertically
- [ ] Both lines fit within circle (no overflow)
- [ ] Contrast is readable in all phases
- [ ] No layout shift when message changes
- [ ] Works on mobile viewport (>375px width)

---

## Future Extensibility

### Potential Enhancements (Out of Scope for MVP)

1. **Animations**: Fade transitions between messages
2. **Icons**: Add phase-specific icons (👑 for leader, ⚔️ for quest, etc.)
3. **Internationalization**: Extract messages to i18n files
4. **Customization**: Allow themes to override colors
5. **Screen Reader**: Add aria-live region for accessibility

**Design Note**: Current implementation allows for these enhancements without breaking changes.

---

## Dependencies

### Internal Dependencies

- `GameBoard.tsx` → Passes game state to PlayerSeats
- `useGameState.ts` → Provides game state via polling
- `lib/domain/quest-config.ts` → Provides quest team sizes
- `types/game.ts` → Type definitions for game state

### External Dependencies

- React 18+ (for rendering)
- Tailwind CSS (for styling)
- No additional npm packages required

---

## API Contract Summary

**Input Contract**:
- ✅ Component receives game state via existing props
- ✅ No new required props
- ✅ Backward compatible with existing usage

**Output Contract**:
- ✅ Always renders valid center message
- ✅ Never throws errors (defensive rendering)
- ✅ Updates automatically when game state changes

**Performance Contract**:
- ✅ O(1) message selection
- ✅ No additional API calls
- ✅ No performance regression

**Quality Contract**:
- ✅ WCAG AA contrast ratio (≥ 4.5:1)
- ✅ Responsive layout (mobile-functional)
- ✅ Graceful error handling

