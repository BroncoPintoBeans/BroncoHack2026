# Frontend / UX — BroncoHack 2026

> Reference: [`docs/plan/architecture.md`](../plan/architecture.md) · [`docs/plan/platform-feature-contracts.md`](../plan/platform-feature-contracts.md) · [`docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`](../superpowers/specs/2026-04-22-bronco-repair-desk-design.md)

## 1. Your mission

Own everything the demo audience sees on the phone and laptop — camera capture, intake page, agent timeline, verdict card with safety banner, helper map. The judging criteria for both the Sustainability track and the AI/ML prize are decided here.

## 2. Files you own

> **Prototype note:** The working prototype lives at `bronco-repair-desk/` and was scaffolded with **Next.js 16** (not Next.js 15 as originally planned). All page files below follow Next.js App Router conventions.

**Core repair desk (original scope):**
- `app/(app)/new/page.tsx` (camera intake — phone hero)
- `app/(app)/case/[id]/page.tsx` (live verdict view)
- `app/(app)/demo/page.tsx` (director view — stretch only)
- `app/(app)/layout.tsx` · `app/layout.tsx` · `app/globals.css`
- `components/ui/**` (shadcn primitives)
- `components/camera/CameraCapture.tsx`
- `components/timeline/AgentTimeline.tsx`
- `components/verdict/{VerdictCard,RRRBadge,SafetyBanner,UncertaintyNote}.tsx`
- `components/map/HelperMap.tsx`
- `components/demo/DirectorView.tsx`
- `hooks/{useCaseRun,useRealtimeEvents,useCamera}.ts`
- `tailwind.config.ts`

**Marketplace & platform pages (prototype-added):**
- `app/page.tsx` (landing page — marketplace preview + repair verdict preview)
- `app/marketplace/page.tsx` (campus marketplace grid)
- `app/marketplace/[id]/page.tsx` (item detail)
- `app/repair/[id]/page.tsx` (agent consultation workspace — desktop-first)
- `app/dashboard/page.tsx` (repair student dashboard)
- `app/messages/page.tsx` (messaging — two-column conversation + chat)
- `app/rewards/page.tsx` (rewards & impact dashboard)
- `app/create-listing/page.tsx` (4-step listing creation form)
- `components/Navbar.tsx` (shared navigation across all routes)

**Design system in use (prototype):**
- Fonts: Manrope (headings) + Work Sans (body) — loaded from Google Fonts
- Colors: Primary `#1b4332`, Deep green `#012d1d`, Background `#f9faf2`, Accent `#ffca98` (peach)

## 3. Features you ship

### `F-fe-baseline` (cut-floor)
- **Done when** — Tailwind + shadcn installed and a base layout renders on phone (375px) and laptop (1280px). Color tokens defined for verdict tiers (green/amber/red) + Flash/Pro model badges.
- **Depends on** — none.
- **Cut-rule** — *cannot cut*. Foundation.

### `F-fe-intake` (cut-floor)
- **Done when** — `/new` page collects: **category** dropdown (`laptop` / `bicycle` / `e_scooter` / `mini_fridge`), **symptoms** text area, **urgency** picker (low / normal / urgent), optional model/serial number, optional cost quote, and up to **3 images** via `F-fe-camera` (or file-picker fallback). Flow: `POST /api/cases` → `POST /api/cases/[id]/media` × N → `POST /api/cases/[id]/run` → redirect to `/case/[id]`. Form validates inputs via Zod before submit; submit is disabled until required fields + ≥1 image present.
- **Depends on** — SF-4 (API contracts) + `F-api-media`.
- **Cut-rule** — *cannot cut*. Entry point.

### `F-fe-verdict` (cut-floor)
- **Done when** — `VerdictCard` renders RRR score + verdict tier + cost comparison (reads `GET /api/cases/[id]/current` for initial snapshot); `RRRBadge` shows tier color; `SafetyBanner` renders amber when `safety_preamble` is non-null (NOT conflated with `uncertainty_note`); `UncertaintyNote` renders separately. All four exist as discrete components.
- **Depends on** — SF-3 (Zod schemas → TS types), `F-api-current`.
- **Cut-rule** — *cannot cut*. The verdict IS the demo.

### `F-fe-timeline` (tier-3 cuttable)
- **Done when** — `AgentTimeline` renders one chip per phase with model-tier badge (Flash/Pro), status (queued/running/complete/failed), and elapsed time. Live-updates via `useRealtimeEvents` → **direct Supabase Realtime subscription** on `case_events` filtered by `case_id` (no SSE proxy).
- **Depends on** — SF-2 (event union), SF-3 (payload shapes).
- **Cut-rule** — degrade to **single progress bar without per-phase chips**. *Hurts AI/ML prize story* — last-resort cut only.

### `F-fe-camera` (tier-3 cuttable)
- **Done when** — `CameraCapture.tsx` opens phone rear camera via `getUserMedia`, captures JPEG ≤ 2 MB, returns blob to caller. Tested on iOS Safari + Android Chrome. Permission denial falls back to file picker automatically.
- **Depends on** — none.
- **Cut-rule** — degrade to **file-picker upload** of pre-staged photo. Less wow but multimodal still demos.

### `F-fe-map` (tier-2 cuttable)
- **Done when** — `HelperMap.tsx` renders leaflet + OSM tiles, plots ≤5 helper pins from helper-routing payload, supports phone touch.
- **Depends on** — SF-3 (helper-routing payload shape).
- **Cut-rule** — degrade to **static list card** of 3 hardcoded CPP shops (shares cut with `F-agent-helpers`).

