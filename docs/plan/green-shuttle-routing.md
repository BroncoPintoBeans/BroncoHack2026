# Green Shuttle Routing Assist Plan

Date: 2026-04-26  
Scope: planning contract only for a hardcoded/public-data green shuttle assist demo.  
Primary app: `bronco-repair-desk/` Next.js 16 App Router.

## Grounding Notes

This plan defines a V1 demo for recommending a CPP Bronco Shuttle option only for the hardcoded allowlisted origin/destination pairs. It is intentionally hardcoded and public-data only. Do not build live shuttle tracking, map routing APIs, private location collection, or real-time navigation in V1.

Official source for shuttle facts:

- CPP Bronco Shuttle page: `https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml`

Confirmed source facts to preserve in product copy and attribution:

- The CPP page lists the **Main Campus/Village Shuttle**.
- Listed stops include **The Village** and **Student Services Building**.
- Riders must have a **Bronco ID**.
- Service is not in operation during **breaks/campus holidays**.

## Product Intent And Boundaries

Green Shuttle Routing Assist adds a lightweight sustainability nudge to relevant campus flows: for the two V1 allowlisted origin/destination pairs, show a route card that suggests using the public CPP shuttle for part of the trip and walking the short final segment.

V1 supports only the demo route:

| Field | Value |
|---|---|
| `routeId` | `main-campus-village-demo` |
| Route name | `Main Campus/Village Shuttle` |
| From stop | `The Village` |
| To stop | `Student Services Building` |
| Final destination | `Building 1/iLab` |
| Final walk | Student Services Building -> short walk to Building 1/iLab |

Do not implement or imply:

- Live shuttle positions.
- Live arrival predictions.
- Turn-by-turn navigation.
- Guarantee that service is currently operating.
- Any routing beyond the hardcoded demo route.
- Any private student location storage.

## Planned Files

The following new hardcoded modules are the shared canonical implementation targets:

| File | Responsibility |
|---|---|
| `lib/campus/locations.ts` | Hardcoded campus location records using the richer canonical `CampusLocation` shape and seven canonical location IDs from `docs/plan/campus-location-contract.md`. |
| `lib/campus/shuttle-routes.ts` | Hardcoded shuttle route records, stop IDs, estimate copy, official source URLs, and recommendation function. |
| `lib/campus/concept3d.ts` | Optional public-data adapter for stable Concept3D/deep-link metadata if frontend wants to link campus places. No network calls in V1. |

These files should be self-contained and safe to import from server or client code. Keep V1 data static so demo behavior stays deterministic across worktrees.

## Data Model

### Location IDs

Use the seven exact IDs from `docs/plan/campus-location-contract.md` in fixtures, UI state, and tests. The shuttle demo actively uses these three IDs:

| ID | Display name | Campus area | Purpose |
|---|---|---|---|
| `village` | The Village | `west` | Demo pickup area and route origin stop. |
| `student-services-building` | Student Services Building | `main-campus` | Demo shuttle drop-off stop. |
| `ilab-building-1-room-113` | iLab, Building 1 Room 113 | `main-campus` | Demo destination after final walk. |

Canonical TypeScript shape:

```ts
export type CampusLocationId =
  | "village"
  | "student-services-building"
  | "ilab-building-1-room-113"
  | "maker-studio-library-15-2f"
  | "it-tech-help-library-2f"
  | "bronco-bookstore-tech-building-66"
  | "marketplace-exchange-public-meetup";

export type CampusLocationType =
  | "pickup_zone"
  | "shuttle_stop"
  | "map_landmark"
  | "repair_destination"
  | "reuse_destination"
  | "parts_destination"
  | "meetup_zone";

export type CampusArea =
  | "west"
  | "main-campus"
  | "library"
  | "bookstore"
  | "marketplace";

export interface Concept3DMapTarget {
  mapId: "1130";
  markerId?: string;
  url: string;
  fallbackUrl: string;
  label: string;
}

export interface CampusLocation {
  id: CampusLocationId;
  name: string;
  types: CampusLocationType[];
  campusArea: CampusArea;
  concept3d: Concept3DMapTarget;
  directions: string;
  accessibilityNote: string;
  sourceUrl?: string;
}
```

Do not use the obsolete lighter shuttle-only model with `label`, `concept3dSlug`, or `CampusArea | "unknown"`. UI labels and route grouping must be derived from the canonical registry fields.

### Shuttle Route

Suggested route shape:

```ts
export type ShuttleRoute = {
  routeId: "main-campus-village-demo";
  name: "Main Campus/Village Shuttle";
  sourceUrl: string;
  requiresBroncoId: true;
  serviceCaveat: string;
  stops: Array<{
    locationId: CampusLocationId;
    stopName: string;
  }>;
  estimate: {
    rideMinutes: number;
    walkMinutes: number;
    carAvoidanceCopy: string;
  };
};
```

V1 route data:

| Field | Value |
|---|---|
| `routeId` | `main-campus-village-demo` |
| `name` | `Main Campus/Village Shuttle` |
| `sourceUrl` | `https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml` |
| `requiresBroncoId` | `true` |
| `serviceCaveat` | `Service may not operate during breaks or campus holidays; check CPP Transportation before relying on it.` |
| Stop 1 | `village` / `The Village` |
| Stop 2 | `student-services-building` / `Student Services Building` |
| Estimated ride | `8` minutes |
| Estimated final walk | `4` minutes |

The `8` and `4` minute values are demo estimates, not official real-time values. They should be easy to replace later without changing the recommendation output shape.

## Recommendation Contract

Every caller should receive the same output shape, even when no shuttle card should be shown:

```ts
export type ShuttleRecommendation = {
  recommended: boolean;
  routeId: string;
  fromStop: CampusLocationId;
  toStop: CampusLocationId;
  walkMinutes: number;
  rideMinutes: number;
  reason: string;
  sourceUrl: string;
};
```

`routeId`, `fromStop`, and `toStop` must remain populated even when `recommended` is `false` so UI, tests, and analytics never need a nullable transport shape. Use the demo route and canonical stops with `walkMinutes: 0` and `rideMinutes: 0` for negative cases.

Required positive output for the demo trip:

```ts
{
  recommended: true,
  routeId: "main-campus-village-demo",
  fromStop: "village",
  toStop: "student-services-building",
  walkMinutes: 4,
  rideMinutes: 8,
  reason: "Estimated cross-campus trip from The Village to Building 1/iLab; shuttle can cover the long segment, then walk from Student Services Building.",
  sourceUrl: "https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml"
}
```

Required negative output shape:

```ts
{
  recommended: false,
  routeId: "main-campus-village-demo",
  fromStop: "village",
  toStop: "student-services-building",
  walkMinutes: 0,
  rideMinutes: 0,
  reason: "Trip is outside the V1 demo shuttle allowlist.",
  sourceUrl: "https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml"
}
```

## Recommendation Allowlist

Use a deterministic V1 allowlist so backend, frontend, and tests agree.

Active V1 rule:

- Recommend the demo shuttle only for `village` -> `ilab-building-1-room-113` and `village` -> `student-services-building`.

Negative cases:

- Reverse-direction trips return `recommended: false` unless a later branch explicitly adds reverse-direction copy.
- Same-area trips return `recommended: false`.
- Unknown locations return `recommended: false`.
- All trips outside the two active V1 route pairs return `recommended: false`; do not add a direct-walk minute rule in V1.

Expected V1 cases:

| Pickup | Destination | Result | Reason |
|---|---|---|---|
| `village` | `ilab-building-1-room-113` | Recommend | Village to main-campus cross-campus trip. |
| `ilab-building-1-room-113` | `village` | Do not recommend | Reverse-direction copy is not part of V1. |
| `student-services-building` | `ilab-building-1-room-113` | Do not recommend | Final walk segment is short and same-side campus travel. |
| `village` | `student-services-building` | Recommend | Village to official shuttle stop across campus. |

V1 must restrict visible shuttle cards to `village` -> `ilab-building-1-room-113` and `village` -> `student-services-building`; tests should assert reverse returns `recommended: false` with a clear reason.

## Demo Route Card Behavior

Show the shuttle card only when `recommendation.recommended === true`.

Card content contract:

| UI element | Required copy / data |
|---|---|
| Title | `Try the Main Campus/Village Shuttle` |
| Route line | `The Village -> Student Services Building -> walk to Building 1/iLab` |
| Estimate label | `Estimated shuttle assist` |
| Time summary | `About 8 min ride + 4 min walk` |
| Sustainability copy | `Avoids a short car trip across campus when shuttle service is operating.` |
| ID note | `Bronco ID required.` |
| Service note | `Service may pause during breaks and campus holidays. Check CPP Transportation before relying on this route.` |
| Source link | `Source: CPP Bronco Shuttle` linking to the official shuttle URL. |

Interaction contract:

- The route card can appear in marketplace listing detail, repair pickup/dropoff flows, or dashboard demo panels.
- The card should not block the primary task. It is an assistive suggestion, not a required step.
- CTA labels should be source-oriented, such as `View shuttle details`, not real-time action copy like `Start route` or `Track shuttle`.
- If a Concept3D link is added, label it as campus map context, not navigation.

## UI Copy Contract

Use estimate language everywhere:

- `Estimated shuttle assist`
- `Estimated ride time`
- `Estimated walk time`
- `Check CPP Transportation for current service details`
- `Not real-time tracking`

Avoid these phrases in V1:

- `live`
- `real-time ETA`
- `arriving now`
- `track shuttle`
- `fastest route`
- `guaranteed`
- `turn-by-turn`

Recommended compact card copy:

```text
Try the Main Campus/Village Shuttle
The Village -> Student Services Building -> walk to Building 1/iLab
Estimated: about 8 min ride + 4 min walk
Bronco ID required. Service may pause during breaks and campus holidays.
Source: CPP Bronco Shuttle
```

