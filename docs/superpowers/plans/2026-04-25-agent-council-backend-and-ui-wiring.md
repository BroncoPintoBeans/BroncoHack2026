# Implementation Plan: Agent Council Backend & UI Wiring

**Date:** 2026-04-25
**Status:** Active
**Feature:** Agent Council Diagnose — backend implementation + frontend wiring
**Output path:** `docs/superpowers/plans/2026-04-25-agent-council-backend-and-ui-wiring.md`

---

## 1. Goal

Wire the Agent Council Diagnose feature end-to-end so that:

- A user submits a repair case from `/repair/new` (or loads demo case)
- The orchestrator runs 5 sub-agents, emitting typed events to `case_events`
- The repair workspace at `/repair/[id]` renders live agent statuses, follow-up cards, and the final verdict
- The dashboard at `/dashboard` renders real case rows from the API
- The demo path works without Gemini credentials or Supabase cloud (deterministic mock fallback)

---

## 2. Architecture

### Runtime flow

```
POST /api/cases          → create case row
POST /api/cases/[id]/media → upload media metadata
POST /api/cases/[id]/run   → acquire lock → create case_run → run orchestrator
  orchestrator:
    intake agent (Flash) → writes case_events, no durable row
    diagnosis agent (Pro) → may emit awaiting_user → writes diagnoses on complete
    economics agent (Flash) → writes verdicts
    action-plan agent (Flash) → writes action_plans (after applySafetyGuard)
    helper-routing agent (Flash, stub) → writes helper_requests
POST /api/cases/[id]/runs/[runId]/followup → resume diagnosis
GET  /api/cases/[id]/current  → unified snapshot via current_case_outputs view
GET  /api/cases/[id]/events   → raw case_events rows (polling or Realtime later)
GET  /api/cases             → list user's cases (dashboard)
```

### Event delivery strategy

**Polling-first.** `/repair/[id]` polls `GET /api/cases/[id]/current` every 2s while `case_runs.status ∈ {running, awaiting_user}`. Shape of `case_events` is Supabase Realtime-compatible — switching to push is a frontend-only change later.

### Local persistence strategy

**Supabase cloud (primary) with in-memory demo store (fallback).**

- If `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set → use Supabase Postgres via `@supabase/supabase-js`
- If env vars are missing → `lib/db/demo-store.ts` provides an in-memory keyed store seeded with 4 demo cases; writes are ephemeral
- All DB access goes through `lib/db/queries/` interfaces, so swapping the backing store is a single-file change

### AI provider strategy

**Mock-first with optional Gemini.**

- If `GOOGLE_API_KEY` is set → live Gemini 2.5 Flash/Pro calls via `@ai-sdk/google`
- If missing/invalid/timeout → `lib/agents/mock-provider.ts` returns deterministic fixture payloads and still emits the full event timeline

### Authentication

Static demo user for now: `user_id = 'demo-user-00000000-0000-0000-0000-000000000000'`. All DB rows carry this `user_id`. Supabase Auth wired in a later pass.

### Concurrency

In-memory `Map<caseId, boolean>` mutex inside the API route for demo mode. Supabase path uses `pg_advisory_xact_lock`. Documented clearly in `lib/db/locks.ts`.

---

## 3. Tech Stack

```
Next.js 16 App Router (route handlers, server-only modules)
React 19 (client components for polling, follow-up buttons)
TypeScript 5
Tailwind CSS v4 + existing design tokens
Zod — runtime validation for all agent outputs and API bodies
@supabase/supabase-js — DB, Auth, Realtime
@ai-sdk/google — Gemini 2.5 Flash + Pro via Vercel AI SDK 6
ai — Vercel AI SDK 6 core (generateText, generateObject)
vitest + @vitest/coverage-v8 — unit + integration tests
```

---

## 4. Source Docs Read

- `docs/plan/platform-feature-contracts.md` — canonical table/API ownership
- `docs/plan/architecture.md` — shape-freeze schedule, repo skeleton, cut tiers
- `docs/roles/platform.md` — DB layer ownership
- `docs/roles/agents.md` — agent responsibilities, persistence rules
- `docs/roles/integration.md` — API routes, event bus, seed script
- `docs/roles/frontend.md` — frontend hook contracts, non-goals
- `docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md` — full PRD, RRR formula, safety rules
- `BroncoHacks Planning.md` — combined planning doc
- `bronco-repair-desk/package.json` — current deps (minimal)
- `bronco-repair-desk/app/repair/[id]/page.tsx` — static workspace prototype
- `bronco-repair-desk/app/dashboard/page.tsx` — static dashboard prototype
- `bronco-repair-desk/app/page.tsx` — landing page prototype

---

## 5. Current UI Inventory

| File | State | What changes |
|------|-------|--------------|
| `app/repair/[id]/page.tsx` | Hardcoded agent statuses, follow-up buttons, locked verdict | Replace with `useCaseRun` hook; map `case_events` to agent card states |
| `app/dashboard/page.tsx` | 3 hardcoded case rows | Replace with `GET /api/cases` via `useCases` hook |
| `app/page.tsx` | Static repair verdict preview, hardcoded CTA links to `/repair/case-84920` | No change needed — demo case `case-84920` will be seeded |
| Other routes (`/marketplace`, `/messages`, `/rewards`, `/create-listing`) | Static prototypes | No change this phase |

---

## 6. File Map

### Lane 1 — Contracts + fixtures (no dependencies)

```
lib/types/index.ts            — re-exports all types
lib/types/case.ts             — CaseRecord, CaseMediaRecord, CaseRunRecord, CaseEventRecord, CurrentCaseOutput
lib/types/agents.ts           — AgentPhase, PhaseStatus, ModelTier, CaseCategory, VerdictLabel, Urgency
lib/types/payloads.ts         — IntakePayload, DiagnosisCompletePayload, DiagnosisAwaitingUserPayload,
                                EconomicsPayload, ActionPlanPayload, HelperRoutingPayload, RrrBreakdown
