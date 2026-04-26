# Campus Location Contract

This is the canonical planning contract for Campus Map, Reverse Logistics, and Green Shuttle work. It is intended for separate worktrees to implement against the same hardcoded V1 shapes without coordinating through database migrations.

If another planning doc conflicts with this file, this file wins for campus location IDs, campus data shapes, Concept3D map URL behavior, shuttle recommendation shape, reverse-logistics public output shape, and listing-location compatibility. The platform listing contract still wins for existing Marketplace ownership and table names.

## 0. Scope

V1 is public-data and hardcoded only:

- No live geocoding.
- No live shuttle tracking.
- No private student location data.
- No required schema migration for location IDs.
- No verified Concept3D marker IDs unless a later worker confirms them from the official map.

Planned hardcoded modules:

| Module | Purpose |
|---|---|
| `lib/campus/locations.ts` | Canonical campus location registry, IDs, names, fallback links, directions, and accessibility copy. |
| `lib/campus/concept3d.ts` | CPP Concept3D URL builders and iframe/link helpers. |
| `lib/campus/reverse-logistics.ts` | Repair, reuse, parts, meetup, and pickup-zone routing helpers. |
| `lib/campus/shuttle-routes.ts` | Demo Green Shuttle route data and recommendation helpers. |

## 1. Compatibility Rules

Preserve the existing listing field:

```ts
pickupLocation: string;
```

Add this optional field everywhere listing location data is modeled:

```ts
pickupLocationId?: string;
```

Rules:

- `pickupLocationId` is optional in TypeScript, API payloads, mock data, form state, fixtures, and any future DB shape.
- Do not make `pickupLocationId` required in validators, UI forms, API request bodies, seed data, tests, or migrations.
- Existing listings with only `pickupLocation` must keep rendering and submitting.
- If `pickupLocationId` is present and matches a canonical campus location, UI may render enriched map, route, and directions data.
- If `pickupLocationId` is missing, unknown, or stale, UI must fall back to the plain `pickupLocation` string and avoid blocking create/edit flows.
- Public demo data may include both fields, but must still exercise at least one fixture with no `pickupLocationId`.

## 2. Canonical Types

The implementation may refine exact export names, but these fields and semantics are frozen.

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

export interface ListingLocationFields {
  pickupLocation: string;
  pickupLocationId?: CampusLocationId | string;
}
```

`CampusLocation.types` is intentionally plural because several required entries carry more than one routing role. Consumers that need a primary role should derive it locally instead of changing the registry shape.

## 3. Required Location Registry

All workers must use these exact IDs.

| ID | Name | Types | Campus Area |
|---|---|---|---|
| `village` | The Village | `pickup_zone`, `shuttle_stop` | `west` |
| `student-services-building` | Student Services Building | `shuttle_stop`, `map_landmark` | `main-campus` |
| `ilab-building-1-room-113` | iLab, Building 1 Room 113 | `repair_destination`, `reuse_destination` | `main-campus` |
| `maker-studio-library-15-2f` | Maker Studio, Library Building 15 2nd floor | `repair_destination`, `reuse_destination` | `library` |
| `it-tech-help-library-2f` | IT Tech Help Desk, University Library 2nd floor | `repair_destination` | `library` |
| `bronco-bookstore-tech-building-66` | Bronco Bookstore/Bronco Tech, Building 66 | `repair_destination`, `parts_destination` | `bookstore` |
| `marketplace-exchange-public-meetup` | Public Marketplace exchange meetup area | `meetup_zone` | `marketplace` |

Directions are required prose, not optional UI decoration. Each location entry must include readable directions suitable for display when the embedded map fails, marker IDs are unavailable, or a screen reader user skips the map.

## 4. Concept3D Contract

CPP Concept3D map ID is frozen as:

```ts
const CPP_CONCEPT3D_MAP_ID = "1130";
```

Base fallback URL:

```text
https://www.cpp.edu/maps/?id=1130
```

URL-builder expectations:

- `buildCampusMapUrl()` returns `https://www.cpp.edu/maps/?id=1130`.
- `buildCampusMapUrl({ markerId })` may append the verified Concept3D marker/share parameters only after the marker ID is confirmed.
- `buildCampusMapIframeSrc(target)` must never require a marker ID. With no verified marker, it returns the base map URL.
- `buildTextMapFallback(location)` returns a normal anchor-safe URL, not only an iframe `src`.
- `buildCampusLocationLink(location)` must include visible link text such as `Open CPP campus map for Student Services Building`.

