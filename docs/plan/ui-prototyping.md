# Bronco Repair Desk — UI Prototyping Spec

---

## 0. Document Purpose + Consumption Model

This document is the single source of truth for every screen, component, motion spec, and design token in Bronco Repair Desk. It is structured to be fed directly into Google Stitch for AI-to-Figma frame generation, then refined interactively inside Figma.

**Stitch consumption model:**
1. Feed this document section by section into Stitch as design prompts. Start with Section 2 (tokens) to define the Figma library before generating frames.
2. Generate component frames from Section 3 first (isolated, no screen context).
3. Generate screen frames from Section 5 using the ASCII wireframes as layout anchors.
4. In Figma: swap Stitch-generated fills with the exact token values in Section 2, wire navigation using the map in Section 4, and apply motion specs from Section 6 via Framer Motion in the implemented codebase.

**Figma naming convention:** Frames use `[ScreenID]/[Viewport]` (e.g., `S2/Phone`, `S3/Laptop`). Components use `[ComponentName]/[Variant]/[State]` (e.g., `RRRBadge/repair_now/default`).

**Design constraints locked:**
- Framework: Next.js 16 App Router (updated for S7–S13)
- Styling: Tailwind CSS v4 + shadcn/ui (updated for S7–S13)
- Motion: Framer Motion (spring physics + AnimatePresence + LayoutGroup)
- Breakpoints: 375px (primary), 768px (tablet), 1280px (laptop)
- Dark mode: light + dark tokens defined together

---

## 1. Design Philosophy

Bronco Repair Desk earns trust by making the invisible visible. Students arrive skeptical — Geek Squad quotes are opaque, repair shops upsell, and "just buy a new one" feels like the safe default. The interface counters this by surfacing the AI's reasoning at every step: you watch the agents work, you see which model handled what and why, and the final verdict shows its math. Nothing is hidden. The visual language must reinforce this transparency through clarity and restraint — not the sterile cold clarity of enterprise dashboards, but the warm, grounded clarity of a trusted advisor who shows their work.

The aesthetic direction draws from the Calistoga/Inter pairing recommended by ui-ux-pro-max (query: "sustainability repair AI tool mobile-first trust warm") with a deliberate modification: the nearly-black dark mode recommendation is inverted to a warm off-white light mode primary. This serves the sustainability track — green is earned, not decorative. The palette uses forest green (`#166534`) for repair verdicts and a carefully staged amber (`#D97706`) exclusively for safety banners, so the amber never feels like generic "warning UX." The result is a product that feels like it was designed specifically for CPP students: direct, honest, slightly earthy, technically capable. As the frontend-design skill demands: one clear conceptual direction, executed with precision and no generic AI aesthetics.

---

## 2. Design Tokens

### 2.1 Color Palette

Palette adopted from ui-ux-pro-max color query (sustainability/trust/warm) with modifications: light mode primary, forest green accent, distinct amber for safety. Rule IDs applied: `color-semantic` (§6), `dark-mode-pairing` (§4), `color-accessible-pairs` (§6).

#### Raw tokens

| Token name | Light value | Dark value | Notes |
|---|---|---|---|
| `--color-background` | `#FAFAF8` | `#0F1A14` | Warm off-white / deep forest |
| `--color-surface` | `#FFFFFF` | `#162012` | Card backgrounds |
| `--color-surface-muted` | `#F4F4F0` | `#1C2A1E` | Subtle section dividers |
| `--color-foreground` | `#1A1A18` | `#EDF3EE` | Body text |
| `--color-foreground-muted` | `#64748B` | `#94A3B8` | Labels, captions |
| `--color-border` | `#E2E8E0` | `#2D3F30` | Dividers, input borders |
| `--color-ring` | `#166534` | `#22C55E` | Focus rings |

#### Semantic tokens

| Token name | Light value | Dark value | Used for |
|---|---|---|---|
| `--color-primary` | `#166534` | `#22C55E` | Primary actions, repair verdicts |
| `--color-primary-fg` | `#FFFFFF` | `#0F1A14` | Text on primary |
| `--color-primary-subtle` | `#F0FDF4` | `#14401C` | Repair badge backgrounds |
| `--color-secondary` | `#1E293B` | `#CBD5E1` | Secondary actions |
| `--color-accent` | `#0369A1` | `#38BDF8` | Model-tier badges (Pro — blue), links |
| `--color-flash` | `#D97706` | `#FCD34D` | Flash model badge |
| `--color-pro` | `#0369A1` | `#38BDF8` | Pro model badge |
| `--color-safety` | `#D97706` | `#F59E0B` | Safety banner background |
| `--color-safety-fg` | `#78350F` | `#FEF3C7` | Safety banner text |
| `--color-safety-border` | `#F59E0B` | `#D97706` | Safety banner border |
| `--color-destructive` | `#DC2626` | `#EF4444` | Replace verdicts, errors |
| `--color-destructive-subtle` | `#FEF2F2` | `#3B0F0F` | Replace badge backgrounds |
| `--color-warning` | `#CA8A04` | `#EAB308` | wait_monitor verdict |
| `--color-warning-subtle` | `#FEFCE8` | `#2D2A00` | wait_monitor badge background |
| `--color-scrim` | `rgba(0,0,0,0.48)` | `rgba(0,0,0,0.64)` | Modal/sheet overlay |

#### Verdict tier color map

| Label | Background token | Text token | Border token |
|---|---|---|---|
| `repair_now` | `--color-primary-subtle` | `--color-primary` | `--color-primary` |
| `repair_if_cheap` | `--color-primary-subtle` | `--color-primary` | `--color-primary` |
| `wait_monitor` | `--color-warning-subtle` | `--color-warning` | `--color-warning` |
| `replace_soon` | `--color-destructive-subtle` | `--color-destructive` | `--color-destructive` |
| `replace_now` | `--color-destructive-subtle` | `--color-destructive` | `--color-destructive` |

### 2.1.1 Marketplace / Platform Palette Extension

These tokens extend §2.1 for the marketplace screens (S7–S13). They co-exist with the existing repair verdict tokens and do not override any repair screen values.

| Token name | Value | Notes |
|---|---|---|
| `--mp-primary` | `#1b4332` | Marketplace primary — dark green CTA buttons, filled badges |
| `--mp-deeper` | `#012d1d` | Deeper green — pill buttons (case ID, "List an Item"), icon accents |
| `--mp-bg` | `#f9faf2` | Page background — warm off-white (identical to `--color-background` light) |
| `--mp-section` | `#f3f4ec` | Section/sidebar background, inner card backgrounds |
| `--mp-accent-peach` | `#ffca98` | CTA peach highlight buttons, "My Listings" pill |
| `--mp-peach-light` | `#ffdcbd` | Light peach — Repairable condition badge background |
| `--mp-green-light` | `#c1ecd4` | Light green — Like New condition badge, Intake Agent COMPLETE badge, earned achievement borders |
| `--mp-border-light` | `#e2e3db` | Light border — card dividers, Free listing badge background |
| `--mp-border-mid` | `#c1c8c2` | Medium border — input outlines, table rules |
| `--mp-text-primary` | `#1a1c18` | Primary text |
| `--mp-text-secondary` | `#414844` | Secondary text — descriptions, metadata |
| `--mp-text-muted` | `#717973` | Muted — timestamps, captions, dimmed states |
| `--mp-stat-dark` | `#1b4332` | Dark stat card background (Active Cases, Green Points) |
| `--mp-stat-gray` | `#e2e3db` | Gray stat card background (CO₂ Saved, CO₂ Prevented) |

**Typography additions for marketplace:**
- Headings: **Manrope** (weight 600–800) replaces Calistoga for marketplace screens, giving a modern, structured feel that complements the sustainability brand.
- Body: **Work Sans** (weight 400–500) replaces Inter for marketplace body text.
- Both fonts loaded via Google Fonts alongside existing Calistoga/Inter import.

**Border radius additions (marketplace-specific context):**
- `9999px` — pill/button radius (same as `radius-full`); used extensively in marketplace CTAs
- `8px` — input corners, small badges
- `12px` — standard marketplace cards
- `16px` — large listing cards, modal cards

---

### 2.2 Typography Scale

Pairing adopted: **Calistoga** (display/headings) + **Inter** (body/UI) from ui-ux-pro-max design system query. Calistoga provides warm editorial character for hero headings and the verdict label; Inter provides readable neutrality for all data, labels, and forms. Rule IDs applied: `font-pairing` (§6), `font-scale` (§6), `weight-hierarchy` (§6), `readable-font-size` (§5).

JetBrains Mono added for numeric data (RRR score, cost figures) per `number-tabular` rule.