lib/types/api.ts              — Request/response types for all 9 routes
lib/events/types.ts           — CaseEvent interface (matches case_events table shape)
lib/events/schemas.ts         — Zod schemas for all payload types + CaseEvent
tests/fixtures/demo-cases.ts  — 4 seeded demo cases (laptop, bicycle, e_scooter, mini_fridge)
tests/fixtures/demo-events.ts — Pre-baked event timelines for each demo case
```

### Lane 2 — Persistence + seed (depends: Lane 1)

```
lib/db/client.ts              — Supabase client singleton (service role); exports `supabase`
lib/db/demo-store.ts          — In-memory store seeded from demo-cases.ts; same interface as queries/
lib/db/queries/cases.ts       — createCase, getCase, listCases, updateCase
lib/db/queries/runs.ts        — createRun, getCurrentRun, updateRun, demoteCurrentRun
lib/db/queries/events.ts      — insertEvent, listEvents
lib/db/queries/outputs.ts     — writeDiagnosis, writeVerdict, writeActionPlan, writeHelperRequest
lib/db/queries/current.ts     — getCurrentCaseOutput (mirrors current_case_outputs view)
lib/db/locks.ts               — acquireCaseLock, acquireRunLock, releaseLock (in-memory mutex + pg_advisory stub)
lib/db/migrations/001_init.sql — Full schema (cases, case_media, case_runs, case_messages, case_events,
                                  diagnoses, verdicts, action_plans, helper_requests, category_reference)
