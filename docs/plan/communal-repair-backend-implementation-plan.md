# Communal Repair Backend Implementation Plan

Date: 2026-04-25  
Scope: backend planning only for Communal Repair, built on the Agent Council Diagnose backend plan.  
Primary app: `bronco-repair-desk/` Next.js 16 App Router.

## Grounding Notes

This plan is based on:

- `BroncoHacks Planning.md`
- `docs/plan/platform-feature-contracts.md`
- `docs/plan/architecture.md`
- `docs/plan/agent-council-backend-implementation-metaprompt.md`
- `docs/roles/platform.md`
- `docs/roles/integration.md`
- `docs/roles/agents.md`
- `docs/roles/frontend.md`
- `bronco-repair-desk/package.json`
- Existing `bronco-repair-desk/app/**` and `components/**`

Current implementation state: the app is mostly static UI. `bronco-repair-desk/lib/**`, `hooks/**`, and `tests/**` do not exist yet. The existing `/messages` route is marketplace-flavored static UI, so this backend plan owns only shared conversation APIs and helper-request messaging contracts, not a UI rewrite.

`docs/plan/platform-feature-contracts.md` is authoritative for table names and feature boundaries.

## Planning Approach Chosen

Three implementation shapes were considered:

| Approach | Trade-off |
|---|---|
| Reuse `helper_requests` only and represent sign-ups as messages | Fastest schema, but offer status, accept/decline, withdrawal, and tests become ambiguous. |
| Create a full marketplace-like bid/order model for helpers | Overbuilt and violates the feature boundary by recreating Marketplace concepts. |
| Extend `helper_requests` and add `helper_request_offers` | Smallest reliable model for structured helper sign-ups while keeping messaging in shared conversation tables. |

Use the third approach. It adds one explicit offer lifecycle table, keeps all board state under Diagnose/Communal Repair, and uses shared `conversations`/`messages` only for private coordination.

## Product Intent And Boundaries

Communal Repair turns a private Agent Council Diagnose result into a public campus help request. A student can publish a repair request from a completed or in-progress case verdict, preserve the original diagnosis/verdict/action-plan context, receive structured helper offers, coordinate in case-scoped messages, and close the request as resolved, cancelled, expired, or no-helper-found.

This is not Marketplace. Do not implement or require:

- `marketplace_listings`
- `marketplace_media`
- `marketplace_bids`
- `marketplace_orders`
- listing browse/create/detail APIs
- listing-scoped messaging
- selling, trading, free giveaways, payment, or order flows

Marketplace may link to cases later through its own feature boundary, but Communal Repair starts from Diagnose tables and uses shared messaging tables only for case/helper coordination.

## Communal Repair User Flows

### Flow 1: Escalate Verdict To Public Request

1. Student completes or receives an Agent Council Diagnose case.
2. Frontend calls `POST /api/cases/[id]/helper-request`.
3. API verifies the caller owns `cases.id`.
4. API reads the current run and latest `diagnoses`, `verdicts`, `action_plans`, and existing `helper_requests`.
5. API inserts one `helper_requests` row with a snapshot of board-facing request fields and links it to `case_id`, `run_id`, and `user_id`.
6. API emits a `case_events` row with `phase='helper_routing'`, `status='complete'`, and `payload.kind='helper_request_created'`.
7. Request appears on `GET /api/helper-requests`.

### Flow 2: Browse Public Board

1. Any authenticated campus user calls `GET /api/helper-requests`.
2. API returns open/active requests with filters for status, category, urgency, campus area, skill tags, and search.
3. Board rows include enough context for scanning, but not private case messages or raw media paths.

### Flow 3: Helper Offers Help

1. Helper opens `GET /api/helper-requests/[id]`.
2. Helper calls `POST /api/helper-requests/[id]/offers` with offer text, availability, skills, and optional `technician_profile_id`.
3. API inserts `helper_request_offers`.
4. Request owner can see pending offers on detail.
5. API emits a `case_events` row with `payload.kind='helper_offer_created'`.

### Flow 4: Owner Accepts Or Declines Offer

1. Owner calls `PATCH /api/helper-requests/[id]/offers/[offerId]` with `action='accept'` or `action='decline'`.
2. API verifies owner controls the parent `helper_requests.user_id`.
3. Accepting sets the chosen offer to `accepted`, optionally declines competing offers, sets `helper_requests.status='helper_accepted'`, and creates/resumes a case-scoped conversation.
4. Declining sets only that offer to `declined`.
5. Helper may call the same route with `action='withdraw'` for their own pending offer.

### Flow 5: Coordinate In Case-Scoped Conversation

