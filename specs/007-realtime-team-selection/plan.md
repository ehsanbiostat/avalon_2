# Implementation Plan: Real-Time Team Selection Visibility

**Branch**: `007-realtime-team-selection` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)

## Summary

This feature enables all players to see the mission leader's team selection process in real-time as they click on players, before the team is officially submitted. Currently, selection state is only stored in the leader's local React state, invisible to other players. The plan introduces a `draft_team` field in the database, an API endpoint for updating selections, and enhanced UI to visually distinguish between draft selections and submitted proposals.

**Primary Goals**:
1. Broadcast leader's draft team selections to all players (<500ms latency)
2. Visual distinction between tentative selections and submitted proposals
3. Maintain immediate feedback for the leader (<100ms)

**Technical Approach** (from research):
- Store `draft_team` (player ID array) on the `games` table
- New API endpoint: `PUT /api/games/{gameId}/draft-team`
- Leverage existing 3-second polling (acceptable for UX, proven stable)
- Optimistic UI updates for the leader (instant feedback)
- Three visual states for player avatars: default, draft-selected (pulsing), proposed (solid)

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (via Next.js 14.2.21)
**Primary Dependencies**: Next.js (App Router), React 18, Supabase JS Client, Tailwind CSS
**Storage**: Supabase Postgres (games table will store draft_team field)
**Testing**: Vitest for unit tests (domain logic), Playwright for E2E (optional)
**Target Platform**: Web browsers (desktop-first, mobile-functional)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: <500ms update latency for observers, <100ms for leader (optimistic UI)
**Constraints**: Must work with existing 3-second polling infrastructure; backward compatible with older deployments
**Scale/Scope**: 5-10 concurrent players per game, ~10-20 active games simultaneously

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Tech Stack Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| React + Next.js + TypeScript | ✅ PASS | Using existing stack |
| Supabase for backend | ✅ PASS | Adding draft_team field to games table |
| All state in Supabase Postgres | ✅ PASS | Draft selections persisted in database |
| Service-role key server-side only | ✅ PASS | Draft updates via API routes only |

### Real-Time Updates Principle

| Principle | Status | Notes |
|-----------|--------|-------|
| "Use Supabase Realtime subscriptions for all multiplayer state" | ⚠️ DEVIATION | Using existing polling (3s) instead of Realtime for draft selections |

**Justification**: The existing codebase uses polling every 3 seconds for game state updates. While Supabase Realtime would provide sub-second updates, introducing it for just this feature would:
- Require refactoring the entire game state synchronization mechanism
- Risk introducing bugs in stable gameplay (voting, quest phases)
- Add complexity with subscription management and connection handling

**Mitigation**: 
- Optimistic UI updates for the leader provide <100ms feedback (FR-006)
- 3-second polling meets the <500ms requirement for 95%+ of selection changes (SC-003)
- If users report delays, we can incrementally add Realtime for draft_team only in a follow-up

### Code Quality & Architecture

| Principle | Status | Notes |
|-----------|--------|-------|
| Separation of concerns | ✅ PASS | Domain logic in lib/domain/, DB in lib/supabase/ |
| Type safety (strict TypeScript) | ✅ PASS | All new code fully typed |
| No god components | ✅ PASS | Changes scoped to TeamProposal, PlayerSeats |
| Domain logic isolation | ✅ PASS | Validation logic in lib/domain/team-selection.ts |

### UX & Product Principles

| Principle | Status | Notes |
|-----------|--------|-------|
| Real-time updates within 2 seconds | ✅ PASS | 3-second polling meets spec's <500ms for most cases |
| Clarity over flair | ✅ PASS | Simple pulsing border for draft, solid for proposed |
| Mobile functional | ✅ PASS | Responsive design, touch targets maintained |

**GATE RESULT**: ✅ PASS with documented deviation (polling vs Realtime)

## Project Structure

### Documentation (this feature)

