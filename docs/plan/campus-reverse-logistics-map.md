# Campus Reverse-Logistics Map + Green Shuttle Product Spec

Date: 2026-04-26  
Scope: umbrella product and coordination contract for Campus Map Reverse-Logistics + Green Shuttle.  
Primary app: `bronco-repair-desk/` Next.js 16 App Router.

## Grounding Notes

This document coordinates parallel worktrees for campus pickup/dropoff intelligence, map UI, reverse-logistics routing, shuttle route display, and accessibility. It is intentionally broader than any one subsystem doc.

Canonical companion docs:

| Doc | Purpose |
|---|---|
| `docs/plan/campus-location-contract.md` | Shared campus location IDs, display names, data/API shapes, Concept3D fallback behavior, and listing compatibility rules. |
| `docs/plan/campus-map-ui.md` | Map and location-selector UI behavior. |
| `docs/plan/reverse-logistics-routing.md` | Category-to-campus-destination routing rules. |
| `docs/plan/green-shuttle-routing.md` | Shuttle route model, demo estimates, and public-source boundaries. |
| `docs/plan/campus-location-accessibility.md` | Accessible labels, fallback list UI, keyboard flow, and non-map route summaries. |

Related existing platform docs:

- `docs/plan/platform-feature-contracts.md` remains authoritative for marketplace ownership and table naming.
- `docs/plan/architecture.md` remains authoritative for repo shape, folder ownership, and cut protocol.

## Product Intent And Boundaries

Campus Reverse-Logistics helps a CPP student move a repairable, reusable, or recyclable item to the right campus destination with the least friction. The student should not need to know whether an old router belongs with IT, iLab, Maker Studio, Bronco Tech, or a public meetup spot. The product recommends a destination, explains why, and shows a walk/shuttle path when useful.

Green Shuttle adds an environmental and convenience layer: when a recommended destination is campus-adjacent to an official Bronco Express stop, the UI can show a shuttle-assisted route. V1 is a demo-quality planning layer using hardcoded campus locations and public CPP shuttle information only.

This feature is additive to Marketplace. It does not replace listing pickup text, listing creation, listing status, bids, orders, points, or messages.

## Demo Story

1. A student at `village` has a broken project enclosure listed in Marketplace with `pickupLocation: "The Village"` and optional `pickupLocationId: "village"`.
2. The item category routes as `mechanical/material/project`, so the reverse-logistics card recommends iLab guidance first.
3. The map shows the item origin, recommended campus destination, and a Green Shuttle suggestion.
4. The demo route `main-campus-village-demo` shows:
   - The Village
   - Student Services Building
   - short walk to Building 1/iLab
5. The UI labels this as an estimate using the Main Campus/Village Shuttle, not a live navigation commitment.
6. If map rendering or route estimates are cut, the student still sees a plain-language destination recommendation and the original `pickupLocation` string.

## V1 Scope

V1 is hardcoded/public-data only.

| Area | V1 behavior |
|---|---|
| Campus locations | Hardcoded in `lib/campus/locations.ts`. |
| Concept3D | Optional URL/deep-link helpers in `lib/campus/concept3d.ts`; no private API dependency. |
| Reverse logistics | Deterministic rules in `lib/campus/reverse-logistics.ts`. |
| Shuttle routes | Hardcoded demo route and official-source metadata in `lib/campus/shuttle-routes.ts`. |
| Marketplace listing compatibility | Preserve `pickupLocation: string`; add optional `pickupLocationId?: string`. |
| Map UI | Uses known locations and route summaries; must degrade to a list. |
| Estimates | Approximate demo copy only; not live ETAs. |

## Non-Goals

- No live shuttle tracker integration in V1.
- No guarantee of real-time shuttle arrival, delay, capacity, or service availability.
- No campus facility inventory, booking, or staff handoff workflow.
- No geocoding user-entered pickup strings.
- No required database migration solely to make `pickupLocationId` mandatory.
- No replacement of `pickupLocation: string`.
- No private CPP, Concept3D, ServiceNow, or transportation API scraping.
- No route optimization beyond deterministic demo choices.

## Canonical Public Interfaces

### Listing Compatibility

Every worker must preserve the current listing field:

```ts
pickupLocation: string;
pickupLocationId?: string;
```

Rules:

- `pickupLocation` remains required anywhere it is already required.
- `pickupLocationId` is optional everywhere and must never block listing create, edit, render, seed, or tests.
- When `pickupLocationId` is absent, UI falls back to `pickupLocation` text only.
- When `pickupLocationId` is present but unknown, UI must ignore the ID and render `pickupLocation`.
- Do not rename `pickupLocation` to `location`, `campusLocation`, or `locationId`.

