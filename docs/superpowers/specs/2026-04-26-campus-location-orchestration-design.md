# Campus Location Parallel Orchestration Design

Date: 2026-04-26

## Purpose

Coordinate the Campus Location, Campus Map, Reverse Logistics, and Green Shuttle work so parallel agents can implement in separate git worktrees without drifting on shared data contracts or colliding in high-risk UI files.

The work proceeds in two stages:

1. Lock the contracts.
2. Fan out implementation worktrees from the locked commit.

## Current Repo Grounding

The refreshed repo is on `main` at `09f433fe` with only the root checkout registered as a worktree. The campus planning docs now exist:

- `docs/plan/campus-location-contract.md`
- `docs/plan/campus-map-ui.md`
- `docs/plan/campus-reverse-logistics-map.md`
- `docs/plan/reverse-logistics-routing.md`
- `docs/plan/green-shuttle-routing.md`
- `docs/plan/campus-location-accessibility.md`

The root checkout is dirty. Modified files include those six planning docs plus app, API, type, and agent files. Much of the diff appears to be line-ending churn, but it must be treated as user state and preserved. Do not start parallel implementation from ambiguous root dirt.

## Selected Approach

Use a two-stage fanout.

Stage 1 creates a contract-lock branch that edits planning docs only and resolves contradictions. Stage 2 creates implementation worktrees from the contract-lock commit.

This is preferred over direct implementation because the current docs disagree on authority order, shuttle estimates, reverse shuttle direction, and reverse-logistics output shape. Fanout before resolving those conflicts would cause workers to create incompatible modules.

## Stage 1: Contract Lock

Branch:

```text
feat/campus-location-contract-lock
```

Scope:

- Docs only.
- Resolve current contradictions.
- Produce one stable base commit for implementation worktrees.

Authority rules:

- `docs/plan/campus-location-contract.md` wins for data and API shapes.
- `docs/plan/campus-reverse-logistics-map.md` wins for orchestration, sequencing, worktree boundaries, and cut rules.
- `docs/plan/platform-feature-contracts.md` continues to win for Marketplace ownership and table/API naming.
- `docs/plan/architecture.md` continues to win for repo ownership, freeze protocol, and cut priority.

Frozen decisions:

- Preserve `pickupLocation: string` as the durable listing field.
- Add `pickupLocationId?: string` only as optional enrichment.
- Never require `pickupLocationId` in validators, UI forms, API bodies, seed data, tests, or migrations.
- Use the seven canonical campus location IDs from `campus-location-contract.md`.
- Use the richer `CampusLocation` shape with `name`, `types`, `campusArea`, `concept3d`, `directions`, `accessibilityNote`, and optional `sourceUrl`.
- Do not use the lighter `label`, `concept3dSlug`, or `CampusArea | "unknown"` variant from the shuttle doc.
- Use `8` ride minutes and `4` walk minutes for the V1 demo shuttle estimate.
- V1 shuttle cards render only for `village -> ilab-building-1-room-113` and `village -> student-services-building`.
- Reverse-direction shuttle trips return `recommended: false` unless a later branch explicitly adds reverse-direction copy.
- Use the richer `ReverseLogisticsRecommendation` result from `reverse-logistics-routing.md` as the public module output.
- Treat any simpler destination option shape as an internal nested option, not the public module result.
- Remove or revise claims that coordinates, aliases, or marker IDs are frozen unless the contract actually defines them.
- Do not invent coordinates, Concept3D marker IDs, official acceptance guarantees, ADA route guarantees, or live shuttle facts.

Stage 1 done criteria:

- The six campus docs agree on canonical shapes and authority.
- Worktree and branch ownership is explicit.
- All implementation agents can consume the docs without resolving contradictions themselves.
- The contract-lock commit SHA is recorded before Stage 2 starts.

## Stage 2: Implementation Fanout

Create implementation worktrees only after the contract-lock commit exists.

Recommended worktree map:

