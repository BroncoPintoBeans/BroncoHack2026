# Reverse Logistics Routing Plan

Date: 2026-04-26  
Scope: deterministic reverse-logistics recommendation planning for Marketplace and Agent Council handoffs.  
Primary app: `bronco-repair-desk/` Next.js 16 App Router.

## Product Intent

Reverse Logistics Routing gives students deterministic campus guidance for where an item might be repaired, reused, exchanged, or directed for parts-related help. V1 is hardcoded and public-data only. It must not claim official department intake, appointment availability, or acceptance guarantees.

This plan is for separate implementation worktrees. It defines the shared routing contract so Marketplace, Agent Council, UI, and data workers can implement compatible pieces independently.

## Compatibility Contract

Existing Marketplace listings must preserve:

| Field | Requirement |
|---|---|
| `pickupLocation: string` | Keep existing field and behavior. This remains the human-readable location text shown on listings. |
| `pickupLocationId?: string` | Add as optional everywhere a listing pickup location is modeled, serialized, validated, or rendered. Never make it required. |

If `pickupLocationId` is absent, routes must continue to use `pickupLocation` as plain text. If `pickupLocationId` is present, UI may enrich the listing with hardcoded campus metadata and Concept3D map links.

## Planned Data Modules

Create these hardcoded modules in implementation worktrees:

| Module | Responsibility |
|---|---|
| `lib/campus/locations.ts` | Canonical campus location records, display names, text fallback, aliases, and optional category tags. |
| `lib/campus/concept3d.ts` | Concept3D URL builder and map-link helper. All map links must go through this module. |
| `lib/campus/reverse-logistics.ts` | Deterministic item-to-destination rules, priority order, explanation copy, and output assembly. |
| `lib/campus/shuttle-routes.ts` | Public shuttle-route hints if shown near recommendations. V1 should keep this independent from recommendation correctness. |

Canonical location IDs:

| ID | Planning role |
|---|---|
| `ilab-building-1-room-113` | iLab guidance for project parts, prototyping, and mechanical/material work. |
| `maker-studio-library-15-2f` | Maker Studio guidance for library-based project, maker, and fabrication support. |
| `it-tech-help-library-2f` | Advanced Computing / IT guidance for electronics, server-computing, troubleshooting, and technical support. |
| `bronco-bookstore-tech-building-66` | Bookstore/tech guidance for repair help, replacement parts, and technology accessories. |
| `marketplace-exchange-public-meetup` | Public meetup guidance for usable-item exchange. |

## Input Fields

The routing function should accept a normalized item snapshot. V1 must work with partial listings and should not require every field.

```ts
type ReverseLogisticsInput = {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  condition?: string
  listingType?: 'sell' | 'trade' | 'free' | 'repair-needed' | string
  pickupLocation?: string
  pickupLocationId?: string
  repairNeed?: boolean
  partsNeed?: boolean
  exchangeIntent?: boolean
  agentCategory?: string
  agentRootCause?: string
  safetyFlags?: string[]
}
```

Field interpretation:

| Field | Use |
|---|---|
| `title`, `description`, `category`, `tags` | Keyword and category matching. Normalize to lowercase, trim punctuation, and evaluate deterministically. |
| `condition`, `listingType` | Detect still-usable exchange versus repair/parts intent. |
| `pickupLocation`, `pickupLocationId` | Existing listing pickup context. These fields do not override the recommended destination. |
| `repairNeed`, `partsNeed`, `exchangeIntent` | Explicit boolean hints from UI or Agent Council. These outrank keyword inference. |
| `agentCategory`, `agentRootCause`, `safetyFlags` | Optional Diagnose context. Use only public-safe summary values. |

## Output Shape

The recommendation result should be serializable and UI-ready:

```ts
type ReverseLogisticsRecommendation = {
  primary: {
    locationId: CampusLocationId
    label: string
    reason: string
    mapUrl?: string
    mapTextFallback: string
  }
  alternatives: Array<{
    locationId: CampusLocationId
    label: string
    reason: string
    mapUrl?: string
    mapTextFallback: string
  }>
  ruleId: string
  confidence: 'high' | 'medium' | 'low'
  explanation: string
  disclaimer: string
}
```

`mapUrl` must be produced by `lib/campus/concept3d.ts`. `mapTextFallback` must be available for no-JS, broken-link, screen-reader, and copy/paste contexts. The fallback should include the display name and building/floor/room text when known.

## Deterministic Rule Priorities

Evaluate rules in this exact order. Stop at the first high-confidence explicit match. For keyword-only matches, collect candidate scores and use the tie-breaker order below.