Google Fonts import:
```
@import url('https://fonts.googleapis.com/css2?family=Calistoga:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Scale name | Font | Size | Weight | Line-height | Letter-spacing | Usage |
|---|---|---|---|---|---|---|
| `display` | Calistoga | 36px / 2.25rem | 400 | 1.1 | -0.02em | Hero headings, verdict label on desktop |
| `h1` | Calistoga | 28px / 1.75rem | 400 | 1.2 | -0.015em | Page titles |
| `h2` | Inter | 22px / 1.375rem | 600 | 1.3 | -0.01em | Section headings |
| `h3` | Inter | 18px / 1.125rem | 600 | 1.4 | 0 | Card titles, agent phase names |
| `body-lg` | Inter | 16px / 1rem | 400 | 1.6 | 0 | Primary body text |
| `body` | Inter | 15px / 0.9375rem | 400 | 1.55 | 0 | Secondary body, descriptions |
| `label` | Inter | 13px / 0.8125rem | 500 | 1.4 | 0.01em | Form labels, badges |
| `caption` | Inter | 12px / 0.75rem | 400 | 1.5 | 0.02em | Timestamps, muted helpers |
| `mono-lg` | JetBrains Mono | 24px / 1.5rem | 500 | 1.2 | -0.01em | RRR score number |
| `mono` | JetBrains Mono | 14px / 0.875rem | 400 | 1.4 | 0 | Cost figures, percentages |

### 2.3 Spacing Scale

4px base unit, 8px grid. Rule ID: `spacing-scale` (§5).

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon gaps, inline padding |
| `space-2` | 8px | Touch target minimum gap |
| `space-3` | 12px | Dense list items |
| `space-4` | 16px | Card padding (mobile), section insets |
| `space-6` | 24px | Card padding (desktop), between components |
| `space-8` | 32px | Section separators |
| `space-12` | 48px | Major section gaps |
| `space-16` | 64px | Hero vertical rhythm |

### 2.4 Radius, Shadow, Elevation

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Badges, chips, input corners |
| `radius-md` | 10px | Cards, buttons |
| `radius-lg` | 16px | Bottom sheets, modals, large cards |
| `radius-full` | 9999px | Pills (model-tier badges), avatar |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Subtle card lift |
| `shadow-md` | `0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)` | VerdictCard, timeline chips |
| `shadow-safety` | `0 0 0 2px var(--color-safety-border), 0 4px 16px rgba(217,119,6,0.15)` | Safety banner glow |
| `shadow-pro` | `0 0 0 1px var(--color-pro), 0 2px 8px rgba(3,105,161,0.2)` | Pro model badge aura |
| `elevation-0` | No shadow | Flat surfaces, backgrounds |
| `elevation-1` | `shadow-sm` | Inactive chips, list items |
| `elevation-2` | `shadow-md` | Active cards, focused elements |
| `elevation-3` | `0 8px 32px rgba(0,0,0,0.12)` | Modals, bottom sheets |

### 2.5 Motion Tokens

Rule IDs applied: `spring-physics` (§7), `duration-timing` (§7), `exit-faster-than-enter` (§7), `stagger-sequence` (§7), `reduced-motion` (§1).

#### Duration tokens

| Token | Value | Usage |
|---|---|---|
| `duration-micro` | 120ms | Press feedback, badge state change |
| `duration-fast` | 200ms | Chip enter, icon swap |
| `duration-base` | 280ms | Card transitions, modal open |
| `duration-slow` | 400ms | Page transition, verdict reveal |
| `duration-exit` | 160ms | Exit animations (exit-faster-than-enter) |

#### Spring configs (Framer Motion)

| Name | Config | Usage |
|---|---|---|
| `spring-snappy` | `{ type:'spring', stiffness:500, damping:30 }` | Button press, badge pop |
| `spring-card` | `{ type:'spring', stiffness:300, damping:28 }` | Card enter, timeline chip |
| `spring-gentle` | `{ type:'spring', stiffness:200, damping:25 }` | VerdictCard reveal, page transitions |
| `tween-fade` | `{ type:'tween', duration:0.22, ease:'easeOut' }` | Opacity-only fades, content swap |
| `tween-slide` | `{ type:'tween', duration:0.28, ease:[0.16,1,0.3,1] }` | Sheet slide-up, bottom drawer |

#### Named Framer Motion variant presets

```
cardEnter: {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring-card }
}

chipEnter: {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: spring-snappy }
  // stagger: 50ms per chip via staggerChildren
}

verdictReveal: {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: spring-gentle }
}

safetyBannerEnter: {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: { opacity: 1, height: 'auto', marginBottom: 16, transition: tween-slide }
}

scoreCountUp: {
  // Framer Motion useMotionValue + animate() from 0 → final score over 600ms
  // spring-gentle; JetBrains Mono for number
}

pageTransition: {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: spring-gentle },
  exit: { opacity: 0, x: -20, transition: tween-fade }
}

badgePop: {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: spring-snappy },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.12 } }
}
```

**Reduced-motion override:** All spring/slide animations collapse to opacity-only fades with `duration-micro` when `prefers-reduced-motion: reduce` is active.

---

## 3. Component Library

### 3.1 RRRBadge

**Purpose:** Communicates the verdict label (repair_now / repair_if_cheap / wait_monitor / replace_soon / replace_now) at a glance. Appears inside VerdictCard and as a standalone summary chip.

**Variants:** By `VerdictLabel` value — 5 variants mapping to the tier color map in §2.1.

**States:** default, loading (skeleton pulse), error (gray, "—").

**Size/spacing:** Height 28px, horizontal padding 10px, `radius-full`, `label` typography (13px/500). Icon: Lucide `wrench` (repair) or `arrow-right-circle` (replace) at 14px, 6px gap before text.

**Framer Motion:** `badgePop` variant. AnimatePresence wraps swaps between loading→populated state.

**Accessibility:** `role="status"`, `aria-label="Verdict: Repair now"`. Color is NOT the only indicator — icon + text present (rule: `color-not-only`).

**Copy examples:**
- `repair_now` — "Repair Now"
- `repair_if_cheap` — "Repair If Cheap"
- `wait_monitor` — "Wait & Monitor"
- `replace_soon` — "Replace Soon"
- `replace_now` — "Replace Now"

---

### 3.2 VerdictCard

**Purpose:** The centrepiece of `/case/[id]`. Renders the full Economics output: RRR score, RRR breakdown table, cost comparison, verdict label, rationale paragraph.

**Variants:** populated, loading (full skeleton), error.

**States:** loading (before economics phase completes) → populated (after `economics|complete` event). No empty state — page should not reach this component until the run starts.

**Layout (375px phone):**
```
┌─────────────────────────────────────┐
│  RRRBadge               [score]     │
│  "repair_now"           0.78        │
│─────────────────────────────────────│
│  RRR Breakdown                      │
│  Confidence          0.30  ██████░  │
│  Cost Factor         0.19  █████░░  │
│  Effort              0.12  ███░░░░  │
│  Parts               0.10  ██░░░░░  │
│  Urgency             0.07  █░░░░░░  │
│─────────────────────────────────────│
│  Repair estimate     $80 – $130     │
│  Comparable refurb   ~$450          │
│─────────────────────────────────────│
│  [Rationale paragraph text]         │
└─────────────────────────────────────┘
```

**Score number:** `mono-lg` (24px JetBrains Mono), color-coded by verdict tier. Animated via `scoreCountUp`.

**RRR breakdown bar:** Each row is a thin progress bar (height 4px, `radius-full`) showing the component value as a fraction of its maximum weight. Bar color matches `--color-primary` for repair, `--color-destructive` for replace. Bars animate width from 0 to final value with `spring-card` stagger, 40ms per row.

**Cost figures:** `mono` typography (14px JetBrains Mono).

**Framer Motion:** `verdictReveal` variant on card mount. `LayoutGroup` id="verdict-card" for shared-element continuity if card transitions between loading and populated.

**Accessibility:** The score number has `aria-label="RRR score 0.78 out of 1"`. Breakdown rows have `role="meter"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax` set to the weight cap for that factor.

---

### 3.3 SafetyBanner

**Purpose:** Displays `action_plans.safety_preamble` when non-null. LOAD-BEARING for the laptop hero demo case. Appears at the TOP of the Action Plan card section, not inside VerdictCard — they are distinct components (per frontend.md: "NOT conflated with uncertainty_note").

**Variants:** battery_swelling (amber), refrigerant_leak (amber), brake_failure (amber), scooter_battery_thermal (amber). All variants use the same amber color scheme. The variant label governs the icon and specific copy.

**States:** hidden (when `safety_preamble` is null — zero height, no DOM presence), visible.

**Size/spacing:** Full-width card. Left icon column: 40px wide, Lucide `alert-triangle` at 20px in `--color-safety`. Right content column: `h3` "Safety First", then `body` copy. Padding 16px. `radius-md` border. Border: 1.5px solid `--color-safety-border`. Background: `--color-safety` at 12% opacity (light) / 8% (dark).

**Demo copy (battery_swelling):**
> "Swollen lithium batteries are a fire risk. Do not press, puncture, or attempt disassembly. Use a professional service only."

**Framer Motion:** `safetyBannerEnter` — animates from `height:0, opacity:0` to `height:auto, opacity:1` when `safety_preamble` arrives. This creates a dramatic reveal in the demo timeline. AnimatePresence wraps the conditional render.

**Accessibility:** `role="alert"` so screen readers announce immediately. `aria-live="assertive"`. Icon has `aria-hidden="true"`; text carries the full meaning.

---

### 3.4 UncertaintyNote

**Purpose:** Renders `verdicts.uncertainty_note` — the weakest-input caveat. Always populated (never null per schema/spec §11.1). Appears below VerdictCard as a small callout.

**Variants:** single variant. Style: left-border accent (3px solid `--color-foreground-muted`), padding-left 12px, `body` text in `--color-foreground-muted`.

**States:** loading (single-line skeleton), populated. Never empty per contract.

**Demo copy:**
> "Battery-health cycle count was not provided — confidence held back. Ask the technician to confirm before paying."

**Accessibility:** `role="note"`, no live region (non-urgent). Icon: Lucide `info` at 14px, inline-start of the note text.

---

### 3.5 AgentTimeline

**Purpose:** Renders the live multi-agent orchestration — one chip per phase arrival from `case_events` Realtime subscription. The Flash/Pro model-tier badges are the AI/ML prize hook.

**Variants:** Per-chip variants: `queued`, `running`, `complete`, `failed`, `awaiting_user`.

**States per chip:**
- Queued: gray circle icon (Lucide `circle`), muted text
- Running: Lucide `loader-2` spinning (20ms CSS animation), `--color-primary` text, model-tier badge visible
- Complete: Lucide `check-circle-2`, `--color-primary` text, elapsed time shown
- Failed: Lucide `x-circle`, `--color-destructive` text
- Awaiting user: Lucide `message-circle`, `--color-warning` text, pulsing ring

**Model-tier badge design:**
- Flash badge: pill shape, `radius-full`, background `--color-flash` at 15% opacity, text `--color-flash`, "Flash" label, 11px Inter 500. Left icon: Lucide `zap` at 10px.
- Pro badge: pill shape, background `--color-pro` at 15% opacity, text `--color-pro`, "Pro" label, `shadow-pro`. Left icon: Lucide `cpu` at 10px. Slightly larger than Flash — 13px text vs 11px — to convey "elevated tier."

**Phase display names:** Orchestrator, Intake Parser, Diagnosis, Economics, Action Plan, Helper Routing.

**Layout (375px, vertical stack):**
```
┌─────────────────────────────────────┐
│  ● Orchestrator          started    │
│  | Intake Parser  [Flash]  running  │
│  | Diagnosis      [Pro]   complete  │
│  | Economics      [Flash] complete  │
│  | Action Plan    [Flash] complete  │
│  ○ Helper Routing [Flash]  queued   │
└─────────────────────────────────────┘
```

Vertical connector line (2px, `--color-border`) between chips. Active chip's connector segment uses `--color-primary`.

**Framer Motion:** `chipEnter` with `staggerChildren: 0.05` on the container. Each new chip entering from Realtime uses `AnimatePresence` with `chipEnter`. The running chip's model-tier badge uses `badgePop`. `LayoutGroup` id="agent-timeline" for smooth reordering when a chip's status updates.

**Elapsed time:** shown as `{s}s` in `caption` style, right-aligned, once `complete`.

**Accessibility:** `role="list"`, each chip `role="listitem"`. Completed chip: `aria-label="Intake Parser complete in 3s, Flash model"`. Running chip: `aria-label="Diagnosis running, Pro model"`. `aria-live="polite"` on the container — new chips announced non-disruptively.

---

### 3.6 CameraCapture

**Purpose:** Opens phone rear camera via `getUserMedia`, captures up to 3 JPEGs, returns blobs to the intake form. File-picker fallback on permission denial.

**Variants:** camera-active (viewfinder open), file-picker (fallback), captured-preview (1–3 thumbnails shown).

**States:** idle (large dashed border zone, Lucide `camera` at center, "Tap to add photos" copy) → camera-active → captured (thumbnail strip, "Add another" if < 3).

**Layout (phone, intake step):**
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │         [camera icon]         │  │
│  │     Tap to add photos         │  │
│  │  Up to 3 · JPEG · max 2 MB    │  │
│  └───────────────────────────────┘  │
│  [thumb1] [thumb2] [+ Add]          │
└─────────────────────────────────────┘
```

