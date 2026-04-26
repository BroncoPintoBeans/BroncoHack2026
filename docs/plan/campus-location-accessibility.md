# Campus Location Accessibility And Safety Plan

This plan hardens Campus Map Reverse-Logistics and Green Shuttle location flows for accessibility, safety, and public-data-only V1 constraints. It aligns with the platform contract in [`platform-feature-contracts.md`](platform-feature-contracts.md): map embeds must be optional enhancements, pickup location text remains sufficient to complete a listing, and recommendations must read as guidance rather than official guarantees.

## Source Links

Use official CPP sources when linking users away from the app:

| Source | URL | Use |
|---|---|---|
| CPP campus map | `https://www.cpp.edu/maps/?id=1130` | Default text fallback for campus locations. |
| CPP accessible text map | `https://www.cpp.edu/maps/text/index.shtml` | Preferred fallback for screen-reader and no-iframe users. |
| CPP campus map accessibility page | `https://www.cpp.edu/maps/accessibility.shtml` | Disclosure link for known map accessibility limitations and workarounds. |
| CPP accessibility statement | `https://www.cpp.edu/accessibility.shtml` | General digital accessibility and barrier-reporting link. |
| CPP Disability Resource Center | `https://www.cpp.edu/drc/` | Accessibility support and accommodation resource. |
| CPP Bronco Express Shuttle | `https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml` | Shuttle stops, schedules, and official tracker link. |

Do not create route claims beyond what official sources publish. If an exact accessible route is unknown, copy must tell users to consult the CPP campus map, DRC, Transportation Services, or the official shuttle page.

## Scope

### In Scope For V1

- Hardcoded public pickup location catalog using the canonical `CampusLocation` shape from [`campus-location-contract.md`](campus-location-contract.md), with display labels and short descriptions derived for UI where needed.
- Location picker for listing creation and reverse-logistics suggestions.
- Text-only location details that work without map iframe support.
- Green Shuttle guidance based on public shuttle stops and schedules.
- Safety and accessibility copy for public meetups.
- Manual and automated accessibility tests for the location picker, map embed wrapper, and fallback content.

### Out Of Scope For V1

- Live navigation, real-time routing, turn-by-turn directions, or travel-time guarantees.
- User location tracking, geolocation prompts, or background location collection.
- Verified ADA route generation unless a future official CPP data source provides it.
- Private or hidden pickup points, dorm-room pickup, vehicle pickup, or isolated outdoor locations.
- Requiring `pickupLocationId` to submit, edit, complete, or archive a listing.

## Data Contract

Listing payloads must preserve the current compatibility shape:

```ts
type ListingLocationFields = {
  pickupLocation: string;
  pickupLocationId?: string;
};
```

Rules:

- `pickupLocation` is the durable user-facing field and must remain required wherever a listing needs pickup text.
- `pickupLocationId` is optional metadata for known CPP public locations. It improves recommendations, map links, and shuttle hints but cannot be required to complete a listing.
- Unknown or custom public locations are allowed if they pass safety copy and validation rules.
- Do not backfill a guessed `pickupLocationId` from free text unless the user selected an exact known option.
- API validation may warn on unsafe wording, but must not reject a listing solely because `pickupLocationId` is absent.

## Location Picker Behavior

The picker must be usable as a keyboard-first form control and understandable through screen readers.

### Interaction Model

Preferred V1 control: a searchable combobox backed by a native input and listbox, with a plain text fallback.

Keyboard behavior:

| Key | Required behavior |
|---|---|
| `Tab` | Moves focus into the picker input, then to the next actionable control. Focus must not enter the map iframe by default. |
| `Shift+Tab` | Moves focus back to the previous control without trapping focus in the picker. |
| `ArrowDown` / `ArrowUp` | Opens the listbox and moves through visible location options. |
| `Enter` | Selects the highlighted option. If no option is highlighted, keeps the typed text. |
| `Escape` | Closes the listbox and restores focus to the input. |
| Printable characters | Filter options without losing typed custom text. |
| `Home` / `End` | Moves caret in the input when the listbox is closed; moves to first or last option when the listbox is open. |

Selection rules:

- Selecting a known option sets both `pickupLocation` and `pickupLocationId`.
- Editing selected text after selection clears `pickupLocationId` unless the value still exactly matches the selected known option.
- A visible "Use typed location" option must be available when the typed value does not exactly match a known location.
- The submit button must work with typed `pickupLocation` and no `pickupLocationId`.

### Screen-Reader Labels

Required labels and descriptions:

- Input accessible name: "Pickup location".
- Helper text ID referenced by `aria-describedby`: "Choose a public campus pickup point or type one. Avoid private or isolated locations."
- Listbox accessible name: "Suggested campus pickup locations".
- Option names must be concise and unique, such as "Student Services Building" or "University Library entrance".
- Option descriptions may include public context, such as "well-lit public area" or "near shuttle stop", but must not claim official safety approval.
- Selected known option confirmation should be announced through an `aria-live="polite"` region: "Pickup location selected: Student Services Building."
- Validation errors should use `aria-invalid="true"` and an error element referenced by `aria-describedby`.