lib/db/migrations/002_seed_category_reference.sql — laptop/bicycle/e_scooter/mini_fridge reference data
scripts/seed-demo.ts          — Seeds demo cases + events + outputs via API or direct DB
```

### Lane 3 — Agents (depends: Lane 1)

```
lib/agents/context.ts         — AgentContext interface + createAgentContext factory
lib/agents/model-router.ts    — modelFor(phase) → 'flash' | 'pro'; buildGeminiClient(tier)
lib/agents/mock-provider.ts   — Returns deterministic fixture payloads; used when GOOGLE_API_KEY missing
lib/agents/intake.ts          — IntakeAgent: parse symptoms + photos → IntakePayload
lib/agents/diagnosis.ts       — DiagnosisAgent: root cause analysis → DiagnosisCompletePayload | DiagnosisAwaitingUserPayload
lib/agents/economics.ts       — EconomicsAgent: RRR score → EconomicsPayload
lib/agents/action-plan.ts     — ActionPlanAgent: steps + applySafetyGuard → ActionPlanPayload
lib/agents/helper-routing.ts  — HelperRoutingAgent: stub matching → HelperRoutingPayload
lib/agents/orchestrator.ts    — State machine: reads case_runs → runs next phase → writes events/outputs
lib/utils/rrr.ts              — computeRrr(inputs) → rrrScore + label; pure function
lib/utils/safety-guard.ts     — applySafetyGuard(payload, safetyFlags) → ActionPlanPayload; pure function
tests/unit/rrr.test.ts        — Threshold boundary tests + golden laptop case test
tests/unit/safety-guard.test.ts — All 4 MVP flags, empty flags, DB round-trip
tests/unit/model-router.test.ts — Phase → model tier mapping
tests/unit/intake.test.ts     — Schema validation + mock provider path
tests/unit/diagnosis.test.ts  — awaiting_user branch + complete branch
tests/unit/economics.test.ts  — RRR formula + label thresholds
tests/unit/action-plan.test.ts — safety guard integration in write path
```

### Lane 4 — API routes (depends: Lane 1, 2, 3)

```
app/api/cases/route.ts                          — GET (list), POST (create)
app/api/cases/[id]/route.ts                     — GET (single), PATCH (update)
app/api/cases/[id]/media/route.ts               — POST (upload metadata)
app/api/cases/[id]/run/route.ts                 — POST (start/restart run)
app/api/cases/[id]/runs/[runId]/followup/route.ts — POST (resume awaiting_user)
app/api/cases/[id]/current/route.ts             — GET (unified snapshot)
app/api/cases/[id]/events/route.ts              — GET (raw events for polling)
tests/integration/api-cases.test.ts             — POST cases, GET cases, PATCH cases
tests/integration/api-run.test.ts               — POST run → events → current snapshot
tests/integration/api-followup.test.ts          — awaiting_user → followup → resume → complete
```

### Lane 5 — Frontend wiring (depends: Lane 1, 4 contracts)

```
lib/api/client.ts             — Typed fetch wrappers for all 9 routes; throws on non-2xx
lib/api/types.ts              — Re-exports API request/response types from lib/types/api.ts
hooks/useCases.ts             — SWR/polling hook → GET /api/cases; returns CaseRecord[]
hooks/useCaseRun.ts           — Polling hook → GET /api/cases/[id]/current + events while active
hooks/useFollowUp.ts          — POST /api/cases/[id]/runs/[runId]/followup; returns mutation state
app/dashboard/page.tsx        — Replace hardcoded rows with useCases(); preserve visual style
app/repair/[id]/page.tsx      — Replace hardcoded state with useCaseRun(); map events to agent card status
app/repair/new/page.tsx       — New case creation form (category, symptoms, photos) → POST /api/cases → POST run
```

### Lane 6 — E2E verification (depends: all lanes)

```
tests/e2e/demo-flow.test.ts   — Full mock-provider flow: create case → run → poll → verdict renders
tests/e2e/followup-flow.test.ts — awaiting_user path: run pauses → followup → resume → verdict
```

---

## 7. Parallel Worktree Setup

`.worktrees/` is gitignored. Create worktrees locally.

```bash
# From BroncoHack2026/ root

# Lane 1 — Contracts (start immediately, no deps)
git worktree add .worktrees/contracts -b agent-council-contracts

# Lane 2 — Persistence (start after Lane 1 types exist)
git worktree add .worktrees/persistence -b agent-council-persistence

# Lane 3 — Agents (start after Lane 1 types exist)
git worktree add .worktrees/agents -b agent-council-agents

# Lane 4 — API (start after Lane 2+3 merge)
git worktree add .worktrees/api -b agent-council-api

# Lane 5 — Frontend wiring (start after Lane 4 API contracts stable)
git worktree add .worktrees/ui-wiring -b agent-council-ui-wiring

# Lane 6 — E2E (start after all lanes merge)
git worktree add .worktrees/e2e -b agent-council-e2e
```

**Baseline verification per worktree (run after creation):**

```bash
cd .worktrees/<lane-name>/bronco-repair-desk
npm install
npm run lint
npm run build
```

---

## 8. Lane Dependency Graph

```
Lane 1 (contracts) ──────────────────────────────┐
                                                  ├──► Lane 3 (agents) ──┐
                    ├──► Lane 2 (persistence) ───┤                       ├──► Lane 4 (API) ──► Lane 5 (UI wiring) ──► Lane 6 (E2E)
                                                  └─────────────────────┘