Capture zone height: 180px, `radius-lg`, border 2px dashed `--color-border`. On capture, thumbnail appears with `cardEnter`. Each thumbnail has an `x` button (Lucide `x`, 20px, `shadow-sm`) top-right for removal.

**Accessibility:** Capture zone is a `<button>` with `aria-label="Add photos of your item"`. File input is hidden but reachable via fallback path. Thumbnails have `alt` text: "Uploaded photo {n}".

---

### 3.7 HelperMap + HelperListCard Fallback

**Purpose:** (stretch) Renders leaflet + OpenStreetMap tiles with up to 5 helper/shop pins from the helper-routing payload. Falls back to a static list of 3 hardcoded CPP-area shops when `F-fe-map` is cut.

**HelperMap variants:** loading (skeleton 200px height), populated (leaflet map), error (shows fallback list).

**Map height:** 220px on phone, 300px on tablet. `radius-md`. Leaflet loaded via dynamic import (Next.js `dynamic(() => import(...), { ssr: false })`).

**Pin style:** Lucide `wrench` SVG pin, `--color-primary`, 32px. Active pin: `shadow-md` + scale 1.2.

**HelperListCard (fallback and individual entries below map):**
```
┌─────────────────────────────────────┐
│  [wrench]  Campus Tech Repair       │
│            0.3 km · Apple Authorized│
│            ★★★★½  (47 reviews)      │
└─────────────────────────────────────┘
```
Card: `shadow-sm`, `radius-md`, padding 12px, `space-4` between entries.

**Accessibility:** Map region has `aria-label="Nearby repair shops map"`. Each pin has `role="button"`, `aria-label="Campus Tech Repair, 0.3 km away"`. List fallback uses `role="list"`.

---

### 3.8 DirectorView Scaffold (stretch — tier-1)

**Purpose:** Laptop `/demo` route subscribes to a case ID via direct Supabase Realtime, renders the full timeline + VerdictCard side-by-side for the audience while phone is the input device.

**Layout (1280px laptop):**
```
┌──────────────────────┬──────────────────────────────┐
│  AgentTimeline       │  VerdictCard                 │
│  (left 40%)          │  (right 60%)                 │
│                      │  SafetyBanner                │
│                      │  UncertaintyNote             │
│                      │  ActionPlan steps            │
└──────────────────────┴──────────────────────────────┘
```

QR code (top-right corner, 80×80px) links to `/case/[id]` on phone. Generated client-side via `qrcode.react`.

**Design note:** DirectorView is tier-1 stretch per architecture.md. If cut, phone-only demo is the fallback. Do not block cut-floor work for this.

---

### 3.9 shadcn Primitives in Use

| Primitive | Where used | Notes |
|---|---|---|
| `Button` | All CTAs, submit, retry, "Load Demo Case" | Variants: default (primary), outline, ghost, destructive |
| `Input` | Symptoms (first line), model number, quoted price | Always has visible `<label>` — no placeholder-only |
| `Textarea` | Symptoms (full entry) | Min-height 96px on phone, auto-resize |
| `Select` | Category picker, urgency picker | Native `<select>` on mobile for iOS accessibility |
| `Toast` | Upload success, submission error, Realtime reconnect | `aria-live="polite"`, auto-dismiss 4s |
| `Sheet` | Follow-up question panel (slides up from bottom on phone) | `role="dialog"`, swipe-down to dismiss |
| `Dialog` | Confirmation dialogs (destructive actions) | Scrim opacity 48% |
| `Progress` | Single-bar fallback if `F-fe-timeline` is cut | `aria-valuenow` set |
| `Skeleton` | Loading states for VerdictCard, AgentTimeline, UncertaintyNote | `animate-pulse`, matches component dimensions |
| `Card` | HelperListCard, action plan steps container | Uses `--color-surface` + `shadow-sm` |

---

## 4. Screen Inventory + Navigation Map

| Screen ID | Name | URL | Primary viewport | Cut-priority |
|---|---|---|---|---|
| S1 | Landing / marketing | `/` | 375px + 1280px | Floor (baseline) |
| S2 | Intake | `/new` | 375px (phone hero) | Floor (F-fe-intake) |
| S3 | Live verdict view | `/case/[id]` | 375px + 1280px shared URL | Floor (F-fe-verdict) |
| S4 | Director view | `/demo` | 1280px laptop only | Tier-1 stretch (F-fe-director) |
| S5 | Auth / sign-in | `/auth/signin` | 375px + 768px | Floor (Supabase magic link) |
| S6 | Error / 404 / fallback | `/*` | 375px | Floor |
| S7 | Campus Marketplace | `/marketplace` | 1280px (desktop-first) | Tier-1 stretch |
| S8 | Item Listing Detail | `/marketplace/[id]` | 1280px (desktop-first) | Tier-1 stretch |
| S9 | Repair Agent Workspace | `/repair/[id]` | 1280px (desktop-first) | Tier-1 stretch |
| S10 | Repair Student Dashboard | `/dashboard` | 1280px (desktop-first) | Tier-1 stretch |
| S11 | Messaging System | `/messages` | 1280px (desktop-first) | Tier-2 stretch |
| S12 | Rewards & Impact Dashboard | `/rewards` | 1280px (desktop-first) | Tier-2 stretch |
| S13 | Create Listing | `/create-listing` | 1280px (desktop-first) | Tier-1 stretch |

**Navigation flow:**

```
S5 (sign-in) ──auth──► S1 (landing)
S1 ──"Start Repair"──► S2 (intake)
S2 ──submit success──► S3 /case/[id]
S3 ──"New Case"──► S2
S4 ──paired to S3 via case ID in URL──► (real-time mirror)
Any screen ──unauthenticated──► S5
Any screen ──error──► S6

── Marketplace / Platform flows ──────────────────────────────
S1 (Navbar) ──"Marketplace"──► S7 (campus marketplace)
S7 ──item card click──► S8 (item listing detail)
S7 ──"List an Item" button──► S13 (create listing, step 1)
S8 ──"Get a Repair Verdict →" link──► S9 (repair agent workspace)
S8 ──"Message Seller" button──► S11 (messages, pre-filled thread)
S9 ──back arrow──► S8 or S10
S10 (dashboard) ──case card click──► S9 (repair agent workspace)
S10 (dashboard) ──"+ New Repair Case"──► S2 (intake)
S1/S7/S10 (Navbar) ──rewards icon──► S12 (rewards & impact)
S12 ──leaderboard "View All"──► (leaderboard sub-page, not yet spec'd)
S13 ──step 3 "Repair Needed" listing type──► S9 (repair verdict linking)
S13 ──"Publish Listing"──► S8 (newly published listing detail)
S11 ──conversation row click──► S11 (active thread, same page)
```

