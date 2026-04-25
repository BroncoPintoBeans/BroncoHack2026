# Agent / AI Engineer — BroncoHack 2026

> Reference: [`docs/plan/architecture.md`](../plan/architecture.md) · [`docs/plan/platform-feature-contracts.md`](../plan/platform-feature-contracts.md) · [`docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`](../superpowers/specs/2026-04-22-bronco-repair-desk-design.md)

## 1. Your mission

Own the AI brain — orchestrator + 5 sub-agents (intake / diagnosis / economics / action-plan / helper-routing), Gemini Flash↔Pro tier routing, the safety guard, and the RRR formula. The verdict and visible model-routing badges are your responsibility.

## 2. Files you own

- `lib/agents/orchestrator.ts`
- `lib/agents/intake.ts` · `diagnosis.ts` · `economics.ts` · `action-plan.ts` · `helper-routing.ts`
- `lib/agents/tools/places.ts` · `tools/mock-data.ts`
- `lib/agents/schemas.ts` (Zod per-phase payloads)
- `lib/agents/model-routing.ts` (Flash vs Pro selector)
- `lib/agents/safety.ts` (safety-flag constants + canonical copy)
- `lib/utils/rrr.ts` (pure RRR formula)
- `tests/unit/{rrr,safety-guard,model-routing}.test.ts`

## 3. Features you ship

### Persistence rule (authoritative)

Sub-agents persist outputs per this rule — no ambiguity:

| Agent | Durable table on `phase.complete` | Event-only record |
|---|---|---|
| `intake` | — (no durable table) | `case_events` row with `phase='intake'`, `status='complete'`, full parsed payload in `payload` |
| `diagnosis` | `diagnoses` (one row per run) | — |
| `economics` | `verdicts` (one row per run) | — |
| `action_plan` | `action_plans` (one row per run, includes `safety_preamble`) | — |
| `helper_routing` | `helper_requests` (one row per run) | — |

**`awaiting_user` is NOT durable-write territory** — partial state lives in `case_events.payload` (most recent `status='awaiting_user'` event for the phase) + `case_runs.awaiting_question`. Agents write durable rows only on true `status='complete'`. On resume after follow-up, the orchestrator re-runs the phase from `awaiting_user` state and writes the row once on completion.

---

### `F-agent-rrr` (cut-floor) — pure function, zero deps
- **Done when** — `rrr.ts` exports `computeRRR(inputs): { score, breakdown, verdict }`. Tests cover all 5 thresholds (`repair_now`, `repair_if_cheap`, `wait_monitor`, `replace_soon`, `replace_now`) plus boundary cases. See spec §11.1.
- **Depends on** — none.
- **Cut-rule** — *cannot cut*. The verdict itself.

### `F-agent-safety` (cut-floor) — pure function, zero deps
- **Done when** — `applySafetyGuard(payload, safetyFlags)` exported from `action-plan.ts`. Three test cases pass: (a) no flags → no preamble; (b) `battery_swelling` flag → amber preamble + downgrade hard steps; (c) write-path integration test confirms `safety_preamble` round-trips through DB. See spec §11.2.
- **Depends on** — none (pure fn). DB round-trip test waits on SF-1.
- **Cut-rule** — *cannot cut*. The hero demo case (laptop swollen battery) hinges on this.

### `F-agent-contracts` (cut-floor)
- **Done when** — `schemas.ts` exports Zod schemas for: intake input, diagnosis output, economics output, action-plan output (with `safety_preamble`), helper-routing output. Each has a passing parse test against `tests/fixtures/demo-cases.ts`.
- **Depends on** — none (writes fixture-validated shapes first; Platform validates against DB after SF-1).
- **Consumers** — Frontend (live payload rendering), Integration (orchestrator resume).
- **Cut-rule** — *cannot cut*. Locks SF-3.

### `F-agent-intake` · `F-agent-diagnosis` · `F-agent-economics` · `F-agent-actionplan` (all cut-floor)
- **Done when** — each agent: (a) accepts input matching its Zod schema, (b) calls Gemini at the correct tier per `model-routing.ts`, (c) returns output validated by Zod with one-retry on parse failure, (d) writes its row to the corresponding table on phase complete (per spec §10).
- **Depends on** — SF-1, SF-2, SF-3.
- **Consumers** — Orchestrator chains them; Frontend renders outputs.
- **Cut-rule** — *cannot cut individual sub-agents*. Cutting any breaks the chain.