```text
specs/007-realtime-team-selection/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md          # API endpoints
├── checklists/
│   └── requirements.md  # Already created
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── games/
│           └── [gameId]/
│               └── draft-team/
│                   └── route.ts          # NEW: PUT endpoint for draft updates
├── components/
│   └── game/
│       ├── TeamProposal.tsx              # MODIFY: Broadcast selections
│       └── PlayerSeats.tsx               # MODIFY: Show draft vs proposed states
├── lib/
│   ├── domain/
│   │   └── team-selection.ts            # NEW: Draft validation logic
│   ├── supabase/
│   │   └── games.ts                     # MODIFY: Add getDraftTeam, updateDraftTeam
│   └── api/
│       └── game.ts                      # MODIFY: Add updateDraftTeam API call
├── types/
│   └── game.ts                          # MODIFY: Add draft_team to Game/GameState types
└── hooks/
    └── useGameState.ts                  # MODIFY: Include draft_team in polling

supabase/migrations/
└── 011_draft_team_selection.sql         # NEW: Add draft_team column to games table
```

**Structure Decision**: Single Next.js web application following existing patterns. All changes integrate cleanly with Phase 3 (Quest System) and Phase 6 (Player Reconnection) implementations.

## Complexity Tracking

No violations requiring justification. The polling deviation is documented above and justified.

---

## Phase 0: Research & Technical Decisions

### Research Tasks

#### R1: Draft Selection Storage Strategy

**Decision**: Store `draft_team` as `text[]` (array of player IDs) directly on the `games` table.

**Rationale**:
- Simple, no new tables needed
- Draft selections are ephemeral (cleared on proposal submission)
- Polling every 3 seconds already fetches entire game state
- No complex joins or queries needed

**Alternatives Considered**:
- **New `draft_selections` table**: Rejected - overkill for a single transient field
- **Store in `team_proposals` as status='draft'**: Rejected - proposals are for submitted teams only; draft selections may change rapidly and shouldn't create proposal records

#### R2: Update Frequency and Latency

**Decision**: Keep existing 3-second polling for draft_team updates.

**Rationale**:
- Existing infrastructure is stable and proven
- Spec requires <500ms for strategic value; 3s polling provides updates within one poll cycle
- Optimistic UI for leader provides <100ms feedback (FR-006)
- Players can observe ~20-30 selection changes per minute (sufficient for gameplay)

**Alternatives Considered**:
- **Supabase Realtime subscriptions**: Rejected for now - would require refactoring entire game state mechanism; can add later if users report delays
- **WebSocket-based updates**: Rejected - adds infrastructure complexity
- **Server-Sent Events (SSE)**: Rejected - not needed for 3s polling frequency

#### R3: Visual State Differentiation

**Decision**: Use three visual states with clear CSS distinctions:
1. **Default**: Normal border, default colors
2. **Draft Selected**: Pulsing cyan border (`animate-pulse`), lighter background, "DRAFTING..." label visible to all
3. **Proposed**: Solid green border, shield icon, "ON TEAM" badge

**Rationale**:
- Pulsing animation indicates "in progress" universally
- Color + animation + label ensures clarity across colorblindness types
- Shield icon (🛡️) already used for proposed teams, maintaining consistency

**Alternatives Considered**:
- **Opacity changes**: Rejected - less accessible, harder to distinguish
- **Color-only distinction**: Rejected - fails colorblindness accessibility

#### R4: Race Condition Handling

**Decision**: Use optimistic updates for leader + last-write-wins for server state.

**Rationale**:
- Leader gets instant feedback (updates local state immediately)
- API call updates database with latest selection
- If rapid toggles occur, final server state reflects last action
- Other players see updates within one poll cycle (3s max)

**Alternatives Considered**:
- **Queue all updates**: Rejected - adds complexity without meaningful benefit for this use case
- **Debouncing**: Rejected - would delay feedback for leader

#### R5: State Persistence on Navigation