| Priority | Rule | Primary destination | Alternatives |
|---|---|---|---|
| 1 | Explicit still-usable exchange: `exchangeIntent=true`, `listingType` is `sell`/`trade`/`free`, or condition says usable/working, and no repair/parts signal is present. | `marketplace-exchange-public-meetup` | None by default. |
| 2 | Explicit electronics/server-computing repair or troubleshooting. | `it-tech-help-library-2f` | `bronco-bookstore-tech-building-66` when parts, accessories, or replacement terms appear. |
| 3 | Explicit electronics/server-computing parts or replacement need. | `bronco-bookstore-tech-building-66` | `it-tech-help-library-2f` for technical triage. |
| 4 | Explicit mechanical, material, prototype, lab, tool, 3D print, soldering, wiring, enclosure, or project-parts need. | `ilab-building-1-room-113` | `maker-studio-library-15-2f`. |
| 5 | Explicit maker/library/fabrication context. | `maker-studio-library-15-2f` | `ilab-building-1-room-113`. |
| 6 | Generic repair help or replacement parts with no category. | `bronco-bookstore-tech-building-66` | `it-tech-help-library-2f`, then `ilab-building-1-room-113`. |
| 7 | Keyword-only electronics/server-computing match. | `it-tech-help-library-2f` | `bronco-bookstore-tech-building-66`. |
| 8 | Keyword-only mechanical/material/project match. | `ilab-building-1-room-113` | `maker-studio-library-15-2f`. |
| 9 | Keyword-only usable/exchange match. | `marketplace-exchange-public-meetup` | None by default. |
| 10 | Unknown or ambiguous item. | `marketplace-exchange-public-meetup` | `it-tech-help-library-2f`, `ilab-building-1-room-113`. |

Keyword groups:

| Group | Example terms |
|---|---|
| Electronics/server-computing | laptop, desktop, pc, macbook, chromebook, monitor, phone, tablet, charger, cable, gpu, cpu, motherboard, ram, ssd, server, networking, router, keyboard, mouse, printer, firmware, software, boot, battery, screen. |
| Mechanical/material/project | bike, skateboard, scooter, hinge, bracket, frame, enclosure, plastic, metal, wood, acrylic, fastener, screw, bolt, bearing, motor, sensor, arduino, raspberry pi, prototype, 3d print, laser cut, solder, wiring. |
| Repair/parts need | broken, repair, fix, troubleshoot, diagnose, replacement, part, parts, missing, damaged, cracked, won't turn on, not charging, jammed, stripped. |
| Still usable/exchange | working, usable, good condition, functional, gently used, free, trade, sell, giveaway, available, spare. |

Tie-breaker order for equal keyword scores:

1. Repair/parts signals outrank usable/exchange signals.
2. Electronics/server-computing outranks generic repair.
3. Mechanical/material/project outranks generic exchange.
4. `it-tech-help-library-2f` outranks `bronco-bookstore-tech-building-66` unless `partsNeed=true`.
5. `ilab-building-1-room-113` outranks `maker-studio-library-15-2f` unless maker/library terms are present.
6. If still tied, use `marketplace-exchange-public-meetup` with `confidence='low'`.

## Explanation Copy

Use short deterministic copy. Do not let an LLM invent location policies.

| Rule family | Explanation |
|---|---|
| Electronics troubleshooting | "This looks like an electronics or computing issue, so the recommendation points you toward campus tech guidance first." |
| Electronics parts | "This looks like a technology parts or replacement need, so the recommendation starts with bookstore/tech guidance and includes IT as a triage option." |
| Mechanical/material/project | "This looks like a project, material, or mechanical repair need, so the recommendation points you toward campus prototyping and maker support." |
| Repair help generic | "This looks like a repair or replacement-parts request, so the recommendation starts with general campus tech guidance and includes alternatives for triage." |
| Usable exchange | "This appears to still be usable, so the recommendation keeps it in the marketplace exchange flow." |
| Unknown | "There is not enough item detail for a precise match, so this recommendation uses the public marketplace meetup and shows guidance alternatives." |

## Safety And Acceptance Disclaimers

Every recommendation surface must include disclaimer copy near the map/link:

> Recommendation only. This is campus guidance based on public information and item details, not an official acceptance guarantee from any department or location. Check posted hours, rules, and staff guidance before bringing an item.

If `safetyFlags` contains electrical, battery, chemical, heat, pressure, sharp, biohazard, or unknown-high-risk values, prepend:

> Safety first: do not transport, open, power on, or repair the item if it may be hazardous. Follow campus safety guidance and ask qualified staff before handling it.

V1 must not recommend disposal paths for hazardous waste, batteries, chemicals, pressurized items, or biohazards unless an approved campus source is added later.