Do not rely on placeholder text as the only label. Visible labels are required.

## Map Iframe And Fallback Contract

Every map iframe or embedded map must include:

- A unique, descriptive `title`, such as `title="Map of Student Services Building pickup area"`.
- A visible text fallback link immediately adjacent to the embed: "Open this location in the CPP campus map".
- A second fallback link to the accessible text map where useful: "Use the CPP accessible text map".
- Readable directions or nearby landmarks in plain text outside the iframe.
- A no-iframe route or state that renders the same location details without any embedded map.

Implementation expectations:

- The iframe is progressive enhancement. The listing or recommendation must remain understandable when iframes are blocked, JavaScript is disabled, or the map provider fails.
- The iframe should be wrapped in a section with a visible heading, not used as the only way to identify the meetup point.
- Iframe focus should be opt-in through a clearly labeled button or link. Users should not tab through an embedded map unless they intentionally open it.
- If an iframe fails to load, show the fallback links and text directions without retry loops or motion-heavy spinners.
- If the CPP campus map has known accessibility limitations, include a nearby link to CPP's campus map accessibility page.

Example fallback copy:

> Map unavailable. Use the CPP campus map or accessible text map for campus location details. This app provides meetup guidance only and does not verify accessible routes.

## No-JS And Reduced-Motion Fallbacks

### No JavaScript

No-JS users must be able to:

- Type `pickupLocation` in a standard text input.
- Submit a listing without a selected location ID.
- See a server-rendered list of common public pickup points.
- Open official CPP map, accessible text map, DRC, and shuttle links.
- Read safety guidance before submitting.

No-JS users may lose autocomplete, inline filtering, and dynamic shuttle hints. They must not lose the ability to complete the core listing flow.

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- Disable animated map panel transitions, route-line drawing, pulsing markers, and auto-scrolling recommendation carousels.
- Replace animated loading states with static text.
- Keep focus movement deterministic; do not smooth-scroll focus into hidden panels.
- If shuttle estimates update after a selection, update text in place and announce through `aria-live="polite"` without animated counters.

## Public Meetup Safety Copy

Location recommendations are safety guidance, not official acceptance guarantees. Copy must avoid implying that CPP, Transportation Services, DRC, or the app has officially approved a meetup.

Required baseline copy near pickup selection:

> Meet in a public, visible campus area during normal campus activity hours. Avoid dorm rooms, vehicles, private offices, empty lots, stairwells, isolated outdoor areas, or locations that require someone to be alone.

Recommended copy for listing details:

> This pickup suggestion is guidance only. Confirm the exact meetup point with the other person, choose a public visible area, and use official CPP resources for campus access, shuttle, and accessibility questions.

Unsafe private or isolated locations should trigger a non-blocking warning unless the content is clearly dangerous. Examples:

| User text pattern | UX response |
|---|---|
| "my dorm", "room", "apartment", "car", "parking garage level" | Warn: "For safety, choose a public campus area instead of a private or isolated location." |
| "behind", "stairwell", "empty lot", "after midnight" | Warn and suggest known public alternatives. |
| Threatening or coercive text | Block submission under general safety policy, independent of location planning. |

The app should suggest alternatives such as Student Services Building, library-adjacent public areas, dining/marketplace public areas, or official shuttle stops only when those are present in the hardcoded public catalog.

## ADA And Accessibility Route-Link Strategy

The app may link to accessibility resources, but must not invent verified ADA routes.

Rules:

- Prefer official CPP accessibility and map resources over generated route claims.
- If a location has a known official CPP map page or text-map entry, link to it.
- If exact accessible route details are unknown, say: "For accessible route details, consult the CPP campus map, Disability Resource Center, or Transportation Services."
- Do not use phrases like "ADA-safe route", "wheelchair guaranteed", "fully accessible path", or "approved accessible route" unless directly backed by an official CPP source for that exact route.
- Where shuttle stops are mentioned, link to the Bronco Express Shuttle page and label estimates as schedule-based or approximate.
- Keep DRC links informational; do not imply DRC approves marketplace meetups or shuttle recommendations.

Location cards should derive from the canonical `CampusLocation` model. UI-only fields may be projected for rendering, but they must not replace the shared campus data contract:

```ts
type PublicCampusLocationView = {
  id: CampusLocationId;
  name: string;
  types: CampusLocationType[];
  campusArea: CampusArea;
  publicDescription: string;
  cppMapUrl: string;
  cppTextMapUrl?: string;
  accessibilityResourceUrl?: string;
  shuttleResourceUrl?: string;
  safetyNotes: string[];
  accessibilityNotes: string[];
};
```

`accessibilityNotes` must contain cautious language unless sourced from official CPP content. Example:

> Exact accessible route not verified in this app. Consult the CPP campus map, DRC, or Transportation Services before relying on this meetup point.

## Green Shuttle Guidance

Green Shuttle recommendations should help users identify lower-impact campus pickup options without acting as live navigation.

