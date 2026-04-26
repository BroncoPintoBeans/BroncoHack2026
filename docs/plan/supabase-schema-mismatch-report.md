# Supabase Schema Mismatch Report

Generated: 2026-04-26

## Scope

This report compares the current `chau` branch's Supabase-facing code against the online Supabase project visible through MCP:

- Project URL: `https://kvxloxsbflbhsdcgwsbq.supabase.co`
- Local app root: `bronco-repair-desk/`
- Branch contract inferred from:
  - `bronco-repair-desk/lib/db/**`
  - `bronco-repair-desk/app/api/cases/**`
  - `bronco-repair-desk/lib/types/**`
- Online schema inspected read-only via:
  - `list_tables` for `public`
  - read-only introspection of `information_schema.columns`
  - read-only introspection of constraints, indexes, RLS policies, views, publications
  - Supabase security advisors

No local `supabase/` migration directory was found under `bronco-repair-desk/`, so the expected branch schema is inferred from runtime code instead of migration files.

## Executive Summary

The online schema does not currently match the branch's Supabase code path. With Supabase env vars enabled, several core flows will fail:

- Creating/listing cases must use Supabase Auth identity when Supabase mode is enabled; local demo identity is only for demo-store fallback.
- Starting a run fails because `case_runs` requires `user_id`, `run_number`, and `input_snapshot`.
- Inserting events fails because `case_events` requires `user_id`.
- Adding media fails because the branch writes `url` and `file_name`, while the live table expects `storage_path`, `ordinal`, and `user_id`.
- Writing/reading verdicts fails because the branch uses `breakdown`, while the live table uses `rrr_breakdown`.
- Writing output rows fails because branch upserts use `onConflict: 'case_id,run_id'`, while live output tables are keyed by `run_id`.
- Helper routing is semantically mismatched: branch treats `helper_requests` as per-run agent match output, while live schema treats it as a community request board.

Recommended path: adapt the local Supabase code to the existing online schema where the live schema is already stronger, then use small migrations only where the online schema is internally inconsistent or lacks branch-required data. Do not blindly reshape the live schema to match the current local code because the online database also contains Marketplace, rewards, conversations, and community repair surfaces.

## Mismatch Inventory