Recommended muted disclaimer:

```text
Estimates are for demo planning only and are not live arrival or navigation data.
```

## No-Real-Time Guardrails

Implementation must keep V1 static and transparent:

- Do not call transportation APIs, map routing APIs, shuttle trackers, or location services.
- Do not poll, cache, scrape, or infer live shuttle arrivals.
- Do not use browser geolocation.
- Do not store user coordinates.
- Do not name any field `eta` unless it is prefixed or labeled as `estimated`.
- Keep `sourceUrl` attached to every recommendation output.
- Keep service caveat copy visible anywhere the card can influence student travel decisions.
- If official shuttle source data changes, update the hardcoded module and tests in the same commit.

## Source Attribution

Every visible recommendation should include a source link:

```text
Source: CPP Bronco Shuttle
```

The link target must be:

```text
https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml
```

The card may summarize source facts, but do not imply CPP endorses this app or this demo. Use phrasing like:

```text
CPP Transportation lists The Village and Student Services Building as stops on the Main Campus/Village Shuttle.
```

## Task Sequence

### Task 1: Add Hardcoded Campus Locations

Files:

- Create: `lib/campus/locations.ts`
- Test: `tests/unit/campus/locations.test.ts`

Steps:

1. Define `CampusArea`, `CampusLocationId`, and `CampusLocation`.
2. Add the full seven-location registry required by `docs/plan/campus-location-contract.md`, with route tests focused on `village`, `student-services-building`, and `ilab-building-1-room-113`.
3. Export `getCampusLocation(id)` and `CAMPUS_LOCATIONS`.
4. Add tests asserting all canonical IDs exist and have the expected campus areas.

### Task 2: Add Shuttle Route And Recommendation Logic

Files:

- Create: `lib/campus/shuttle-routes.ts`
- Test: `tests/unit/campus/shuttle-routes.test.ts`

Steps:

1. Define `ShuttleRoute` and `ShuttleRecommendation`.
2. Add `MAIN_CAMPUS_VILLAGE_DEMO_ROUTE`.
3. Implement `getShuttleRecommendation({ pickupId, destinationId })`.
4. Return the exact positive shape for `village` -> `ilab-building-1-room-113`.
5. Return the exact negative shape for reverse and all non-allowlisted trips, with non-null route and stop IDs plus zeroed estimate fields.
6. Add tests for route ID, stop names, source URL, estimate values, allowlisted positive cases, and non-allowlisted negative cases.

### Task 3: Add Optional Concept3D Public-Data Helpers

Files:

- Create: `lib/campus/concept3d.ts`
- Test: `tests/unit/campus/concept3d.test.ts`

Steps:

1. Define stable metadata for known location IDs if the frontend needs a campus map link.
2. Keep the helper pure and hardcoded.
3. Return `null` for unknown IDs.
4. Add tests proving no network-dependent behavior is required.

### Task 4: Wire The Demo Card

Files:

- Modify only the assigned frontend route/component for the implementing worktree.
- Do not change the recommendation output shape.

Steps:

1. Call `getShuttleRecommendation` with the selected pickup and destination IDs.
2. Render the route card only for `recommended: true`.
3. Use the required UI copy contract.
4. Link source attribution to the official CPP Bronco Shuttle page.
5. Ensure the card remains secondary to the primary user task.

### Task 5: Add Focused UI Or Integration Tests

Files:

- Test path should match the route/component touched by the implementing worktree.

Steps:

1. Assert the route card appears for `village` -> `ilab-building-1-room-113`.
2. Assert the card includes `Estimated`, `Bronco ID required`, and the source link.
3. Assert the card does not appear for `student-services-building` -> `ilab-building-1-room-113`.
4. Assert no visible copy contains `live`, `real-time ETA`, `track shuttle`, or `guaranteed`.

## Focused Test Matrix

| Test | Expected assertion |
|---|---|
| Location fixture completeness | All three canonical IDs resolve. |
| Allowlisted iLab trip | `village` -> `ilab-building-1-room-113` recommends shuttle. |
| Short walk suppression | `student-services-building` -> `ilab-building-1-room-113` does not recommend shuttle. |
| Route facts | Route ID, name, from stop, to stop, and source URL match the canonical contract. |
| Estimate labeling | UI displays estimated ride and walk time, not live ETA. |
| Source attribution | UI links `CPP Bronco Shuttle` to the official source URL. |
| Service caveat | UI mentions Bronco ID and breaks/campus holidays caveat. |
| Guardrail copy | UI avoids prohibited real-time/navigation phrases. |

## Compatibility Notes

This plan is compatible with separate worktrees because it creates new `lib/campus/**` modules and a self-contained UI card contract. Shared implementation workers should not modify `lib/types/**` just to support V1; the shuttle recommendation type can live in `lib/campus/shuttle-routes.ts` until the shape is frozen by implementation.

If another worktree adds route selection or campus map work, it should consume `getShuttleRecommendation` rather than duplicate the allowlist or hardcoded route facts.
