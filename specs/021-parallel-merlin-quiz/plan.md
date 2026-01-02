# Implementation Plan: Parallel Merlin Quiz

**Branch**: `021-parallel-merlin-quiz` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-parallel-merlin-quiz/spec.md`

## Summary

Change the Merlin quiz flow to run in parallel with assassination (Good wins) or show for all except Merlin/Percival (Evil wins). This eliminates bias by ensuring players submit their Merlin guesses before knowing the Assassin's target. Key changes: new game phase `parallel_quiz`, quiz eligibility logic, enhanced results display with individual vote breakdown.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: React, Supabase (Postgres + Realtime), TailwindCSS
**Storage**: Supabase Postgres (games, merlin_quiz_votes tables)
**Testing**: Vitest for unit tests, Playwright for E2E
**Target Platform**: Web (desktop-first, mobile-functional)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Real-time updates < 2 seconds, quiz timeout precisely 60 seconds
**Constraints**: Quiz must complete within 60 seconds; Assassin has no timeout
**Scale/Scope**: 5-10 players per game, < 100 concurrent games

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Spec-Driven Development | ✅ Pass | Following `/speckit.specify` → `/speckit.plan` flow |
| Domain Logic Isolation | ✅ Pass | Quiz eligibility logic in `lib/domain/quiz-eligibility.ts` |
| TypeScript Strict Mode | ✅ Pass | All new types defined in `types/game.ts` |
| Server-Side Game Logic | ✅ Pass | Phase transitions enforced in API routes |
| Supabase Realtime | ✅ Pass | Using existing broadcast patterns for vote counts |
| RLS Enforcement | ✅ Pass | Quiz votes table already has RLS |
| No Client-Side Trust | ✅ Pass | Eligibility computed server-side |

## Project Structure

### Documentation (this feature)

```text
specs/021-parallel-merlin-quiz/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # API contract changes
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── games/
│           └── [gameId]/
│               ├── route.ts                    # Modify: Include parallel phase state
│               ├── merlin-quiz/
│               │   └── route.ts                # Modify: Support parallel phase
│               └── assassin-guess/
│                   └── route.ts                # Modify: Check parallel phase completion
├── components/
│   └── game/
│       ├── GameBoard.tsx                       # Modify: Handle parallel phase routing
│       ├── GameOver.tsx                        # Modify: Enhanced results display
│       ├── MerlinQuiz.tsx                      # Modify: Parallel mode support
│       ├── MerlinQuizResults.tsx               # Modify: Full breakdown display
│       ├── ParallelQuizWaiting.tsx             # NEW: Waiting screen with vote count
│       └── AssassinPhase.tsx                   # Minor: No changes needed
├── lib/
│   └── domain/
│       ├── quiz-eligibility.ts                 # NEW: Quiz eligibility logic
│       ├── merlin-quiz.ts                      # Modify: Parallel completion logic
│       ├── game-state-machine.ts               # Modify: Add parallel_quiz phase
│       └── win-conditions.ts                   # Modify: Parallel phase triggers
└── types/
    └── game.ts                                 # Modify: Add parallel phase types

tests/
├── unit/
│   └── quiz-eligibility.test.ts               # NEW: Eligibility logic tests
└── e2e/
    └── parallel-quiz.spec.ts                  # NEW: E2E flow tests
```

**Structure Decision**: Using existing Next.js App Router structure with new domain module for quiz eligibility logic.

## Complexity Tracking

No constitution violations detected.
