# Meta-Prompt: Agent Council Backend Implementation Plan

Use this prompt with the next planning agent. The next agent's job is to produce a complete implementation plan, not to implement the feature yet.

---

## Prompt To Give The Next Agent

You are planning the full backend implementation for Bronco Repair Desk's **Agent Council Diagnose** feature and the wiring needed to connect it to the current temporary frontend UI.

Your output must be a single complete markdown implementation plan saved at:

`docs/superpowers/plans/YYYY-MM-DD-agent-council-backend-and-ui-wiring.md`

The plan must be usable as a live To-Do list with checkbox tasks. It must be modular enough that multiple coding agents can implement separate lanes in parallel from different git worktrees and later merge their work with minimal conflicts.

Do not implement code. Produce the plan only.

## Required Skills / Method

Use the local planning discipline:

- Use `superpowers:writing-plans` to create the final implementation plan.
- Incorporate `superpowers:using-git-worktrees` concepts into the plan so implementers can run isolated branches/worktrees.
- Assume parallel workers will use separate git worktrees and branch names.
- Split work by disjoint write sets. If two lanes must touch the same file, call out the required merge order.

## Repository Context To Read First

Read these files before writing the plan:

- `docs/plan/platform-feature-contracts.md`
- `docs/plan/architecture.md`
- `docs/roles/platform.md`
- `docs/roles/agents.md`
- `docs/roles/integration.md`
- `docs/roles/frontend.md`
- `BroncoHacks Planning.md`
- `docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`
- `bronco-repair-desk/package.json`
- `bronco-repair-desk/app/repair/[id]/page.tsx`
- `bronco-repair-desk/app/dashboard/page.tsx`
- `bronco-repair-desk/app/page.tsx`
- Any existing `bronco-repair-desk/app/api/**`, `bronco-repair-desk/lib/**`, `bronco-repair-desk/tests/**`, and `bronco-repair-desk/components/**` files.

Treat `docs/plan/platform-feature-contracts.md` as authoritative for table names and feature boundaries.

## Product Scope

Plan implementation for **Agent Council Diagnose** only, plus minimal shared infrastructure needed to show the flow in the current frontend.

Agent Council Diagnose owns:

- Case intake.
- Case media metadata.
- Multi-agent run lifecycle.
- Durable output for diagnosis, verdict/economics, action plan, helper request.
- Case event stream.
- Follow-up messages.
- Deterministic demo fallback if AI credentials are missing or external calls fail.

Use these canonical Diagnose tables:

- `cases`
- `case_media`
- `case_runs`
- `case_messages`
- `case_events`
- `diagnoses`
- `verdicts`
- `action_plans`
- `helper_requests`
- `category_reference`

Shared tables may be planned only if needed for the Diagnose flow:

- `technician_profiles`
- `conversations`
- `conversation_participants`
- `messages`
- `user_points`
- `point_transactions`

Do not plan Marketplace implementation except optional links from `marketplace_listings.case_id` to an existing diagnosis case. Marketplace can remain static/mock for this phase.

## Current Frontend State

The current UI is mostly static and must be wired through a thin frontend data layer rather than rewritten wholesale.

Important current routes:

- `bronco-repair-desk/app/page.tsx`
  - Has static CTA links to `/repair/case-84920`.
  - Shows a static repair verdict preview.
- `bronco-repair-desk/app/dashboard/page.tsx`
  - Has hardcoded cases.
  - Links rows to `/repair/${caseId}`.
  - Has a "New Repair Case" link to `/repair/new`, which may not exist yet.
- `bronco-repair-desk/app/repair/[id]/page.tsx`
  - Client component.
  - Hardcoded Agent Review Board state.
  - Hardcoded follow-up question buttons.
  - Hardcoded locked final recommendation placeholder.

The plan must preserve the visual UI while replacing hardcoded data with typed fetches/hooks where practical.

## Required Backend Shape

Plan these API routes at minimum:

- `POST /api/cases`
- `GET /api/cases`
- `GET /api/cases/[id]`
- `PATCH /api/cases/[id]`
- `POST /api/cases/[id]/media`
- `POST /api/cases/[id]/run`
- `POST /api/cases/[id]/runs/[runId]/followup`
- `GET /api/cases/[id]/current`
- `GET /api/cases/[id]/events`

If Realtime is too much for this implementation pass, plan polling-first behavior using `GET /api/cases/[id]/current` and `GET /api/cases/[id]/events`. Keep the schema compatible with Supabase Realtime later.

## Required Agent Council Modules