Back behavior: S3 → S1 (not S2). S2 → S1. S6 → browser back or S1 depending on context. S8 → S7. S9 → S8 or S10 (via browser back). S13 → S7 (cancel).

---

## 5. Per-Screen Specs

### 5.1 Landing / Marketing (S1)

**Purpose:** Entry point. Communicates the core value prop, drives sign-up or "Start Repair." Secondary goal: show what the product does for judges who navigate directly.

**URL:** `/`

**Layout anatomy (375px phone):**

```
┌─────────────────────────────────────┐
│  [Logo] Bronco Repair Desk    [Menu]│
├─────────────────────────────────────┤
│                                     │
│  Don't replace it.                  │
│  Repair it.                         │
│  (Calistoga display, 36px)          │
│                                     │
│  AI-powered repair verdict for      │
│  students in under 45 seconds.      │
│  (Inter body-lg)                    │
│                                     │
│  [     Start Repair      ] ← CTA   │
│                                     │
├─────────────────────────────────────┤
│  Four categories:                   │
│  [laptop] [bicycle] [e-scooter]     │
│  [mini-fridge]                      │
│  (2×2 grid, icon cards, 80×80px)    │
├─────────────────────────────────────┤
│  How it works (3 steps)             │
│  1. Capture → 2. AI Diagnoses →     │
│  3. Get Verdict                     │
├─────────────────────────────────────┤
│  [Load Demo Case]                   │
│  (ghost button, secondary)          │
└─────────────────────────────────────┘
```

**Layout anatomy (1280px laptop):**

```
┌────────────────────────────────────────────────────────────┐
│ [Logo]                              [Sign In]  [Start]     │
├────────────────────────────────────────────────────────────┤
│  Left col (55%)                │  Right col (45%)          │
│                                │                           │
│  Don't replace it.             │  [Laptop photo / illus]   │
│  Repair it.                    │  with verdict card overlay│
│  (display 48px)                │                           │
│                                │                           │
│  AI-powered verdict...         │                           │
│                                │                           │
│  [  Start Repair  ]            │                           │
│                                │                           │
├────────────────────────────────────────────────────────────┤
│  4 category cards (horizontal row)                         │
├────────────────────────────────────────────────────────────┤
│  How it works (3-column)       │  Load Demo Case (right)   │
└────────────────────────────────────────────────────────────┘
```

**Copy:**
- Hero headline: "Don't replace it. Repair it."
- Subhead: "Upload a photo. Describe the problem. Get an AI verdict — repair cost vs. replacement — in under 45 seconds."
- CTA primary: "Start Repair"
- CTA secondary: "Load Demo Case"
- Category cards: "Laptop", "Bicycle", "E-Scooter", "Mini Fridge"
- How it works: "1. Capture your item", "2. AI diagnoses in real time", "3. Get a transparent verdict"

**States:** unauthenticated (shows "Sign In" in nav), authenticated (shows user initial + "Start Repair").

**Motion choreography:** On page load: hero text uses `staggerChildren: 0.08` on each word via `cardEnter` variant. Category grid enters with `staggerChildren: 0.06`. CTA button uses `cardEnter` last. All triggered by `AnimatePresence` on mount.

**Responsive behavior:** Phone: single column, stacked. Laptop: two-column hero with illustration panel. Category grid: 2×2 phone → 4 column row on 768px+.

---

### 5.2 Intake (S2) — `/new`

**Purpose:** The phone hero interaction. Camera capture + symptoms form. Submit triggers the orchestration run and redirects to `/case/[id]`.

**URL:** `/new`

**Layout anatomy (375px phone):**

```
┌─────────────────────────────────────┐
│  ← Back         New Repair Case     │
├─────────────────────────────────────┤
│  Category *                         │
│  [Select ▼ laptop/bicycle/...]      │
├─────────────────────────────────────┤
│  Photos *  (1-3 required)           │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │        [camera icon]          │  │
│  │     Tap to add photos         │  │
│  │  Up to 3 photos · max 2 MB    │  │
│  └───────────────────────────────┘  │
│  [thumb1] [thumb2] [+ Add]          │
├─────────────────────────────────────┤
│  What's wrong? *                    │
│  ┌───────────────────────────────┐  │
│  │ Describe symptoms, sounds,    │  │
│  │ anything unusual...           │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Urgency                            │
│  [Low] [Normal ✓] [Urgent]          │
│  (segmented pill row)               │
├─────────────────────────────────────┤
│  Model / serial #  (optional)       │
│  [___________________________]      │
├─────────────────────────────────────┤
│  Got a repair quote?  (optional)    │
│  [$_____________________________]   │
├─────────────────────────────────────┤
│                                     │
│  [    Analyze My Item    ]  ← CTA  │
│                                     │
└─────────────────────────────────────┘
```

**States:**
- `idle`: form empty, CTA disabled (visual: 50% opacity, `not-allowed` cursor)
- `valid`: category + 1+ photo + symptoms filled → CTA enabled
- `submitting`: CTA shows Lucide `loader-2` spin, all inputs disabled, button text "Analyzing..."
- `error`: Toast shows specific error (e.g., "Photo upload failed — please try again"), CTA re-enables
- `uploading-media`: Photo thumbnails show upload progress (small progress ring overlay on thumbnail)

**Validation (Zod, client-side on blur and on submit):**
- Category: required selection
- Photos: min 1, max 3
- Symptoms: required, min 10 characters
- Urgency: required (default "normal")
- Model number: optional, max 100 chars
- Quoted price: optional, numeric, positive

**Copy:**
- Section label "Category *" — asterisk for required (rule: `required-indicators`)
- Photos label: "Photos *" with helper "1–3 images of your item"
- Symptoms label: "What's wrong? *" with helper "Be specific — mention sounds, smells, recent events"
- Urgency helper: "How soon do you need this fixed?"
- Model # helper: "Helps with parts lookup (optional)"
- Quote helper: "Entering a quote improves the cost comparison (optional)"
- CTA: "Analyze My Item"
- Submitting: "Analyzing..."

**Motion choreography:** Each form section enters via `cardEnter` with `staggerChildren: 0.04` (form feels purposeful, not instant). Photo thumbnails added via `chipEnter`. On submit: page transition via `pageTransition` exit to `/case/[id]`.

**Responsive:** Phone only (375px primary). At 768px+, form constrains to `max-w-md` centered column.

---

### 5.3 Live Verdict View (S3) — `/case/[id]`

**Purpose:** The primary demo screen. Shows the orchestration timeline animating live, then the verdict with safety banner, RRR breakdown, action plan, uncertainty note. Handles the `awaiting_user` follow-up question pause.

**URL:** `/case/[id]`

**Layout anatomy (375px phone — loading state, run just started):**

```
┌─────────────────────────────────────┐
│  ← Cases      My Laptop Case       │
├─────────────────────────────────────┤
│  [Skeleton: RRRBadge]               │
├─────────────────────────────────────┤
│  Agent Pipeline                     │
│  ┌───────────────────────────────┐  │
│  │  ● Orchestrator   started     │  │
│  │  | Intake  [Flash]  running   │  │
│  │  ○ Diagnosis        queued    │  │
│  │  ○ Economics        queued    │  │
│  │  ○ Action Plan      queued    │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [Skeleton: VerdictCard 3 rows]     │
├─────────────────────────────────────┤
│  [Skeleton: UncertaintyNote]        │
└─────────────────────────────────────┘
```

**Layout anatomy (375px phone — awaiting_user state):**

```
┌─────────────────────────────────────┐
│  ← Cases      My Laptop Case       │
├─────────────────────────────────────┤
│  AgentTimeline (partial — Intake    │
│  complete, Diagnosis awaiting)      │
├─────────────────────────────────────┤
│  ┌────────────── Sheet ───────────┐ │
│  │ Question from Diagnosis        │ │
│  │                                │ │
│  │ Has the trackpad become harder │ │
│  │ to click or started lifting?   │ │
│  │                                │ │
│  │  [  Yes  ]  [  No  ]          │ │
│  │                                │ │
│  │  Or type your answer:          │ │
│  │  [__________________________]  │ │
│  │  [       Send Answer       ]   │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Layout anatomy (375px phone — populated state):**

```
┌─────────────────────────────────────┐
│  ← Cases      My Laptop Case       │
├─────────────────────────────────────┤
│  [RRRBadge: REPAIR NOW  0.78]       │
├─────────────────────────────────────┤
│  ┌────AgentTimeline complete──────┐ │
│  │  ✓ Orchestrator               │ │
│  │  ✓ Intake [Flash]     2s      │ │
│  │  ✓ Diagnosis [Pro]    18s     │ │
│  │  ✓ Economics [Flash]  4s      │ │
│  │  ✓ Action Plan [Flash] 3s    │ │
│  └───────────────────────────────┘ │
├─────────────────────────────────────┤
│  ┌─────SafetyBanner (amber)──────┐  │
│  │ ⚠  Safety First               │  │
│  │ Swollen lithium batteries are  │  │
│  │ a fire risk. Do not press,     │  │
│  │ puncture, or attempt           │  │
│  │ disassembly. Use a professional│  │
│  │ service only.                  │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ┌──────VerdictCard──────────────┐  │
│  │  [RRRBadge]        0.78       │  │
│  │  RRR Breakdown                │  │
│  │  Confidence   0.30  ██████░   │  │
│  │  Cost Factor  0.19  █████░░   │  │
│  │  Effort       0.12  ███░░░░   │  │
│  │  Parts        0.10  ██░░░░░   │  │
│  │  Urgency      0.07  █░░░░░░   │  │
│  │  ─────────────────────────── │  │
│  │  Repair estimate  $80 – $130  │  │
│  │  Comparable refurb    ~$450   │  │
│  │  ─────────────────────────── │  │
│  │  A $110 battery swap averts   │  │
│  │  a $450 e-waste decision...   │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  | Battery-health cycle count was  │
│  | not provided — confidence held  │
│  | back. Ask technician to confirm.│
├─────────────────────────────────────┤
│  Action Plan                        │
│  ┌───────────────────────────────┐  │
│  │ 1. Do not charge the laptop   │  │
│  │    further.                   │  │
│  │ 2. Contact an Apple Authorized│  │
│  │    Service Provider...        │  │
│  │ 3. Ask technician:            │  │
│  │    - Is cycle count ≥ 1000?   │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Nearby Repair Shops                │
│  [HelperMap or HelperListCard]      │
├─────────────────────────────────────┤
│  [  Start New Case  ] [Retry Run]   │
└─────────────────────────────────────┘
```

**Layout anatomy (1280px laptop — populated):**

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]                        [user] [New Case]        │
├───────────────────────┬─────────────────────────────────┤
│  Left col (38%)       │  Right col (62%)                │
│                       │                                 │
│  AgentTimeline        │  [RRRBadge large]               │
│  (full vertical)      │                                 │
│                       │  SafetyBanner (if present)      │
│                       │                                 │
│                       │  VerdictCard                    │
│                       │                                 │
│                       │  UncertaintyNote                │
│                       │                                 │
│                       │  Action Plan                    │
│                       │                                 │
│                       │  HelperMap                      │
└───────────────────────┴─────────────────────────────────┘
```