| Area | Local branch expectation | Online schema | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| User identity | Local routes previously relied on a demo user constant | `cases.user_id` is `uuid not null` with FK to `auth.users.id`; owner policies should use `auth.uid()` | Supabase mode must not depend on a fake demo UUID | Local: derive the request user from Supabase Auth bearer tokens in Supabase mode. Supabase: keep `auth.users` / `auth.uid()` as the source of truth. |
| Case categories | Local enum now uses `scooter` | `cases.category` allows `scooter` | Compatible | Keep `scooter` canonical. Do not add `e_scooter` to `cases.category`. |
| Case status | Local row parser accepts `open` and maps DB `draft` to app `open` | `cases.status` allows `draft`, `awaiting_user`, `running`, `complete`, `failed` | Current code is mostly compatible because it writes `draft` and maps to `open`; drift remains in app-vs-DB naming | Keep local mapping, but document `draft` as DB equivalent of app `open`. |
| Case media | Branch inserts `{ id, case_id, url, media_type, file_name }` | `case_media` has `case_id`, `user_id`, `storage_path`, `media_type`, `ordinal`; no `url`, no `file_name` | `POST /api/cases/:id/media` fails immediately | Decide media model. For fastest demo, migrate DB to support external `url` and optional `file_name`. For production-aligned path, change route to upload/store `storage_path`, `ordinal`, and `user_id`. |
| Run creation | Branch inserts `id`, `case_id`, `is_current`, `status`, `current_phase`, `followup_count`, `trigger_reason` | `case_runs` additionally requires `user_id`, `run_number`, `input_snapshot` | `POST /api/cases/:id/run` fails on NOT NULL constraints | Local: pass case `userId`, calculate `run_number`, and persist an `input_snapshot`. |
| Current run uniqueness | Branch demotes old current run, then inserts new current run | Live index `case_runs_one_current` exists | Compatible as a DB backstop, but not transactional in current branch code | Keep index. Consider an RPC or transaction wrapper later if true DB-level atomicity is required. |
| Run status and phases | Branch uses `running`, `awaiting_user`, `complete`, `failed` plus current/next phases | Online checks match | Compatible | No schema change needed. |
| Events | Branch inserts `case_id`, `run_id`, `phase`, `status`, `payload` | `case_events` also requires `user_id`; `id` is bigint, not UUID/text; `payload` is non-null jsonb default `{}` | Event insert fails; row validation may fail because `id` is parsed as string | Local: insert `user_id`, use `payload ?? {}`, and coerce bigint IDs to strings in mappers. |
| Event statuses | Branch enum allows `started`, `complete`, `failed`, `awaiting_user` | Online allows `started`, `running`, `awaiting_user`, `complete`, `failed` | Online is a superset; local parser rejects live `running` events if any are inserted elsewhere | Local: include `running` in `PhaseStatus`. |
| Realtime | Planning docs expect Realtime on `case_events` | No publication entry found for `case_events` | Direct Supabase Realtime subscriptions will not receive Postgres changes | Supabase: add `public.case_events` to the Realtime publication if the client will subscribe directly. Current branch appears API/polling-oriented, so this is not required for server-only reads. |
| Diagnoses write | Branch writes `top_causes`, `confidence`, `safety_flags`, `technician_questions` | `diagnoses` requires `user_id`; has no `technician_questions`; has `missing_evidence` and `raw_response` | Upsert fails because of missing `user_id` or unknown `technician_questions` column | Local: insert `user_id`, stop writing `technician_questions`, or Supabase: add `technician_questions jsonb not null default '[]'`. |
| Diagnoses read | Branch reads `technician_questions` from `diagnoses` | Column does not exist online | Snapshot read fails or loses technician questions | Same decision as diagnoses write. If keeping technician questions in app output, add the DB column. |
| Verdicts write | Branch writes `breakdown` | Online requires `rrr_breakdown`; no `breakdown` column | Verdict upsert fails and `rrr_breakdown` remains missing | Local: write `rrr_breakdown: payload.breakdown`. |
| Verdicts read | Branch validates `breakdown` | Online returns `rrr_breakdown` | `GET /api/cases/:id/current` fails row validation | Local: parse `rrr_breakdown` and map it to API `breakdown`. |
| Verdict nullable values | Branch expects `rrr_score`, `label`, `repair_low_cents`, `replacement_value_cents`, `uncertainty_note` to be non-null | Online allows those fields to be nullable except `rrr_breakdown` | Local parser can reject partial rows inserted by other tools | Either make online fields non-null for completed verdict rows or make local parser tolerate nulls until complete. Prefer non-null for completed agent outputs. |
| Action plans write | Branch writes `case_id`, `run_id`, `steps`, `safety_preamble`, `technician_questions` | Online additionally requires `user_id` | Upsert fails on NOT NULL `user_id` | Local: insert `user_id`. |
| Output upsert conflicts | Branch uses `onConflict: 'case_id,run_id'` for `diagnoses`, `verdicts`, `action_plans` | Live primary key is `run_id`; no unique constraint on `(case_id, run_id)` | Upsert fails because conflict target does not exist | Local: change output upserts to `onConflict: 'run_id'`, or Supabase: add unique indexes on `(case_id, run_id)`. Prefer local change because `run_id` is already the live primary key. |
| Helper routing | Branch writes `helper_requests` with `run_id` and `matches` | Live `helper_requests` has `id`, `case_id`, `user_id`, `campus_area`, `preferred_time`, `status`; no `run_id`, no `matches` | Helper output write/read fails | Recommended: do not overload `helper_requests`. Create a separate `helper_routing_results` table keyed by `run_id`, or store matches in `case_events.payload` if only needed for demo display. |
| Current output view | Some planning docs mention `current_case_outputs` | No online `current_case_outputs` view exists | Not a current runtime blocker because branch now composes outputs in `lib/db/queries/current.ts` | Either update docs to match code, or add the view with `security_invoker = true` if clients will read it directly. |
| RLS policies | Tables have RLS enabled | MCP and advisor show no policies for repair tables | Direct anon/authenticated client reads and Realtime with RLS will be blocked; service-role server code bypasses RLS | If keeping service-role-only API routes, this is not a runtime blocker. If using client Supabase or Realtime, add owner-scoped policies before enabling client access. |