Plan modular files for these responsibilities:

- Case repository / persistence boundary.
- Run repository / lock boundary.
- Event bus.
- Typed event contracts.
- Agent schemas.
- Model router.
- Intake agent.
- Diagnosis agent.
- Economics/verdict agent.
- Action-plan agent.
- Helper-routing agent.
- Orchestrator state machine.
- Safety guard.
- RRR scoring utility.
- Mock/demo fallback data.
- API route handlers.
- Frontend API client.
- Frontend hooks or adapters for dashboard and repair workspace.

The plan must prefer focused files over large catch-all files.

## Expected Implementation Architecture

The plan should aim for this runtime flow:

1. User creates a case or opens seeded demo case.
2. Frontend calls `POST /api/cases` and optionally `POST /api/cases/[id]/media`.
3. Frontend calls `POST /api/cases/[id]/run`.
4. API creates a `case_runs` row with `is_current = true`.
5. Orchestrator emits `case_events` as phases progress.
6. Agents produce validated payloads.
7. Durable outputs are written only on phase completion:
   - `diagnoses`
   - `verdicts`
   - `action_plans`
   - `helper_requests`
8. If diagnosis needs one follow-up, run enters `awaiting_user`.
9. Frontend displays the follow-up card and posts to `POST /api/cases/[id]/runs/[runId]/followup`.
10. Orchestrator resumes and completes the run.
11. `GET /api/cases/[id]/current` returns the unified page snapshot.
12. `/repair/[id]` renders live agent statuses, follow-up state, and final recommendation from the snapshot.
13. `/dashboard` renders real case rows from `GET /api/cases`.

## Deterministic Demo Requirement

The implementation plan must not depend on live Gemini or Supabase cloud being available during local development.

Plan a deterministic local/demo path:

- Seed at least four demo cases:
  - `laptop`
  - `bicycle`
  - `e_scooter`
  - `mini_fridge`
- Include a deterministic mock result for `case-84920` matching the current MacBook/Flexgate UI.
- If `GOOGLE_API_KEY` is missing, invalid, or times out, orchestrator uses mock data and still emits the full event timeline.
- Tests must be able to run without network access.

## Parallel Worktree Strategy

The final plan must define parallel work lanes with non-overlapping ownership. Use this structure unless repo inspection shows a better split:

| Lane | Suggested branch/worktree | Primary write set | Depends on |
|---|---|---|---|
| Contracts + fixtures | `agent-council-contracts` | `lib/types/**`, `lib/events/**`, `tests/fixtures/**`, shared schemas | none |
| Persistence + seed | `agent-council-persistence` | `lib/db/**`, `scripts/**`, DB tests | Contracts |
| Agent modules | `agent-council-agents` | `lib/agents/**`, `lib/utils/rrr.ts`, agent unit tests | Contracts |
| API routes | `agent-council-api` | `app/api/cases/**`, integration tests | Contracts, Persistence, Agent modules |
| Frontend wiring | `agent-council-ui-wiring` | `lib/api/**`, `hooks/**`, selected frontend page files | Contracts, API route contracts |
| E2E verification | `agent-council-e2e` | `tests/e2e/**`, Playwright config if needed | API, UI wiring |

The plan must include:

- Exact git worktree creation commands.
- Baseline verification commands per worktree.
- Branch naming.
- Merge order.
- Conflict-risk notes.
- Integration checkpoints after each lane merges.

Use project-local `.worktrees/` only if it is gitignored. Otherwise plan a global worktree directory under `~/.config/superpowers/worktrees/<project-name>/`.

## Plan Quality Requirements

The final implementation plan must include:

- A header following the `superpowers:writing-plans` format.
- A file map listing every file to create or modify and its responsibility.
- A dependency graph across lanes.
- A task list with checkboxes.
- Small, commit-sized steps.
- Test-first steps wherever behavior is non-trivial.
- Exact commands to run.
- Expected pass/fail outcomes.
- Explicit merge/integration checkpoints.
- A final verification checklist.

Do not write vague steps such as:

- "Add error handling."
- "Write tests."
- "Implement API."
- "Wire frontend."
- "Handle edge cases."

Replace every vague item with exact files, expected types, expected behavior, and test commands.

## Technical Decisions To Make Explicit

The plan must make explicit decisions for these points:

- Local persistence strategy for hackathon implementation:
  - Supabase local, SQLite adapter, JSON-file demo store, or in-memory store with seeded data.
  - Choose one primary path and justify it.
  - If a shortcut is chosen, keep interfaces compatible with later Supabase/Postgres migration.