1. Owner or accepted/pending helper calls `POST /api/helper-requests/[id]/conversation`.
2. API creates or resumes a shared `conversations` row with `case_id` and `helper_request_id`.
3. API ensures `conversation_participants` contains the request owner and helper.
4. Participants use `GET /api/conversations`, `GET /api/conversations/[id]/messages`, and `POST /api/conversations/[id]/messages`.
5. Non-participants receive `404` or `403` and cannot read private messages.

### Flow 6: Close Request

1. Owner calls `PATCH /api/helper-requests/[id]`.
2. Valid terminal statuses: `resolved`, `cancelled`, `expired`, `no_helper_found`.
3. Optional hooks can award points or open ratings, but this plan keeps those hooks separate from Marketplace.

## DB Contract

### Existing Diagnose Tables Used

| Table | Communal Repair use |
|---|---|
| `cases` | Source case and owner boundary. |
| `case_media` | Detail can expose safe media summaries or signed image URLs later. |
| `case_runs` | Current run, `run_id` snapshot source. |
| `case_messages` | Diagnose follow-up history only; not public board chat. |
| `case_events` | Emits helper request and helper offer lifecycle events. |
| `diagnoses` | Context: causes, confidence, missing evidence, safety flags. |
| `verdicts` | Context: RRR score, label, cost band, rationale, uncertainty note. |
| `action_plans` | Context: safe next steps, technician questions, helper template. |
| `helper_requests` | Public campus repair/help request attached to a case. |
| `category_reference` | Public category labels, safety warning copy, filter categories. |

### Shared Tables Used

| Table | Communal Repair use |
|---|---|
| `technician_profiles` | Optional helper profile, skills, aggregate rating. |
| `conversations` | Case-scoped helper/owner thread container. |
| `conversation_participants` | Participant authorization boundary. |
| `messages` | Private coordination messages. |
| `user_ratings` | Optional post-resolution rating hook. |
| `user_points` | Optional points balance read/write target. |
| `point_transactions` | Optional points ledger hook. |

### Additive Schema Decision

Add `helper_request_offers`.

Justification: `helper_requests`, `technician_profiles`, `conversations`, and `messages` cannot cleanly represent structured multi-helper sign-up state. Chat messages can say "I can help", but they do not support deterministic pending/accepted/declined/withdrawn status, owner-only accept/decline actions, board filters like "has offers", or smoke tests for offer lifecycle. A small explicit table keeps lifecycle state queryable and avoids polluting Marketplace bid/order concepts.

### `helper_requests` Required Shape

If the Agent Council implementation has not frozen `helper_requests`, create it with the fields below. If it already exists in the minimal stretch shape from the spec, apply an additive migration to add missing columns and widen the status check.

```sql
-- Existing canonical Diagnose table, extended for Communal Repair.
create table helper_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  run_id uuid references case_runs(id) on delete set null,
  user_id uuid not null references auth.users(id),

  title text not null,
  public_summary text not null,
  helper_request_template text,
  category text not null,
  urgency text not null default 'normal',
  campus_area text,
  preferred_time text,
  skill_tags jsonb not null default '[]',
  safety_flags jsonb not null default '[]',

  status text not null default 'open'
    check (status in (
      'draft',
      'open',
      'helper_offered',
      'helper_accepted',
      'in_progress',
      'resolved',
      'cancelled',
      'expired',
      'no_helper_found'
    )),

  diagnosis_snapshot jsonb not null default '{}',
  verdict_snapshot jsonb not null default '{}',
  action_plan_snapshot jsonb not null default '{}',

  accepted_offer_id uuid,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index helper_requests_board_idx
  on helper_requests(status, category, created_at desc);
create index helper_requests_case_idx
  on helper_requests(case_id);
create index helper_requests_owner_idx
  on helper_requests(user_id, created_at desc);
```

Snapshot rule: store board-safe copies of the diagnosis/verdict/action-plan at publish time so the public board remains stable even if the owner reruns the case. Detail routes may also include `latest_case_context` from current Diagnose outputs for owners and participants, but the public board reads the snapshot.

### `helper_request_offers` New Table

```sql
create table helper_request_offers (
  id uuid primary key default gen_random_uuid(),
  helper_request_id uuid not null references helper_requests(id) on delete cascade,
  helper_user_id uuid not null references auth.users(id),
  technician_profile_id uuid references technician_profiles(id) on delete set null,

  offer_message text not null,
  availability text,
  skill_tags jsonb not null default '[]',
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','withdrawn')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(helper_request_id, helper_user_id)
);

create index helper_request_offers_request_idx
  on helper_request_offers(helper_request_id, status, created_at desc);
create index helper_request_offers_helper_idx
  on helper_request_offers(helper_user_id, created_at desc);
```

### Conversation Table Extensions

The platform contract allows `conversations.case_id` and `conversations.listing_id`. Add the smallest community fields if not present:

```sql
alter table conversations
  add column if not exists case_id uuid references cases(id) on delete cascade,
  add column if not exists helper_request_id uuid references helper_requests(id) on delete cascade,
  add column if not exists helper_request_offer_id uuid references helper_request_offers(id) on delete cascade,
  add column if not exists conversation_type text not null default 'case_helper'
    check (conversation_type in ('case_helper','listing'));

create unique index conversations_helper_offer_pair_idx
  on conversations(helper_request_offer_id)
  where helper_request_offer_id is not null;
```

Do not create listing-scoped conversations in this phase. Conversation privacy is per helper offer, not per public request, so multiple pending helpers never share a thread with each other.

## Public Board Read Model

Create a repository query or SQL view named `community_helper_request_cards` if the DB lane wants stable board reads:

```sql
select
  hr.id,
  hr.case_id,
  hr.title,
  hr.public_summary,
  hr.category,
  hr.urgency,
  hr.campus_area,
  hr.preferred_time,
  hr.skill_tags,
  hr.safety_flags,
  hr.status,
  hr.verdict_snapshot->>'label' as verdict_label,
  (hr.verdict_snapshot->>'rrr_score')::numeric as rrr_score,
  count(hro.id) filter (where hro.status = 'pending') as pending_offer_count,
  hr.created_at,
  hr.updated_at
from helper_requests hr
left join helper_request_offers hro on hro.helper_request_id = hr.id
group by hr.id;
```

The API can implement this as a query function instead of a DB view for the 24-hour MVP.

## API Contract

All routes are under `bronco-repair-desk/app/api/**`. Use Next.js App Router route handlers. All request bodies and responses are Zod-validated.

### `POST /api/cases/[id]/helper-request`

Purpose: escalate an Agent Council case/verdict into Communal Repair.

Auth: case owner only.

Request:

```ts
{
  title?: string;
  public_summary?: string;
  campus_area?: string;
  preferred_time?: string;
  skill_tags?: string[];
  expires_at?: string;
}
```

Behavior:

- Require `cases.id` exists and belongs to caller.
- Require a current `case_runs` row with at least one of `diagnoses`, `verdicts`, or `action_plans`.
- Default `title` from case title/category.
- Default `public_summary` from action plan `helper_request_template` or case symptoms.
- Insert or return existing non-terminal `helper_requests` for the case unless `forceNew` is explicitly added later.
- Snapshot diagnosis/verdict/action plan into JSON columns.
- Emit `case_events` with `payload.kind='helper_request_created'`.

Response:

```ts
{
  helper_request: HelperRequestDetail;
  created: boolean;
}
```

### `GET /api/helper-requests`

Purpose: public/community board list.

Auth: authenticated users. Demo mode may use a deterministic local user.

Query params:

```ts
{
  status?: "open" | "helper_offered" | "helper_accepted" | "in_progress";
  category?: "laptop" | "bicycle" | "e_scooter" | "mini_fridge";
  urgency?: "low" | "normal" | "urgent";
  campus_area?: string;
  skill?: string;
  q?: string;
  mine?: "owner" | "helper";
  limit?: string;
  cursor?: string;
}
```

Response:

```ts
{
  items: HelperRequestCard[];
  page: { next_cursor: string | null; limit: number; };
}
```

### `GET /api/helper-requests/[id]`

Purpose: full request detail with linked case summary and verdict/action-plan context.

Auth:

- Any authenticated user can read public request fields and snapshots.
- Owner and conversation participants can read offer details and private conversation metadata.

Response:

```ts
{
  helper_request: HelperRequestDetail;
  case_summary: CasePublicSummary;
  diagnosis_context: DiagnosisSnapshot;
  verdict_context: VerdictSnapshot;
  action_plan_context: ActionPlanSnapshot;
  offers?: HelperRequestOffer[];
  conversation?: ConversationSummary | null;
  permissions: {
    is_owner: boolean;
    can_offer: boolean;
    can_message: boolean;
    can_close: boolean;
  };
}
```

### `PATCH /api/helper-requests/[id]`

Purpose: owner updates mutable public fields or status.

Auth: request owner only.

Request:

```ts
{
  title?: string;
  public_summary?: string;
  campus_area?: string | null;
  preferred_time?: string | null;
  skill_tags?: string[];
  status?: "open" | "in_progress" | "resolved" | "cancelled" | "expired" | "no_helper_found";
}
```

Rules:

- Do not allow helpers to mutate parent request.
- Do not reopen terminal statuses in MVP.
- `resolved`, `cancelled`, `expired`, and `no_helper_found` are terminal.
- `in_progress` requires an accepted offer unless owner explicitly coordinates offline via a later flag.

Response:

```ts
{ helper_request: HelperRequestDetail; }
```

### `POST /api/helper-requests/[id]/offers`

Purpose: helper signs up or offers help.

Auth: authenticated non-owner user. Owners cannot offer on their own request.

Request:

```ts
{
  offer_message: string;
  availability?: string;
  skill_tags?: string[];
  technician_profile_id?: string;
}
```