| Lane | Branch | Worktree path | Primary ownership |
|---|---|---|---|
| Campus location contract | `feat/campus-location-contract` | `.worktrees/feat-campus-location-contract` | `lib/campus/locations.ts`, `lib/campus/concept3d.ts`, tests |
| Reverse logistics routing | `feat/reverse-logistics-routing` | `.worktrees/feat-reverse-logistics-routing` | `lib/campus/reverse-logistics.ts`, tests |
| Green shuttle routing | `feat/green-shuttle-routing` | `.worktrees/feat-green-shuttle-routing` | `lib/campus/shuttle-routes.ts`, tests |
| Campus map UI | `feat/campus-map-ui` | `.worktrees/feat-campus-map-ui` | `app/campus-map/page.tsx`, `components/campus-map/**` |
| Campus location plan | `feat/campus-location-plan` | `.worktrees/feat-campus-location-plan` | accessibility, safety, picker behavior, fallback tests/components where assigned |
| Campus reverse logistics map | `feat/campus-reverse-logistics-map` | `.worktrees/feat-campus-reverse-logistics-map` | final integration composition and collision resolution |

Merge order:

1. `feat/campus-location-contract-lock`
2. `feat/campus-location-contract`
3. `feat/reverse-logistics-routing` and `feat/green-shuttle-routing` in parallel after location helpers land
4. `feat/campus-map-ui` and `feat/campus-location-plan` after shared helpers exist
5. `feat/campus-reverse-logistics-map` as the final integration pass

## Ownership Rules

- Only the location-contract branch creates or substantially edits `lib/campus/locations.ts` first.
- Only the shuttle branch owns `lib/campus/shuttle-routes.ts`.
- Only the reverse-logistics branch owns `lib/campus/reverse-logistics.ts`.
- UI workers import campus data from `lib/campus/**`; they must not duplicate hardcoded location IDs.
- Shuttle and reverse-logistics workers do not directly edit `MarketplaceDetailClient.tsx`.
- `MarketplaceDetailClient.tsx` is owned by the map UI or final integration branch for visible cards and CTAs.
- `app/create-listing/page.tsx` remains a high-risk file. Picker work must be surgical around step 2 and must preserve direct Supabase `pickup_location` behavior unless the assigned branch owns persistence.
- If the platform column is not ready, location picker UI can populate `pickupLocation` text and omit `pickupLocationId` persistence.

## Agent Handoff Template

Each worker prompt should include:

- Base commit SHA from the contract-lock commit.
- Branch name and worktree path.
- Owned files.
- Forbidden files.
- Canonical doc or docs to follow.
- Required tests.
- Merge prerequisite.
- Instruction to read relevant Next.js 16 docs in `node_modules/next/dist/docs/` before App Router code changes.
- Instruction not to make `pickupLocationId` required.
- Instruction not to duplicate campus constants outside `lib/campus/**`.
- Instruction not to claim live shuttle tracking, verified ADA routing, or official acceptance guarantees.

## Verification

Each worker runs focused tests for owned code and reports exactly what passed.

Shared verification targets:

```bash
npx tsc --noEmit
npm test
```

Attempt `npm run build` when practical. If it fails with the known Next/Turbopack sandbox port-binding issue, classify it as environment-limited only after typecheck and tests pass.

Required behavior checks:

- Existing listings with only `pickupLocation` still render and submit.
- Listings with known `pickupLocationId` can render enriched map, route, and shuttle context.
- Unknown or missing `pickupLocationId` never crashes create, edit, detail, or map flows.
- Reverse-logistics recommendations return the rich result shape with primary, alternatives, rule ID, confidence, explanation, and disclaimer.
- Shuttle recommendation returns the frozen non-null shape for both recommended and non-recommended cases.
- User-facing shuttle copy says estimate, not live ETA.
- User-facing accessibility copy does not claim verified ADA routes.
- User-facing destination copy does not claim official acceptance by a department or location.

## Done Criteria

The whole effort is done when:

- Campus docs agree on canonical contracts.
- Worktrees are created from a locked base commit.
- Each implementation branch owns a clear file set.
- Shared campus constants exist in one place.
- Marketplace text-location compatibility is preserved.
- Campus map, reverse logistics, and shuttle UI degrade to text fallbacks.
- Final integration preserves all worker outputs without duplicate models or conflicting copy.