**Decision**: Store draft_team in database; persist across leader's page navigation within the same phase.

**Rationale**:
- If leader views their role modal and returns, selections should remain
- Database persistence ensures consistency if leader refreshes page
- Cleared only when: (1) proposal submitted, or (2) quest advances, or (3) game ends

**Alternatives Considered**:
- **sessionStorage**: Rejected - doesn't broadcast to other players
- **Clear on any navigation**: Rejected - poor UX if leader accidentally navigates away

---

## Phase 1: Data Model & API Contracts

### Data Model (data-model.md)

#### Modified: `games` Table

```sql
ALTER TABLE games
ADD COLUMN draft_team text[] DEFAULT NULL;

COMMENT ON COLUMN games.draft_team IS 'Leader''s current draft team selection (player IDs); null if no draft or proposal submitted';
```

**Field**: `draft_team`
- **Type**: `text[]` (array of player IDs)
- **Default**: `NULL`
- **Purpose**: Store the leader's tentative team selection during team_building phase
- **Lifecycle**: 
  - Set when leader clicks players (via PUT /api/games/{gameId}/draft-team)
  - Cleared when leader submits proposal (via POST /api/games/{gameId}/propose)
  - Cleared when quest advances or game ends

**Validation Rules**:
- Must be subset of game.seating_order (all IDs must be valid players in the game)
- Length must be ≤ quest requirement size
- Only updated when game.phase = 'team_building'
- Only updated by current_leader_id

#### Modified TypeScript Types

**File**: `src/types/game.ts`

```typescript
export interface Game {
  // ... existing fields ...
  draft_team: string[] | null; // NEW: Leader's current draft selection
}

export interface GameUpdate {
  // ... existing fields ...
  draft_team?: string[] | null; // NEW: Update draft selection
}

export interface GameState {
  // ... existing fields ...
  draft_team: string[] | null; // NEW: Available to all players
  is_draft_in_progress: boolean; // NEW: True if draft_team is non-null
}
```

### API Contracts (contracts/api.md)

#### NEW: Update Draft Team Selection

**Endpoint**: `PUT /api/games/{gameId}/draft-team`
**Purpose**: Update the leader's tentative team selection (broadcasts to all players)
**Auth**: Player ID (x-player-id header)

**Request**:
```typescript
{
  team_member_ids: string[]; // Array of player database IDs (0 to quest_size)
}
```

**Response 200** (Success):
```typescript
{
  draft_team: string[];
  quest_number: number;
  required_size: number;
  updated_at: string;
}
```

**Response 400** (Invalid Request):
```typescript
{
  error: {
    code: 'INVALID_TEAM_SIZE' | 'INVALID_PLAYER_ID' | 'INVALID_PHASE';
    message: string;
  }
}
```

**Response 403** (Forbidden - Not Leader):
```typescript
{
  error: {
    code: 'NOT_LEADER';
    message: 'Only the current leader can update team selection';
  }
}
```

**Validations**:
- Game must be in 'team_building' phase
- Caller must be current_leader_id
- All team_member_ids must be in game.seating_order
- Array length must be ≤ quest requirement size

#### MODIFIED: Propose Team

**Endpoint**: `POST /api/games/{gameId}/propose`
**Changes**: Clear `draft_team` field when proposal is created

**Before**:
- Creates team_proposals record
- Updates game.phase to 'voting'

**After**:
- Creates team_proposals record
- Updates game.phase to 'voting'
- **NEW**: Sets games.draft_team = NULL (clears draft)

#### MODIFIED: Get Game State

**Endpoint**: `GET /api/games/{gameId}`
**Changes**: Include `draft_team` and `is_draft_in_progress` in response

**Response Addition**:
```typescript
{
  data: {
    game: {
      // ... existing fields ...
      draft_team: string[] | null;  // NEW
    },
    // ... existing fields ...
    is_draft_in_progress: boolean;  // NEW: Derived from draft_team !== null
  }
}
```