**States:**
- `loading`: skeleton placeholders, timeline showing first events
- `running`: timeline animating, verdict skeleton pulsing
- `awaiting_user`: timeline paused at diagnosis chip (pulsing), follow-up sheet slides up
- `populated`: all components revealed
- `failed`: error state in the relevant timeline chip + error card with "Retry" button

**Awaiting-user sheet copy:**
- Title: "One question from the AI"
- Subtitle: "This helps the diagnosis — your answer stays private"
- Question: rendered from `case_runs.awaiting_question`
- Yes/No buttons (if question is binary, detected by checking for question mark and yes/no framing)
- Text input always available as fallback
- CTA: "Send Answer"
- Dismiss: not allowed (the run is paused, dismissal would leave the run stuck — no X button on sheet)

**Follow-up answer submission:** POST to `/api/cases/:id/runs/:runId/followup`. On success: sheet dismisses with `tween-slide` exit, timeline resumes with `chipEnter` for next phase chip.

**"Load Demo Case" button:** Visible only when no active run. Replays seeded `case_events` on a timer, simulating real orchestration cadence.

**Motion choreography:** See Section 6 for detailed beat-by-beat description.

**Responsive:** 375px: single column, components stacked. 768px+: 2-column layout (timeline left, verdict right). 1280px: full laptop layout.

---

### 5.4 Director View (S4) — `/demo` (stretch)

**Purpose:** Laptop view for live judging. Large-format presentation of the full timeline + verdict, synchronized via direct Supabase Realtime subscription.

**URL:** `/demo?caseId=[id]` (case ID passed via QR code from phone)

**Layout anatomy (1280px only):**

```
┌─────────────────────────────────────────────────────────┐
│  BRONCO REPAIR DESK — Live Demo        [QR] case/[id]   │
├───────────────────────┬─────────────────────────────────┤
│  Agent Pipeline       │  Verdict                        │
│  (40%)                │  (60%)                          │
│                       │                                 │
│  Timeline chips at    │  SafetyBanner (large)           │
│  larger size (h3)     │  VerdictCard (large)            │
│  Model badges at 14px │  UncertaintyNote                │
│                       │  Action Plan (abbreviated)      │
└───────────────────────┴─────────────────────────────────┘
```

**Design note:** DirectorView is tier-1 stretch. This spec exists so Stitch/Figma has the frame ready, but implementation is contingent on all tier-2 and cut-floor features shipping first.

---

### 5.5 Auth / Sign-In (S5)

**Purpose:** Supabase magic-link email sign-in. Minimal — one screen, one action.

**URL:** `/auth/signin`

**Layout anatomy (375px phone):**

```
┌─────────────────────────────────────┐
│                                     │
│          Bronco Repair Desk         │
│        (Calistoga h1, centered)     │
│                                     │
│   AI repair advisor for students.   │
│         (Inter body, centered)      │
│                                     │
│  Email                              │
│  [your@email.edu         ]          │
│                                     │
│  [ Send Magic Link ]                │
│                                     │
│  ─────────── or ───────────         │
│                                     │
│  [ Continue with Google ]           │
│                                     │
│  No account needed — sign in        │
│  creates one automatically.         │
│                                     │
└─────────────────────────────────────┘
```

**States:** idle → submitting (button loading) → sent (email confirmation message, no new screen: "Check your email — link expires in 15 minutes") → error (inline below email input).

**Copy:**
- Email label: "Email" (always visible, not placeholder-only per rule `input-labels`)
- Email placeholder: "your@email.edu"
- CTA: "Send Magic Link"
- Google button: "Continue with Google"
- Confirmation: "Magic link sent to {email}. Check your inbox and spam folder."
- Error: "Couldn't send the link. Check your email address and try again."

---

### 5.6 Error / 404 / Fallback (S6)

**Purpose:** Graceful dead-end handling. Three sub-states: 404 (page not found), run-failed (orchestrator error), network (offline/timeout).

**Layout anatomy (375px phone, generic error):**

```
┌─────────────────────────────────────┐
│                                     │
│        Something went wrong.        │
│        (Calistoga h1)               │
│                                     │
│   The analysis couldn't complete.   │
│   This sometimes happens with       │
│   complex diagnostics.              │
│                                     │
│  [      Try Again       ]           │
│  [      Go Home         ] ← ghost  │
│                                     │
└─────────────────────────────────────┘
```

**404 copy:**
- Headline: "Page not found."
- Body: "That case or page doesn't exist. It may have been deleted or the link is wrong."
- CTA: "Go to Home"

**Run-failed copy:**
- Headline: "Analysis didn't complete."
- Body: "The AI couldn't finish this analysis. Your photos and description are saved — you can try again."
- CTA: "Try Again" (triggers new run, not page reload)

**Network copy:**
- Headline: "Connection issue."
- Body: "Can't reach the server right now. Check your connection and try again."
- CTA: "Retry"

---

### 5.7 Campus Marketplace (S7) — `/marketplace`

**Purpose:** The item discovery hub. Students browse, filter, and find items to buy, trade, or claim for free. The impact strip reinforces the sustainability narrative for judges.

**URL:** `/marketplace`

