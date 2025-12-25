# Implementation Plan: Watcher Mode

**Branch**: `015-watcher-mode` | **Date**: 2024-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-watcher-mode/spec.md`

## Summary

Add a pure read-only spectator mode allowing up to 10 non-players to observe ongoing Avalon games. Watchers see a "neutral observer" view (no hidden information) and have zero impact on game state or performance. Watcher sessions are ephemeral (in-memory) with complete isolation from game database tables.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: React 18, Next.js API Routes, existing game components
**Storage**: In-memory Map for watcher sessions (NOT Supabase - per isolation requirements)
**Testing**: Manual browser testing (per project patterns)
**Target Platform**: Web (desktop primary, mobile functional)
**Project Type**: Web application (Next.js)
**Performance Goals**: Zero measurable impact on player API latency with 10 watchers
**Constraints**: Complete isolation from game state; watchers cannot affect game in any way
**Scale/Scope**: Max 10 watchers per game, ephemeral sessions only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| React + Next.js App Router | ✅ PASS | Using existing App Router patterns |
| TypeScript strict mode | ✅ PASS | All new code will be typed |
| Supabase as primary backend | ⚠️ PARTIAL | Watchers use in-memory storage per isolation requirement |
| Separation of concerns | ✅ PASS | Watcher logic isolated in `lib/domain/watcher-session` |
| Domain logic isolation | ✅ PASS | Watcher session management is pure functions |
| Responsive design | ✅ PASS | Reuses existing GameBoard (already responsive) |
| Real-time updates | ✅ PASS | Same polling as players (3-second interval) |
| RLS/Security | ✅ PASS | Watchers read public game state only |
| Spec-driven development | ✅ PASS | Following speckit flow |

**Gate Result**: ✅ PASSED - Deviation from Supabase storage is JUSTIFIED by NFR-004 (no FK to game tables)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WATCHER MODE ARCHITECTURE                    │
│                                                                  │
│  COMPLETE ISOLATION: Watcher path never touches game state      │
│                                                                  │
│  ┌─────────────────┐          ┌──────────────────────────────┐ │
│  │   Home Page     │          │  IN-MEMORY STORAGE           │ │
│  │  (room code)    │          │  (NOT Supabase)              │ │
│  │                 │          │                              │ │
│  │  [Join] [Watch] │          │  watcherSessions: Map<       │ │
│  └────────┬────────┘          │    gameId,                   │ │
│           │                   │    Set<{nickname, joinedAt}> │ │
│           ▼                   │  >                           │ │
│  ┌─────────────────┐          └──────────────────────────────┘ │
│  │ /api/watch/     │                       │                   │
│  │ [gameId]/join   │◄──────────────────────┘                   │
│  │                 │  (read/write sessions)                    │
│  └────────┬────────┘                                           │
│           │                                                    │
│           ▼                                                    │
│  ┌─────────────────┐          ┌──────────────────────────────┐ │
│  │ /api/watch/     │          │  GAME DATABASE               │ │
│  │ [gameId]        │◄─────────│  (READ ONLY)                 │ │
│  │                 │          │                              │ │
│  │ Returns neutral │          │  games, proposals, votes     │ │
│  │ observer view   │          │  (NO watcher data here)      │ │
│  └────────┬────────┘          └──────────────────────────────┘ │
│           │                                                    │
│           ▼                                                    │
│  ┌─────────────────┐                                           │
│  │ GameBoard       │                                           │
│  │ (isWatcher=true)│                                           │
│  │                 │                                           │
│  │ - Read-only UI  │                                           │
│  │ - No controls   │                                           │
│  │ - No role info  │                                           │
│  └─────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

### Documentation (this feature)

```text
specs/015-watcher-mode/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
src/
├── app/
│   ├── page.tsx                         # MODIFY: Add "Watch" option for room codes
│   ├── api/
│   │   ├── rooms/
│   │   │   └── [code]/
│   │   │       └── watch-status/
│   │   │           └── route.ts         # NEW: GET room watch status (watchable, count)
│   │   └── watch/
│   │       └── [gameId]/
│   │           ├── route.ts             # NEW: GET watcher game state (neutral view)
│   │           ├── join/
│   │           │   └── route.ts         # NEW: POST join as watcher
│   │           └── leave/
│   │               └── route.ts         # NEW: POST leave watching
│   └── watch/
│       └── [gameId]/
│           └── page.tsx                 # NEW: Watcher view page
├── components/
│   └── game/
│       └── GameBoard.tsx                # MODIFY: Add isWatcher prop for read-only mode
├── hooks/
│   └── useWatcherState.ts               # NEW: Hook for watcher game state polling
├── types/
│   └── watcher.ts                       # NEW: Watcher TypeScript types
└── lib/
    └── domain/
        ├── watcher-session.ts           # NEW: In-memory watcher session management
        └── watcher-game-state.ts        # NEW: Build neutral observer game state
```

**Structure Decision**: Extends existing Next.js App Router structure. New `/app/watch/[gameId]` route for watcher view. New `/app/api/watch/` endpoints completely separate from player game APIs. Watcher logic isolated in `lib/domain/watcher-session.ts`.

## Implementation Phases

### Phase 1: Watcher Session Infrastructure
1. Create `lib/domain/watcher-session.ts` with in-memory session management
2. Implement `addWatcher`, `removeWatcher`, `getWatcherCount`, `isWatcherLimitReached`
3. Implement auto-cleanup for stale sessions (30-second timeout)

### Phase 2: Watcher API Endpoints
4. Create `/api/watch/[gameId]/join` - Join as watcher (POST)
5. Create `/api/watch/[gameId]` - Get neutral observer game state (GET)
6. Create `/api/watch/[gameId]/leave` - Leave watching (POST)

### Phase 3: Watcher UI
7. Create `useWatcherState` hook (similar to `useGameState` but for watchers)
8. Modify `GameBoard` to accept `isWatcher` prop (disables all controls)
9. Create `/app/watch/[gameId]/page.tsx` watcher view page

### Phase 4: Entry Flow
10. Modify home page to add "Watch" option when entering room code
11. Add room status check to enable/disable Watch button
12. Handle watch-before-game-starts error state

### Phase 5: Polish
13. Add "Stop Watching" button
14. Test 10-watcher limit enforcement
15. Verify zero performance impact

## Complexity Tracking

> No violations to justify - straightforward read-only observer feature

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| In-memory storage (not Supabase) | NFR-004 requires no FK to game tables | Supabase would create coupling to game state |
| Separate /api/watch endpoints | Complete isolation from player APIs | Sharing /api/games would risk state leakage |
