# Integration / Demo-ops — BroncoHack 2026

> Reference: [`docs/plan/architecture.md`](../plan/architecture.md) · [`docs/plan/platform-feature-contracts.md`](../plan/platform-feature-contracts.md) · [`docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`](../superpowers/specs/2026-04-22-bronco-repair-desk-design.md)

## 1. Your mission

Own the wiring that makes four streams cohere — API routes, event bus, direct Supabase Realtime subscription glue, demo seed scripts, end-to-end test fixtures. Also own the demo dry-runs and the fallback drill.

## 2. Files you own

**Core repair desk (original scope):**
- `app/api/cases/route.ts` (POST create)
- `app/api/cases/[id]/route.ts` (GET metadata, PATCH field edit)
- `app/api/cases/[id]/current/route.ts` (GET snapshot — polling-capable)
- `app/api/cases/[id]/media/route.ts` (POST attach media)
- `app/api/cases/[id]/run/route.ts` (POST new run, atomic `is_current` demotion)
- `app/api/cases/[id]/runs/[runId]/followup/route.ts` (POST follow-up answer)
- `lib/events/bus.ts` (server-side insert + emit)
- `lib/events/subscribe.ts` (client Realtime hook — **direct Supabase subscription, no SSE proxy**)
- `lib/events/types.ts` (event discriminated union)
- `lib/types/api.ts` (request / response types per route)
- `scripts/seed-demo.ts` (populates the 4 hero demo cases)
- `tests/fixtures/demo-cases.ts` (**publish as first commit**, before any other stream needs it)
- `tests/integration/{run-lifecycle,safety-persistence}.test.ts`

