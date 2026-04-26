# Campus Map UI Implementation Plan

Date: 2026-04-26  
Scope: frontend planning for the `/campus-map` experience, marketplace listing map CTAs, and create/edit listing location selection.  
Primary app: `bronco-repair-desk/` Next.js 16 App Router.

## Grounding Notes

This plan is based on:

- `docs/plan/platform-feature-contracts.md`
- `app/campus-map/page.tsx`
- `app/create-listing/page.tsx`
- `app/marketplace/[id]/page.tsx`
- Current marketplace data flow where listing UI uses `pickupLocation: string`

Current implementation state: `/campus-map` is a static `SiteInfoPage`, create listing writes `pickup_location`, listing detail is routed through `MarketplaceDetailClient`, and edit listing already keeps a required text `pickupLocation` field. This UI plan is additive and must preserve those behaviors.

`docs/plan/platform-feature-contracts.md` remains authoritative for Marketplace table ownership and canonical naming. This plan does not rename or replace existing listing fields.

## Shared Contract

All campus-map workers must align to this contract:

- Preserve existing listing field `pickupLocation: string`.
- Add `pickupLocationId?: string` everywhere as optional only. Never require it in forms, API payloads, normalized listing types, fixtures, or UI components.
- Planned hardcoded public-data modules:
  - `lib/campus/locations.ts`
  - `lib/campus/concept3d.ts`
  - `lib/campus/reverse-logistics.ts`
  - `lib/campus/shuttle-routes.ts`
- Concept3D CPP map ID: `1130`.
- Canonical location IDs:
  - `village`
  - `student-services-building`
  - `ilab-building-1-room-113`
  - `maker-studio-library-15-2f`
  - `it-tech-help-library-2f`
  - `bronco-bookstore-tech-building-66`
  - `marketplace-exchange-public-meetup`
- Every iframe or map embed requires an accessible text fallback URL and readable route/direction text.
- Map marker opening is best-effort unless Concept3D marker IDs are verified.
- Shuttle output shape:

```ts
type ShuttleRecommendation = {
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

## Product Intent And Boundaries

Campus Map V1 helps students choose safe, recognizable, public campus exchange points and open a CPP map or route view with non-iframe fallbacks. It should make location choice easier without pretending the app has live navigation, verified room-level map markers, live shuttle telemetry, private address support, or automatic route optimization.

V1 is hardcoded/public-data only:

- No live shuttle API.
- No geolocation requirement.
- No database requirement beyond optional listing-location ID compatibility.
- No private dorm room, private address, or exact personal meetup guidance.
- No hard failure if `pickupLocationId` is missing.

## File Ownership

This documentation worker owns only:

- Create: `docs/plan/campus-map-ui.md`

Implementation workers should coordinate ownership before editing these future files:

| Area | Future files | Notes |
|---|---|---|
| Campus data | `lib/campus/locations.ts`, `lib/campus/concept3d.ts`, `lib/campus/reverse-logistics.ts`, `lib/campus/shuttle-routes.ts` | Hardcoded public data and pure helpers. Keep V1 deterministic. |
| Campus map route | `app/campus-map/page.tsx` | Replace static `SiteInfoPage` with the real campus map experience. |
| Campus map components | `components/campus-map/CampusMapClient.tsx`, `LocationList.tsx`, `Concept3DMapPanel.tsx`, `DirectionsPanel.tsx`, `ShuttleRecommendationCard.tsx` | Suggested split; worker may adjust names if local component patterns require it. |
| Marketplace detail CTA | `components/marketplace/MarketplaceDetailClient.tsx` | Add map CTA near existing pickup location display. |
| Create listing picker | `app/create-listing/page.tsx` | Add picker while keeping free-text `pickupLocation`. |
| Edit listing picker | `app/marketplace/[id]/edit/page.tsx` | Add picker while keeping required text input. |
| Listing normalization | `lib/db/marketplace/listings.ts` and API route consumers | Add optional `pickupLocationId?: string` only if the worker owns this cross-feature change. |
| Focused tests | `tests/unit/campus/*.test.ts` or existing test convention | Prefer pure helper coverage for deterministic V1 behavior. |

Before implementing, read the relevant guide in `node_modules/next/dist/docs/` because this repo uses Next.js 16 and the root agent rules warn that App Router conventions may differ from older expectations.

## Data Plan

### `lib/campus/locations.ts`

Use the canonical `CampusLocation` type from `docs/plan/campus-location-contract.md` and a hardcoded array keyed by the seven canonical IDs. UI-specific grouping labels may be derived from that registry, but components must not create a second incompatible location model.

```ts
import type { CampusLocation, CampusLocationId } from "@/lib/campus/locations";

type CampusLocationUiGroup =
  | "pickup"
  | "shuttle"
  | "repair"
  | "reuse"
  | "parts"
  | "meetup";
```

Rules:

- `location.name` or an explicit `listingLabel` derived from the registry is the value copied into existing listing `pickupLocation`.
- `id` is copied into optional `pickupLocationId`.
- If users type a custom location, set `pickupLocationId` to `undefined` and preserve the text.
- Room-level entries can be present for public service desks or labs, but UI copy should still tell users to confirm exact timing through messages.

### `lib/campus/concept3d.ts`

Own URL helpers for CPP Concept3D map ID `1130`:

```ts
export const CPP_CONCEPT3D_MAP_ID = "1130";

export function buildCampusMapUrl(args?: { markerId?: string; query?: string }): string;
export function buildCampusMapIframeSrc(location?: CampusLocation): string;
export function buildTextMapFallback(location?: CampusLocation): string;
export function buildCampusLocationLink(location: CampusLocation): {
  href: string;
  label: string;
};
```

Rules:

- Use query/search URLs for V1 unless verified marker IDs exist.
- If `concept3dMarkerId` is absent, label marker opening as best-effort.
- Every component rendering an iframe must render a visible text link to the same map destination and readable directions beside or below the iframe.
- URL helpers should be unit-tested because they are easy to regress and affect every CTA.

### `lib/campus/reverse-logistics.ts`

Plan a pure recommendation helper but do not overbuild logic in the UI phase:

```ts
export interface DestinationRecommendation {
  locationId: string;
  title: string;
  reason: string;
  confidence: "default" | "category" | "repair" | "support";
}
```

Rules:

- Return a deterministic fallback such as `marketplace-exchange-public-meetup`.
- Accept listing category/type/condition as optional inputs.
- UI receives the recommendation as a card slot; the recommendation logic can be minimal in V1.

### `lib/campus/shuttle-routes.ts`

Expose a slot-compatible helper returning `ShuttleRecommendation`. V1 can return a hardcoded public-data recommendation for known route pairs with `recommended: true` or the same non-null route shape with `recommended: false` when no useful shuttle suggestion is available.

Rules:

- Output shape must be exactly `recommended, routeId, fromStop, toStop, walkMinutes, rideMinutes, reason, sourceUrl`, with `fromStop` and `toStop` carrying canonical campus location IDs rather than display names.
- UI must treat it as advisory copy, not live transit status.
- The card should be green-themed but restrained, matching marketplace palette rather than becoming the dominant visual element.

## Route And Component Plan

### `/campus-map`

Replace the current static page with a real route made of:

- Header with title, short intro, and primary fallback link to the CPP Concept3D map.
- Search/filter controls for campus locations.
- Location list with keyboard-selectable rows or cards.
- Map panel using Concept3D iframe when iframe rendering is available.
- Text fallback panel with an external map URL and readable directions for the selected location.
- Destination recommendation slot.
- Green shuttle card slot.

Desktop layout:

- Two-column work surface: location list on the left, map/directions on the right.
- Keep the selected location details visible next to the iframe.
- Do not place cards inside cards; use one page surface with repeated location rows.

Mobile layout:

- Search and filters first.
- Selected location summary second.
- Map iframe or fallback third.
- Location list below, with sticky-free controls so content does not overlap.

### Listing Detail Map CTA

Add a CTA near existing pickup-location UI in `MarketplaceDetailClient`:

- If `item.pickupLocationId` matches a known location, CTA label can be `View pickup spot on campus map`.
- If only `item.pickupLocation` exists, CTA label can be `Search pickup spot on campus map`.
- Link to `/campus-map?location=<pickupLocationId>` when an ID exists.
- Link to `/campus-map?q=<encoded pickupLocation>` when only text exists.
- Also render a Concept3D external link for users who want to open the official map directly.
- Keep the existing pickup text visible exactly as listing data provides it.

Compatibility rule: listings without `pickupLocationId` should look normal and must not show blank state errors.

### Create Listing Location Picker

Modify the existing step 2 pickup field flow:

- Keep `pickupLocation` as required text.
- Add `pickupLocationId?: string` state.
- Add a campus-location picker above or beside the free-text input.
- Selecting a known location sets both:
  - `pickupLocationId = location.id`
  - `pickupLocation = location.pickupLocationText`
- Editing the text after choosing a known location should either:
  - keep the ID if the text still equals that location's `pickupLocationText`, or
  - clear the ID when the text no longer matches.
- Add a `Custom campus location` option that focuses the text input and clears `pickupLocationId`.
- Publish payload should include text exactly as today and include optional ID only when the database/API contract supports `pickup_location_id`.

Validation rule: `pickupLocation` remains required; `pickupLocationId` is never required.

### Edit Listing Location Picker

Apply the same picker behavior to `app/marketplace/[id]/edit/page.tsx`:

- Existing `pickupLocation` text input remains required.
- If `item.pickupLocationId` exists and matches known hardcoded data, preselect that location.
- If no ID exists, try a non-authoritative text match for initial display only, but do not submit an ID unless the user actively picks a known location or the existing ID is already present.
- Submit both `pickupLocation` and optional `pickupLocationId` when supported.
- Preserve legacy listings with text-only pickup locations.

## UI States

### `/campus-map`

| State | Behavior |
|---|---|
| Default | Select `marketplace-exchange-public-meetup`, show all locations, show official map fallback URL and directions. |
| `?location=<id>` | Select matching hardcoded location. If unknown, show default and a small non-blocking message that the saved location is no longer recognized. |
| `?q=<text>` | Filter/search by text and select the best text match when available; otherwise show search results with fallback map search link. |
| Search empty | Show all locations and keep current selection. |
| Search no results | Show no-results copy plus official Concept3D search fallback link. |
| Iframe blocked | Keep all map actions usable through fallback links and text directions. |
| Missing marker ID | Use search/query URL and copy that marker opening is best-effort. |
| Shuttle unavailable | Hide the card or show a compact "No useful shuttle route for this pickup" message, depending on layout density. |

### Listing Detail

| State | Behavior |
|---|---|
| Known `pickupLocationId` | Deep-link to selected campus-map location and show external Concept3D link. |
| Text-only `pickupLocation` | Search campus map by text and show external Concept3D search link. |
| Empty pickup text | Keep current fallback `Campus pickup` copy and link to `/campus-map`. |

### Create/Edit Picker

| State | Behavior |
|---|---|
| Known location selected | Selected option has visible state, text input is populated, ID is set. |
| Text edited after selection | ID clears when text no longer matches selected location text. |
| Custom selected | Text input remains primary, ID is undefined. |
| Validation error | Error remains attached to `pickupLocation`, not the optional ID. |
| Legacy edit record | Text renders and submits even without an ID. |

## Accessibility, Keyboard, And No-Iframe Requirements

- Search input has a visible label.
- Location list uses buttons or links with native keyboard behavior; do not make non-interactive divs clickable.
- Selected location state is conveyed by text and `aria-current` or `aria-pressed`, not color alone.
- Map iframe has a descriptive `title`, such as `CPP campus map centered on Bronco Bookstore`.
- The iframe is not the only way to use the feature. Render the official fallback URL as readable link text and include plain-language directions.
- If the iframe fails, is blocked, or is hidden on small screens, the fallback link and directions remain visible.
- Shuttle recommendations include route text in normal prose, for example: `Take Route A from Student Services to Library, then walk about 4 minutes.`
- Focus order should move from filters to selected-location summary to map/fallback actions to location results.
- Avoid hover-only controls. Every CTA must be reachable and understandable by keyboard and screen reader.
- Use readable text contrast on green shuttle cards; do not put muted gray text on green backgrounds.

## Task Sequence

### Task 1: Add Hardcoded Campus Data And URL Helpers

Files:

- Create: `lib/campus/locations.ts`
- Create: `lib/campus/concept3d.ts`
- Create: `tests/unit/campus/concept3d.test.ts`

Steps:

- Define `CampusLocation` and all seven canonical locations.
- Add Concept3D URL helpers using map ID `1130`.
- Unit-test that known locations produce official map/search URLs, text-only search is encoded, and missing marker IDs use query/search behavior.
- Run `npm run test -- tests/unit/campus/concept3d.test.ts`.

### Task 2: Add Recommendation And Shuttle Slot Data

Files:

- Create: `lib/campus/reverse-logistics.ts`
- Create: `lib/campus/shuttle-routes.ts`
- Create: `tests/unit/campus/reverse-logistics.test.ts`
- Create: `tests/unit/campus/shuttle-routes.test.ts`

Steps:

- Add deterministic destination recommendation helper with a default public meetup fallback.
- Add shuttle helper returning the exact shared output shape or `null`.
- Unit-test fallback recommendation, repair/support category recommendations, and shuttle shape.
- Run `npm run test -- tests/unit/campus/reverse-logistics.test.ts tests/unit/campus/shuttle-routes.test.ts`.

### Task 3: Build `/campus-map` Experience

Files:

- Modify: `app/campus-map/page.tsx`
- Create: `components/campus-map/CampusMapClient.tsx`
- Create: `components/campus-map/LocationList.tsx`
- Create: `components/campus-map/Concept3DMapPanel.tsx`
- Create: `components/campus-map/DirectionsPanel.tsx`
- Create: `components/campus-map/ShuttleRecommendationCard.tsx`

Steps:

- Replace static `SiteInfoPage` content with the interactive campus-map shell.
- Parse `location` and `q` search params on the route and pass initial state into the client component.
- Render search/filter controls, selected-location summary, iframe panel, fallback URL, direction text, recommendation slot, and shuttle card slot.
- Verify keyboard traversal, mobile stacking, no-results state, and blocked-iframe fallback.
- Run `npm run lint` and `npm run build`.

### Task 4: Add Listing Detail Map CTA

Files:

- Modify: `components/marketplace/MarketplaceDetailClient.tsx`
- Modify if owned by the same worker: `lib/db/marketplace/listings.ts`

Steps:

- Add optional `pickupLocationId?: string` to listing type and normalizer only as an optional property.
- Add CTA links beside existing pickup-location display.
- Use known-location ID when present; otherwise generate a campus-map text search link from `pickupLocation`.
- Preserve existing fallback copy for text-only listings.
- Run `npm run lint` and `npm run build`.

### Task 5: Add Create Listing Location Picker

Files:

- Modify: `app/create-listing/page.tsx`

Steps:

- Add optional `pickupLocationId` state.
- Add known-location picker in the current Item Details step.
- Keep existing free-text input and existing `pickupLocation` validation.
- Clear optional ID on custom text mismatch.
- Include optional ID in submit only when the API/DB path supports it; do not break current `pickup_location` insert behavior.
- Run `npm run lint` and `npm run build`.

### Task 6: Add Edit Listing Location Picker

Files:

- Modify: `app/marketplace/[id]/edit/page.tsx`
- Modify if owned by the same worker: listing update server action payload and normalized listing type.

Steps:

- Preselect known location from optional ID when available.
- Preserve legacy text-only records.
- Keep the required text field as the source of truth for submitted pickup copy.
- Submit optional ID only when present and supported.
- Run `npm run lint` and `npm run build`.

## Focused Tests

Minimum test coverage for the implementation workers:

- `concept3d.test.ts`: map ID `1130`, encoded search links, fallback URL generation, no marker-specific URL when marker ID is missing.
- `locations.test.ts`: all seven canonical IDs exist, every location has `pickupLocationText`, `directionsText`, `concept3dQuery`, and a safety note.
- `reverse-logistics.test.ts`: default recommendation returns a known public meetup, category/repair inputs return deterministic IDs, unknown inputs do not throw.
- `shuttle-routes.test.ts`: helper returns the exact shared shuttle shape, including `recommended`, non-null route/stop IDs, numeric estimate fields, and `sourceUrl`.
- Create/edit manual smoke: selecting a known location populates text and ID; editing text clears ID; custom text still passes validation.
- Listing detail manual smoke: text-only listings show a working `/campus-map?q=` CTA; known-ID listings show `/campus-map?location=`.
- Accessibility smoke: keyboard-only navigation can select a location, open fallback link, and reach shuttle/directions text without using iframe content.
- No-iframe smoke: hide/block the iframe in devtools and confirm fallback URL plus readable directions still provide the full route.

## Compatibility Notes

- `pickupLocation` remains the compatibility field and should keep flowing through existing UI and database code.
- `pickupLocationId?: string` is a progressive enhancement. It must be optional in TypeScript, nullable in database/API shape if added, and absent-safe in all components.
- If the platform column is not ready, the create/edit UI can still ship with picker-to-text behavior and omit persistence of the ID.
- If Concept3D marker IDs are later verified, add them to `locations.ts`; until then, query/search links are the reliable path.