Rules:

- Label all shuttle timing as estimates: "Estimated from public shuttle schedule" or "Approximate shuttle guidance".
- Link to the official Bronco Express Shuttle page for current stops, schedules, service breaks, and tracker.
- Do not present the app's recommendation as live route planning.
- If the official tracker is linked, label it as the official tracker and do not proxy or scrape it in V1.
- If schedules are not available, show "Check CPP Transportation for current shuttle service" instead of stale timing.
- Shuttle guidance must never override safety or accessibility copy. A closer shuttle stop is not recommended if the location is private, isolated, or described as unsafe.

Example shuttle copy:

> Approximate shuttle guidance: this pickup point may be near a Bronco Express stop. Check CPP Transportation for current service, stop order, holidays, and live tracker availability.

## Ownership Boundaries

| Area | Owner | Boundary |
|---|---|---|
| Location accessibility plan | Documentation worker | This file only. |
| Marketplace listing schema | Platform / API owner | Preserve `pickupLocation: string`; `pickupLocationId?: string` stays optional. |
| Location picker UI | Frontend owner | Keyboard, screen-reader, no-JS, reduced-motion behavior. |
| Hardcoded public location catalog | Frontend or shared-data owner by implementation decision | Public data only; no private locations or invented route verification. |
| Shuttle copy and links | Frontend/content owner | Public schedule guidance only; no live navigation claims. |
| Safety warning policy | Safety/content owner | Public meetup copy, unsafe pattern warnings, official-resource disclaimers. |
| Official CPP source updates | Release owner | Validate links before release; do not silently replace source meaning. |

Any implementation that edits shared types, API contracts, migrations, or listing completion behavior must announce first and preserve backward compatibility with existing listing records that only have `pickupLocation`.

## Acceptance Criteria

### Data Compatibility

- Creating a listing succeeds with `pickupLocation="Student Services Building"` and no `pickupLocationId`.
- Editing a listing with only `pickupLocation` does not force the user into the location picker.
- Completing a listing does not require `pickupLocationId`.
- Selecting a known public location stores both the display string and optional ID.
- Editing selected text clears stale IDs unless the known option still exactly matches.

### Keyboard Accessibility

- A keyboard-only user can open, filter, select, clear, and submit the picker.
- `Escape` closes the listbox and leaves focus on the input.
- Focus order is predictable and never trapped in the picker, iframe, map panel, or shuttle hint.
- Iframe focus is opt-in through a labeled control or external link.

### Screen-Reader Accessibility

- The picker has a visible label and accessible name.
- Helper, error, and selected-location status text are programmatically associated with the input.
- The listbox and options expose clear names.
- Selection changes and validation errors are announced politely.
- Map content has a descriptive iframe title plus text directions and fallback links outside the iframe.

### Fallbacks

- With JavaScript disabled, users can type a pickup location, read safety copy, submit the listing, and open CPP source links.
- With iframes blocked, location details remain readable and include CPP map and accessible text map links.
- With reduced motion enabled, no pulsing markers, animated route lines, or auto-scrolling recommendation panels run.

### Safety And Copy

- Public meetup guidance appears during listing creation and on listing details.
- Unsafe private or isolated location text produces a warning and public alternatives.
- Recommendations are labeled as guidance only, not official guarantees.
- Accessibility copy never claims verified ADA access unless an exact official source supports it.
- Shuttle hints are labeled as estimates only and link to CPP Transportation.

## Test Plan

### Automated Tests

- Unit test location field validation to prove `pickupLocation` is required and `pickupLocationId` is optional.
- Unit test selected-option behavior: known option sets ID, edited text clears ID, custom text submits without ID.
- Component test picker keyboard behavior for `Tab`, `ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Home`, and `End`.
- Component test ARIA wiring: label, description, error, listbox name, option names, `aria-invalid`, and live region.
- Component test iframe wrapper: required `title`, fallback URL, accessible text map link, readable directions, and no-iframe state.
- Unit test safety pattern warnings for private or isolated location phrases.
- Unit test shuttle copy to assert estimate language appears with every shuttle hint.

### Manual QA

- Navigate listing creation using keyboard only at 100 percent and 200 percent zoom.
- Run at least one screen-reader smoke test with VoiceOver or NVDA: type a location, select a suggestion, trigger a warning, and submit.
- Disable JavaScript and confirm the plain text location field, public pickup list, safety copy, and official links remain available.
- Block iframes or simulate map load failure and confirm fallback links and directions render.
- Enable reduced motion and confirm map/recommendation animations are disabled.
- Test mobile viewport at 375px width: labels, warnings, fallback links, and submit controls must not overlap.
- Review all location and shuttle copy for official-guarantee language before release.

### Release Checks

- Verify official CPP links still resolve before demo or deployment.
- Confirm all hardcoded locations are public campus areas.
- Confirm no user-facing text says the app verifies ADA routes, official acceptance, live shuttle navigation, or guaranteed safety.
- Confirm existing listings without `pickupLocationId` still render, edit, and complete.