**Marketplace & platform routes (prototype-added):**
- `app/api/listings/route.ts` (GET list with filters, POST create listing)
- `app/api/listings/[id]/route.ts` (GET detail, PATCH update, DELETE/archive)
- `app/api/listings/[id]/media/route.ts` (POST attach listing images)
- `app/api/messages/route.ts` (GET thread list, POST new message)
- `app/api/messages/[threadId]/route.ts` (GET thread messages, POST reply, PATCH mark read)
- `app/api/listings/[id]/bids/route.ts` (POST create bid/offer)
- `app/api/listings/[id]/bids/[bidId]/route.ts` (PATCH accept/decline)
- `app/api/user/points/route.ts` (GET current user's points balance)
- `app/api/points/transactions/route.ts` (POST internal point transaction — called by gamification integration)
- `app/api/user/achievements/route.ts` (GET current user's earned achievements)
- `app/api/rewards/route.ts` (GET campus reward catalog)
- `app/api/rewards/redemptions/route.ts` (POST/GET reward redemptions)

## 3. Features you ship

### `F-event-contract` (cut-floor)
- **Done when** — `lib/events/types.ts` exports a discriminated union covering every (`phase` × `status`) pair the orchestrator can emit, plus a `payload_version` field. Each variant is Zod-validated.
- **Depends on** — none (defines the contract; doesn't consume it).
- **Consumers** — Agent (emits), Frontend (subscribes via direct Supabase Realtime).
- **Cut-rule** — *cannot cut*. Locks SF-2.

### `F-event-bus` (cut-floor)
- **Done when** — `lib/events/bus.ts` exports `emit(event)` which inserts to `case_events`. Supabase Realtime broadcasts the row automatically via database replication. Integration test verifies a Realtime subscriber receives the event within 1s of insert.
- **Depends on** — SF-1, `F-event-contract`.
- **Cut-rule** — *cannot cut*. The orchestrator can't surface progress without it.

### `F-api-cases` (cut-floor)
- **Done when** — `POST /api/cases` creates a row, returns `{ caseId }`. `GET /api/cases/[id]` returns case metadata. `PATCH /api/cases/[id]` updates mutable intake fields (e.g., symptoms, urgency after initial create). All authenticated via Supabase JWT + RLS-enforced.
- **Depends on** — SF-1.
- **Cut-rule** — *cannot cut*.

### `F-api-current` (cut-floor)
- **Done when** — `GET /api/cases/[id]/current` returns the authoritative snapshot: case metadata joined with the current run's diagnoses/verdicts/action_plans/helper_requests via `current_case_outputs`. Serves both initial page load AND polling fallback if Realtime is ever cut.
- **Depends on** — SF-1.
- **Cut-rule** — *cannot cut*. Every page read of a case goes through this route.

### `F-api-media` (cut-floor)
- **Done when** — `POST /api/cases/[id]/media` accepts a JPEG blob (≤ 5 MB, up to 3 per case), stores via Supabase Storage, inserts a `case_media` row, returns `{ mediaId, url }`. Content-type + size validated server-side.
- **Depends on** — SF-1.
- **Cut-rule** — *cannot cut*. F-fe-intake can't attach photos without it.

### `F-api-run` (cut-floor)
- **Done when** — `POST /api/cases/[id]/run` acquires `withCaseLock`, sets prior `case_runs.is_current = false`, inserts new run with `is_current = true`, kicks off orchestrator. All in one transaction. Concurrent-request integration test passes (no two runs both `is_current`).
- **Depends on** — SF-1, `F-platform-locks`, Agent's orchestrator entry point.
- **Cut-rule** — *cannot cut*. Atomicity here is the spec's hardest invariant.

### `F-api-followup` (tier-2 cuttable)
- **Done when** — `POST /api/cases/[id]/runs/[runId]/followup` accepts a follow-up response for the named run, clears `case_runs.awaiting_question`, acquires `withRunLock`, kicks orchestrator resume.
- **Depends on** — SF-1, SF-3, `F-agent-orchestrator-resume`.
- **Cut-rule** — degrade to **orchestrator auto-commits best-guess verdict when confidence low**. Loses follow-up question demo beat.

### `F-integration-seedscript` (cut-floor) — demo safety net glue
- **Done when** — `scripts/seed-demo.ts` populates 4 hero cases (`laptop` swollen battery, `bicycle` worn brakes, `e_scooter` throttle issue, `mini_fridge` compressor noise) with deterministic UUIDs. Wired to `pnpm db:seed`. Re-runnable; idempotent.
- **Depends on** — SF-1.
- **Cut-rule** — *cannot cut*. This is the "Load Demo Case" button on stage.

### `F-api-listings` (tier-2 cuttable)
- **Done when** — `GET /api/listings` returns a filtered, paginated list (query params: `category`, `condition`, `listing_type`, `price_min`, `price_max`, `search`). `POST /api/listings` creates a listing row (authenticated; body validated with Zod). `GET /api/listings/[id]` returns full detail with seller profile. `PATCH /api/listings/[id]` updates mutable fields (owner-only). Status transitions (`active` → `sold`/`traded`/`archived`) enforced server-side.
- **Depends on** — SF-1 plus the Marketplace extension (`marketplace_listings`, `marketplace_media`, `marketplace_orders`; see [`platform-feature-contracts.md`](../plan/platform-feature-contracts.md)).
- **Consumers** — Frontend marketplace pages, Frontend item detail.
- **Cut-rule** — degrade to read-only static mock data. Loses create-listing and trade flows.

### `F-api-messages` (tier-2 cuttable)
- **Done when** — `POST /api/messages` creates or resumes a thread between a buyer and a seller scoped to a `listing_id`. `GET /api/messages` returns all threads for the authenticated user with latest message preview. `GET /api/messages/[threadId]` returns the full message history. `PATCH /api/messages/[threadId]` marks all unread messages as read (`read_at` set to now). RLS enforces that only thread participants can read or write.
- **Depends on** — SF-1 plus shared messaging tables (`conversations`, `conversation_participants`, `messages`).
- **Consumers** — Frontend messaging page, Frontend item detail (Message Seller CTA).
- **Cut-rule** — degrade to email-link CTA. Integration removes messaging routes.

### `F-api-bids` (tier-3 cuttable)
- **Done when** — `POST /api/listings/[id]/bids` records a bid or trade offer against `marketplace_bids`. `PATCH /api/listings/[id]/bids/[bidId]` accepts or declines; on accept, the listing transitions through `marketplace_orders` and point transactions fire for the appropriate parties.
- **Depends on** — `F-api-listings`, `F-api-points`.
- **Cut-rule** — degrade to "contact seller to arrange trade" copy on item detail. Points event still fires on manual status change.

### `F-api-points` (tier-2 cuttable)
- **Done when** — `GET /api/user/points` returns the current user's `user_points` balance plus recent `point_transactions`. `POST /api/points/transactions` accepts `{ user_id, reason, source_type, reference_id }` and inserts a `point_transactions` row with the canonical point value for that reason:

  | `reason` | Points |
  |---|---|
  | `listing_sold` | +50 |
  | `listing_traded` | +40 |
  | `listing_given_away` | +20 |
  | `repair_verdict_received` | +30 |

  After insert, the handler updates `user_points.points` (upsert). Called internally by other API routes on transaction completion — not called directly by the client.
- **Depends on** — SF-1 plus shared points tables (`point_transactions`, `user_points`).
- **Consumers** — `F-api-listings` (on sale/trade/archive), `F-api-run` (on verdict complete), Gamification integration agent.
- **Cut-rule** — degrade to stubbed no-op. Rewards page shows mock data.

### `F-api-reward-redemptions` (tier-3 cuttable)
- **Done when** — `POST /api/rewards/redemptions` accepts `{ reward_id, points_to_spend }`, verifies the user has sufficient balance, deducts points through `point_transactions`, inserts a `reward_redemptions` row, and returns the generated one-time code. Supported rewards come from `rewards`. Idempotency key prevents double-spend on retry.
- **Depends on** — `F-api-points`.
- **Cut-rule** — degrade to stub that returns a hardcoded code. Loses real redemption tracking; vendor integrations are not live at hackathon anyway.

### `F-api-achievements` (tier-3 cuttable)
- **Done when** — Badge unlock logic derives earned/locked state from `point_transactions`. `GET /api/user/achievements` returns the authenticated user's earned badges without creating an `achievements` table.
- **Depends on** — `F-api-points`.
- **Cut-rule** — degrade to static mock achievement list on rewards page.

## 4. Shape-freezes you publish

- **SF-2** — `lib/events/types.ts`. Locks when `F-event-contract` ships. Push `FREEZE SF-2: event-contract` and post SHA.
- **SF-4** — `lib/types/api.ts`. Locks when all repair-desk API routes ship and req/resp types are exported:
  - `POST /api/cases`
  - `GET /api/cases/[id]` · `PATCH /api/cases/[id]`
  - `GET /api/cases/[id]/current`
  - `POST /api/cases/[id]/media`
  - `POST /api/cases/[id]/run`
  - `POST /api/cases/[id]/runs/[runId]/followup`

  Push `FREEZE SF-4: api-contracts` and post SHA.

  **Note:** Marketplace API types (`listings`, `messages`, `bids`, `points`, `achievements`, `rewards`, `reward-redemptions`) extend SF-4 but do not block it — they are additive and can ship after the freeze. Their table names must follow [`platform-feature-contracts.md`](../plan/platform-feature-contracts.md).

**First commit (before SF-1):** push `tests/fixtures/demo-cases.ts` with hand-written sample payloads for all 4 hero cases. This unblocks Frontend and Agent until real types land.

## 5. Inputs you consume

- **SF-1** (Platform schema + locks) — to write events, acquire advisory locks, insert to `case_media`.

Until SF-1 lands, write the event union (`F-event-contract`) and API contracts against the spec's TypeScript snippets in §9. Both are pure-shape work — no DB needed.

## 6. Non-goals

- Don't put orchestration logic in API routes — call Agent's orchestrator entry point.
- Don't render UI — page shells belong to Frontend.
- Don't define agent payload shapes — those are SF-3 (Agent owns).
- Don't write the schema — Platform owns DDL; you read from `current_case_outputs`.
- Don't build an SSE proxy — Realtime is direct client-side (dropped from MVP per design review).

## 7. Files you touch with announce-first

- `lib/types/**` (after `api.ts` ships)
- `lib/events/types.ts` (after SF-2 locks)
- `package.json` (Supabase / Storage deps — announce before adding)

## 8. Raise a flag when…

- Realtime auth fails repeatedly (likely RLS misconfig — coordinate with Platform; don't disable RLS).
- The atomic `/run` transaction has a race condition under concurrent requests (test by hammering with `wrk` or a quick loop).
- Demo seed script can't reproduce a verdict end-to-end on a clean DB.
- `F-api-run` hasn't locked and orchestrator can't start runs — entire team re-plans.

---

## 9. Marketplace & gamification — detailed API spec

This section fills in the precise route shapes, cut-priority assignments, and points engine wiring that the feature stubs above left open. It is additive — nothing in §3 is superseded.

### Additional files you own

- `app/api/listings/[id]/complete/route.ts` (POST mark listing sold/traded/given)
- `app/api/listings/[id]/bids/route.ts` (POST submit bid/offer)
- `app/api/listings/[id]/bids/[bidId]/route.ts` (PATCH accept/decline)
- `app/api/user/points/route.ts` (GET balance + recent events)
- `app/api/user/achievements/route.ts` (GET earned achievements)
- `app/api/leaderboard/route.ts` (GET top-20 monthly)
- `lib/points/engine.ts` (internal points event processor — not a public route)

### Route shapes

**Marketplace — listing lifecycle**

`POST /api/listings` — create listing draft.
Request body: `{ title, description, category, condition, listing_type: "sale" | "trade" | "free" | "repair_needed", price_cents?, trade_for?, location }`.
Returns `{ listingId }`. Authenticated; Zod-validated server-side; inserts `marketplace_listings`.

`GET /api/listings` — paginated item list.
Query params: `category`, `listing_type`, `condition`, `q` (full-text), `page`, `limit`.
Returns `{ items: Listing[], meta: { total, page, limit } }`.

`GET /api/listings/:id` — single listing with attached media URLs.
Returns `{ listing: ListingDetail }`.

`PATCH /api/listings/:id` — update mutable fields (owner-only; blocked if an accepted offer exists).

`POST /api/listings/:id/media` — attach listing images.
Accepts JPEG/PNG blob ≤ 10 MB; up to 6 per listing. Stores via Supabase Storage (`listing-media` bucket), inserts `marketplace_media` row.
Returns `{ mediaId, url }`. Content-type + size validated server-side.

`POST /api/listings/:id/bids` — submit bid or trade request.
Body: `{ bid_amount_cents?, trade_item_description? }`. Creates a `marketplace_bids` row scoped to the listing and authenticated bidder.

`PATCH /api/listings/:id/bids/:bidId` — accept or decline a bid/offer.
Body: `{ action: "accept" | "decline" }`. Accepting locks the listing from further offers.

`POST /api/listings/:id/complete` — mark listing as sold/traded/given. **(cut-floor)**
Transitions listing status to `completed`, records counterparty in `marketplace_orders` if applicable, and calls `lib/points/engine.ts -> awardPoints()` with the appropriate transaction reason. Idempotent on repeat calls with a status guard and a unique marketplace order per completed listing.
Returns `{ ok: true }`.

**Messaging**

`GET /api/messages` — list all conversation threads for the authenticated user, sorted by latest message. Returns thread summaries with latest message preview and unread count.

`GET /api/messages/:listingId/:partnerId` — chronological messages for a thread scoped to a specific listing and counterparty.

`POST /api/messages/:listingId/:partnerId` — send a message. Inserts message row; triggers Supabase Realtime broadcast on `messages:{listingId}:{userId}`.

`PATCH /api/messages/:listingId/:partnerId/read` — mark all unread messages in the thread as read (`read_at = now()`).

RLS enforces that only thread participants can read or write.

**Gamification — points, rewards, and badges**

`GET /api/user/points` — current user's points total and recent events.
Returns `{ total_points, recent_events: PointsEvent[] }` (capped at 20 most recent).

`GET /api/user/achievements` — earned and locked badges for the authenticated user.
Returns `{ earned: Achievement[], locked: Achievement[] }`.

`GET /api/leaderboard` — top 20 students ranked by points earned in the current calendar month. **(tier-2 cuttable)**
Computed from `point_transactions` filtered by `created_at >= start_of_month`.
Returns `{ leaderboard: { rank, display_name, avatar_url, monthly_points }[] }`.

`GET /api/rewards` — list active campus rewards. **(tier-1 stretch)**
Returns `{ rewards: Reward[] }` from `rewards`.

`POST /api/rewards/redemptions` — create a reward redemption. **(tier-1 stretch)**
Body: `{ reward_id, points_to_spend }`. Validates sufficient balance, deducts atomically through `point_transactions`, inserts `reward_redemptions` row with generated one-time code.
Returns `{ redemption_id, code, vendor_name, expires_at }`. Idempotency key prevents double-spend on retry. Redemption code generation uses `crypto.randomUUID()` prefixed with vendor short-code.

`GET /api/rewards/redemptions` — list user's reward redemption history.

### Points engine — `lib/points/engine.ts` (cut-floor)

Exports `awardPoints(event: PointsEvent): Promise<void>`. Inserts to `point_transactions`, increments `user_points.points` via atomic upsert, then runs a derived badge check. Not called directly by the client — called internally by `POST /api/listings/:id/complete` and by the repair verdict route on `case.verdict_complete`.

Point values by trigger:

| Internal event | Trigger | Points awarded |
|---|---|---|
| `listing.completed` with `type = sale` | Seller completes sale | +50 to seller |
| `listing.completed` with `type = trade` | Trade marked complete | +40 to each party |
| `listing.completed` with `type = free` | Item given away | +20 to giver |
| `case.verdict_complete` | Repair verdict ready | +30 to case owner |

Badge checks run after every `awardPoints` call. When a user's cumulative points or action count crosses a badge threshold, the API response reports that badge as earned; no badge table is part of the canonical contract.

### Achievement badge milestones

Badge definitions are static config (not DB rows):

| Badge | Unlock condition |
|---|---|
| First Item Recirculated | 1 listing completed (any type) |
| 5 Items Traded | 5 trade-type listings completed |
| Repair Veteran | 3 repair verdicts received |
| Green Champion | 500 total points |
| Campus Hero | 1000 total points |
| Zero Waste Pioneer | 20 total listings completed (any type) |

### Reward vendor stub data

Seed these rows in `rewards` until a DB-backed admin panel exists:

```ts
export const VENDORS = [
  {
    id: "panda-express",
    name: "Panda Express",
    campus_location: "BroncoStudent Center",
    discount_per_100pts: "$2.00 off",
  },
  {
    id: "pony-express",
    name: "Pony Express",
    campus_location: "Various campus locations",
    discount_per_100pts: "$1.50 off",
  },
] as const;
```

### SF-4 extension — marketplace types

When `F-api-listings`, `POST /api/listings/:id/complete`, `F-api-messages` (per-thread routes), `GET /api/user/points`, `GET /api/leaderboard`, and reward routes all ship, add their request/response types to `lib/types/api.ts` and post an addendum SHA in the `FREEZE SF-4` thread. Do not re-lock SF-4; append to it.

## 10. Raise a flag when… (marketplace additions)

- `POST /api/listings/:id/complete` fires but `lib/points/engine.ts` hasn't shipped — stub with a `console.warn` log and coordinate immediately; this breaks the rewards demo loop.
- Two concurrent `POST /api/listings/:id/complete` calls both succeed — add status guard and unique constraint on the `marketplace_orders.listing_id` completion path.
- Redemption deduct and insert are not atomic — use a Postgres transaction or Supabase RPC; partial deduction without a code is a data integrity bug.
- Badge derivation silently throws inside `awardPoints` — wrap in try/catch and log; never let a badge failure roll back a points award.