```

Conflict-risk files: `lib/types/index.ts`, `bronco-repair-desk/package.json`. Both are Lane 1 / pre-Lane 1. No other lane touches them.

---

## 9. Implementation Tasks

### Pre-work (main branch, no worktree)

- [ ] Add `.worktrees/` to `.gitignore` in `BroncoHack2026/`
- [ ] Install dependencies in `bronco-repair-desk/`:
  ```bash
  npm install @supabase/supabase-js ai @ai-sdk/google zod swr
  npm install -D vitest @vitest/coverage-v8 @types/node
  ```
- [ ] Add vitest config to `bronco-repair-desk/vitest.config.ts`
- [ ] Add test scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`
- [ ] Add `.env.local.example` with all required env vars

---

### Lane 1 — Contracts + Fixtures

**Branch:** `agent-council-contracts` | **Worktree:** `.worktrees/contracts`

- [ ] Create `lib/types/agents.ts` — enums: `CaseCategory`, `AgentPhase`, `PhaseStatus`, `ModelTier`, `VerdictLabel`, `Urgency`
- [ ] Create `lib/types/payloads.ts` — `IntakePayload`, `DiagnosisCompletePayload`, `DiagnosisAwaitingUserPayload`, `EconomicsPayload`, `RrrBreakdown`, `ActionPlanPayload`, `HelperRoutingPayload`
- [ ] Create `lib/types/case.ts` — `CaseRecord`, `CaseMediaRecord`, `CaseRunRecord`, `CaseEventRecord`, `CurrentCaseOutput`
- [ ] Create `lib/types/api.ts` — request/response types for all 9 routes
- [ ] Create `lib/types/index.ts` — re-export all of the above
- [ ] Create `lib/events/types.ts` — `CaseEvent` interface matching `case_events` table columns exactly
- [ ] Create `lib/events/schemas.ts` — zod schemas for every payload type; export `CaseEventSchema`, `IntakePayloadSchema`, `DiagnosisPayloadSchema`, `EconomicsPayloadSchema`, `ActionPlanPayloadSchema`
- [ ] Create `tests/fixtures/demo-cases.ts` — export `DEMO_CASES: CaseRecord[]` (4 entries: laptop `case-84920`, bicycle `case-84921`, e_scooter `case-84922`, mini_fridge `case-84923`)
- [ ] Create `tests/fixtures/demo-events.ts` — export pre-baked `case_events` rows for the laptop demo matching the demo script in §14 of the design spec (all 8 events through `orchestrator·complete`)
- [ ] Verify: `npm run build` passes with no type errors

**Merge trigger:** `npm run build` passes → merge `agent-council-contracts` → `main`

---

### Lane 2 — Persistence + Seed

**Branch:** `agent-council-persistence` | **Worktree:** `.worktrees/persistence` | **Depends on:** Lane 1 merged

- [x] ~~Create `lib/db/migrations/001_init.sql`~~ **SKIP — schema already deployed in Supabase cloud. Revisit when Supabase MCP is connected.**
- [x] ~~Create `lib/db/migrations/002_seed_category_reference.sql`~~ **SKIP — same reason as above.**
- [ ] Create `lib/db/client.ts` — export `supabase` (service role client); export `isSupabaseAvailable(): boolean`
- [ ] Create `lib/db/demo-store.ts` — in-memory store implementing the same interface as queries/; seeded from `tests/fixtures/demo-cases.ts`; writes are ephemeral
- [ ] Create `lib/db/queries/cases.ts` — `createCase`, `getCase`, `listCases`, `updateCase`; routes through Supabase or demo-store based on `isSupabaseAvailable()`
- [ ] Create `lib/db/queries/runs.ts` — `createRun` (sets `is_current=true`, demotes old within transaction), `getCurrentRun`, `updateRun`
- [ ] Create `lib/db/queries/events.ts` — `insertEvent`, `listEvents`
- [ ] Create `lib/db/queries/outputs.ts` — `writeDiagnosis`, `writeVerdict`, `writeActionPlan`, `writeHelperRequest`
- [ ] Create `lib/db/queries/current.ts` — `getCurrentCaseOutput`: joins cases + current run + diagnoses + verdicts + action_plans (mirrors `current_case_outputs` view for demo-store path)
- [ ] Create `lib/db/locks.ts` — `acquireCaseLock(caseId)` and `acquireRunLock(runId)` using in-memory `Map` mutex for demo; stub comment for pg_advisory_xact_lock path
- [ ] Create `scripts/seed-demo.ts` — upsert 4 demo cases + events + outputs via queries; idempotent (`ON CONFLICT DO NOTHING`)
- [ ] Add `"seed": "tsx scripts/seed-demo.ts"` to package.json scripts
- [ ] Write DB unit test `tests/unit/db-queries.test.ts` — verify `createRun` with `is_current` demotes prior run using demo-store
- [ ] Run `npm test -- db-queries` → passes