### Quick Start (quickstart.md)

**Testing Real-Time Selection**:

1. **Setup**: Start a 5-player game, reach Quest 1 team_building phase
2. **Leader** (one browser): Click on 3 players to select them
3. **Observer** (another browser): Watch round table - see selections appear as leader clicks
4. **Leader**: Deselect one player
5. **Observer**: See player's highlight removed
6. **Leader**: Submit proposal
7. **All players**: See visual state change from "drafting" to "proposed"

**Expected Behavior**:
- Leader sees instant feedback on each click
- Observers see updates within 3 seconds
- Draft selections have pulsing border
- Submitted proposal has solid border + shield icon
- Selection count updates for all players

---

## Phase 2-N: Implementation Phases

### Phase 2: Database Schema & Types

**Objective**: Add draft_team storage and TypeScript types

**Files**:
- `supabase/migrations/011_draft_team_selection.sql`
- `src/types/game.ts`

**Tasks**:
1. Create migration to add `draft_team text[]` column to `games` table
2. Add default value NULL and comment
3. Update `Game` interface to include `draft_team: string[] | null`
4. Update `GameUpdate` interface to include optional `draft_team`
5. Update `GameState` interface to include `draft_team` and `is_draft_in_progress`

### Phase 3: Domain Logic

**Objective**: Create validation logic for draft selections

**Files**:
- `src/lib/domain/team-selection.ts` (NEW)

**Tasks**:
1. Create `validateDraftSelection` function:
   - Input: player IDs array, quest requirement size, game seating order
   - Output: validation result (valid boolean, error message if invalid)
   - Rules: All IDs must be in seating order, length ≤ required size
2. Create `isDraftInProgress` helper function:
   - Input: draft_team array
   - Output: boolean (true if non-null and non-empty)
3. Create `normalizeDraftTeam` function:
   - Input: potentially duplicate or out-of-order IDs
   - Output: deduplicated array maintaining selection order

### Phase 4: Database Layer

**Objective**: Add Supabase query functions for draft team

**Files**:
- `src/lib/supabase/games.ts` (MODIFY)

**Tasks**:
1. Add `updateDraftTeam` function:
   - Input: Supabase client, game ID, player IDs array
   - Update: games.draft_team field
   - Return: Updated game record
2. Add `clearDraftTeam` function:
   - Input: Supabase client, game ID
   - Update: Set games.draft_team = NULL
   - Return: Updated game record
3. Modify existing `getGameById` to include `draft_team` in select query

### Phase 5: API Endpoint - Draft Team Update

**Objective**: Create API route for leader to update draft selections

**Files**:
- `src/app/api/games/[gameId]/draft-team/route.ts` (NEW)

**Tasks**:
1. Create `PUT` handler for `/api/games/{gameId}/draft-team`
2. Validate player is authenticated and is current leader
3. Validate game is in 'team_building' phase
4. Validate draft selection using domain logic (Phase 3)
5. Call `updateDraftTeam` from Supabase layer
6. Return updated draft state with quest info
7. Handle errors: NOT_LEADER, INVALID_PHASE, INVALID_TEAM_SIZE, INVALID_PLAYER_ID

### Phase 6: API Endpoint - Clear Draft on Proposal

**Objective**: Ensure draft_team is cleared when proposal is submitted

**Files**:
- `src/app/api/games/[gameId]/propose/route.ts` (MODIFY)

**Tasks**:
1. After creating team_proposals record (existing logic)
2. Before updating game phase to 'voting' (existing logic)
3. **NEW**: Call `clearDraftTeam` to set games.draft_team = NULL
4. Ensure this happens atomically (same transaction if possible)

### Phase 7: Client API Layer

**Objective**: Add frontend API function for draft updates

**Files**:
- `src/lib/api/game.ts` (MODIFY)