### `F-fe-marketplace` (tier-2 cuttable)
- **Done when** — `/marketplace` renders a filterable item grid: search bar, category tabs, price range and condition filters (Like New / Good / Used / Repairable), listing type tabs (All / For Sale / Trade / Free / Repair Needed). Each card shows thumbnail, title, condition badge, listing type badge, price (or "Trade" swap-interest label for trade listings, "Free" for giveaways). My Activity sidebar shows the viewer's own active listings and offer count. Impact stats strip (items recirculated, CO₂ saved) renders below the header.
- **Depends on** — `F-api-listings`, SF-4 (API contracts).
- **Cut-rule** — degrade to static mock grid with hardcoded sample items. Repair-desk core still demos.

### `F-fe-marketplace-detail` (tier-2 cuttable)
- **Done when** — `/marketplace/[id]` renders full item view: image gallery, condition badge, listing type, price/trade-for, seller profile card, repair estimate callout (appears when `listing_type = 'repair'`; links to `/repair/[id]` for a Get a Repair Verdict flow), and a Message Seller CTA that opens in-app messaging.
- **Depends on** — `F-fe-marketplace`, `F-fe-messaging`, `F-api-listings`.
- **Cut-rule** — degrade to read-only detail view without messaging or repair-verdict link.

### `F-fe-messaging` (tier-2 cuttable)
- **Done when** — `/messages` renders a two-column layout: thread list (left) and chat pane (right). Supports buyer↔seller negotiation threads initiated from item detail. Messages sent via `POST /api/messages`; thread list and chat pane poll or subscribe for new messages.
- **Depends on** — `F-api-messages`, SF-4.
- **Cut-rule** — degrade to email-link CTA on item detail. Loses in-app negotiation beat.

### `F-fe-rewards` (tier-2 cuttable)
- **Done when** — `/rewards` renders: Green Points balance with earn-rate breakdown per action type (sell +50 pts, trade +40 pts, repair verdict +30 pts, give away +20 pts); redemption partner cards for campus vendors including **Panda Express** and **Pony Express** (each showing point cost and a Redeem button); achievement badge grid (6 badge types, earned vs locked state); leaderboard with viewer's current rank (e.g., ranked #7); CO₂ impact metric and items-recirculated count.
- **Depends on** — `F-api-points`, `F-api-achievements`.
- **Cut-rule** — degrade to static mock rewards page with hardcoded points balance and partner cards.

### `F-fe-create-listing` (tier-2 cuttable)
- **Done when** — `/create-listing` implements a 4-step guided form: **Step 1 Photos** (up to 5 images via file picker or camera), **Step 2 Details** (title, description, category, condition picker), **Step 3 Pricing / Type** (listing type selector: For Sale / Trade / Free / Repair Needed; price field shown only for "For Sale"; trade-for field shown only for "Trade"), **Step 4 Review** (summary before submit). Progress indicator shows current step. Zod validates each step before advancing; submit is disabled until all required fields are filled.
- **Depends on** — `F-api-listings`, `F-api-media`, SF-4.
- **Cut-rule** — degrade to a single-page flat form without step progression.

### `F-fe-student-dashboard` (tier-3 cuttable)
- **Done when** — `/dashboard` renders repair case stats (active cases, resolved count, average repair cost, CO₂ saved) and a case list table with per-case repairability score, status badge, and link to the repair workspace. Reads `GET /api/cases` for the authenticated user.
- **Depends on** — SF-4, `F-api-cases`.
- **Cut-rule** — degrade to a static table of the 4 seeded demo cases. Loses personal tracking beat.

### `F-fe-director` (tier-1 stretch)
- **Done when** — `/demo` route on laptop subscribes to a case ID via direct Supabase Realtime, renders synchronized timeline + verdict for the audience while the phone is the input device.
- **Cut-rule** — drop entirely. Phone-only demo is fine.

## 4. Shape-freezes you publish

None. Frontend consumes SF-1 through SF-4; doesn't publish.

## 5. Inputs you consume

- **SF-1** (Platform `lib/types/case.ts`) — entity types
- **SF-2** (Integration `lib/events/types.ts`) — event union for timeline
- **SF-3** (Agent `lib/agents/schemas.ts`) — payload shapes for verdict / action plan / helpers
- **SF-4** (Integration `lib/types/api.ts`) — typed fetch client for forms

Until each lands, render against `tests/fixtures/demo-cases.ts`. Build the verdict card and timeline against fixture payloads first — swap to live imports when SF-3 ships.

## 6. Non-goals

- Don't add API routes — those belong to Integration (`app/api/**`).
- Don't write to DB directly — call Integration's API endpoints.
- Don't define payload shapes — those are SF-3 (Agent owns).
- Don't build an SSE proxy — subscribe to Supabase Realtime directly.

## 7. Files you touch with announce-first

- `lib/types/**` (rare — should be read-only for Frontend)
- `package.json` (any UI library deps — announce before adding; resist non-shadcn deps; Framer Motion is pre-approved)
- `next.config.js` (image domains for Supabase Storage URLs — coordinate with Platform)

## 8. Raise a flag when…

- iOS Safari camera permissions silently fail (likely PWA/standalone mode bug — switch to file picker).
- Realtime subscription drops repeatedly (coordinate with Integration on RLS / token refresh).
- Verdict card renders empty or wrong tier — almost always a SF-3 type mismatch; check schemas.
- A cut-floor feature is at risk — flag immediately, don't push through.