Rules:

- Parent request must be `open` or `helper_offered`.
- One active row per helper/request via unique constraint.
- If prior offer is `withdrawn`, implementation may update it back to `pending`; plan this as an upsert path.
- Set parent `helper_requests.status='helper_offered'` when first pending offer appears.
- Emit `case_events` with `payload.kind='helper_offer_created'`.

Response:

```ts
{ offer: HelperRequestOffer; helper_request_status: HelperRequestStatus; }
```

### `PATCH /api/helper-requests/[id]/offers/[offerId]`

Purpose: owner accepts/declines, or helper withdraws.

Auth:

- Owner may `accept` or `decline`.
- Offer author may `withdraw`.

Request:

```ts
{ action: "accept" | "decline" | "withdraw"; }
```

Rules:

- `accept` requires parent status not terminal.
- Accepting sets selected offer to `accepted`, parent `accepted_offer_id`, and parent `status='helper_accepted'`.
- MVP may leave competing offers as `pending`; preferred implementation auto-declines competing offers with `status='declined'` to make state deterministic.
- `withdraw` is allowed only from `pending`; if accepted helper withdraws, owner must close or reopen in a later phase.
- Accept creates or resumes a helper conversation.
- Emit `case_events` with `payload.kind='helper_offer_accepted' | 'helper_offer_declined' | 'helper_offer_withdrawn'`.

Response:

```ts
{
  offer: HelperRequestOffer;
  helper_request: HelperRequestDetail;
  conversation?: ConversationSummary;
}
```

### `POST /api/helper-requests/[id]/conversation`

Purpose: creates or resumes a case-scoped conversation.

Auth:

- Owner can open with an accepted or pending helper by passing `offer_id`.
- Helper can open only if they have a pending or accepted offer.

Request:

```ts
{ offer_id?: string; initial_message?: string; }
```

Behavior:

- Resolve `offer_id` from the request body or from `helper_requests.accepted_offer_id`.
- Upsert one `conversations` row per `helper_request_offer_id`.
- Add owner and helper to `conversation_participants`.
- If `initial_message` exists, insert it into `messages`.

Response:

```ts
{ conversation: ConversationSummary; }
```

### `GET /api/conversations`

Purpose: returns user's case/helper conversations.

Auth: participant only.

Query params:

```ts
{ type?: "case_helper"; limit?: string; cursor?: string; }
```

Response:

```ts
{
  items: ConversationSummary[];
  page: { next_cursor: string | null; limit: number; };
}
```

### `GET /api/conversations/[id]/messages`

Purpose: returns messages for a participant.

Auth: participant only.

Query params:

```ts
{ limit?: string; before?: string; }
```

Response:

```ts
{
  conversation: ConversationSummary;
  messages: MessageDTO[];
  page: { next_cursor: string | null; limit: number; };
}
```

### `POST /api/conversations/[id]/messages`

Purpose: sends a message.

Auth: participant only.

Request:

```ts
{ body: string; client_id?: string; }
```

Rules:

- Body trimmed length: 1 to 2000 chars.
- Optional `client_id` supports idempotent retries if the messages table adds a unique key later.
- Only participants can insert.

Response:

```ts
{ message: MessageDTO; }
```

## TypeScript And Zod Contract

Create these files in the contracts lane:

| File | Responsibility |
|---|---|
| `bronco-repair-desk/lib/types/community/helper-requests.ts` | Shared TS types for helper requests/offers. |
| `bronco-repair-desk/lib/types/community/conversations.ts` | Shared TS types for conversations/messages. |
| `bronco-repair-desk/lib/types/community/api.ts` | Route request/response types. |
| `bronco-repair-desk/lib/types/community/index.ts` | Barrel exports. |
| `bronco-repair-desk/lib/schemas/community/helper-requests.ts` | Zod schemas for helper request route bodies/query params. |
| `bronco-repair-desk/lib/schemas/community/conversations.ts` | Zod schemas for conversation route bodies/query params. |
| `bronco-repair-desk/tests/fixtures/community.ts` | Deterministic Communal Repair fixtures. |

Core unions:

```ts
export const helperRequestStatusValues = [
  "draft",
  "open",
  "helper_offered",
  "helper_accepted",
  "in_progress",
  "resolved",
  "cancelled",
  "expired",
  "no_helper_found",
] as const;

export const helperOfferStatusValues = [
  "pending",
  "accepted",
  "declined",
  "withdrawn",
] as const;
```

Zod packages are not currently installed. Add `zod` in the contracts or API lane before route implementation.

## Event Contract

Communal Repair consumes existing Agent Council outputs and emits lifecycle events through `case_events`.

Do not create a new event table.

Event variants:

```ts
type CommunalRepairEvent =
  | {
      phase: "helper_routing";
      status: "complete";
      payload: {
        payload_version: 1;
        kind: "helper_request_created";
        helper_request_id: string;
      };
    }
  | {
      phase: "helper_routing";
      status: "running" | "complete";
      payload: {
        payload_version: 1;
        kind:
          | "helper_offer_created"
          | "helper_offer_accepted"
          | "helper_offer_declined"
          | "helper_offer_withdrawn";
        helper_request_id: string;
        offer_id: string;
      };
    }
  | {
      phase: "helper_routing";
      status: "complete";
      payload: {
        payload_version: 1;
        kind:
          | "helper_request_resolved"
          | "helper_request_cancelled"
          | "helper_request_expired"
          | "helper_request_no_helper_found";
        helper_request_id: string;
      };
    };
```

Event writes are for audit/timeline. The source of truth for board state is `helper_requests` and `helper_request_offers`.

## Repository And Service Boundaries

Create focused modules instead of catch-all files.

| File | Owner lane | Responsibility |
|---|---|---|
| `lib/db/community/helper-request-repository.ts` | DB/Persistence | CRUD for `helper_requests`, board queries, snapshot reads. |
| `lib/db/community/helper-offer-repository.ts` | DB/Persistence | CRUD/status transitions for `helper_request_offers`. |
| `lib/db/community/conversation-repository.ts` | Messaging | Conversation participant and message queries. |
| `lib/services/community/helper-request-service.ts` | API | Escalation, owner update, close lifecycle, event emission. |
| `lib/services/community/helper-offer-service.ts` | API | Offer create/accept/decline/withdraw lifecycle. |
| `lib/services/community/conversation-service.ts` | Messaging | Create/resume case helper conversations, participant enforcement. |
| `lib/services/community/context-snapshot.ts` | API | Build board-safe snapshots from Diagnose outputs. |
| `lib/api/community.ts` | Frontend Wiring | Future typed fetch client for hooks/UI. |
| `hooks/useHelperRequests.ts` | Frontend Wiring | Future board data hook. |
| `hooks/useCaseConversations.ts` | Frontend Wiring | Future messaging hook. |

API route handlers should validate input, resolve auth, call services, and return responses. They should not contain SQL or lifecycle business rules.

## Auth And RLS Expectations

### Demo Auth Strategy

The app has no auth implementation today. For local/demo work:

- Use `DEMO_USER_ID=00000000-0000-4000-8000-000000000001`.
- Use `DEMO_HELPER_USER_ID=00000000-0000-4000-8000-000000000002`.
- Wrap auth access in `lib/auth/current-user.ts`.
- Keep all `user_id` fields and repository signatures compatible with Supabase Auth.

### RLS Policy Intent

| Table | Read | Insert | Update |
|---|---|---|---|
| `helper_requests` | All authenticated users for public fields. Owner for private owner metadata. | Case owner only. | Owner only. |
| `helper_request_offers` | Request owner and offer author. Public detail may expose aggregate counts only. | Authenticated non-owner helper. | Owner accepts/declines; offer author withdraws. |
| `conversations` | Participants only. | Server/service path only. | Server/service path only. |
| `conversation_participants` | Participant rows for current user. | Server/service path only. | Server/service path only. |
| `messages` | Participants only through conversation membership. | Participants only. | Sender or server path for read markers if implemented. |

Non-participants must not read private messages or offer details.

## Messaging Model

Use shared `conversations`, `conversation_participants`, and `messages`.

Conversation scope:

- `conversations.case_id` links to the original repair case.
- `conversations.helper_request_id` links to the Communal Repair request.
- `conversations.helper_request_offer_id` links to one helper offer and keeps pre-acceptance threads private.
- `conversations.listing_id` remains null in this feature.
- `conversation_type='case_helper'`.

Participant rules:

- Owner is always a participant.
- Accepted helper is always a participant.
- Pending helpers may be participants if owner or helper starts a conversation before acceptance.
- Other users cannot discover message contents through list or detail APIs.

Message metadata:

- `messages.body`: text content.
- `messages.sender_user_id`: current user.
- `messages.conversation_id`: parent.
- Optional future fields: `read_at`, `client_id`, `attachment_refs`.

## Helper Sign-Up And Offer Lifecycle

Allowed transitions:

```text
helper_requests:
draft -> open
open -> helper_offered
helper_offered -> helper_accepted
helper_accepted -> in_progress
open/helper_offered/helper_accepted/in_progress -> resolved
open/helper_offered/helper_accepted/in_progress -> cancelled
open/helper_offered -> expired
open/helper_offered -> no_helper_found

helper_request_offers:
pending -> accepted
pending -> declined
pending -> withdrawn
```

Rules:

- Owner cannot create an offer for their own request.
- Helper cannot create a second pending offer for the same request.
- Owner can accept only one offer for MVP.
- Accepting an offer creates or resumes the case-scoped conversation.
- Terminal request statuses block new offers and new messages unless the requester reopens in a later phase. Reopen is cut from MVP.