**Merge trigger:** tests pass + `npm run build` passes → merge `agent-council-persistence` → `main`

---

### Lane 3 — Agents

**Branch:** `agent-council-agents` | **Worktree:** `.worktrees/agents` | **Depends on:** Lane 1 merged

- [ ] Create `lib/utils/rrr.ts` — `computeRrr(inputs: RrrInputs): { score: number; label: VerdictLabel; breakdown: RrrBreakdown }` — pure function, no I/O
- [ ] Create `lib/utils/safety-guard.ts` — `applySafetyGuard(payload: ActionPlanPayload, safetyFlags: string[]): ActionPlanPayload` — pure function, no I/O
- [ ] Write `tests/unit/rrr.test.ts`:
  - Boundary: score 0.70 → `repair_now`
  - Boundary: score 0.55 → `repair_if_cheap`
  - Boundary: score 0.40 → `wait_monitor`
  - Boundary: score 0.25 → `replace_soon`
  - Boundary: score 0.24 → `replace_now`
  - Golden: laptop demo inputs → `rrr_score ∈ [0.77, 0.80]`, label `repair_now`
- [ ] Write `tests/unit/safety-guard.test.ts`:
  - Empty flags → plan unchanged, `safetyPreamble` undefined
  - `battery_swelling` → hard+medium disassembly steps removed, preamble = "Swollen lithium batteries are a fire risk..."
  - `refrigerant_leak`, `brake_failure`, `scooter_battery_thermal` → each produces correct preamble
  - `technicianQuestions` always preserved
- [ ] Run `npm test -- rrr safety-guard` → all pass
- [ ] Create `lib/agents/context.ts` — `AgentContext` interface + `createAgentContext` factory (wraps `insertEvent` + case/run IDs)
- [ ] Create `lib/agents/model-router.ts` — `modelFor(phase: AgentPhase): ModelTier`; exports `buildClient(tier)` using `@ai-sdk/google` or mock
- [ ] Create `lib/agents/mock-provider.ts` — for each phase, returns the fixture payload from `tests/fixtures/demo-events.ts`; emits events via context
- [ ] Create `lib/agents/intake.ts` — prompts Flash with symptoms + photo URLs → zod validates `IntakePayloadSchema`; one retry on parse failure
- [ ] Create `lib/agents/diagnosis.ts` — prompts Pro with case + IntakePayload + category_reference → returns `DiagnosisCompletePayload` or `{ awaitingUser: true, question, reason }` (max 1 per run)
- [ ] Create `lib/agents/economics.ts` — prompts Flash with DiagnosisPayload + cost_bands → computes via `computeRrr` → returns `EconomicsPayload`; validates that `uncertaintyNote` is non-empty
- [ ] Create `lib/agents/action-plan.ts` — prompts Flash → calls `applySafetyGuard` unconditionally before writing → returns `ActionPlanPayload`
- [ ] Create `lib/agents/helper-routing.ts` — stub: returns 2 pre-seeded helper matches from `category_reference`
- [ ] Create `lib/agents/orchestrator.ts` — state machine: reads `case_runs.current_phase` → dispatches to correct agent → writes durable output → updates `case_runs` → inserts `case_events`; handles `awaiting_user` pause and resume
- [ ] Write `tests/unit/orchestrator.test.ts`:
  - Happy path (mock provider): full run → `orchestrator·complete` event emitted, `diagnoses`+`verdicts`+`action_plans` written
  - `awaiting_user` path: run pauses at diagnosis, returns `{ status: 'awaiting_user', question }`
  - Mock fallback: `GOOGLE_API_KEY` absent → mock provider used, same event timeline
- [ ] Run `npm test -- orchestrator` → all pass

**Merge trigger:** all unit tests pass + `npm run build` passes → merge `agent-council-agents` → `main`

---

### Lane 4 — API Routes