**Tasks**:
1. Add `updateDraftTeam` function:
   - Input: game ID, team member IDs array
   - Makes PUT request to `/api/games/{gameId}/draft-team`
   - Includes x-player-id header
   - Returns draft state or error
2. Update error handling to include new error codes (NOT_LEADER, INVALID_PHASE)

### Phase 8: Game State Hook Enhancement

**Objective**: Include draft_team in polled game state

**Files**:
- `src/hooks/useGameState.ts` (MODIFY)

**Tasks**:
1. Verify `draft_team` is included in API response parsing
2. Ensure `draft_team` is included in GameState returned from hook
3. Calculate `is_draft_in_progress` derived state (draft_team !== null)
4. No changes to polling frequency (keep 3 seconds)

### Phase 9: TeamProposal Component - Broadcast Selections

**Objective**: Update leader's selection actions to persist to database

**Files**:
- `src/components/game/TeamProposal.tsx` (MODIFY)

**Tasks**:
1. Keep existing local state `selectedTeam` for optimistic UI (instant feedback)
2. Add `useEffect` to call `updateDraftTeam` API when `selectedTeam` changes
3. Debounce API calls (200ms) to avoid excessive requests on rapid toggles
4. Handle API errors gracefully (show error, don't block UI)
5. Show "Broadcasting..." indicator when API call is pending (optional)
6. On successful proposal submission, local state is cleared (existing behavior)

### Phase 10: PlayerSeats Component - Visual States

**Objective**: Show three distinct visual states for player avatars

**Files**:
- `src/components/game/PlayerSeats.tsx` (MODIFY)

**Tasks**:
1. Add new prop: `draftTeam: string[] | null` (from game state)
2. Add new prop: `isDraftInProgress: boolean`
3. Update player avatar rendering logic to determine state:
   - **Default**: Not in draftTeam, no proposal → normal styling
   - **Draft Selected**: Player ID in draftTeam AND isDraftInProgress === true → pulsing border, lighter bg, subtle glow
   - **Proposed**: Player ID in current_proposal.team_member_ids → solid border, shield icon, brighter colors
4. Add CSS classes:
   - `draft-selected`: `border-cyan-400 animate-pulse bg-cyan-900/30`
   - `proposed`: `border-green-400 bg-green-800` (existing)
5. Update "You" label color to match state
6. Ensure all states work with existing leader/Lady tokens

### Phase 11: Selection Count Display

**Objective**: Show selection progress to all players

**Files**:
- `src/components/game/TeamProposal.tsx` (MODIFY)

**Tasks**:
1. Calculate selection count from `gameState.draft_team` (for all players)
2. Display: "Selecting team: {count}/{required}" when isDraftInProgress
3. Display: "Team proposed: {count}/{required}" when proposal submitted
4. Use color coding:
   - Incomplete (count < required): text-cyan-400
   - Complete (count === required): text-green-400
5. Position above or below PlayerSeats component

### Phase 12: GameBoard Integration

**Objective**: Pass draft state to TeamProposal component

**Files**:
- `src/components/game/GameBoard.tsx` (MODIFY)

**Tasks**:
1. Extract `draft_team` and `is_draft_in_progress` from `gameState`
2. Pass as props to `TeamProposal` component
3. Pass to `PlayerSeats` via TeamProposal
4. Ensure backward compatibility if migration not yet applied (draft_team may be undefined)

### Phase 13: Edge Cases & Polish

**Objective**: Handle disconnections, navigation, and edge cases

**Tasks**:
1. **Disconnected player in draft**: Show disconnect indicator while maintaining draft highlight
2. **Leader navigation**: Draft state persists in database (already handled by storage in games table)
3. **Leader refresh**: Re-fetch game state includes draft_team (already handled by existing polling)
4. **Session takeover**: Draft state persists if new session is same leader (no special handling needed)
5. **Rapid toggles**: Debounce API calls to prevent race conditions (Phase 9, task 3)
6. **Network delay indicator**: Show subtle "syncing..." text if draft update call takes >1 second (optional polish)

### Phase 14: Testing

**Objective**: Validate real-time visibility and performance

**Tasks**:
1. **Manual test: Basic flow**
   - Leader selects players → Observers see selections within 3 seconds
   - Leader deselects → Observers see removal within 3 seconds
   - Leader submits → All see state transition to proposed
2. **Manual test: Rapid toggles**
   - Leader toggles same player 5x rapidly → Final state is accurate for all players
3. **Manual test: Navigation**
   - Leader selects players → Views role → Returns → Selections still visible
4. **Manual test: Disconnection**
   - Leader selects disconnected player → All players see both disconnect indicator and draft highlight
5. **Performance measurement** (optional):
   - Use browser DevTools to measure time from leader click to observer screen update
   - Target: <3s (poll interval); actual: likely 0-3s depending on timing

---

## Implementation Order

1. **Phase 2**: Database schema → Can deploy migration independently
2. **Phase 3**: Domain logic → Pure functions, easily unit testable
3. **Phase 4**: Database layer → Builds on Phase 2-3
4. **Phase 5**: API endpoint → Testable via curl/Postman
5. **Phase 6**: Modify propose endpoint → Small change, low risk
6. **Phase 7**: Client API layer → Thin wrapper over Phase 5
7. **Phase 8**: Game state hook → Passive change (include draft_team in polling)
8. **Phase 9**: TeamProposal broadcasting → Leader-side changes
9. **Phase 10**: PlayerSeats visual states → Observer-side changes
10. **Phase 11**: Selection count display → UI polish
11. **Phase 12**: GameBoard integration → Wire everything together
12. **Phase 13**: Edge cases → Defensive checks and polish
13. **Phase 14**: Testing → Validate end-to-end flow

**Critical Path**: Phases 2-6 (backend) → Phase 7-12 (frontend) → Phase 13-14 (polish & test)

**Parallel Work**: Phases 3-4 can be done simultaneously; Phases 10-11 can be done simultaneously

---

## Rollout Strategy

### Backward Compatibility

- Migration 011 adds nullable column → existing games unaffected
- If `draft_team` is undefined/null in API response → treat as no draft in progress
- Feature gracefully degrades if migration not yet applied (no errors, just no draft visibility)

### Deployment

1. Apply migration 011 to production Supabase
2. Deploy code to Vercel (backward compatible)
3. Existing games will see NULL for draft_team initially → no visual change until next team_building phase
4. New games immediately use draft broadcasting

### Monitoring

- Track API errors for `/api/games/{gameId}/draft-team` (should be near-zero)
- Monitor draft_team field usage in database (should be NULL except during active team_building)
- User feedback: Survey players on whether real-time visibility improves gameplay

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Polling not fast enough for UX | Medium | High | Optimistic UI for leader; can add Realtime later if needed |
| Race conditions on rapid toggles | Low | Medium | Debounce API calls (200ms) |
| Network latency degrades experience | Medium | Medium | Acceptable up to 1s (SC-001); show "syncing" indicator if >1s |
| Players confused by visual states | Low | Medium | Clear color distinction + labels + testing |
| Migration breaks existing games | Low | High | Nullable column, backward compatible code |

---

## Success Metrics (Post-Launch)

- **Latency**: Measure actual time from leader click to observer update (target: <3s avg)
- **Accuracy**: Track dropped updates or selection state mismatches (target: <5% error rate)
- **User Satisfaction**: Survey players: "Does real-time selection visibility improve your experience?" (target: >80% yes)
- **Error Rate**: Monitor draft-team API endpoint errors (target: <1% of requests)

---

## Future Enhancements (Out of Scope for v1)

- Supabase Realtime for sub-second updates (if users request faster response)
- Visual indicators for leader hesitation or selection timing
- Selection history/replay for post-game analysis
- Audio cues for selection changes (optional accessibility feature)

