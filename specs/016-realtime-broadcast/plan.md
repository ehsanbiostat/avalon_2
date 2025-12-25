# Implementation Plan: Real-Time Broadcast Updates

**Branch**: `016-realtime-broadcast` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-realtime-broadcast/spec.md`

## Summary

Implement Supabase Realtime Broadcast channels to push game state updates instantly to all connected players and watchers. This reduces perceived latency from ~3 seconds (polling) to <200ms for draft team selections, vote submissions, quest actions, and phase transitions. The existing polling mechanism is retained as a fallback for reliability.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 18.3.1, Next.js 15.1.9
**Primary Dependencies**: `@supabase/supabase-js ^2.47.12` (Realtime included), React hooks
**Storage**: Supabase Postgres (existing) - broadcast is ephemeral, no new tables
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (Vercel deployment), modern browsers with WebSocket support
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Updates visible within 200ms (down from 3s polling)
**Constraints**: <1KB broadcast messages, debounce 50ms minimum, fallback within 5s
**Scale/Scope**: ~10 concurrent players per game, ~10 watchers per game, multiple games

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Tech Stack - Supabase Realtime | ✅ PASS | Supabase Realtime is explicitly mentioned as allowed infrastructure |
| II. Tech Stack - TypeScript strict | ✅ PASS | All new code will use strict TypeScript |
| III. Data & Security - No sensitive data in client | ✅ PASS | FR-008 ensures broadcasts contain no hidden info |
| IV. Code Quality - Small functions/components | ✅ PASS | Broadcast logic isolated in dedicated modules |
| IV. Code Quality - Domain logic isolation | ✅ PASS | Broadcast messaging in lib/domain/, channel management in lib/supabase/ |
| V. Testing - Error handling | ✅ PASS | FR-007 requires fallback to polling on failure |
| V. Logging - Important events logged | ✅ PASS | FR-015 requires connection event logging |
| VI. UX - Real-time updates within 2s | ✅ EXCEEDS | Target is 200ms, well under constitution's 2s requirement |

**Gate Result**: ✅ PASS - No violations

## Project Structure

### Documentation (this feature)

```text
specs/016-realtime-broadcast/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── broadcast-events.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── broadcast/                    # NEW: Broadcast system
│   │   ├── channel-manager.ts        # Channel lifecycle management
│   │   ├── event-types.ts            # TypeScript types for broadcast events
│   │   ├── broadcaster.ts            # Server-side broadcast functions
│   │   └── debounce.ts               # Debounce utility (50ms minimum)
│   └── supabase/
│       └── client.ts                 # (MODIFY) Add channel creation helper
├── hooks/
│   ├── useGameState.ts               # (MODIFY) Add broadcast subscription
│   ├── useWatcherState.ts            # (MODIFY) Add broadcast subscription
│   └── useBroadcastChannel.ts        # NEW: Reusable broadcast subscription hook
├── app/
│   └── api/
│       └── games/[gameId]/
│           ├── draft-team/route.ts   # (MODIFY) Add broadcast after update
│           ├── vote/route.ts         # (MODIFY) Add broadcast after vote
│           ├── quest/action/route.ts # (MODIFY) Add broadcast after action
│           ├── propose/route.ts      # (MODIFY) Add broadcast on phase change
│           └── continue/route.ts     # (MODIFY) Add broadcast on phase change
└── types/
    └── broadcast.ts                  # NEW: Broadcast type definitions
```

**Structure Decision**: Extending existing Next.js web application structure. New broadcast functionality is isolated in `lib/broadcast/` following domain isolation principles. Hooks are placed in `hooks/` following existing patterns.

## Complexity Tracking

> **No Constitution violations - this section is empty**
