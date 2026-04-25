# Platform Feature Contracts

This is the canonical planning contract for the DB, API, and agent teams. If another planning doc conflicts with this file, this file wins until implementation creates a frozen migration or API artifact.

## Source Strategy

- **Diagnose schema:** the repair-desk planning docs are authoritative for Agent Council Diagnose tables and run semantics.
- **Marketplace, points, rewards, and community schema:** the ERD image is authoritative for table names.
- **Implementation state:** migrations have not shipped yet, so planning docs should use canonical names directly. Do not add migration compatibility aliases unless the team intentionally freezes them later.

## Product Feature Split

### Marketplace

Marketplace owns campus item exchange flows:

- Listing browse, create, detail, edit, archive, and completion.
- Listing media uploads.
- Bids and orders.
- Listing-scoped conversations.
- Marketplace-triggered point awards when a listing/order completes.

Marketplace tables:

| Table | Purpose |
|---|---|
| `marketplace_listings` | Sell, trade, free, and repair-needed item posts. Optional `case_id` links a listing to an Agent Council case when the post is based on a repair verdict. |
| `marketplace_media` | Listing photos and other listing media. |
| `marketplace_bids` | Monetary bids and trade/offer records scoped to a listing. |
| `marketplace_orders` | Completed or in-progress marketplace transactions. |

### Agent Council Diagnose

Agent Council Diagnose owns repair case intake and multi-agent diagnosis output:

- Case intake and case media.
- Multi-agent run control plane.
- Durable diagnosis, economics verdict, and action-plan output.
- Case event stream.
- Follow-up messages during a run.
- Helper/community repair requests attached to cases.

Diagnose tables:

| Table | Purpose |
|---|---|
| `cases` | User-owned repair case intake record. |
| `case_media` | Photos and media attached to a repair case. |
| `case_runs` | Run control plane: current run, phase, status, follow-up state, input snapshot. |
| `case_messages` | Case follow-up answers and diagnose-scoped message history. |
| `case_events` | Realtime event stream for orchestration phases and statuses. |
| `diagnoses` | Diagnosis agent output, one complete row per run. |
| `verdicts` | Economics/RRR output, one complete row per run. |
| `action_plans` | Action-plan output, including safety preamble. |
| `helper_requests` | Community repair/help request attached to a case. |
| `category_reference` | Repair category lookup data, cost bands, and safety warning copy. |

### Shared Community, Messaging, Points, And Rewards

Shared infrastructure supports both product features. Feature routes may use these tables, but no feature owns the table exclusively.

| Table | Purpose |
|---|---|
| `technician_profiles` | Community repair helper profile, skills, verification, and aggregate rating data. |
| `user_ratings` | Ratings for marketplace orders or repair case help. |
| `conversations` | Thread container. Optional `listing_id` scopes Marketplace threads; optional `case_id` scopes Diagnose/helper threads. |
| `conversation_participants` | Thread membership. |
| `messages` | Chat messages within a conversation. |
| `user_points` | Current points balance per user. |
| `point_transactions` | Append-only point ledger for awards and spends. |
| `rewards` | Campus reward catalog. |
| `reward_redemptions` | User reward redemption history and status. |

## Cross-Feature Links

- Community repair starts from Diagnose. A user requests help through `helper_requests`, and optional case-scoped `conversations` can coordinate the repair.
- Marketplace may link a listing to a case through `marketplace_listings.case_id` when a "Repair Needed" item should show an Agent Council verdict.
- `user_ratings.order_id` rates Marketplace transactions; `user_ratings.case_id` rates repair help.
- Both features award points by inserting `point_transactions` and updating `user_points`.

## API Ownership

| API area | Owning feature | Canonical tables |
|---|---|---|
| `POST /api/cases`, `GET/PATCH /api/cases/:id` | Agent Council Diagnose | `cases` |
| `POST /api/cases/:id/media` | Agent Council Diagnose | `case_media` |
| `POST /api/cases/:id/run`, `POST /api/cases/:id/runs/:runId/followup` | Agent Council Diagnose | `case_runs`, `case_messages`, `case_events`, `diagnoses`, `verdicts`, `action_plans` |
| `GET /api/cases/:id/current` | Agent Council Diagnose | `current_case_outputs` view over Diagnose tables |
| `POST /api/helpers` | Agent Council Diagnose | `helper_requests`, optionally `conversations`, `conversation_participants`, `messages` |
| `GET/POST /api/listings`, `GET/PATCH /api/listings/:id` | Marketplace | `marketplace_listings` |
| `POST /api/listings/:id/media` | Marketplace | `marketplace_media` |
| `POST/PATCH /api/listings/:id/bids` | Marketplace | `marketplace_bids` |
| `POST /api/listings/:id/complete` | Marketplace | `marketplace_orders`, `point_transactions`, `user_points` |
| `GET/POST/PATCH /api/messages` | Shared, called by feature routes | `conversations`, `conversation_participants`, `messages` |
| `GET /api/user/points`, `GET /api/leaderboard` | Shared rewards/points | `user_points`, `point_transactions` |
| `GET /api/rewards` | Shared rewards/points | `rewards` |
| `POST /api/rewards/redemptions`, `GET /api/rewards/redemptions` | Shared rewards/points | `reward_redemptions`, `point_transactions`, `user_points` |
| `GET /api/user/achievements` | Shared rewards/points | Derived from `point_transactions`; no `achievements` table in this contract. |

## Legacy Name Policy

The following names are stale planning aliases and should not appear in new schema snippets:

| Legacy alias | Canonical name |
|---|---|
| `listings` | `marketplace_listings` |
| `listing_media` | `marketplace_media` |
| `offers` / `trade_offers` | `marketplace_bids` |
| `completed_listings` | `marketplace_orders` |
| `points_events` / `user_point_events` | `point_transactions` |
| `redemptions` | `reward_redemptions` |
| `achievements` table | Derived badge state from `point_transactions`; no table. |