## Agent Council Context Snapshot

`POST /api/cases/[id]/helper-request` snapshots:

- `diagnoses.top_causes`, `confidence`, `missing_evidence`, `safety_flags`
- `verdicts.rrr_score`, `rrr_breakdown`, `label`, `rationale`, `uncertainty_note`, repair/replacement cost fields
- `action_plans.steps`, `technician_questions`, `helper_request_template`, `safety_preamble`
- `cases.category`, `title`, `symptoms`, `urgency`

Public board cards should not expose raw `case_messages`, internal `raw_response`, or private owner identifiers beyond display-safe profile fields.

Detail route may include:

- `snapshot_context`: what was published.
- `latest_case_context`: current Diagnose outputs, owner/participant only.

## Points And Rating Hooks Optional

Keep these hooks optional and separate from Marketplace.

Potential point events:

| Trigger | Ledger target | Notes |
|---|---|---|
| Helper request published | `point_transactions` | Optional low-value participation event. |
| Helper request resolved | `point_transactions` | Award owner for repair completion. |
| Accepted helper contributed | `point_transactions` | Award accepted helper only after owner marks resolved. |

Potential rating event:

- After `helper_requests.status='resolved'`, owner may rate accepted helper through `user_ratings.case_id`.
- Do not require ratings for close.
- Do not use `marketplace_orders` or listing IDs.

## Deterministic Local Demo Data

Create `tests/fixtures/community.ts` and `scripts/seed-community-demo.ts`.

Seed IDs:

```text
owner_user_id: 00000000-0000-4000-8000-000000000001
helper_user_id: 00000000-0000-4000-8000-000000000002
second_helper_user_id: 00000000-0000-4000-8000-000000000003
case_id: 84920000-0000-4000-8000-000000000001
run_id: 84920000-0000-4000-8000-000000000101
helper_request_id: 84920000-0000-4000-8000-000000000201
offer_id: 84920000-0000-4000-8000-000000000301
conversation_id: 84920000-0000-4000-8000-000000000401
```

Required seeded scenarios:

- MacBook Flexgate case with current diagnosis, verdict, action plan, safety context, and helper request template.
- Open helper request with zero offers.
- Open helper request with one pending offer.
- Accepted offer with owner/helper conversation and two messages.
- Terminal resolved request for rating/points smoke hooks.

Local demo must work with no external network and no Gemini key. Community APIs should read seeded data directly; no AI calls are needed for Communal Repair.

## Parallel Work Lanes

Use project-local `.worktrees/` only if it is gitignored. This workspace is not currently a git repository at the root, so the commands below assume implementation happens from the actual git repo root once initialized or moved. If `.worktrees/` is not ignored, use `~/.config/superpowers/worktrees/bronco-repair-desk/`.

| Lane | Branch | Worktree path | Owns | Must Not Touch | Depends on |
|---|---|---|---|---|---|
| Contracts | `communal-repair-contracts` | `.worktrees/communal-repair-contracts` | `lib/types/community/**`, `lib/schemas/community/**`, `tests/fixtures/community.ts` | API routes, DB internals, UI pages | none |
| DB/Persistence | `communal-repair-db` | `.worktrees/communal-repair-db` | `lib/db/community/**`, migration/schema notes, repository tests, seed script | UI, agent internals, Marketplace routes | Contracts |
| API | `communal-repair-api` | `.worktrees/communal-repair-api` | `app/api/cases/[id]/helper-request/**`, `app/api/helper-requests/**`, service files, API tests | UI pages, DB SQL internals | Contracts, DB |
| Messaging | `communal-repair-messaging` | `.worktrees/communal-repair-messaging` | `app/api/conversations/**`, `lib/db/community/conversation-repository.ts`, `lib/services/community/conversation-service.ts`, message tests | Marketplace routes, helper offer lifecycle except conversation handoff | Contracts, DB |
| Frontend Wiring | `communal-repair-frontend-wiring` | `.worktrees/communal-repair-frontend-wiring` | `lib/api/community.ts`, `hooks/useHelperRequests.ts`, `hooks/useCaseConversations.ts` | DB, agents, API route handlers | Contracts, API |
| E2E/Smoke | `communal-repair-e2e` | `.worktrees/communal-repair-e2e` | `tests/e2e/community-repair.spec.ts`, `scripts/smoke-community-repair.ts`, test docs | Product files unless fixing integration | API, Messaging |

## Worktree Commands

From repo root:

```bash
mkdir -p .worktrees
git worktree add .worktrees/communal-repair-contracts -b communal-repair-contracts
git worktree add .worktrees/communal-repair-db -b communal-repair-db
git worktree add .worktrees/communal-repair-api -b communal-repair-api
git worktree add .worktrees/communal-repair-messaging -b communal-repair-messaging
git worktree add .worktrees/communal-repair-frontend-wiring -b communal-repair-frontend-wiring
git worktree add .worktrees/communal-repair-e2e -b communal-repair-e2e
```