### `F-agent-orchestrator-resume` (tier-3 cuttable)
- **Done when** — orchestrator is stateless; resume reads `case_runs` + `case_events` to determine next phase; uses two-level advisory lock (`withCaseLock` + `withRunLock`).
- **Depends on** — SF-1, SF-2, `F-platform-locks`, all sub-agents.
- **Cut-rule** — degrade to *single-run only, no retries*. Demo loses the manual-retry beat; happy path still works.

### `F-agent-helpers` (tier-2 cuttable)
- **Done when** — Helper-routing agent calls Google Places via function-calling tool; returns ≤5 nearby technicians with `distance_km`, `name`, `rating`.
- **Cut-rule** — degrade to **static list of 3 CPP-area shops** hardcoded in `tools/places.ts`. Cuts also resolve `F-fe-map` cut.

### `F-agent-mockdata` (cut-floor) — demo safety net
- **Done when** — `tools/mock-data.ts` exports `getMockVerdict(caseSlug): VerdictPayload` returning pre-scored verdicts for the 4 demo cases. Orchestrator calls this when a Gemini request fails twice (timeout or 5xx). Returns in <200ms.
- **Depends on** — `F-agent-contracts`.
- **Cut-rule** — *cannot cut*. This is the demo safety net, not a test fixture.

## 4. Shape-freezes you publish

- **SF-3** — `lib/agents/schemas.ts`. Locks when `F-agent-contracts` ships. Push `FREEZE SF-3: agent-contracts` and post SHA.

## 5. Inputs you consume

- **SF-1** (Platform DB) — table shapes for output writes.
- **SF-2** (Integration event union) — to emit `case_events` per phase.

Until both land, work on cut-floor pure functions: `F-agent-rrr`, `F-agent-safety`, plus `model-routing.ts` unit tests. Use `tests/fixtures/demo-cases.ts` for everything that needs a sample payload.

## 6. Non-goals

- Don't write to DB tables directly — go through Platform's `lib/db/queries/*` helpers.
- Don't add a 6th sub-agent. Resist scope creep.
- Don't tune Gemini prompts to production quality. Demo-quality is the bar — Flash should hit it on the easy phases.

## 7. Files you touch with announce-first

- `lib/types/**` (any shared type changes)
- `lib/agents/safety.ts` (after `F-agent-safety` locks; safety copy is on the demo's critical path)
- `package.json` (`@ai-sdk/google` etc. — announce before adding)

## 9. Prototype — Agent Review Board UI

The prototype at `app/repair/[id]/page.tsx` includes an **Agent Review Board** component that is the visual representation of the agent orchestration system. It renders 4 agent cards in a panel:

| Card | Label | Prototype status badge |
|---|---|---|
| 1 | Intake Agent | `COMPLETE` (green) |
| 2 | Diagnosis Agent | `ANALYZING` (blue/pulsing) |
| 3 | Economics Agent | `WAITING` (gray) |
| 4 | Action Plan Agent | `WAITING` (gray) |

These four cards correspond directly to `F-agent-intake`, `F-agent-diagnosis`, `F-agent-economics`, and `F-agent-actionplan`. The status badge on each card must mirror the `case_events` status emitted by the corresponding sub-agent:

| `case_events.status` | Badge display |
|---|---|
| `queued` | `WAITING` (gray) |
| `running` | `ANALYZING` (blue, animated pulse) |
| `complete` | `COMPLETE` (green) |
| `failed` | `FAILED` (red) |
| `awaiting_user` | `NEEDS INPUT` (amber) |

The prototype workspace page (`/repair/[id]`) is the **expected visual output** of the agent system — design your event emissions to map cleanly onto these status transitions. Frontend's `useRealtimeEvents` will drive the badge updates via direct Supabase Realtime subscription on `case_events` filtered by `case_id`.

**Cross-feature flow:** The marketplace item detail page (`/marketplace/[id]`) includes a "Get a Repair Verdict →" link for items listed as `Repair Needed`. That link routes to `/repair/[id]`, creating a direct user path from marketplace listing → agent consultation workspace. When this flow triggers, the orchestrator should receive the listing's category and description as intake context so the agent doesn't start from scratch.

## 10. Raise a flag when…

- Gemini API returns 5xx for >5 min straight (consider mock-only mode for dev to keep moving).
- Zod parse fails on Gemini response *after* the one-retry pattern (means schema is wrong or model is hallucinating — both need attention).
- Cost projection from a dry-run exceeds the API budget.
- Any cut-floor sub-agent is at risk — entire team re-plans, not just you.
