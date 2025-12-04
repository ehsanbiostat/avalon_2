# Phase 4: Lady of the Lake – Tasks

| Field | Value |
|-------|-------|
| **Spec** | [spec.md](./spec.md) |
| **Plan** | [plan.md](./plan.md) |
| **Total Tasks** | 90 |

---

## Phase 1: Database & Types

### Database Migration
- [ ] T001 Create migration file `009_lady_of_lake_phase.sql`
- [ ] T002 Add 'lady_of_lake' to `game_phase` enum
- [ ] T003 Create `lady_investigations` table with constraints
- [ ] T004 Add `lady_holder_id` column to `games` table
- [ ] T005 Add `lady_enabled` column to `games` table
- [ ] T006 Create index on `lady_investigations(game_id)`
- [ ] T007 Add RLS policy for viewing investigations
- [ ] T008 Add RLS policy for creating investigations

### TypeScript Types
- [ ] T009 Add 'lady_of_lake' to `GamePhase` type
- [ ] T010 Create `LadyInvestigation` interface
- [ ] T011 Create `LadyOfLakeState` interface
- [ ] T012 Create `LadyInvestigateRequest` interface
- [ ] T013 Create `LadyInvestigateResponse` interface
- [ ] T014 Add `lady_holder_id` and `lady_enabled` to `Game` interface
- [ ] T015 Add `lady_of_lake` to `GameState` interface

---

## Phase 2: Domain Logic

### Lady of Lake Logic
- [ ] T016 Create `src/lib/domain/lady-of-lake.ts`
- [ ] T017 Implement `shouldTriggerLadyPhase()` function
- [ ] T018 Implement `getValidTargets()` function
- [ ] T019 Implement `validateInvestigationTarget()` function
- [ ] T020 Implement `getInvestigationResult()` function (lookup player role)

### State Machine Updates
- [ ] T021 Add `lady_of_lake` to `VALID_TRANSITIONS`
- [ ] T022 Add `getPhaseName()` for lady_of_lake
- [ ] T023 Add `getPhaseDescription()` for lady_of_lake
- [ ] T024 Add `isLadyPhase()` helper function

---

## Phase 3: Supabase Queries

### Lady Investigations Queries
- [ ] T025 Create `src/lib/supabase/lady-investigations.ts`
- [ ] T026 Implement `createInvestigation()` function
- [ ] T027 Implement `getInvestigations()` function (all for game)
- [ ] T028 Implement `getInvestigatedPlayerIds()` function
- [ ] T029 Implement `getLastInvestigation()` function

### Games Table Updates
- [ ] T030 Update `createGame()` to copy Lady holder from room
- [ ] T031 Implement `updateLadyHolder()` function
- [ ] T032 Add Lady holder to game query selects

---

## Phase 4: API Endpoints

### Lady Investigate Endpoint
- [ ] T033 Create `POST /api/games/[gameId]/lady-investigate/route.ts`
- [ ] T034 Validate player is Lady holder
- [ ] T035 Validate game is in lady_of_lake phase
- [ ] T036 Validate target is valid (not self, not investigated)
- [ ] T037 Get target player's alignment from player_roles
- [ ] T038 Create investigation record
- [ ] T039 Transfer Lady to target player
- [ ] T040 Transition game to team_building phase
- [ ] T041 Return result to Lady holder only

### Game State Endpoint Updates
- [ ] T042 Update `GET /api/games/[gameId]` to include Lady state
- [ ] T043 Include investigated player IDs in response
- [ ] T044 Include last investigation for announcement
- [ ] T045 Include `is_holder` and `can_investigate` flags

---

## Phase 5: Game Flow Integration

### Quest Action Updates
- [ ] T046 Update quest action API to check for Lady phase trigger
- [ ] T047 Call `shouldTriggerLadyPhase()` after quest completion
- [ ] T048 After `quest_result` phase, transition to `lady_of_lake` if Lady enabled and valid targets exist

### Continue API Updates
- [ ] T049 Handle continue from `quest_result` → `lady_of_lake`
- [ ] T050 Handle Lady phase completion → `team_building`
- [ ] T051 Skip Lady phase when no valid targets exist

### Game Start Updates
- [ ] T052 Copy `lady_of_lake_holder_id` from room to game on start
- [ ] T053 Set `lady_enabled` from room configuration

---

## Phase 6: Frontend Components

### LadyOfLakePhase Component
- [ ] T054 Create `src/components/game/LadyOfLakePhase.tsx`
- [ ] T055 Implement Lady holder view (target selection)
- [ ] T056 Implement other players view (waiting state)
- [ ] T057 Show investigated players as disabled
- [ ] T058 Add selection confirmation button
- [ ] T059 Add loading state during submission

### InvestigationResult Component
- [ ] T060 Create `src/components/game/InvestigationResult.tsx`
- [ ] T061 Display target name and alignment
- [ ] T062 Style Good/Evil results differently
- [ ] T063 Show "Lady passes to [name]" message
- [ ] T064 Add "Continue" button (Lady holder only)

### Player Badges
- [ ] T065 Add Lady holder badge (🌊) to PlayerSeats
- [ ] T066 Add investigated badge (👁️) to player display
- [ ] T067 Add tooltip for badges

---

## Phase 7: GameBoard Integration

### GameBoard Updates
- [ ] T068 Import LadyOfLakePhase component
- [ ] T069 Add condition to render Lady phase
- [ ] T070 Handle investigation submission callback
- [ ] T071 Show public announcement after investigation

### Hook Updates
- [ ] T072 Update `useGameState` to include Lady state
- [ ] T073 Add `ladyState` to hook return value
- [ ] T074 Track last investigation for announcement display

---

## Phase 8: Testing & Polish

### Manual Testing
- [ ] T075 Test Lady phase with 7-player game
- [ ] T076 Test Lady phase with 10-player game
- [ ] T077 Test investigation flow (select → result → continue)
- [ ] T078 Test Lady token transfer
- [ ] T079 Test multiple investigations (Quest 2, 3, 4)

### Edge Case Testing
- [ ] T080 Test game without Lady (phase skipped)
- [ ] T081 Test single valid target scenario
- [ ] T082 Test all players investigated (phase skipped)
- [ ] T083 Test Lady holder only uninvestigated (phase skipped)

### Error Handling
- [ ] T084 Test non-holder investigation attempt
- [ ] T085 Test invalid target selection
- [ ] T086 Test self-investigation attempt

### Polish
- [ ] T087 Add loading spinners
- [ ] T088 Add error toast messages
- [ ] T089 Ensure mobile responsiveness
- [ ] T090 Review and adjust animations

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Database & Types | 15 | ⬜ Pending |
| Phase 2: Domain Logic | 9 | ⬜ Pending |
| Phase 3: Supabase Queries | 8 | ⬜ Pending |
| Phase 4: API Endpoints | 13 | ⬜ Pending |
| Phase 5: Game Flow Integration | 8 | ⬜ Pending |
| Phase 6: Frontend Components | 14 | ⬜ Pending |
| Phase 7: GameBoard Integration | 7 | ⬜ Pending |
| Phase 8: Testing & Polish | 16 | ⬜ Pending |
| **Total** | **90** | |

---

## Dependencies

```
T001-T008 (DB) ──► T009-T015 (Types) ──► T016-T024 (Domain)
                                              │
                                              ▼
T025-T032 (Supabase) ◄────────────────────────┘
      │
      ▼
T033-T045 (API) ──► T046-T053 (Flow) ──► T054-T067 (Components)
                                              │
                                              ▼
                                    T068-T074 (GameBoard)
                                              │
                                              ▼
                                    T075-T090 (Testing)
```