**Layout anatomy (1280px desktop):**

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar: Bronco Repair Desk · nav links · Start Repair]│
├─────────────────────────────────────────────────────────┤
│  Marketplace                     [My Listings] [List ▶] │
│  Give items a second life on campus.                    │
├─────────────────────────────────────────────────────────┤
│  [All] [For Sale] [Free] [Trade] [Repairable]  ←tabs   │
│  ─────────────────────────────────────────────          │
├───────────────────────────────────┬─────────────────────┤
│  Main (9 cols)                    │  Sidebar (3 cols)   │
│                                   │                     │
│  [🔍 Search] [Category▼][Price▼] │  My Activity        │
│  [Condition▼] [🔧 Repair Needed] │  Active Listings  3 │
│                                   │  ████████░░ (bar)   │
│  ┌────────┐ ┌────────┐ ┌───────┐ │                     │
│  │[image] │ │[image] │ │[image]│ │  Recent Bids&Views  │
│  │Recircul│ │Recircul│ │Recircl│ │  ┌──────────────┐   │
│  │[badge] │ │[badge] │ │[badge]│ │  │[img] IKEA Lamp│   │
│  │        │ │        │ │       │ │  │     2 new bids│   │
│  │Title $X│ │Title   │ │Title  │ │  └──────────────┘   │
│  │desc... │ │Trade   │ │Free   │ │  ┌──────────────┐   │
│  │📍 loc  │ │📍 loc  │ │📍 loc │ │  │[img] TI-84   │   │
│  └────────┘ └────────┘ └───────┘ │  │  14 views today│  │
│  ┌────────┐                      │  └──────────────┘   │
│  │[image] │                      │                     │
│  │...     │                      └─────────────────────┤
│  └────────┘                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🌱  1,245 ITEMS RECIRCULATED  │  💰  $15.4k SAVINGS│ │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Listing card anatomy:**
- Top badge (left): frosted-glass "↻ Recirculated" chip (backdrop-blur, white/90)
- Top badge (right): condition/type chip — peach (#ffca98) for "Repairable", green (#c1ecd4) for "Like New", gray (#e2e3db) for "Used - Good", yellow-green for "Free"
- Price display: numeric for For Sale; word "Trade" in green for swaps; "Free" in a yellow-green badge for giveaways
- Location: pin icon + text, border-t separator

**Tab active state:** `border-b-2 border-[#012d1d]` on active tab, `text-[#414844]` on inactive.

**States:** loading (skeleton grid, 6 cards), populated, empty (no results for filter combination — "No items match your filters. Try removing some filters.")

**Copy:**
- Page title: "Marketplace"
- Subtitle: "Give items a second life on campus."
- Tabs: "All" · "For Sale" · "Free" · "Trade" · "Repairable"
- Filter pills: "Category ▾" · "Price ▾" · "Condition ▾" · "🔧 Repair Needed"
- Impact strip: "ITEMS RECIRCULATED" · "STUDENT SAVINGS"
- My Listings button: "My Listings"
- List button: "List an Item"

**Responsive:** 3-col grid on 1280px, 2-col on 768px, 1-col on 375px. Sidebar collapses below content on mobile.

---

### 5.8 Item Listing Detail (S8) — `/marketplace/[id]`

**Purpose:** Full item view. Gives the buyer everything they need to commit: photos, condition, price, repair estimate (if repairable), and a direct path to the seller.

**URL:** `/marketplace/[id]`

**Layout anatomy (1280px desktop):**

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar]                                               │
├─────────────────────────────────────────────────────────┤
│  ← Back to Marketplace                                  │
├──────────────────────────┬──────────────────────────────┤
│  Image area (7 cols)     │  Details panel (5 cols)      │
│                          │                              │
│  ┌──────────────────────┐│  [Repairable] Apr 18, 2024   │
│  │                      ││                              │
│  │   Hero image 400px   ││  Vintage Road Bike           │
│  │                      ││  $45                         │
│  └──────────────────────┘│                              │
│  [img][img][img][img]    │  Needs a new chain and some  │
│  (4 thumbnails, 80px)    │  tire patching, but frame is │
│                          │  in excellent shape.         │
│                          │                              │
│                          │  📍 West Village             │
│                          │                              │
│                          │  ┌──────────────────────┐    │
│                          │  │ Estimated Repairs     │    │
│                          │  │ ○ New chain (~$15)    │    │
│                          │  │ ○ Tire patch (~$5)    │    │
│                          │  │ Get a Repair Verdict →│    │
│                          │  └──────────────────────┘    │
│                          │                              │
│                          │  ┌──────────────────────┐    │
│                          │  │ [A] Alex C.           │    │
│                          │  │     4.8★ · 12 traded  │    │
│                          │  └──────────────────────┘    │
│                          │                              │
│                          │  [ Message Seller ]          │
│                          │  [ Save to Wishlist ]        │
└──────────────────────────┴──────────────────────────────┘
```

**Repair estimate callout:** amber/peach border (`border-[#ffdcbd]`), `bg-[rgba(255,220,189,0.3)]`, lists needed repairs + estimated costs. Links to `/repair/[id]` (Get a Repair Verdict →). Only shown for "Repairable" listings.

**Seller avatar:** 40×40px circle, background `#1b4332`, white initial letter. Rating and trade count beneath name.

**States:** loading (hero image skeleton, text skeletons), populated.

**Copy:**
- Back link: "← Back to Marketplace"
- Message CTA: "Message Seller" (primary button, full width)
- Secondary CTA: "Save to Wishlist" (outline button)
- Repair callout heading: "Estimated Repairs Needed"
- Repair link: "Get a Repair Verdict →"

---

### 5.9 Repair Agent Workspace (S9) — `/repair/[id]`

**Purpose:** Desktop command center for an active repair case. Shows the live multi-agent orchestration in a structured workspace layout — evidence gathering panel, agent review board, progress sidebar, and verdict placeholder.

**URL:** `/repair/[id]`

**Note:** This screen extends and replaces S3 (Live Verdict View) for the desktop form factor. S3 remains the mobile-first verdict screen; S9 is the desktop workspace during active orchestration.

**Layout anatomy (1280px desktop):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Bronco Repair Desk               [Case #84920]       │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │ [MacBook image] MacBook Pro 2019                  │  │
│  │                 ● Status: Analyzing Case          │  │
│  │                 ⏱ Symptoms: Screen flickers...    │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Evidence Gathering                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ⓘ FOLLOW-UP QUESTION           [MacBook img 32px] │  │
│  │ Does the flicker stop at a specific angle?        │  │
│  │ The Diagnosis Agent needs this to confirm cable   │  │
│  │ tension issues.                                   │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  [Yes]  [No]  [Intermittent]                      │  │
│  └───────────────────────────────────────────────────┘  │
├──────────────┬──────────────────────────────────────────┤
│  Progress    │  Agent Review Board                      │
│  (256px)     │                                          │
│              │  ┌──────────────┐ ┌──────────────────┐  │
│  ✓ EVIDENCE  │  │INTAKE AGENT  │ │DIAGNOSIS AGENT   │  │
│    RECEIVED  │  │[COMPLETE ✓] │ │[ANALYZING ···]  │  │
│    Intake OK │  │✓ Data valid  │ │● Checking Flexg..│  │
│              │  └──────────────┘ └──────────────────┘  │
│  ● AGENT     │  ┌──────────────┐ ┌──────────────────┐  │
│    ORCHEST.  │  │ECONOMICS     │ │ACTION PLAN AGENT │  │
│    Diagnos.. │  │[WAITING]     │ │[WAITING]         │  │
│              │  │⏸ Queued      │ │⏸ Queued          │  │
│  ○ SYNTHES.  │  └──────────────┘ └──────────────────┘  │
│    VERDICT   │                                          │
│    Waiting   │  Final Recommendation                    │
│              │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│              │       🔒 Verdict Locked                   │
│              │    Generated once all agents complete   │
│              │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
└──────────────┴──────────────────────────────────────────┘
```

**Agent card states:**
- Complete: white bg, `border-[#e2e3db]`, green badge `bg-[#c1ecd4] text-[#274e3d]`
- Analyzing: white bg, `border-2 border-[#ffdcbd]`, peach badge `bg-[#ffdcbd] text-[#623f18]`, pulsing dot
- Waiting: `bg-[#edefe7] opacity-70`, gray badge `bg-[#e2e3db]`

**Progress sidebar steps:**
1. EVIDENCE RECEIVED — filled green circle with checkmark (complete)
2. AGENT ORCHESTRATION — amber dashed ring with center dot (active, `border-[#7d562d]`)
3. SYNTHESIZING VERDICT — empty gray ring (pending)
Vertical connector line behind steps, `bg-[#e2e3db]`.

**Evidence Q&A buttons:** Yes = dark green (`bg-[#012d1d]`); No = gray (`bg-[#e2e3db]`); Intermittent = gray. Height 40px, rounded-lg.

**Final Recommendation placeholder:** dashed border (`border-2 border-dashed border-[#c1c8c2]`), min-height 200px, lock icon, "Verdict Locked" heading in muted gray.

**Header:** Back arrow button (p-2, rounded, hover bg) + "Bronco Repair Desk" title + "Case #84920" dark green pill (bg `#012d1d`).

---

### 5.10 Repair Student Dashboard (S10) — `/dashboard`

**Purpose:** Personal repair case history. Students track their active cases, see verdict status at a glance, and understand their aggregate sustainability impact.

**URL:** `/dashboard`

**Layout anatomy (1280px desktop):**

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar]                                               │
├─────────────────────────────────────────────────────────┤
│  Repair Dashboard           [+ New Repair Case ▶]       │
│  Track your active repair cases and verdicts.           │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │    2     │ │    1     │ │   $43    │ │  12kg    │  │
│  │Active    │ │Verdicts  │ │Avg Repair│ │CO₂ Saved │  │
│  │Cases     │ │Ready     │ │Cost      │ │(est.)    │  │
│  │(green bg)│ │(white)   │ │(white)   │ │(gray bg) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  Your Cases                                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [img] MacBook Pro 2019    [Analyzing]   Apr 24    │  │
│  │        Screen flickers when hinge is moved        │  │
│  │                                    75% ████░  $15 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [img] Vintage Road Bike   [Verdict Ready] Apr 18  │  │
│  │        Chain slipping under load                  │  │
│  │                                    90% █████  $30 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [img] Old MacBook Air     [Draft]       Apr 10    │  │
│  │        Battery drains in 45 minutes               │  │
│  │                                    60% ███░░  $85 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Stat card colors:** Active Cases = dark `#1b4332` bg, white text; Verdicts Ready + Avg Cost = white; CO₂ Saved = `#e2e3db` gray.

**Case row anatomy:** 80×80 device thumbnail (border-rounded) + title + status badge + date (right-aligned) + issue description + repairability score bar (24px wide, right column) + estimated cost + chevron arrow.

**Status badges:** Analyzing = peach `#ffdcbd`/`#623f18`; Verdict Ready = green `#c1ecd4`/`#274e3d`; Draft = gray.

**Case rows:** Full-width white cards, border `#e2e3db`, hover elevates shadow. Entire row is a link to `/repair/[id]`.

---

### 5.11 Messaging System (S11) — `/messages`

**Purpose:** In-app negotiation channel between buyers and sellers. Keeps all transaction communication within the platform.

**URL:** `/messages`

**Layout anatomy (1280px desktop — full viewport):**

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar]                                               │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │ Conversation list   │  Chat thread                │  │
│  │ (320px fixed)       │  (flex-1)                   │  │
│  │                     │                             │  │
│  │ Messages            │  [J] Jordan M.              │  │
│  │ [🔍 Search...]      │  Re: Mountain Bike · $50    │  │
│  │ ─────────────────── │  [View Listing][Make Offer] │  │
│  │ [J] Jordan M.  2m   │  ─────────────────────────  │  │
│  │  Mountain Bike  ●2  │                             │  │
│  │  Is it available?   │   "Hey! Is the mountain     │  │
│  │ ─────────────────── │    bike still available?"   │  │
│  │ [T] Taylor R.  1h   │                    10:02 AM  │  │
│  │  Mini Fridge        │                             │  │
│  │  I can offer a lamp │      "Yes it is! Still      │  │
│  │ ─────────────────── │       looking for a buyer." │  │
│  │ [A] Alex C.   3h ●1 │                10:04 AM ✓   │  │
│  │  Bio Textbooks      │                             │  │
│  │  Can I pick up tmrw │  "Great. Is the price       │  │
│  │                     │   negotiable? Thinking $40" │  │
│  │                     │                   10:06 AM  │  │
│  │                     │  ─────────────────────────  │  │
│  │                     │  [Type a message...] [→ ]   │  │
│  └─────────────────────┴─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Conversation list anatomy:** Avatar circle (40px, `#1b4332` bg, white initial) + name (semibold) + time (right) + item name (small, muted) + preview text (truncated). Unread badge: small dark green circle with count. Active row: `#f3f4ec` bg.

**Message bubbles:** Mine = right-aligned, `#1b4332` bg, white text, `rounded-br-sm`. Theirs = left, `#f3f4ec` bg, `#1a1c18` text, `rounded-bl-sm`. Timestamp in 10px muted text below each bubble.

**Chat header:** Sends user to the listing via "View Listing" (outline button) + trade action via "Make Offer" (dark green).

**Input bar:** Rounded-full input (`#f3f4ec` bg) + send arrow button (dark green circle, 40px).

**States:** empty-inbox (no conversations yet, "Start a conversation by messaging a seller on any listing"), loading, populated.

---

### 5.12 Rewards & Impact Dashboard (S12) — `/rewards`

**Purpose:** Gamified sustainability tracking. Shows students the tangible environmental impact of their actions on campus. Points redeemable at Panda Express, Pony Express, and other campus vendors.

**URL:** `/rewards`

**Layout anatomy (1280px desktop):**

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar]                                               │
├─────────────────────────────────────────────────────────┤
│  Rewards & Impact                                       │
│  Your sustainability journey, visualized.               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────┐  │
│  │ 🌱 Green Points  │ │ ♻️ Items Recircl  │ │🌍 CO₂  │  │
│  │ #1b4332 dark bg  │ │ white card        │ │ gray bg │  │
│  │    1,240         │ │      12           │ │  28kg   │  │
│  │ ████████░░ 62%   │ │ ██████████░ 80%   │ │ ██████░ │  │
│  │ 760 pts to next  │ │ Goal: 15 items    │ │ 2 flights│ │
│  └──────────────────┘ └──────────────────┘ └─────────┘  │
├──────────────────────────┬──────────────────────────────┤
│  Achievements            │  Recent Activity             │
│                          │                              │
│  ┌────┐ ┌────┐ ┌────┐   │  ┌──────────────────────┐    │
│  │ 🏅 │ │ ⭐ │ │ 🔧 │   │  │Sold Mountain Bike     │    │
│  │EARND│ │EARND│ │EARND│  │  │              +50 pts  │    │
│  └────┘ └────┘ └────┘   │  ├──────────────────────┤    │
│  ┌────┐ ┌────┐ ┌────┐   │  │Repair Verdict: MBP    │    │
│  │ 🌿 │ │ 🏆 │ │ ♻️ │   │  │              +30 pts  │    │
│  │dim │ │dim │ │dim │   │  ├──────────────────────┤    │
│  └────┘ └────┘ └────┘   │  │Gave Away Textbooks    │    │
│                          │  │              +20 pts  │    │
│                          │  └──────────────────────┘    │
│                          │                              │
│                          │  ┌──────────────────────┐    │
│                          │  │🏆 Campus Leaderboard  │    │
│                          │  │You're ranked #7!      │    │
│                          │  │          [View All]   │    │
│                          │  └──────────────────────┘    │
└──────────────────────────┴──────────────────────────────┘
```

**Points card (dark):** `#1b4332` bg, emoji, large number (bold 48px), progress bar (white/20 track, `#a5d0b9` fill), "X pts to next level" muted text.

