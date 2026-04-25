# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bronco Repair Desk is a dual-mode sustainability platform built for BroncoHack 2026 (Cal Poly Pomona, 24-hour hackathon). It combines an **AI Repair Verdict Desk** (multi-agent orchestration diagnosing broken items from photos) with a **Campus Marketplace** (item listing and trading). Target tracks: Sustainability (primary), Best Use of AI/ML (primary).

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, TypeScript, shadcn/ui, framer-motion
- **Backend:** Next.js API routes on Vercel; Vercel AI SDK 6 for Gemini calls
- **Database / Auth / Realtime / Storage:** Supabase (Postgres 15, RLS enabled, Realtime on `case_events` only)
- **AI Models:** Gemini 2.5 Flash (intake, economics, action plan, helper routing) + Gemini 2.5 Pro (diagnosis)
- **Maps (stretch):** Places API via Gemini function-calling; leaflet.js + OpenStreetMap tiles

## Development Commands

```bash
npm run dev                                 # Start dev server
npm run build                               # Production build
npm run lint                                # Lint
npm test                                    # Run all tests
npx jest lib/agents/economics.test.ts       # Run a single test file
```

## Architecture

### Orchestrator

Lives inside `POST /api/cases/:id/run` and `POST /api/cases/:id/runs/:runId/followup`. It is **stateless between phases** — `case_runs` is the sole source of truth for where the orchestration is.

Each invocation:
1. Acquires two advisory locks in order within the same transaction: `pg_advisory_xact_lock(hashtext('case:' || case_id))` then `pg_advisory_xact_lock(hashtext('run:' || run_id))`
2. Reads `case_runs` (status, current_phase, next_phase, followup_count, awaiting_question)
3. Runs the next phase → writes output row → updates `case_runs` → inserts `case_events` row, all in same transaction
4. On `awaiting_user`: flips status, records `awaiting_question`, returns 200, releases lock
5. On complete/failed: flips status, clears `awaiting_question`

### Agent Graph

```
Orchestrator (no LLM)
├── Intake Parser    → Flash  (Pro if video)
├── Diagnosis        → Pro    (critical accuracy; judge-visible "high-stakes" badge)
├── Economics        → Flash  (deterministic scoring)
├── Action Plan      → Flash  (templated drafting)
└── Helper Routing   → Flash  (stub in MVP)
```

Each sub-agent validates output with zod, retries once with the schema explicitly in the prompt on parse failure, and emits a `failed` event on second failure.

### Realtime Topology

Only `case_events` publishes Supabase Realtime events. Phone subscribes `realtime:case_events:case_id=eq.<caseId>`. When a `{phase:'orchestrator', status:'started'}` event arrives with a new `run_id`, the client switches `currentRun` to catch reruns initiated from other clients.

### Key Contracts

`lib/types/**` is the shared workspace package. All four streams depend on it — it must be published by **Hr 4**. Core types: `CaseCategory`, `AgentPhase`, `PhaseStatus`, `ModelTier`, `VerdictLabel`, `CaseEvent`, and payload interfaces per agent phase (`IntakePayload`, `DiagnosisCompletePayload`, `EconomicsPayload`, `ActionPlanPayload`).

## Critical Invariants

### Safety Guard (enforced in code, not prompts)

`applySafetyGuard(payload, safetyFlags)` in `lib/agents/action-plan.ts` is called unconditionally **after** the LLM returns and **before** writing to `action_plans`. A misbehaving prompt cannot bypass it.

When `safetyFlags` is non-empty:
- Suppress any step with `difficulty ∈ {medium, hard}` involving disassembly, pressure, heat, or electricity
- Prepend `safetyPreamble` with category-specific safety copy
- Replace self-fix steps with professional-service wording; preserve `technicianQuestions`

MVP safety flags: `battery_swelling`, `refrigerant_leak`, `brake_failure`, `scooter_battery_thermal`. Defined in `category_reference.safety_warnings`.

### RRR Formula (transparent; rendered component-by-component in the UI)

```
RRR = 0.35 × diagnosis_confidence
    + 0.25 × cost_factor              // clamp(1 − repair_cost / replacement_value, 0, 1)
    + 0.20 × effort_factor            // easy=1.0, medium=0.6, hard=0.3
    + 0.10 × part_availability        // in_stock=1.0, special_order=0.5, scarce=0.0
    + 0.10 × urgency_factor           // low=1.0, normal=0.7, urgent=0.4
```