### Planned Modules

| Module | Owner contract |
|---|---|
| `lib/campus/locations.ts` | Canonical hardcoded campus location registry and lookup helpers. |
| `lib/campus/concept3d.ts` | Map/deep-link helpers that consume known campus locations. |
| `lib/campus/reverse-logistics.ts` | Item category and intent routing to destination recommendations. |
| `lib/campus/shuttle-routes.ts` | Green Shuttle route metadata, demo route, and estimate labels. |

These modules should be pure, importable from server and client code, and safe for fixture-driven tests. They should not import React components, Supabase clients, or network code.

### Location IDs

The initial canonical IDs are:

| ID | Product meaning |
|---|---|
| `village` | Student origin and demo shuttle start. |
| `student-services-building` | Main Campus/Village Shuttle transfer/demo stop. |
| `ilab-building-1-room-113` | iLab destination for project and repair work. |
| `maker-studio-library-15-2f` | Maker Studio destination for mechanical/material/project parts. |
| `it-tech-help-library-2f` | IT Tech Help destination for IT support guidance. |
| `bronco-bookstore-tech-building-66` | Bookstore/Bronco Tech destination for repair help or replacement parts. |
| `marketplace-exchange-public-meetup` | Public meetup fallback for still-usable exchange. |

`docs/plan/campus-location-contract.md` owns final display names, location types, campus areas, Concept3D fallback metadata, directions, accessibility notes, and API/data shapes. It does not freeze coordinates, aliases, or Concept3D marker IDs unless those fields are explicitly defined there. This umbrella doc owns only the coordination requirement that these IDs remain stable.

### Reverse-Logistics Rules

The V1 deterministic routing contract is:

| Input class | Primary recommendation |
|---|---|
| `electronics/server-computing` | IT guidance. |
| `mechanical/material/project parts` | iLab/Maker Studio. |
| `repair help/replacement parts` | Bookstore/Bronco Tech or IT Tech Help. |
| `still usable` | Marketplace exchange. |

Subsystem docs may refine display copy and ranking, but they must preserve these broad routes and the public `ReverseLogisticsRecommendation` result shape from `docs/plan/reverse-logistics-routing.md` unless the umbrella spec is updated.

### Green Shuttle Demo Route

The V1 demo route ID is `main-campus-village-demo`.

Route story:

```text
The Village -> Student Services Building -> short walk to Building 1/iLab
```

Source boundary:

- Official shuttle source: <https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml>
- The CPP page lists Main Campus/Village Shuttle stops including The Village and Student Services Building.
- V1 must phrase shuttle information as an 8 minute ride plus 4 minute walk estimate and provide a source link; it must not claim live shuttle facts, live ETA, or verified operating status.
- V1 visible shuttle cards are limited to `village` -> `ilab-building-1-room-113` and `village` -> `student-services-building`. Reverse-direction trips return `recommended: false` unless a later branch explicitly adds reverse-direction copy.

## Dependency Graph

```text
campus-location-contract.md
  -> lib/campus/locations.ts
  -> lib/campus/concept3d.ts
  -> campus-map-ui.md
  -> campus-location-accessibility.md

reverse-logistics-routing.md
  -> lib/campus/reverse-logistics.ts
  -> Marketplace listing cards/details/create flow
  -> campus-map-ui.md

green-shuttle-routing.md
  -> lib/campus/shuttle-routes.ts
  -> campus-map-ui.md
  -> campus-location-accessibility.md

campus-reverse-logistics-map.md
  -> all subsystem docs
  -> cut decisions and cross-worktree compatibility
```

Hard dependency rules:

- `locations.ts` must stabilize before map UI or shuttle UI locks copy around display names.
- `reverse-logistics.ts` can begin with ID constants from this doc, then sync to `campus-location-contract.md`.
- `shuttle-routes.ts` can begin independently because the demo route uses only `village`, `student-services-building`, and `ilab-building-1-room-113`.
- UI work must tolerate missing route data and missing `pickupLocationId` from the first commit.

## Parallel Worktree Map

| Worktree | Assigned output | Must not block on |
|---|---|---|
| Location contract | `docs/plan/campus-location-contract.md`, then `lib/campus/locations.ts` | Live map rendering, shuttle ETA logic. |
| Map UI | `docs/plan/campus-map-ui.md`, map/list UI components | Final shuttle timing; can consume fixture route summaries. |
| Reverse logistics | `docs/plan/reverse-logistics-routing.md`, then `lib/campus/reverse-logistics.ts` | Concept3D links; can return destination IDs only. |
| Green Shuttle | `docs/plan/green-shuttle-routing.md`, then `lib/campus/shuttle-routes.ts` | Marketplace APIs; can expose hardcoded demo route. |
| Accessibility | `docs/plan/campus-location-accessibility.md`, fallback UI rules | Visual map implementation; should define non-map summaries early. |
| Marketplace integration | Listing type updates and UI wiring | Campus modules must stay optional and pure. |