**Branch:** `agent-council-api` | **Worktree:** `.worktrees/api` | **Depends on:** Lane 1 + 2 + 3 merged

- [ ] Create `app/api/cases/route.ts`:
  - `GET` → `listCases(demoUserId)` → `200 { cases: CaseRecord[] }`
  - `POST` → validate body with `CreateCaseSchema` → `createCase(...)` → `201 { case: CaseRecord }`
- [ ] Create `app/api/cases/[id]/route.ts`:
  - `GET` → `getCase(id)` → `200 { case }` or `404`
  - `PATCH` → validate body → `updateCase(id, ...)` → `200 { case }` (only when no active run)
- [ ] Create `app/api/cases/[id]/media/route.ts`:
  - `POST` → validate file metadata → insert `case_media` row → `201 { media }`
- [ ] Create `app/api/cases/[id]/run/route.ts`:
  - `POST` → `acquireCaseLock` → demote old run → `createRun` → run orchestrator → return `200 { status, runId }` or `{ status: 'awaiting_user', runId, question }`
- [ ] Create `app/api/cases/[id]/runs/[runId]/followup/route.ts`:
  - `POST` → validate body `{ answer: string }` → write `case_messages` row → flip run to `running` → resume orchestrator from `diagnosis` → return `200 { status }`
- [ ] Create `app/api/cases/[id]/current/route.ts`:
  - `GET` → `getCurrentCaseOutput(id)` → `200 { snapshot: CurrentCaseOutput }` or `404`
- [ ] Create `app/api/cases/[id]/events/route.ts`:
  - `GET` → `listEvents(caseId)` → `200 { events: CaseEventRecord[] }`
- [ ] Write `tests/integration/api-cases.test.ts`:
  - `POST /api/cases` creates case, returns 201 with correct shape
  - `GET /api/cases` returns array including newly created case
  - `PATCH /api/cases/[id]` updates symptoms; fails 409 when run is active
- [ ] Write `tests/integration/api-run.test.ts`:
  - `POST /api/cases/[id]/run` with mock provider → all events emitted → `GET current` returns complete snapshot
  - Second concurrent `POST run` on same case → 409 (lock held)
- [ ] Write `tests/integration/api-followup.test.ts`:
  - Run pauses at `awaiting_user` → `POST followup` → resumes → `GET current` shows complete verdict
- [ ] Run `npm test -- api` → all pass + `npm run build` passes

**Merge trigger:** integration tests pass → merge `agent-council-api` → `main`

---

### Lane 5 — Frontend Wiring

**Branch:** `agent-council-ui-wiring` | **Worktree:** `.worktrees/ui-wiring` | **Depends on:** Lane 1 + 4 contracts

- [ ] Create `lib/api/client.ts` — typed fetch wrappers for all 9 routes; throws `ApiError` on non-2xx; uses relative URLs (works in both browser and server)
- [ ] Create `hooks/useCases.ts` — polls `GET /api/cases` every 5s; returns `{ cases, isLoading, error }`
- [ ] Create `hooks/useCaseRun.ts` — polls `GET /api/cases/[id]/current` + `GET /api/cases/[id]/events` every 2s while `status ∈ {running, awaiting_user}`; stops polling on `complete | failed`; returns `{ snapshot, events, isLoading }`
- [ ] Create `hooks/useFollowUp.ts` — wraps `POST /api/cases/[id]/runs/[runId]/followup`; returns `{ submit, isSubmitting }`
- [ ] Update `app/dashboard/page.tsx`:
  - Add `'use client'`
  - Replace 3 hardcoded rows with `useCases()` result
  - Map `CaseRecord` fields to existing row template (preserve visual style exactly)
  - Show loading skeleton while `isLoading`
- [ ] Update `app/repair/[id]/page.tsx`:
  - Add `'use client'`
  - Call `useCaseRun(id)` to get `{ snapshot, events }`
  - Map `events` phase+status → agent card state (COMPLETE / ANALYZING / WAITING / FAILED)
  - Show follow-up card when `snapshot.status === 'awaiting_user'`
  - Wire Yes/No/Intermittent buttons to `useFollowUp().submit`
  - Render verdict panel (RRR score, label, breakdown, uncertainty note, safety banner) when `snapshot.status === 'complete'`
  - Preserve existing visual layout
- [ ] Create `app/repair/new/page.tsx`:
  - Form: category select, symptoms textarea, urgency select, optional model#, optional quote
  - Submit → `POST /api/cases` → redirect to `/repair/[newId]` which auto-starts run
