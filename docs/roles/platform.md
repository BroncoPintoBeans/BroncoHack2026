# Platform / Backend — BroncoHack 2026

> Reference: [`docs/plan/architecture.md`](../plan/architecture.md) · [`docs/plan/platform-feature-contracts.md`](../plan/platform-feature-contracts.md) · [`docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`](../superpowers/specs/2026-04-22-bronco-repair-desk-design.md)

## 1. Your mission

Own the data layer end-to-end. Everyone else's code runs on top of what you ship — schema, RLS, advisory locks, Realtime wiring, Supabase auth.

## 2. Files you own

- `lib/db/migrations/001_init.sql` · `002_rls.sql` · `seed.sql`
- `lib/db/client.ts` (server + browser factories)
- `lib/db/queries/{cases,runs,events,outputs}.ts`
- `lib/db/locks.ts` (advisory lock helpers)
- `lib/utils/env.ts` (DB / Supabase env validation)
- `.env.example` (DB section)

## 3. Features you ship

### `F-platform-core` (cut-floor)
- **Done when** — all 10 core tables exist (`cases`, `case_runs`, `case_events`, `case_media`, `case_messages`, `diagnoses`, `verdicts`, `action_plans`, `helper_requests`, `category_reference`), RLS enabled on every user-scoped table, `current_case_outputs` view returns the latest run per case, `case_runs_one_current` partial unique index in place, `category_reference` seeded with `laptop`/`bicycle`/`e_scooter`/`mini_fridge` rows + `safety_warnings` copy. Validated by a smoke query that returns expected shape.
- **Depends on** — none (foundation).
- **Consumers** — Agent (writes outputs), Integration (locks + bus), Frontend (live data via view).
- **Cut-rule** — *cannot cut*. Without this, demo collapses (see in-demo decision table, "Verdict card empty").

### `F-platform-marketplace` (tier-2 cuttable)
- **Done when** — canonical Marketplace tables from [`platform-feature-contracts.md`](../plan/platform-feature-contracts.md) exist and have RLS in place: `marketplace_listings`, `marketplace_media`, `marketplace_bids`, and `marketplace_orders`. `marketplace_listings` is readable by all authenticated users and writable only by the seller. `marketplace_media`, `marketplace_bids`, and `marketplace_orders` are readable/writable only by the seller, bidder/buyer, or service role paths required for transaction completion.
- **Shared dependencies** — listing-scoped messaging uses `conversations`, `conversation_participants`, and `messages`. Marketplace point awards use `point_transactions` and `user_points`.
- **Depends on** — `F-platform-core`.
- **Cut-rule** — degrade to static mock data. Integration's marketplace API routes return fixtures.

### `F-platform-gamification` (tier-2 cuttable)
- **Done when** — canonical shared points/rewards tables from [`platform-feature-contracts.md`](../plan/platform-feature-contracts.md) exist and have RLS in place: `user_points`, `point_transactions`, `rewards`, and `reward_redemptions`. `point_transactions` is append-only through service/server paths; client reads are scoped to the owning `user_id`. `reward_redemptions` deducts points and records the code atomically.
- **Badge policy** — achievement badges are derived from `point_transactions`; do not create an `achievements` table unless a later frozen migration intentionally extends the contract.
- **Depends on** — `F-platform-core`.
- **Cut-rule** — degrade to mock data in rewards page. No point tracking or reward redemptions.

### `F-platform-locks` (cut-floor)
- **Done when** — `lib/db/locks.ts` exports `withCaseLock(caseId, fn)` and `withRunLock(runId, fn)` using two-level `pg_advisory_xact_lock`. Integration test hammers concurrent `/run` requests on the same case and confirms only one wins.
- **Depends on** — `F-platform-core`.
- **Consumers** — Integration (atomic `is_current` demotion in POST `/run`).
- **Cut-rule** — *cannot cut*. Without locks, retry semantics break silently.

### `F-platform-seed` (cut-floor)
- **Done when** — `lib/db/migrations/seed.sql` populates the dev DB with deterministic UUIDs and minimal lookup data (categories, safety-flag enums). Integration's `scripts/seed-demo.ts` then layers the 4 hero demo cases on top.
- **Depends on** — `F-platform-core`.
- **Consumers** — Integration (demo seed script), all streams (local dev).
- **Cut-rule** — *cannot cut*. The demo IS the seed data.

## 4. Shape-freezes you publish

- **SF-1** — `001_init.sql` + `002_rls.sql` + `lib/types/case.ts`. Locks the moment `F-platform-core` ships. Push commit `FREEZE SF-1: platform-core` and post in chat with the SHA.

## 5. Inputs you consume

None. Platform is the foundation. Until you ship SF-1, every other stream is reading `tests/fixtures/demo-cases.ts` (Integration publishes that file as the very first commit).

## 6. Non-goals

- Don't write the queries Agent uses to write outputs — those live in `lib/agents/*` and call your `lib/db/queries/*` helpers.
- Don't optimize for write throughput. This is a 24h demo, not production.
- Don't add columns "we might need." Minimal schema; expand on demand via migrations (announce-first after SF-1).

## 7. Files you touch with announce-first

- `lib/types/**` (after `case.ts` ships)
- `lib/db/migrations/**` (after SF-1 locks)
- `package.json` (Supabase / dotenv deps — announce before adding)

## 8. Raise a flag when…

- Supabase project quota or rate limit hits (free-tier ceilings exist).
- An RLS policy blocks a legitimate query in another stream's code (don't disable RLS — fix the policy).
- Migration drift detected between local and remote DB.
- `F-platform-core` hasn't locked and Agent or Integration is fully out of fixture work.