Shared-file policy:

- Announce before editing shared listing types, fixtures, or create/edit forms.
- Never make `pickupLocationId` required in shared types or schemas.
- Keep campus modules under `lib/campus/**` to avoid ownership collisions.

## Task Sequencing

Stage 1 contract-lock commit on `feat/map-main`:

```text
acd8a2d84d762aaf73575241f399f7264b1883e8
```

Implementation lanes must fan out from this SHA before Stage 2 starts.

1. Lock the six campus planning docs enough for field names, module exports, authority, worktree ownership, and UI fallback language. This Stage 1 contract-lock work happened on `feat/map-main`.
2. Add `lib/campus/locations.ts` with the seven canonical IDs and lookup helpers.
3. Add `pickupLocationId?: string` to listing types, fixtures, and seed data without changing `pickupLocation`.
4. Add `lib/campus/reverse-logistics.ts` with deterministic recommendations.
5. Add `lib/campus/shuttle-routes.ts` with `main-campus-village-demo`, source URL, and estimate disclaimers.
6. Add `lib/campus/concept3d.ts` only after location shape is stable.
7. Wire Marketplace listing cards/detail/create flows to use optional campus IDs.
8. Wire map UI with accessible list fallback.
9. Add smoke tests for unknown IDs, missing IDs, and known demo route rendering.

## Cross-Doc Compatibility Rules

- If a subsystem doc conflicts with `docs/plan/campus-location-contract.md` on data or API shapes, `campus-location-contract.md` wins.
- If a subsystem doc conflicts with this umbrella doc on orchestration, sequencing, implementation worktree boundaries, or cut rules, this umbrella doc wins until all workers agree to update it.
- If `platform-feature-contracts.md` conflicts with this doc on Marketplace table/API ownership, `platform-feature-contracts.md` wins.
- If `architecture.md` conflicts with this doc on repo ownership, freeze protocol, or cut rules, `architecture.md` wins.
- Subsystem docs may add fields, helper functions, UI states, and test cases, but they must keep the canonical IDs and optional listing field policy.
- Implementation worktrees must branch from the `feat/map-main` contract-lock commit SHA `acd8a2d84d762aaf73575241f399f7264b1883e8`, then use the lane worktree paths from `docs/superpowers/specs/2026-04-26-campus-location-orchestration-design.md`.
- Public copy must distinguish "recommended destination" from "guaranteed dropoff accepted here."
- Shuttle copy must distinguish "estimated route" from "live shuttle arrival."

## Risks And Cut Rules

| Risk | Impact | Cut rule |
|---|---|---|
| Map package or rendering instability | Could distract from Marketplace demo. | Cut to accessible list cards using the same location/recommendation data. |
| Unknown or stale campus coordinates | Could mislead students. | Show destination names, source links, and "estimate" labels; avoid turn-by-turn claims. |
| Shuttle service changes or beta tracker instability | Could make route claims inaccurate. | Keep only `main-campus-village-demo` and link to official CPP shuttle page. |
| Listing schema churn | Could break Marketplace implementation. | Preserve `pickupLocation: string`; keep `pickupLocationId?: string` optional. |
| Over-routing every category | Could create brittle or false recommendations. | Route only the four V1 rule groups; use Marketplace exchange fallback for uncertain but still usable items. |
| Accessibility gaps in visual map | Could block keyboard/screen-reader users. | Accessibility fallback list is part of cut-floor, not polish. |

Cut priority:

1. Live shuttle tracker integration is out of V1.
2. Concept3D deep links can be cut before deterministic routing.
3. Visual map can be cut before location list and destination recommendation.
4. Shuttle-assisted route can be cut before reverse-logistics recommendation.
5. `pickupLocation` compatibility and accessible text fallback are not cuttable.

## Acceptance Checks

- Existing listings render with only `pickupLocation`.
- Listings with known `pickupLocationId` render enhanced campus/map context.
- Listings with unknown `pickupLocationId` do not crash and still render `pickupLocation`.
- Reverse-logistics recommendations cover electronics/server-computing, mechanical/material/project parts, repair help/replacement parts, and still-usable exchange.
- Green Shuttle route `main-campus-village-demo` is present and labeled as an estimate.
- UI can render a non-map list summary for every map recommendation.
- No implementation depends on private campus APIs or live shuttle data.