Marker policy:

- Opening a specific Concept3D marker is best-effort unless marker IDs are verified.
- Do not invent marker IDs.
- Do not block routing, listing creation, listing detail, or shuttle recommendation output on marker availability.
- Every iframe or map link must have a text-map fallback URL and readable directions adjacent to it.

Canonical fallback URLs:

| Use | URL |
|---|---|
| Base CPP interactive campus map | `https://www.cpp.edu/maps/?id=1130` |
| Text fallback for any unverified marker location | `https://www.cpp.edu/maps/?id=1130` |
| Official shuttle source | `https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml` |

## 5. Reverse Logistics Contract

Reverse logistics maps repair and reuse intent to known campus destinations. It does not decide business policy, prices, availability, or staff schedules.

Required public output shape:

```ts
export interface ReverseLogisticsDestinationOption {
  locationId: CampusLocationId;
  label: string;
  reason: string;
  mapUrl?: string;
  mapTextFallback: string;
}

export interface ReverseLogisticsRecommendation {
  primary: ReverseLogisticsDestinationOption;
  alternatives: ReverseLogisticsDestinationOption[];
  ruleId: string;
  confidence: "high" | "medium" | "low";
  explanation: string;
  disclaimer: string;
}
```

`ReverseLogisticsDestinationOption` is an internal nested option shape inside the public `ReverseLogisticsRecommendation`. Public callers should not return only a destination option because UI needs the rule ID, confidence, explanation, and disclaimer.

Routing expectations:

- Repair destinations include `ilab-building-1-room-113`, `maker-studio-library-15-2f`, `it-tech-help-library-2f`, and `bronco-bookstore-tech-building-66`.
- Reuse destinations include `ilab-building-1-room-113` and `maker-studio-library-15-2f`.
- Parts destination includes `bronco-bookstore-tech-building-66`.
- Public exchange coordination can suggest `marketplace-exchange-public-meetup`.
- The Village can be used as a pickup zone and shuttle origin, not as a repair destination.
- Unknown item categories should return a generic campus repair/reuse option list, not an error.

## 6. Shuttle Route Contract

Official source:

```text
https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml
```

Source facts frozen for V1 copy:

- CPP lists the Main Campus/Village Shuttle.
- Listed stops include The Village and Student Services Building.
- A Bronco ID is required.
- Service is not in operation during breaks/campus holidays.

The app must describe V1 shuttle routing as estimates only, not real-time shuttle data.

Required recommendation output shape:

```ts
export interface ShuttleRecommendation {
  recommended: boolean;
  routeId: string;
  fromStop: CampusLocationId;
  toStop: CampusLocationId;
  walkMinutes: number;
  rideMinutes: number;
  reason: string;
  sourceUrl: string;
}
```

Demo route:

```ts
export const MAIN_CAMPUS_VILLAGE_DEMO_ROUTE = {
  routeId: "main-campus-village-demo",
  name: "Main Campus/Village Shuttle",
  fromStop: "village",
  toStop: "student-services-building",
  onwardDestinationId: "ilab-building-1-room-113",
  rideMinutes: 8,
  walkMinutes: 4,
  sourceUrl:
    "https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml",
  notes: [
    "Estimates only; not real-time.",
    "Bronco ID required.",
    "Service may not operate during breaks or campus holidays.",
    "After reaching Student Services Building, walk to Building 1/iLab."
  ]
} as const;
```

Recommendation behavior:

- Recommend the demo shuttle only when the origin is `village` and the target is `ilab-building-1-room-113` or `student-services-building`.
- Return `recommended: false` for reverse-direction trips unless a later branch explicitly adds reverse-direction copy.
- Return `recommended: false` when the origin or destination does not benefit from the demo route.
- `reason` must include enough plain text for a user to understand the recommendation without opening the map.
- `sourceUrl` must always be the official CPP shuttle page.
- `rideMinutes` and `walkMinutes` are estimates and must not be labeled as live ETAs.

## 7. Accessibility And Fallbacks

Every campus map surface must support:

- A visible text link to the CPP map fallback URL.
- Human-readable directions in text.
- An accessible name for iframes, such as `CPP campus map for The Village`.
- No iframe-only interaction path.
- No color-only distinction between repair, reuse, shuttle, parts, pickup, and meetup roles.
- Copy that says shuttle times are estimates and service may not run during breaks/campus holidays.
- Keyboard reachable map links and route actions.

If the Concept3D iframe is slow, blocked, or missing a marker:

- Keep the location card visible.
- Show the fallback link.
- Show directions.
- Keep any listing action, route recommendation, or marketplace CTA usable.

## 8. Implementation Task Outline

Suggested split for separate worktrees:

1. Add `lib/campus/locations.ts` with the required registry, type exports, lookup helpers, and compatibility helper for `pickupLocationId`.
2. Add `lib/campus/concept3d.ts` with base URL, map ID constant, marker-safe URL builders, iframe helper metadata, and text fallback helpers.
3. Add `lib/campus/reverse-logistics.ts` with repair/reuse/parts/meetup routing helpers using only canonical location IDs.
4. Add `lib/campus/shuttle-routes.ts` with the demo route and `getShuttleRecommendation()` outputting the frozen `ShuttleRecommendation` shape.
5. Extend listing-facing mock data and UI types to carry optional `pickupLocationId` while preserving `pickupLocation`.
6. Add map and route UI only through consumers that can render without marker IDs or iframe availability.

Cross-stream compatibility checks:

- Do not edit existing listing APIs to require campus IDs.
- Do not rename `pickupLocation`.
- Do not introduce duplicate hardcoded location IDs in feature components.
- Import from `lib/campus/*` instead of embedding campus constants in app routes or components.

## 9. Focused Test Plan

Unit tests:

- `locations` exports every required ID exactly once.
- `pickupLocationId` lookup succeeds for canonical IDs and returns a non-throwing fallback for unknown IDs.
- Every location has at least one type, directions, an accessibility note, and a fallback URL.
- `concept3d` URL builders return `https://www.cpp.edu/maps/?id=1130` when no marker ID is provided.
- `concept3d` marker URL builder does not invent marker parameters for missing marker IDs.
- Reverse logistics returns repair destinations for generic repair intent.
- Reverse logistics returns reuse destinations for reuse intent.
- Shuttle recommendation for `village` to `ilab-building-1-room-113` returns `recommended: true`, `routeId: "main-campus-village-demo"`, `fromStop: "village"`, `toStop: "student-services-building"`, numeric walk/ride estimates, a reason, and the official source URL.
- Non-benefiting shuttle cases return `recommended: false` without throwing.

Compatibility tests:

- Listing fixtures with only `pickupLocation` still validate and render.
- Listing fixtures with both `pickupLocation` and `pickupLocationId` validate and render enriched campus details.
- Unknown `pickupLocationId` does not prevent create/edit/listing detail flows.
- API and form schemas keep `pickupLocationId` optional.

Accessibility tests:

- Any map iframe has a readable title.
- Every map iframe has a nearby text fallback link.
- Directions are present in text for each rendered location.
- Shuttle recommendation copy exposes estimate and service-limitation language.

Manual checks:

- Disable iframe loading or block the Concept3D frame and confirm location cards, fallback links, and directions remain usable.
- Confirm route copy does not claim live shuttle status or real-time arrival data.
- Confirm all user-facing shuttle facts link back to the official CPP shuttle source.