**Achievement badge grid (3×2):** Earned = white bg, `#c1ecd4` border, "EARNED" label in small caps green. Unearned = `#f3f4ec` bg, `#e2e3db` border, 50% opacity.

**Achievement badges:**
1. 🏅 First Item Recirculated — 1 listing completed
2. ⭐ 5 Items Traded — 5 trades completed
3. 🔧 Repair Veteran — 3 repair verdicts received
4. 🌿 Green Champion — 50+ green points earned
5. 🏆 Campus Hero — 50 items recirculated
6. ♻️ Zero Waste Pioneer — 1 full semester with no landfill items

**Leaderboard teaser:** Dark `#012d1d` card, trophy emoji, "Campus Leaderboard" heading, rank statement, "View All" button (peach `#ffca98`, `#7a532a` text).

**Redemption partners (referenced in copy):**
- Panda Express — $2.00 off per 100 pts
- Pony Express — $1.50 off per 100 pts

**Copy:**
- Section title: "Rewards & Impact"
- Subtitle: "Your sustainability journey, visualized."
- Points card label: "GREEN POINTS"
- Progress hint: "{X} pts to next level"
- Leaderboard teaser: "You're ranked #{N} on campus this month!"
- Leaderboard CTA: "View All"

---

### 5.13 Create Listing (S13) — `/create-listing`

**Purpose:** Guided multi-step form for posting an item. Four steps reduce cognitive load and ensure complete listings.

**URL:** `/create-listing`

**Layout anatomy (1280px desktop — max-w-860 centered):**

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar]                                               │
├─────────────────────────────────────────────────────────┤
│  Create a Listing                                       │
│  Help an item find its next home.                       │
├─────────────────────────────────────────────────────────┤
│  ①─────②─────③─────④                                  │
│  Photos  Details  Pricing  Review   ← step indicator   │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  [STEP CONTENT — varies per step, see below]      │  │
│  │                                                   │  │
│  ├───────────────────────────────────────────────────┤  │
│  │                         [Back]        [Continue]  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Step indicator:** Row of 4 numbered circles connected by lines. Current/past = `#1b4332` fill, white number. Future = `#e2e3db` fill, `#717973` number. Connecting lines: past = `#1b4332`, future = `#e2e3db`.

**Step 1 — Photos:**
Large dashed drop zone (border-2 dashed `#c1c8c2`, `radius-xl`, padding 48px). Camera icon + "Drop photos here or click to upload" + file type hint. "Choose Files" button (`#e8e9e1` bg). Tip copy below: "Clear, well-lit photos get 3× more views."

**Step 2 — Details:**
- Title: text input
- Category: 4×2 pill button grid (Laptops, Bicycles, E-Scooters, Appliances, Furniture, Books, Clothing, Other). Selected = `#1b4332` bg, white text.
- Condition: 4-button row (Like New / Good / Used - Fair / For Parts). Selected = `#1b4332` fill.
- Description: textarea (min-height 112px, auto-resize)
- Pickup Location: text input

**Step 3 — Pricing & Type:**
2×2 grid of listing type cards. Selected card = `border-2 border-[#1b4332]` + subtle green tint bg. Cards:
- For Sale: "Set a price and sell"
- Trade: "Swap for something else"
- Free: "Give it away"
- Repair Needed: "Sell as-is for parts"

Conditional field: price input ($ prefix) for "For Sale"; trade-for text input for "Trade".
Info callout (green tint border, `#274e3d` text): items with a repair verdict get 2× more interest — links to repair verdict tool.

**Step 4 — Review & Publish:**
Preview card (`#f3f4ec` bg) with image placeholder, title, badges, description preview, price/type. "Publish Listing" full-width dark green CTA.

**Navigation:** Back button (outline, hidden on step 1 via `opacity-0 pointer-events-none`). Continue / Publish button (dark green, right-aligned).

**States:**
- Step n of 4: step indicator updates; card content swaps
- Disabled Continue: when required fields for current step are empty
- Publishing: spinner on "Publish Listing" button

**Copy:**
- Page title: "Create a Listing"
- Subtitle: "Help an item find its next home."
- Step 1 hint: "Tip: Clear, well-lit photos get 3× more views. Show any damage honestly."
- Repair callout: "Items with a Repair Verdict attached get 2× more interest!"
- Publish CTA: "Publish Listing"

---

## 6. Motion Choreography — Demo Script Walkthrough

**Beat 1 (0:00–0:25) — Hook: intake on phone**

User opens `/new`. The form sections stagger in via `cardEnter` with `staggerChildren: 0.04s` — the effect is deliberate and purposeful, not flashy. User selects "Laptop" from the category Select (smooth native dropdown). The CameraCapture zone is tapped: it expands to viewfinder via a `tween-slide` transition (the zone grows from the tap point using `motion.div` with `layoutId="camera-zone"`). Two photos are captured; each thumbnail enters via `chipEnter`. Symptoms text is typed; the textarea autoresizes using `AnimatePresence` + `LayoutGroup`. The "Analyze My Item" button transitions from 50%-opacity disabled to full opacity enabled using a `tween-fade` over `duration-fast`. On submit, the button enters its loading state (`badgePop` on the spinner icon) and the page exits via `pageTransition`.

**Beat 2 (0:25–1:15) — Orchestrator on the projector: timeline animates**

The `/case/[id]` page loads. Skeleton components are in place (Framer Motion `animate-pulse` via shadcn Skeleton). The first `case_events` row arrives from Supabase Realtime: `orchestrator|started`. The Orchestrator chip enters via `chipEnter` from the left. `intake|running` arrives: the Intake chip enters, its Flash badge pops in via `badgePop` (yellow pill, `spring-snappy`). `intake|complete`: chip's icon swaps from spinning loader to Lucide `check-circle-2` via `AnimatePresence` + `badgePop` for the icon. `diagnosis|running` arrives: the Pro badge pops in using `badgePop` with `shadow-pro` glow — the blue badge is visually distinct and notably larger than Flash, narrating "this is the high-stakes model." The diagnosis chip pulses in its `awaiting_user` state (pulsing amber ring using CSS `animate-ping` on a pseudo-element). The follow-up Sheet slides up from the bottom via `tween-slide`. User taps "Yes." Sheet exits via `tween-slide` exit (shorter than enter per `exit-faster-than-enter`). Diagnosis resumes, chip transitions to `complete` with elapsed time appearing in `caption` style. Economics chip enters with Flash badge (smaller, warmer yellow — the contrast with Pro's blue is intentional and demo-narratable). Action Plan chip enters. `orchestrator|complete` — Orchestrator chip gets its checkmark.