Baseline in each worktree:

```bash
cd bronco-repair-desk
npm install
npm run lint
npm run build
```

If dependencies are already installed in the main tree, run `npm ci` only in lanes that add packages.

## Merge Order

1. `communal-repair-contracts`
2. `communal-repair-db`
3. `communal-repair-messaging`
4. `communal-repair-api`
5. `communal-repair-frontend-wiring`
6. `communal-repair-e2e`

Integration checkpoints:

- After Contracts: `npm run lint` and TypeScript import smoke for community schemas.
- After DB: repository tests pass against seeded local/demo store.
- After Messaging: non-participant read test passes.
- After API: required route smoke checks pass by script.
- After Frontend Wiring: no page behavior regression; static pages still build.
- After E2E: full Communal Repair smoke suite passes with no network and no Gemini key.

## Conflict-Risk Notes

High-risk shared files:

- `package.json` and `package-lock.json` if adding `zod`, test tools, or DB clients.
- `lib/types/**` if Agent Council backend work lands at the same time.
- `lib/db/migrations/**` if Agent Council Diagnose migrations are still in flight.
- `app/api/conversations/**` if Marketplace messaging begins in parallel.

Mitigations:

- Contracts lane publishes community types first.
- DB lane must not rename canonical Diagnose or shared tables.
- Messaging lane must keep `listing_id` nullable and untouched.
- API lane consumes repository/service contracts; it does not edit migration files.
- Marketplace route work pauses before touching shared `conversations`, `conversation_participants`, or `messages` until Communal Repair participant rules are merged.

## Implementation Checklist

### Contracts Lane

- [ ] Add `zod` dependency if no other lane has done so.
- [ ] Create `lib/types/community/helper-requests.ts`.
- [ ] Create `lib/types/community/conversations.ts`.
- [ ] Create `lib/types/community/api.ts`.
- [ ] Create `lib/types/community/index.ts`.
- [ ] Create `lib/schemas/community/helper-requests.ts`.
- [ ] Create `lib/schemas/community/conversations.ts`.
- [ ] Create `tests/fixtures/community.ts` with deterministic IDs and snapshots.
- [ ] Add schema parse tests for create helper request, create offer, patch offer, create conversation, send message.

### DB/Persistence Lane

- [ ] Add migration/schema notes for extending `helper_requests`.
- [ ] Add migration/schema notes for `helper_request_offers`.
- [ ] Add migration/schema notes for `conversations.case_id`, `conversations.helper_request_id`, and `conversation_type`.
- [ ] Create `lib/db/community/helper-request-repository.ts`.
- [ ] Create `lib/db/community/helper-offer-repository.ts`.
- [ ] Create `lib/db/community/conversation-repository.ts`.
- [ ] Create `scripts/seed-community-demo.ts`.
- [ ] Add repository tests for board list filters, request detail, offer lifecycle, and participant message reads.

### API Lane

- [ ] Create `lib/auth/current-user.ts` with Supabase-compatible demo fallback.
- [ ] Create `lib/services/community/context-snapshot.ts`.
- [ ] Create `lib/services/community/helper-request-service.ts`.
- [ ] Create `lib/services/community/helper-offer-service.ts`.
- [ ] Create `app/api/cases/[id]/helper-request/route.ts`.
- [ ] Create `app/api/helper-requests/route.ts`.
- [ ] Create `app/api/helper-requests/[id]/route.ts`.
- [ ] Create `app/api/helper-requests/[id]/offers/route.ts`.
- [ ] Create `app/api/helper-requests/[id]/offers/[offerId]/route.ts`.
- [ ] Create `app/api/helper-requests/[id]/conversation/route.ts`.
- [ ] Add API tests for owner-only escalation, public board list, offer create, accept/decline, terminal close, and Marketplace independence.

### Messaging Lane

- [ ] Create `lib/services/community/conversation-service.ts`.
- [ ] Create `app/api/conversations/route.ts`.
- [ ] Create `app/api/conversations/[id]/messages/route.ts`.
- [ ] Add tests for list conversations, read messages, send message, and non-participant denial.
- [ ] Ensure all messaging code filters by `conversation_participants`.

### Frontend Wiring Lane

- [ ] Create `lib/api/community.ts` typed client wrappers for all required routes.
- [ ] Create `hooks/useHelperRequests.ts`.
- [ ] Create `hooks/useCaseConversations.ts`.
- [ ] Do not rewrite existing pages in this phase unless needed for API smoke wiring.

### E2E/Smoke Lane