## Recommended Local File Changes

These changes adapt branch code to the online schema with minimal database churn.

### `bronco-repair-desk/lib/auth/demo-user.ts`

- Keep `DEMO_USER_ID` only for demo-store fallback.
- In Supabase mode, derive the current user from the request's Supabase Auth bearer token.
- Compare case ownership against the authenticated Supabase user ID.

### `bronco-repair-desk/lib/db/queries/cases.ts`

- Keep mapping DB `draft` to API `open`.
- Keep `scooter` as the canonical app and DB category.
- Keep `quoteCents` bounded to int32, matching the live `integer` column.

### `bronco-repair-desk/lib/db/queries/runs.ts`

- Change `createRun` to receive the case owner/user ID.
- Insert:
  - `user_id`
  - `run_number`
  - `input_snapshot`
- Calculate `run_number` from existing runs for the case.
- Keep `is_current` demotion plus the live `case_runs_one_current` unique index.
- Consider an RPC later for atomic demote-and-insert if concurrency matters beyond demo scale.

### `bronco-repair-desk/lib/db/queries/events.ts`

- Add `user_id` to inserted rows.
- Insert `payload: event.payload ?? {}` instead of `null`.
- Coerce bigint `id` to a string in `dbRowToEventRecord`.
- Add `running` to the local `PhaseStatus` parser if live events may use it.

### `bronco-repair-desk/lib/db/queries/outputs.ts`

- Add `user_id` to all output inserts/upserts.
- Change upserts for `diagnoses`, `verdicts`, and `action_plans` to `onConflict: 'run_id'`.
- Change verdict write from `breakdown` to `rrr_breakdown`.
- Decide where diagnosis `technicianQuestions` should live:
  - Local-only option: stop writing/reading them from `diagnoses`.
  - Schema option: add `diagnoses.technician_questions jsonb not null default '[]'`.

### `bronco-repair-desk/lib/db/queries/current.ts`

- Parse `verdicts.rrr_breakdown` and expose it as API `breakdown`.
- Do not select helper routing matches from live `helper_requests` unless that table is intentionally changed.
- If a new `helper_routing_results` table is created, read helper matches from there instead.

### `bronco-repair-desk/app/api/cases/[id]/media/route.ts`

Choose one model:

- Storage-path model:
  - Insert `user_id`, `storage_path`, `media_type`, and `ordinal`.
  - Generate a public/signed URL separately for API response.
  - This matches the current live table better.
- External-URL model:
  - Keep SSRF-hardened `url` input.
  - Add DB columns for `url` and optional `file_name`.
  - Make `storage_path` and `ordinal` nullable/defaulted or split external media into a separate table.

Storage-path model is cleaner long term. External-URL model is faster for a hackathon demo if uploads are out of scope.

### `bronco-repair-desk/lib/db/queries/validation.ts`

- Update row schemas to match actual DB values:
  - `case_events.id`: accept `number` or `string`, then normalize to string.
  - `PhaseStatus`: include `running` if online events use it.
  - `VerdictRowSchema`: use `rrr_breakdown`.
  - `DiagnosisRowSchema`: match the final decision for `technician_questions`.
  - `HelperRequestRowSchema`: remove `matches` if live `helper_requests` stays community-focused.