**Beat 3 (1:15–1:45) — Verdict reveal**

As `economics|complete` lands, the VerdictCard skeleton dissolves and the real card enters via `verdictReveal` (`spring-gentle`, 280ms). The RRR score counts up from 0.00 to 0.78 using `useMotionValue` + `animate()` over 600ms (JetBrains Mono, `--color-primary` green, `mono-lg` 24px). The five breakdown bars wipe from left to right with `spring-card` stagger, 40ms per row — each bar fills to its proportion simultaneously as the score counts up, creating a synchronized reveal. The SafetyBanner enters via `safetyBannerEnter` — height animates from 0 to auto, amber glow expanding with `shadow-safety`. This is the most dramatic single moment in the demo: the amber banner arrives before the VerdictCard finishes revealing, creating a clear visual hierarchy: safety first, then verdict. The UncertaintyNote fades in last via `tween-fade`.

**Beat 4 (1:45–2:00) — Pitch**

No new UI events. The populated state holds. If `F-fe-map` shipped, the HelperMap renders with three pins entering via `badgePop` with `staggerChildren: 0.08s`. The presenter narrates the RRR breakdown numbers while the bars stay visible. The "Load Demo Case" button at the bottom provides a visible reset affordance for judges who want to see it again.

---

## 7. Accessibility Checklist (WCAG 2.2 AA)

Applied rules from ui-ux-pro-max §1 (accessibility, CRITICAL) and §2 (touch, CRITICAL).

| Requirement | Implementation |
|---|---|
| Text contrast 4.5:1 minimum | All foreground/background pairs verified against tokens in §2.1. `--color-foreground` on `--color-background`: 14.2:1 (light), 13.8:1 (dark). |
| Large text 3:1 minimum | `display` and `h1` Calistoga at 28px+ qualify as large text; target 3:1 maintained. |
| Focus rings visible | `--color-ring` 2px solid on all interactive elements; never removed. Matches green brand. |
| Touch targets 44×44px minimum | All buttons min-height 44px. Category cards 80×80px. Timeline chips 44px height. Urgency pills 36px height × ≥60px width. |
| Touch spacing 8px minimum between targets | Urgency pill group uses 6px gap (borderline — increase to 8px in implementation). |
| Color not sole indicator | RRRBadge: label text + icon. SafetyBanner: "Safety First" heading + icon. AgentTimeline chips: status text + icon. |
| Aria labels on icon-only buttons | Camera capture zone, thumbnail remove buttons, follow-up sheet close (if added). |
| Form labels always visible | No placeholder-only labels anywhere. |
| `role="alert"` on SafetyBanner | Ensures screen readers announce the safety content immediately. |
| `role="status"` on RRRBadge | Non-disruptive live region for verdict updates. |
| `aria-live="polite"` on AgentTimeline | New chips announced without interrupting current speech. |
| `prefers-reduced-motion` | All spring/slide animations collapse to opacity-only fades at `duration-micro`. CSS: `@media (prefers-reduced-motion: reduce)`. |
| Keyboard navigation | Tab order: nav → main content → sidebar. Timeline chips are focusable with `tabIndex`. All Sheets/Dialogs trap focus inside with `inert` on rest. |
| Skip links | Single "Skip to main content" link at document top, visible on focus. |
| Heading hierarchy | H1: page title. H2: sections (Agent Pipeline, Verdict, Action Plan). H3: card titles. No levels skipped. |
| Bottom sheet swipe-down | `aria-label` on close affordance; keyboard Escape dismisses. |
| Error recovery | Every error state includes a "Try Again" CTA or link to correction. |
| `min-h-dvh` not `100vh` | Applied on landing hero and sign-in page to handle mobile browser chrome correctly. |

---

## 8. Stitch + Figma Handoff Notes

**Feeding this doc into Stitch:**

1. Use the tokens section (§2) to prime Stitch with the design system. Input the color palette as "brand colors" and the typography pairings as "font choices." Reference the `--color-safety` amber as a distinct brand moment.
2. Feed component specs one at a time (§3.1–3.7). Each spec includes: purpose, size, states, copy. Include the ASCII layout as spatial reference.
3. Feed screen specs (§5) with ASCII wireframes. Stitch reads ASCII as layout maps — the proportions matter.
4. Use exact copy from each section — Stitch performs better with real text than "Lorem ipsum."

**What to verify after Stitch generates:**

- [ ] SafetyBanner amber is visually distinct from primary green — never let Stitch default both to brand color
- [ ] Pro badge (blue) is visually larger/more prominent than Flash badge (amber) — verify in generated frames
- [ ] RRRBadge uses `radius-full` (pill), not square corners
- [ ] VerdictCard breakdown bars are thin (4px height), not chunky progress bars
- [ ] Typography: Calistoga on display/h1 only, Inter everywhere else, JetBrains Mono on numeric values
- [ ] SafetyBanner appears ABOVE VerdictCard in the layout order (both in Figma frame and in code)
- [ ] UncertaintyNote is a separate component from SafetyBanner — different visual style (left border vs full card)

**Figma frame naming:**
- `S1/Phone/Unauthenticated` `S1/Phone/Authenticated` `S1/Desktop/Authenticated`
- `S2/Phone/Idle` `S2/Phone/Valid` `S2/Phone/Submitting`
- `S3/Phone/Loading` `S3/Phone/AwaitingUser` `S3/Phone/Populated` `S3/Phone/Failed` `S3/Desktop/Populated`
- `S4/Desktop/Populated` (stretch)
- `S5/Phone/Idle` `S5/Phone/Sent`
- `S6/Phone/404` `S6/Phone/RunFailed` `S6/Phone/Network`

**Figma component naming:**
`RRRBadge/repair_now/default` `RRRBadge/replace_now/loading` `VerdictCard/populated/default` `SafetyBanner/battery_swelling/visible` `AgentTimeline/chip/running-flash` `AgentTimeline/chip/complete-pro`

**Framer Motion integration notes for implementors:**
- Import `motion`, `AnimatePresence`, `LayoutGroup` from `framer-motion`
- Wrap the AgentTimeline list with `<motion.ul layout>` and `LayoutGroup id="agent-timeline"` for automatic layout animation on chip additions
- VerdictCard uses `layoutId="verdict-card"` for shared-element if needed between skeleton and populated
- All `AnimatePresence` wrappers need `mode="wait"` for skeleton → content transitions to prevent overlap

---

## 9. Design System Persistence

The ui-ux-pro-max `--persist` flag would generate `design-system/MASTER.md` at the repo root and per-page overrides at `design-system/pages/`. For this project:

- `design-system/MASTER.md` — global tokens (Section 2 of this doc), component defaults, motion tokens
- `design-system/pages/intake.md` — overrides for S2: camera capture zone, multi-step form behavior
- `design-system/pages/verdict.md` — overrides for S3: safety banner prominence rules, RRR breakdown visualization
- `design-system/pages/landing.md` — overrides for S1: hero typography scale at display size

**Persistence command (run after this spec is approved):**
```
python3 /home/danny/.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py "sustainability repair AI tool mobile-first trust warm" --design-system --persist -p "Bronco Repair Desk"
```

Then run with `--page` flag for each override page listed above.

**Context-aware retrieval prompt for implementors:**
```
I am building the [verdict] page. Please read design-system/MASTER.md.
Also check if design-system/pages/verdict.md exists. If the page file
exists, prioritize its rules. If not, use the Master rules exclusively.
```

---

## 10. Open Questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| 1 | Does the follow-up question Sheet support free-text only, or do binary (Yes/No) questions get a dedicated two-button layout? The spec allows both — the implementation needs a detection heuristic. | S3 awaiting_user state | Frontend + Agent |
| 2 | Director view (S4) QR code: does the phone need to be authenticated with the same user account as the laptop, or is the case ID alone sufficient to subscribe to Realtime? RLS policy on `case_events` requires `user_id = auth.uid()` — this may force same-account login. | S4 design | Platform + Integration |
| 3 | "Load Demo Case" button: does this live on S1 (landing) as a secondary CTA, on S3 (verdict) as a reset, or both? Both locations are sketched in this spec — implementation should confirm. | S1 + S3 | Frontend + Integration |
| 4 | The `HelperMap` component uses leaflet which is SSR-incompatible. Is the dynamic import pattern (`ssr: false`) already in `next.config.js`, or does Frontend need to add the config? | S3 helper section | Frontend + Platform |
| 5 | Safety banner amber vs. Flash badge amber: both use `--color-flash` / `--color-safety` which are both `#D97706` in light mode. Should Flash badge use a slightly different hue (e.g., `#B45309` for Flash) to avoid visual ambiguity between "model badge" amber and "safety" amber? Recommend yes — differentiate Flash badge to `#B45309` / `#92400E` dark. | Component library | Frontend (S1 font baseline) |
| 6 | Calistoga is an italic-style serif — does the team accept its warm/editorial character, or does a neutral-but-distinctive alternative like DM Serif Display better match the tone? Decision needed before Figma import. | §2.2 typography | Frontend + S4 |