- [ ] Verify `/repair/case-84920` still loads via demo seed data (landing page CTA works)

**Merge trigger:** dashboard and repair workspace load from API + `npm run build` passes → merge → `main`

---

### Lane 6 — E2E Verification

**Branch:** `agent-council-e2e` | **Worktree:** `.worktrees/e2e` | **Depends on:** all lanes merged

- [ ] Write `tests/e2e/demo-flow.test.ts` — mock-provider path: create case → POST run → poll current → assert `status=complete`, `rrr_score` in range, `label=repair_now`, `safety_preamble` populated for battery case
- [ ] Write `tests/e2e/followup-flow.test.ts` — assert run pauses at `awaiting_user`, followup answer resumes, final verdict rendered
- [ ] Run `npm run lint` → 0 errors
- [ ] Run `npm run build` → 0 errors
- [ ] Run `npm test` → all tests pass
- [ ] Manual: start `npm run dev`, open `/dashboard` → 4 seeded cases visible
- [ ] Manual: click MacBook Pro case → repair workspace loads, agent cards animate via polling
- [ ] Manual: follow-up card appears, tap Yes → run resumes → verdict panel renders with safety banner

**Done when:** all automated tests pass, manual demo path runs cleanly 3× without intervention.

---

## 10. Merge Order

```
main
└─► agent-council-contracts    (no deps — merge first)
    └─► agent-council-persistence  (after contracts)
    └─► agent-council-agents       (after contracts; can merge in parallel with persistence)
        └─► agent-council-api      (after persistence + agents)
            └─► agent-council-ui-wiring  (after api)
                └─► agent-council-e2e    (after ui-wiring)
```

After each merge: `npm run lint && npm run build` must pass before the next lane starts.
Any conflict in `lib/types/**` pauses all downstream lanes until resolved on `main`.

---

## 11. Verification Plan

| Test | Command | Expected |
|------|---------|---------|
| Type check | `npx tsc --noEmit` | 0 errors |
| Lint | `npm run lint` | 0 errors |
| Build | `npm run build` | 0 errors |
| RRR unit | `npm test -- rrr` | 6 tests pass (5 thresholds + golden) |
| Safety guard unit | `npm test -- safety-guard` | 6 tests pass (4 flags + empty + preamble copy) |
| Orchestrator unit | `npm test -- orchestrator` | 3 tests pass (happy, awaiting_user, mock fallback) |
| API integration | `npm test -- api` | 9 tests pass |
| E2E demo flow | `npm test -- e2e` | 2 test suites pass |
| Dev server smoke | `npm run dev` → open `/dashboard` | 4 cases visible |

---

## 12. Known Risks and Cut Rules

| Risk | Mitigation | Cut rule |
|------|-----------|---------|
| Gemini latency/timeout | Mock-provider path always available; "Load Demo Case" button replays seeded events | Cut live Gemini if it blocks E2E verification |
| Supabase cloud unavailable | In-memory demo-store path | Demo always works without cloud |
| Concurrent run race | In-memory mutex for demo; advisory lock comment for Postgres path | Document limitation; don't block demo |
| Stretch features bleed into core | Hr 20 cutoff; stretches not in this plan | Remove any stretch feature not cleanly working |
| iOS Safari camera permission | Camera component is stretch in this pass | /repair/new uses file input fallback only |
| Type contract drift between lanes | `lib/types/**` is Lane 1 and frozen before other lanes start | Any type change goes through Lane 1 PR first |

---

## 13. Definition of Done

- [ ] `npm run build` passes with 0 type errors
- [ ] `npm test` passes: RRR thresholds, safety guard (all 4 flags), orchestrator (3 paths), API (9 routes), E2E (2 flows)
- [ ] `/dashboard` shows real case data from `GET /api/cases`
- [ ] `/repair/[id]` shows live agent card states from polled events
- [ ] Follow-up question card appears when run is `awaiting_user`; answer resumes the run
- [ ] Verdict panel renders RRR score, label, breakdown, uncertainty note, and safety banner on complete
- [ ] Landing page CTA to `/repair/case-84920` loads the seeded MacBook demo case
- [ ] Demo path works without `GOOGLE_API_KEY` or Supabase cloud env vars set
- [ ] No lane's files were edited by another lane