## Recommended Supabase Changes

These changes should be done through migrations after deciding which side is canonical. Use a development branch or local Supabase instance first.

### Required if enabling Supabase mode

- Keep Supabase Auth as the source of truth for user identity.
  - Repair API routes should receive a valid Supabase Auth bearer token in Supabase mode.
  - RLS should use owner policies based on `auth.uid()`.
- Keep `scooter` as the canonical case category.
- Add or confirm output-table support:
  - Either add `diagnoses.technician_questions jsonb not null default '[]'`, or remove it from branch code.
  - Keep `verdicts.rrr_breakdown` as canonical and adapt code.
- Decide the helper routing storage shape:
  - Preferred: create `helper_routing_results(run_id primary key, case_id, user_id, matches jsonb not null default '[]')`.
  - Avoid mixing agent routing results into community `helper_requests`.

### Required if using direct Supabase client access or Realtime

- Add RLS policies for owner-scoped tables:
  - `cases`
  - `case_media`
  - `case_runs`
  - `case_events`
  - `diagnoses`
  - `verdicts`
  - `action_plans`
- Add community-specific policies for `helper_requests` if it remains public-to-authenticated users.
- Add `public.case_events` to the Supabase Realtime publication if clients subscribe directly.

### Optional cleanup

- Create `current_case_outputs` view only if a direct database read path needs it.
- If creating the view on Postgres 15+, use `security_invoker = true` so RLS is applied through the caller.
- Fix advisor warnings for mutable function search paths:
  - `public.handle_new_user`
  - `public.set_updated_at`
- Review the public `marketplace-media` bucket listing policy if marketplace media exposure is not intentional.

## Recommended Resolution Plan

### Phase 1: Make a contract decision

Pick the canonical contract for these unresolved areas:

- User identity: Supabase Auth in Supabase mode, local demo user only in demo-store mode.
- Category name: `scooter`.
- Media model: storage path vs external URL.
- Helper routing output: new result table vs reuse `helper_requests`.
- Current snapshot: composed API query vs `current_case_outputs` view.

### Phase 2: Patch local code first

Patch local files where the online schema is already stronger:

- Use real UUID demo user.
- Pass `user_id` to run, event, and output inserts.
- Use `run_id` conflict targets.
- Use `rrr_breakdown`.
- Normalize event IDs.

This has lower blast radius than reshaping the shared database.

### Phase 3: Apply small schema migrations

Apply only the schema changes that are product decisions, not accidental code drift:

- Category check normalization.
- Optional `diagnoses.technician_questions`.
- Optional media external URL columns if uploads are not in scope.
- Preferred `helper_routing_results` table if helper matches must persist.
- Optional Realtime publication and RLS policies.

### Phase 4: Verify with Supabase enabled

Run the branch against real Supabase env vars and verify:

- `GET /api/cases`
- `POST /api/cases`
- `PATCH /api/cases/:id`
- `POST /api/cases/:id/media`
- `POST /api/cases/:id/run`
- `GET /api/cases/:id/events`
- `GET /api/cases/:id/current`
- `POST /api/cases/:id/runs/:runId/followup`

Then run:

- `npx tsc --noEmit`
- `npm test`
- `npm run build` in an environment that permits Turbopack binding

## Current Risk Rating

| Risk | Rating | Reason |
| --- | --- | --- |
| Supabase runtime enablement | High | Required columns and column names do not match branch inserts. |
| Demo-store-only mode | Low | Current mismatches are isolated to Supabase paths. |
| Direct Realtime/client Supabase | High | RLS has no policies and `case_events` is not in a publication. |
| Schema migration blast radius | Medium | Repair tables are empty, but the project has adjacent marketplace/community tables and some existing data. |

## Bottom Line

Do not turn on Supabase mode for this branch until the above mismatches are resolved. The safest implementation path is a small local adaptation pass plus targeted migrations for the few places where the live schema is missing branch-required product fields.