`replacement_value_cents` must use the comparable **refurb** price (not new-retail) from `category_reference.cost_bands.replacement_refurb`. `uncertainty_note` is always populated — zod rejects an empty string.

Label thresholds: ≥0.70 `repair_now` · ≥0.55 `repair_if_cheap` · ≥0.40 `wait_monitor` · ≥0.25 `replace_soon` · <0.25 `replace_now`

### `is_current` Invariant

`POST /api/cases/:id/run` is the **only** writer that mutates `is_current`. Creating a new run with `is_current=true` must demote the prior current row within the same transaction. The unique partial index `case_runs_one_current` is the DB-level backstop.

### Rerun Rule

A retry (after `complete` or `failed`) always creates a **new** `case_runs` row (`trigger_reason ∈ {manual_retry, field_edit, new_info}`). A follow-up resume does **not** create a new run and does not write new output rows until a fresh complete diagnosis is produced.

## User Journey After Photo Upload

Four paths are available once a user uploads an image of a broken item:

1. **Repair Verdict** — Agent diagnoses the item, labels parts in the image, and provides step-by-step repair instructions (video or written). Returns a structured verdict with repair-vs-replace score and action plan.
2. **Disassembly / Learning** — Agent generates an instruction manual or tutorial covering what parts the device contains and how to analyze or disassemble it — for users who want to understand the item without necessarily repairing it.
3. **Auto-Marketplace Post** — Agent extracts product name, type, and make from the image and auto-drafts a marketplace listing with an estimated price. Also surfaces similar listings from other sellers with comparable items. User reviews and approves before publishing.
4. **Donate / Recycle** — If the user wants responsible disposal, the agent recommends nearby donation centers or e-waste recycling facilities.

## MVP Scope

**Categories (hand-tuned reference data):** laptop, bicycle, e_scooter, mini_fridge

**Listing types:** For Sale · Trade · Free · Repair Needed

**Routes:** `/` · `/marketplace` · `/marketplace/[id]` · `/repair/[id]` · `/dashboard` · `/messages` · `/rewards` · `/create-listing`

**Stretch features (Hr 20 cutoff):** dual-screen director view (highest priority) · nearby technicians · video/voice intake (`FEATURE_VIDEO_INTAKE=false` until flipped) · persistent memory · community distress board

## Parallel Work Streams

| Stream | Owns | Unblocked |
|--------|------|-----------|
| S1 Frontend/UX | Shell, camera capture, event timeline, verdict panel, marketplace UI | Hr 4 (types published) |
| S2 Agent layer | Orchestrator, 5 sub-agents, Gemini SDK wrapper, zod validation + retry | Hr 4 (types + category_reference) |
| S3 Data/Infra | Supabase schema, RLS, Auth, Storage, Realtime, advisory-lock helpers, seed data | Hr 0 (kickoff) |
| S4 Content + Polish | category_reference for all 4 categories (incl. safety_warnings), prompt tuning, demo script | Hr 4 (types for schema) |

**Shape freeze: Hr 2. Contracts publish: Hr 4. Code freeze: Hr 22. Stretch cutoff: Hr 20 (absolute).**

## Required Test Coverage

- `lib/agents/economics.test.ts`: boundary tests for all 5 label thresholds; golden test verifying laptop demo case lands on `repair_now` with `rrr_score ∈ [0.77, 0.80]`
- `lib/agents/action-plan.test.ts`: `applySafetyGuard` with empty flags (plan unchanged, no preamble); with each MVP safety flag (preamble populated, DIY disassembly steps stripped, technicianQuestions preserved); DB round-trip via `current_case_outputs` view

## Design Tokens

| Token | Value |
|-------|-------|
| Primary green | `#1b4332` |
| Deeper green | `#012d1d` |
| Background | `#f9faf2` / `#f3f4ec` (cream) |
| Accent peach | `#ffca98` |
| Headings | Manrope Bold/SemiBold |
| Body | Work Sans Regular/SemiBold |

Figma source file key: `Q1U2pgxm0XqISBmUpGRe1g` (10 screens)