- [ ] Create `scripts/smoke-community-repair.ts`.
- [ ] Create `tests/e2e/community-repair.spec.ts` if Playwright is available.
- [ ] Add README section or script comments documenting no-network/no-Gemini mode.
- [ ] Run smoke suite after all lanes merge.

## Verification Checklist

- [ ] Seeded Agent Council case can create a helper request.
- [ ] Public board returns open helper requests.
- [ ] Board filters by category, urgency, status, and skill.
- [ ] Helper can offer help.
- [ ] Owner can accept an offer.
- [ ] Owner can decline an offer.
- [ ] Helper can withdraw a pending offer.
- [ ] Accepted helper and owner can exchange messages.
- [ ] Non-participants cannot read private messages.
- [ ] Owner can close as `resolved`.
- [ ] Owner can close as `cancelled`.
- [ ] Expiration path can mark stale request `expired`.
- [ ] No-helper path can mark request `no_helper_found`.
- [ ] Marketplace APIs/tables are not required for this flow.
- [ ] App builds with no external network and no Gemini key.

## Smoke-Test Scripts And API Checks

Create `scripts/smoke-community-repair.ts` to run against local route handlers or a dev server.

Expected flow:

```bash
cd bronco-repair-desk
npm run smoke:community-repair
```

If no package script exists yet, add:

```json
{
  "scripts": {
    "smoke:community-repair": "tsx scripts/smoke-community-repair.ts"
  }
}
```

Smoke checks:

```text
1. POST /api/cases/84920000-0000-4000-8000-000000000001/helper-request
   expect 200, helper_request.id present.

2. GET /api/helper-requests?status=open
   expect 200, created helper_request present.

3. GET /api/helper-requests/[id]
   expect 200, verdict_context.label and action_plan_context.helper_request_template present.

4. POST /api/helper-requests/[id]/offers as helper user
   expect 200, offer.status='pending'.

5. PATCH /api/helper-requests/[id]/offers/[offerId] as owner with action='accept'
   expect 200, offer.status='accepted', conversation.id present.

6. POST /api/conversations/[conversationId]/messages as owner
   expect 200, message.body echoed.

7. GET /api/conversations/[conversationId]/messages as helper
   expect 200, owner message visible.

8. GET /api/conversations/[conversationId]/messages as unrelated user
   expect 403 or 404.

9. PATCH /api/helper-requests/[id] as owner with status='resolved'
   expect 200, helper_request.status='resolved'.

10. Confirm smoke does not call /api/listings, marketplace tables, Gemini, or external network.
```

Manual `curl` shape:

```bash
curl -X POST http://localhost:3000/api/cases/84920000-0000-4000-8000-000000000001/helper-request \
  -H 'content-type: application/json' \
  -d '{"campus_area":"Engineering Meadow","preferred_time":"Weekday afternoon"}'

curl http://localhost:3000/api/helper-requests?status=open

curl -X POST http://localhost:3000/api/helper-requests/84920000-0000-4000-8000-000000000201/offers \
  -H 'content-type: application/json' \
  -d '{"offer_message":"I can help test the display cable and bring a toolkit.","availability":"Today after 4pm","skill_tags":["laptop","display"]}'
```

## Cut Lines For 24-Hour MVP

### Must Ship

- `POST /api/cases/[id]/helper-request`
- `GET /api/helper-requests`
- `GET /api/helper-requests/[id]`
- `PATCH /api/helper-requests/[id]`
- `POST /api/helper-requests/[id]/offers`
- `PATCH /api/helper-requests/[id]/offers/[offerId]`
- `POST /api/helper-requests/[id]/conversation`
- `GET /api/conversations`
- `GET /api/conversations/[id]/messages`
- `POST /api/conversations/[id]/messages`
- `helper_request_offers`
- Deterministic local seed and smoke script.
- Participant-only message reads.

### Can Defer

- Realtime for messages.
- Rich read receipts.
- Attachments in messages.
- Helper profile verification.
- Ratings UI/API.
- Points awards.
- Multiple simultaneous accepted helpers.
- Reopening terminal helper requests.
- Scheduled expiration job; use manual/scripted status patch for demo.

### Emergency 24-Hour Cut

If time is short, keep:

- Escalate case to helper request.
- Board list/detail.
- Single helper offer.
- Owner accept.
- Single conversation with owner/helper messages.
- Non-participant denial test.

Cut:

- Decline/withdraw UI wiring, but keep API status support if already implemented.
- Points/rating hooks.
- Expiration automation.
- Skill filtering beyond simple JSON contains.

## Done Definition

Communal Repair backend is done when the merged app can run locally with deterministic seed data, no network, and no Gemini key, then complete this path:

```text
seeded Diagnose case
-> helper request
-> public board
-> helper offer
-> owner accepts
-> case-scoped conversation
-> participant messages
-> non-participant denied
-> resolved close
```

No Marketplace table or API is required anywhere in that path.