- Runtime for route handlers:
  - Next.js App Router route handlers.
  - Server-only modules for orchestration.
- Validation:
  - Zod or equivalent runtime validation for all agent outputs and API bodies.
- Event delivery:
  - Polling-first or Supabase Realtime-first.
  - If polling-first, preserve `case_events` shape for Realtime later.
- AI integration:
  - Mock-first with optional Gemini provider.
  - Provider interface must make live AI replaceable.
- Authentication:
  - Demo user strategy if auth is not yet implemented.
  - Keep `user_id` fields in data model even if demo user is static.
- Concurrency:
  - How to prevent two current runs for the same case.
  - If using local/demo persistence, document the limitation and the future Postgres advisory-lock path.
- Frontend state:
  - Where fetching happens.
  - How loading, awaiting follow-up, running, complete, and failed states render in the existing UI.

## Required Types / Payloads To Plan

The plan should include or require precise TypeScript types for:

- `CaseRecord`
- `CaseMediaRecord`
- `CaseRunRecord`
- `CaseEventRecord`
- `DiagnosisPayload`
- `VerdictPayload`
- `ActionPlanPayload`
- `HelperRequestPayload`
- `CurrentCaseOutput`
- API request/response types for every required route.

The payloads should align with the planning docs:

- Diagnosis:
  - `top_causes`
  - `confidence`
  - `missing_evidence`
  - `safety_flags`
  - optional `awaiting_user`
- Verdict:
  - repair cost low/high
  - replacement value
  - RRR score
  - RRR breakdown
  - label
  - rationale
  - uncertainty note
- Action plan:
  - steps
  - safety preamble
  - technician questions
  - helper request template

## Frontend Wiring Requirements

The plan must wire current temporary UI incrementally:

- Add a typed frontend API client or hooks layer.
- `/dashboard` should use `GET /api/cases`.
- `/repair/[id]` should use `GET /api/cases/[id]/current`.
- `/repair/[id]` should poll events while a run is active.
- Follow-up buttons should call `POST /api/cases/[id]/runs/[runId]/followup`.
- The static Agent Review Board should map from `case_events` phase/status.
- The final recommendation placeholder should render verdict/action-plan output once complete.
- Keep the existing visual style unless a UI change is required for state clarity.

## Test And Verification Scope

The plan must include tests for:

- RRR scoring thresholds.
- Safety guard behavior.
- Agent output schema validation.
- Orchestrator happy path.
- Orchestrator awaiting-user path.
- Mock fallback path when AI provider fails.
- `POST /api/cases/[id]/run` creates one current run.
- `POST /api/cases/[id]/runs/[runId]/followup` resumes a run.
- `GET /api/cases/[id]/current` returns the combined snapshot.
- Frontend dashboard renders API cases.
- Frontend repair workspace renders running, awaiting-user, and complete states.

The final verification command set should include at least:

- `npm run lint`
- `npm run build`
- Targeted unit tests
- Targeted integration tests
- Optional Playwright/browser smoke test if configured

If the repo lacks a test framework, the plan must include the exact task for adding one and the first tests to prove it works.

## Merge / Coordination Rules

The implementation plan must include these coordination rules:

- One lane, one branch, one worktree.
- Each lane commits small working increments.
- No lane rewrites another lane's files.
- Contracts merge first.
- Persistence and agent modules merge after contracts.
- API merges after persistence and agent modules.
- UI wiring merges after API contracts are stable.
- E2E verification merges last.
- After each merge, run `npm run lint` and `npm run build`.
- Any conflict in `lib/types/**` or API response shapes pauses all downstream lanes until resolved.

## Required Final Sections In The Plan

Your final markdown plan must contain these sections:

1. `Goal`
2. `Architecture`
3. `Tech Stack`
4. `Source Docs Read`
5. `Current UI Inventory`
6. `File Map`
7. `Parallel Worktree Setup`
8. `Lane Dependency Graph`
9. `Implementation Tasks`
10. `Merge Order`
11. `Verification Plan`
12. `Known Risks And Cut Rules`
13. `Definition Of Done`

## Definition Of Done For The Plan

The plan is complete only when a separate implementation agent can start from the first checkbox and proceed without asking architectural questions.

The plan must make clear:

- What each parallel worker owns.
- What each worker must not touch.
- Which tests prove each lane works.
- How the temporary frontend stops using hardcoded case state.
- How the demo still works without external AI/network services.
- How all lanes combine back into one branch cleanly.