## Edge Cases

| Case | Behavior |
|---|---|
| Missing title/category/description | Return unknown fallback with `confidence='low'`. |
| Existing listing has only `pickupLocation` | Preserve the string and do not infer a `pickupLocationId` unless it exactly matches a known alias. |
| Unknown `pickupLocationId` | Ignore enrichment, keep `pickupLocation`, and log or surface a non-blocking validation warning in tests. |
| Item is usable but also says repair or parts | Route to repair/parts because safety and help intent outrank exchange. |
| Electronics item asks for both troubleshooting and parts | Primary `it-tech-help-library-2f`; include `bronco-bookstore-tech-building-66` alternative. If `partsNeed=true`, swap primary and alternative. |
| Mechanical item includes electronics terms | If electronics terms are embedded in a project/prototype context, route to iLab first with IT as an optional alternative only if troubleshooting terms are present. |
| Official-hours unavailable | Show text fallback and disclaimer only. Do not fabricate hours. |
| Concept3D helper cannot build a URL | Render no link, keep `mapTextFallback`, and retain the recommendation. |
| Agent Council text contains private details | Pass only normalized category/root-cause keywords into routing; never expose private case notes in marketplace recommendation copy. |

## Task Sequence

1. Add or consume `lib/campus/locations.ts` with the full seven-location registry from `docs/plan/campus-location-contract.md`; this routing module uses the five destination IDs but must not create a duplicate five-location registry.
2. Add `lib/campus/concept3d.ts` with a single URL helper used by all campus map links.
3. Add `lib/campus/reverse-logistics.ts` with input normalization, rule evaluation, deterministic tie-breaking, output assembly, explanation copy, and disclaimers.
4. Add optional `pickupLocationId?: string` to listing TypeScript types, schemas, API payloads, mock data, and fixtures while preserving `pickupLocation: string`.
5. Update listing create/edit UI to store `pickupLocationId` when the user picks a known campus location and keep custom text in `pickupLocation`.
6. Update listing detail and recommendation UI to show primary destination, alternatives, map link, text fallback, confidence, and disclaimer.
7. Wire Agent Council handoff code to pass public-safe category/root-cause hints into the routing function when creating marketplace or repair-needed recommendations.
8. Add `lib/campus/shuttle-routes.ts` only as a display hint source; do not make shuttle data required for recommendation output.
9. Run focused unit tests, UI tests, and typecheck before merging each worktree.

## Focused Tests

### Unit Tests

| Test | Expected result |
|---|---|
| Working laptop with `exchangeIntent=true` and no repair terms | Primary `marketplace-exchange-public-meetup`, high confidence. |
| Laptop "not charging" with `repairNeed=true` | Primary `it-tech-help-library-2f`, alternative `bronco-bookstore-tech-building-66`. |
| Phone screen replacement with `partsNeed=true` | Primary `bronco-bookstore-tech-building-66`, alternative `it-tech-help-library-2f`. |
| 3D printed bracket project | Primary `ilab-building-1-room-113`, alternative `maker-studio-library-15-2f`. |
| Maker Studio/library wording | Primary `maker-studio-library-15-2f`, alternative `ilab-building-1-room-113`. |
| Generic "need repair help" | Primary `bronco-bookstore-tech-building-66`, alternatives include IT and iLab. |
| Usable item with repair keyword | Repair route wins over exchange. |
| Unknown item | Marketplace meetup fallback, low confidence, alternatives included. |
| Existing listing without `pickupLocationId` | Existing `pickupLocation` renders unchanged. |
| Concept3D helper failure | Text fallback still renders and no recommendation is dropped. |

### UI Tests

| Surface | Assertion |
|---|---|
| Listing create/edit | Known campus location saves both `pickupLocation` and optional `pickupLocationId`; custom text saves only `pickupLocation`. |
| Listing detail | Recommendation card shows primary destination, disclaimer, map link when available, and text fallback. |
| No-JS or broken map URL state | Text fallback remains visible. |
| Repair-needed listing from Agent Council | Public-safe explanation copy appears without private case notes. |
| Mobile layout | Primary destination, alternatives, and disclaimer fit without overlapping controls. |

### Compatibility Tests

| Test | Expected result |
|---|---|
| Existing listing fixture missing `pickupLocationId` | Validation passes. |
| API response with `pickupLocationId` omitted | Client renders without branching errors. |
| API response with unknown `pickupLocationId` | Client ignores enrichment and keeps text location. |
| Serialized recommendation output | Contains `primary`, `alternatives`, `ruleId`, `confidence`, `explanation`, and `disclaimer`. |
