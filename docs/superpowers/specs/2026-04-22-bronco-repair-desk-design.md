# Bronco Repair Desk — PRD / Design

**Event:** BroncoHack 2026 (Cal Poly Pomona, 24-hour hackathon)
**Track:** Sustainability (primary)
**Prize target:** Best Use of AI/ML (primary); also optimizing for UX so Sustainability-track UX (10 pts) lands hard.
**Team:** 3–4 specialists × parallel Claude Code agents per specialist.
**Author:** Team Bronco Repair Desk
**Spec date:** 2026-04-22
**Status:** Approved design, pre-implementation

---

## 1. Executive summary

Bronco Repair Desk is a dual-mode sustainability platform combining an AI repair verdict desk with a campus-wide marketplace and trading system. On the repair side, a student captures 1–3 photos of a broken item on their phone, enters symptoms and (optionally) a repair quote, and receives a structured diagnosis + a transparent repair-vs-replace verdict + a practical action plan — in under 45 seconds. An orchestrator agent delegates to five sub-agents, routing to Gemini 2.5 Flash for lightweight work and Gemini 2.5 Pro for high-stakes diagnosis reasoning. Every phase of the orchestration is streamed as a live event to any client subscribed to the case, which both powers the user-facing timeline and enables a dual-screen "director view" on a laptop for dramatic judging.

On the marketplace side, students list items as For Sale, Trade, Free, or Repair Needed — creating a closed-loop recirculation economy on campus. Listings that need repair can be directly linked to a repair verdict, so a buyer sees the AI diagnosis alongside the asking price. An in-app messaging system supports swap negotiation. A gamification layer awards Green Points for sustainable actions (repairs, trades, free giveaways) redeemable at on-campus vendors including Panda Express and Pony Express, reinforcing the sustainability loop beyond individual repair decisions.

The sustainability story: a $100 battery repair decision averts a $999 e-waste purchase; a traded bicycle averts a new purchase entirely; 500+ items recirculated saves an estimated 2 tons of waste from landfill. The technical story: visible multi-agent orchestration, visible model routing, transparent scoring (no black box), and per-category grounding data keep Gemini honest across four failure domains (consumer electronics, mechanical mobility, hybrid mobility, thermal appliance).

The prototype was built from Figma designs (file key: `Q1U2pgxm0XqISBmUpGRe1g`, 10 screens) using Next.js 16, React 19, Tailwind CSS v4, and TypeScript.

---

## 2. Problem and opportunity

### Problem
Cal Poly Pomona students — like most college students — throw away reusable items during finals week and move-out because:
1. **Diagnosis is opaque.** Students don't know whether a $180 technician quote is fair.
2. **Trust gap.** They can't tell whether the shop is upselling, or whether the fix is actually needed.
3. **Time pressure.** Semester deadlines push "just replace it" over "investigate and repair."

### Opportunity
A single camera-first interaction that returns a believable diagnosis, a transparent repair-vs-replace score, and a practical next step lowers the friction of repairing below the friction of replacing — exactly where students stand at finals and move-out.

### Why now
Gemini 2.5's multimodal reasoning + structured JSON output + long context make small-team, weekend-built diagnostic agents feasible for the first time. Supabase Realtime plus Vercel AI SDK 6 makes live multi-agent orchestration visible in the UI without standing up custom websocket infrastructure.

---

## 3. Target users

**Primary persona — Jamie, CPP sophomore.** Lives in a dorm, rides an e-scooter to class, owns a 3-year-old laptop, has a mini fridge in their room. Has ~$400/month discretionary budget and is sustainability-aware but not activist. Wants to make the right call fast. Willing to do a modest DIY repair but not electronics disassembly.

**Secondary persona — peer helper.** Engineering student with a soldering iron and a willingness to help classmates for beer money or karma. Not modeled in MVP beyond the stub Helper Routing agent.

---

## 4. Track & prize strategy

| Axis | Strategy |
|---|---|
| **Track — Sustainability** | Diversion of 4 high-waste student items from landfill/trash. Visible economic logic makes "repair" feel rational, not preachy. Carbon/waste framing shown in verdict copy. |
| **Prize — Best Use of AI/ML** | Visible orchestrator + sub-agent delegation, visible model routing (Flash vs Pro), transparent scoring rubric, multimodal diagnosis from photos, follow-up-question conversational flow. |
| **Secondary — UX / Sustainability UX (10 pts)** | Mobile-first capture, live event timeline animation, readable RRR breakdown, no jargon, no preaching. V0-scaffolded shadcn UI polished by hand. |

We explicitly do **not** target Best Beginner, Best Hardware, Best Cybersecurity, or Best V0 as primary prizes, but V0 is used for scaffolding regardless.

### Judging-rubric mapping

| Rubric axis (max pts) | How we earn it |
|---|---|
| Impact (10) | Concrete sustainability outcome: verdict + cost band + action plan. Real CPP-relevant items (laptop, bike, e-scooter, mini fridge). **Campus Impact stats (500+ items recirculated, 2 tons diverted) visible on landing page. Green Points loop makes sustainability measurable at the individual student level.** |
| Functionality (10) | Complete flow end-to-end: capture → orchestrate → verdict → action plan, with one interactive follow-up. **Marketplace create-listing wizard, item detail with repair estimate callout, messaging system, and rewards dashboard all fully functional in prototype.** |
| UX & Design (10) | Mobile-first, responsive, animated event timeline, transparent score breakdown, graceful fallbacks. **Figma-sourced design system with Manrope/Work Sans typography, sustainability-green palette, and cream backgrounds delivers a polished, cohesive visual identity across all 8 routes.** |
| Creativity (5) | Dual-screen director view; conversational follow-up; visible model routing. **"Repair Needed" listing type linking AI verdict to marketplace item is a novel product pattern not seen in prior art. Green Points redeemable at Panda Express/Pony Express closes the loop in a campus-native way.** |
| Technical complexity (10) | Multi-agent orchestration on Gemini, run-versioned conversation state, Realtime event bus, multimodal + optional video. |
| Presentation (10) | Tight 2-minute scripted demo with rehearsed fallback. |

---

## 5. Scope

### 5.1 MVP — Repair Verdict Desk (must ship in 24hr — non-negotiable)

| Area | What's in |
|---|---|
| Auth | Supabase Auth (Google OAuth + magic-link) |
| Categories | Four hand-tuned: **laptop, bicycle, e-scooter, mini fridge** |
| Intake | Mobile browser camera capture (up to 3 JPEGs), symptoms text, urgency, optional model #, optional quoted price |
| Orchestrator | Stateless per invocation; writes typed events to `case_events`; uses `case_runs` as control plane |
| Sub-agents (live) | Intake Parser, Diagnosis, Economics, Action Plan |
| Sub-agent (stub) | Helper Routing (returns seeded fake helpers) |
| Model routing | Gemini 2.5 Flash for Intake / Economics / Action Plan / Helper Routing; Gemini 2.5 Pro for Diagnosis. Visible badge per phase. |
| Verdict UI | Repair-vs-replace score, label, `rrr_breakdown`, cost band, uncertainty note |
| Event timeline UI | Animates each agent phase as it lands from Supabase Realtime |
| Conversational follow-up | Exactly one `awaiting_user` pause per run; user answers on phone; same run resumes |
| Rerun | New run created on field-edit, manual-retry, or new-info; old runs preserved |
| Demo fallback | "Load Demo Case" button replays a seeded `case_events` timeline on a timer |

### 5.1b Campus Marketplace & Trading System (prototype shipped)

The following features are fully built in the UI prototype (Next.js 16 / React 19 / Tailwind CSS v4 / TypeScript, sourced from Figma file key `Q1U2pgxm0XqISBmUpGRe1g` with 10 design screens).

#### Listing types

| Mode | Description | Notes |
|---|---|---|
| **For Sale** | Fixed asking price | Standard e-commerce flow |
| **Trade** | Swap for another item; "Trade" badge replaces price | Negotiated via in-app messaging |
| **Free** | Give away at no cost | Highest Green Points reward to poster |
| **Repair Needed** | Sell as-is for parts | Repair estimate callout links to AI verdict if a case exists |

#### Marketplace screen inventory (Next.js routes)

| Route | Screen | Key elements |
|---|---|---|
| `/` | Landing page | Hero ("Sustainable Campus Life"), How it Works (3-step flow), Marketplace preview (2 item cards), Repair Verdict preview panel, Campus Impact strip (500+ items recirculated, 2 tons waste diverted), Browse Categories (Laptops, Bicycles, E-Scooters, Appliances), footer |
| `/marketplace` | Campus Marketplace | Full item grid; tabs: All / For Sale / Free / Trade / Repairable; search + filter bar (Category, Price, Condition, Repair Needed); My Activity sidebar (Active Listings bar, Recent Bids & Views); Impact strip (1,245 items, $15.4k in campus savings) |
| `/marketplace/[id]` | Item Detail | Photo gallery, condition badge, price or "Trade" label, description, repair estimate callout (links to AI verdict), seller profile card, Message Seller + Save to Wishlist CTAs |
| `/repair/[id]` | Agent Consultation Workspace | Case summary card (device image, status badge, symptoms text); Evidence Gathering panel (follow-up question with image upload + Yes / No / Intermittent buttons); Progress sidebar (3-step timeline: Evidence Received → Agent Orchestration → Synthesizing Verdict); Agent Review Board (4 agent cards: Intake Agent [COMPLETE], Diagnosis Agent [ANALYZING], Economics Agent [WAITING], Action Plan Agent [WAITING]); Final Recommendation placeholder (dashed border, "Verdict Locked" state) |
| `/dashboard` | Repair Student Dashboard | Stats row (Active Cases, Verdicts Ready, Avg Repair Cost, CO2 Saved); case list table with status badges and repairability scores |
| `/messages` | Messaging System | Two-column layout: conversation list sidebar (avatar, preview, timestamp) + chat thread panel; real-time-feel message bubbles; Make Offer button for trade/price negotiation |
| `/rewards` | Rewards & Impact Dashboard | Green Points balance (1,240 pts in demo); Items Recirculated count (12); CO2 Prevented (28 kg); Achievements grid (6 badge types, see §5.1c); Recent Activity log; Campus Leaderboard (rank #7) |
| `/create-listing` | Create Listing wizard (4 steps) | Step 1: Photos (drag-and-drop upload area); Step 2: Details (title, category, condition, description, pickup location); Step 3: Pricing & Type (For Sale / Trade / Free / Repair Needed selector); Step 4: Review & Publish |

### 5.1c Gamification & Green Points

A points-based incentive layer creates a sustainability loop: act sustainably → earn Green Points → redeem at on-campus vendors.

#### Points ledger

| Action | Points awarded |
|---|---|
| Sell an item | +50 pts |
| Trade an item | +40 pts |
| Get a repair verdict (item repaired, not replaced) | +30 pts |
| Give an item away for free | +20 pts |

#### Achievement badges (6 types in prototype)

| Badge | Trigger |
|---|---|
| First Item Recirculated | List and complete first item transaction |
| 5 Items Traded | Complete 5 trade listings |
| Repair Veteran | Receive 3 or more repair verdicts |
| Green Champion | Accumulate 500 Green Points |
| Campus Hero | Accumulate 1,000 Green Points |
| Zero Waste Pioneer | Give away 3 or more items for free |

#### Campus Leaderboard

Visible on `/rewards`; ranks all campus users by total Green Points earned. Drives social competition around sustainable behavior. Demo seed shows current user at rank #7.

#### Vendor redemptions

Green Points are redeemable at on-campus partners:
- **Panda Express** (campus dining)
- **Pony Express** (campus convenience)
- Other campus dining and retail partners

Redemptions close the incentive loop: students earn points through sustainability actions and spend them at vendors they already use daily, making green behavior feel tangible rather than abstract.

### 5.1d Messaging system

`/messages` provides a two-column in-app chat interface:
- **Left panel:** conversation list with avatar, preview text, and timestamp for each thread.
- **Right panel:** full chat thread with message bubbles and timestamps.
- **Make Offer button:** surfaces in trade and for-sale threads to initiate price negotiation inline.
- No external messaging app required; all negotiation stays within the platform.

### 5.1e Design system (Figma → prototype)

The prototype was built directly from Figma designs (file key: `Q1U2pgxm0XqISBmUpGRe1g`, 10 screens). Extracted tokens:

| Category | Values |
|---|---|
| **Primary** | `#1b4332` (dark green), `#012d1d` (deeper green) |
| **Background** | `#f9faf2` / `#f3f4ec` (cream) |
| **Accent** | `#ffca98` (peach), `#ffdcbd` (light peach), `#c1ecd4` (light green) |
| **Text** | `#1a1c18` (primary), `#414844` (secondary), `#717973` (muted) |
| **Headings font** | Manrope Bold / SemiBold |
| **Body font** | Work Sans Regular / SemiBold |

Stack note: the prototype runs **Next.js 16, React 19, Tailwind CSS v4, TypeScript** (the original spec targeted Next.js 15; the build was advanced to 16 during scaffolding).

### 5.2 Stretch (ship if streams have capacity, strict Hr 20 cutoff)

| # | Stretch | Est. | Priority |
|---|---|---|---|
| 1 | Dual-screen director view (QR pair + laptop Realtime subscriber) | ~3h | Highest — biggest demo unlock |
| 2 | Nearby technicians (Places API + leaflet.js) | ~3h | High — direct sustainability points |
| 3 | Video + voice intake (5-10s clip, Gemini 2.5 Pro processes natively) | ~4–6h | Medium — biggest wow |
| 4 | Persistent memory (prior-case recall in Diagnosis prompt prefix) | ~1.5h | Medium — low effort, narrative win |
| 5 | Community distress board (post + helper offers; needs 2 test accounts) | ~4h | Low — most scope |

Gating: video is behind `FEATURE_VIDEO_INTAKE=false` until a stream owner flips it.

### 5.3 Explicitly cut

- Real technician marketplace / verification
- Payment, escrow, logistics
- Live video *streaming* (async upload only)
- Part-number compatibility guarantees
- General chatbot (every interaction is scoped to diagnosing an item)
- PWA standalone mode (iOS Safari `getUserMedia` bug per research)
- Custom Google Maps MCP wrapper (direct Places API via Gemini function-calling is faster)
- Google Agent Development Kit (Vercel AI SDK 6 is faster for 24hr per research)

---

## 6. System architecture

### 6.1 Primary: Approach 2 — Realtime event bus, all-TypeScript

```
┌────────────────┐          ┌──────────────────────────────────┐
│  Phone browser │◄──HTTPS──┤         Next.js 15 (Vercel)       │
│  (capture UX)  │          │  /api/cases  (CRUD)                │       ┌─────────────┐
└──────┬─────────┘          │  /api/cases/:id/run                │──────►│ Gemini API  │
       │                    │  /api/cases/:id/media              │       │ Flash + Pro │
       │ Realtime WS        │  /api/cases/:id/runs/:runId/followup│      └─────────────┘
       ▼                    │  /api/auth/...                     │
┌────────────────┐          └──────────────┬───────────────────┘
│   Supabase     │                         │                         ┌──────────────┐
│  Postgres      │◄────────────────────────┘                         │ Places API   │
│  Auth          │                                                   │ (stretch)    │
│  Storage       │                                                   └──────────────┘
│  Realtime      │
└──────┬─────────┘
       │  Realtime WS (case_events)
       ▼
┌────────────────┐
│ Laptop browser │
│ (director view │
│   — stretch)   │
└────────────────┘
```

The **orchestrator lives inside the Next.js API route** for `POST /api/cases/:id/run` and `POST /api/cases/:id/runs/:runId/followup`. It:

1. **Acquires two advisory locks in order**, both within the same transaction:
   - `pg_advisory_xact_lock(hashtext('case:' || case_id::text))` — prevents two runs from starting concurrently on the same case.
   - `pg_advisory_xact_lock(hashtext('run:' || run_id::text))` — prevents two resumes of the same run.
   The two-level lock means: (a) at run-start, the case-id lock serializes new-run creation, and the unique partial index `case_runs_one_current` is the belt-and-suspenders enforcement; (b) at resume, the run-id lock is sufficient because the run already exists and its identity is stable.
2. Reads `case_runs` (control plane) — `status`, `current_phase`, `next_phase`, `followup_count`, `awaiting_question`.
3. Replays nothing from events; `case_runs` is source of truth for "where are we."
4. Runs the next phase. On each phase: writes output row (diagnoses/verdicts/action_plans) → updates `case_runs` → inserts `case_events` row — same transaction where possible.
5. On `awaiting_user`: flips `case_runs.status='awaiting_user'`, records `awaiting_question`, returns `200 {status:'awaiting_user', runId, question}` and releases the locks (transaction commits).
6. On `orchestrator_complete` or `_failed`: flips `case_runs.status`, clears `awaiting_question`.

The API-route handler is **stateless between phases**. A crashed invocation is resumable on retry because `case_runs` records what was already committed.

### 6.2 Backup: Approach 3 — Python agent service (documented, not built)

Same schema, same event shape, same API surface. The orchestrator is a Python FastAPI service using Google ADK or LangGraph instead of a Next.js route. Supabase Realtime still carries events to both clients. Swap-in is a backend-only change; no UI impact.

This is documented as a fallback if a team member wants to own the agent layer in Python. Default is Approach 2.

### 6.3 Stack details

- **Frontend:** Next.js 16 (App Router, React 19, React Server Components). Tailwind CSS v4 (utility-first, no config file). Client-side camera capture via `getUserMedia` (no PWA standalone mode). Animation via `framer-motion` for event-timeline arrivals. TypeScript throughout.
- **UI prototype routes:** `/` (landing), `/marketplace`, `/marketplace/[id]`, `/repair/[id]`, `/dashboard`, `/messages`, `/rewards`, `/create-listing` — all built from Figma file `Q1U2pgxm0XqISBmUpGRe1g`.
- **Backend:** Next.js API routes (Vercel). Vercel AI SDK 6 for Gemini calls + streaming helpers.
- **DB + Realtime + Storage + Auth:** Supabase (Postgres 15, RLS enabled on all case-owned tables, Realtime enabled on `case_events` only).
- **AI models:** Gemini 2.5 Flash (cheap/fast) + Gemini 2.5 Pro (deep reasoning, multimodal). Structured JSON output via `response_schema` (no parsing retries for well-specified schemas).
- **Maps (stretch):** Places API via Gemini function-calling; leaflet.js + OpenStreetMap tiles for render.
- **Hosting:** Vercel (Next.js) + Supabase. Both in `us-west-2` for CPP proximity.

Note: the original spec targeted Next.js 15; the prototype was scaffolded on Next.js 16 with React 19 and Tailwind CSS v4. All architectural decisions in §6.1–6.2 remain valid.

---

## 7. Agent graph and model routing

### 7.1 Agent graph

```
           ┌──────────────────────────────────────┐
           │  Orchestrator (control loop, no LLM) │
           └─────┬────────────────────────────────┘
                 │
   ┌─────────────┼──────────────┬─────────────────┬────────────────┐
   ▼             ▼              ▼                 ▼                ▼
Intake        Diagnosis       Economics       Action Plan    Helper Routing
(Flash)         (Pro)          (Flash)          (Flash)      (Flash, stub MVP)
```

Each sub-agent:
- Has a typed input + typed output.
- Validates output with zod; one retry with schema explicitly in the prompt on parse failure; on second failure emits a `failed` event with rationale.
- Writes its output row, updates `case_runs.current_phase`/`next_phase`, inserts `case_events` rows (`<phase>|running` before LLM call, `<phase>|complete` after).

### 7.2 Sub-agent responsibilities

| Agent | Model | Input | Output (zod schema) |
|---|---|---|---|
| Intake Parser | Flash (Pro if video) | Raw case fields + media URLs | `IntakePayload`: `{ symptoms[], evidence_quality, missing_evidence[], asking_followup? }` |
| Diagnosis | Pro | Case + `IntakePayload` + `category_reference` row + (stretch) prior cases | `DiagnosisPayload`: `{ top_causes[{cause, confidence, reasoning}], confidence, missing_evidence[], safety_flags[] }` OR `{ awaiting_user: true, question, reason }` (max 1 per run) |
| Economics | Flash | Case + `DiagnosisPayload` + `category_reference.cost_bands` | `EconomicsPayload`: `{ repair_low_cents, repair_high_cents, replacement_value_cents, rrr_score, rrr_breakdown, label, rationale, uncertainty_note }` |
| Action Plan | Flash | `DiagnosisPayload` + `EconomicsPayload` | `ActionPlanPayload`: `{ steps[], technician_questions[], helper_request_template? }` — **suppresses DIY steps if any `safety_flags` present** |
| Helper Routing | Flash (stub MVP) | Case + `technician_profiles` + `helper_requests` context | `{ matches[{helper_id, name, distance, badge, availability}] }` |

### 7.3 Model routing table (visible badges in UI)

| Phase | Model | Reason |
|---|---|---|
| Intake (text + photos) | Flash | Cheap normalization |
| Intake (with video — stretch) | Pro | Multimodal reasoning justifies cost |
| Diagnosis | **Pro** | Critical accuracy; judge-facing badge reads "high-stakes" |
| Economics | Flash | Table lookup + deterministic math |
| Action Plan | Flash | Templated drafting |
| Helper Routing | Flash | DB-driven stub |

Typical call budget per case: 4 Flash + 1 Pro ≈ $0.03 / case per research. Budget for 100 live users + rehearsals: under $5.

---

## 8. Data model

### 8.1 Schema (PostgreSQL via Supabase migrations)

> Canonical feature/table ownership lives in `docs/plan/platform-feature-contracts.md`. This section remains authoritative only for Agent Council Diagnose core tables.

```sql
-- Cases (mutable container)
create table cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  category text not null check (category in ('laptop','bicycle','e_scooter','mini_fridge')),
  title text,
  symptoms text not null,
  urgency text not null default 'normal' check (urgency in ('low','normal','urgent')),
  model_number text,
  quoted_price_cents integer,
  status text not null default 'draft'
    check (status in ('draft','awaiting_user','running','complete','failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Media (append-only for MVP)
create table case_media (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  storage_path text not null,
  media_type text not null check (media_type in ('image','video','audio')),
  ordinal int not null check (ordinal >= 0),
  created_at timestamptz default now(),
  unique(case_id, ordinal)
);

-- Runs (the versioned attempt; control plane of the orchestrator)
create table case_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  run_number int not null,
  status text not null
    check (status in ('running','awaiting_user','complete','failed')),
  trigger_reason text not null
    check (trigger_reason in ('initial','manual_retry','field_edit','new_info')),
  current_phase text
    check (current_phase in ('orchestrator','intake','diagnosis','economics','action_plan','helper_routing')),
  next_phase text
    check (next_phase in ('orchestrator','intake','diagnosis','economics','action_plan','helper_routing')),
  followup_count int not null default 0,
  awaiting_question text,
  input_snapshot jsonb not null,
  is_current boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Exactly one current run per case:
create unique index case_runs_one_current
  on case_runs(case_id) where is_current;
create index on case_runs(user_id);
-- Invariant: creating a new run row with is_current=true MUST demote the prior current row
-- to is_current=false within the same transaction as the insert. The run-start endpoint
-- (POST /api/cases/:id/run) is the only writer that mutates is_current; all other paths treat
-- is_current as read-only. The unique partial index is the DB-level backstop against drift.

-- Conversational thread (rerun notes + follow-up Q/A)
create table case_messages (
  id bigserial primary key,
  case_id uuid not null references cases(id) on delete cascade,
  run_id uuid not null references case_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  author_type text not null check (author_type in ('user','assistant')),
  kind text not null check (kind in ('rerun_note','followup_question','followup_answer')),
  body text not null,
  created_at timestamptz default now()
);
create index on case_messages(case_id, run_id, id);

-- THE event-bus table (only Realtime-enabled table)
create table case_events (
  id bigserial primary key,
  case_id uuid not null references cases(id) on delete cascade,
  run_id uuid not null references case_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  phase text not null
    check (phase in ('orchestrator','intake','diagnosis','economics','action_plan','helper_routing')),
  status text not null
    check (status in ('started','running','awaiting_user','complete','failed')),
  model_tier text check (model_tier in ('flash','pro')),
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);
create index on case_events(case_id, run_id, id);
create index on case_events(user_id);
-- Enable Realtime (supabase-specific):
alter publication supabase_realtime add table case_events;

-- Run-scoped outputs
create table diagnoses (
  run_id uuid primary key references case_runs(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  top_causes jsonb not null,
  confidence numeric not null check (confidence between 0 and 1),
  missing_evidence jsonb not null default '[]',
  safety_flags jsonb not null default '[]',
  raw_response jsonb,
  created_at timestamptz default now()
);

create table verdicts (
  run_id uuid primary key references case_runs(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  repair_low_cents integer,
  repair_high_cents integer,
  replacement_value_cents integer,
  rrr_score numeric check (rrr_score between 0 and 1),
  rrr_breakdown jsonb not null,
  label text check (label in ('repair_now','repair_if_cheap','wait_monitor','replace_soon','replace_now')),
  rationale text,
  uncertainty_note text,
  created_at timestamptz default now()
);

create table action_plans (
  run_id uuid primary key references case_runs(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  steps jsonb not null,
  technician_questions jsonb not null default '[]',
  helper_request_template text,
  safety_preamble text,           -- populated by applySafetyGuard when safety_flags non-empty; NULL otherwise
  created_at timestamptz default now()
);

-- Community board (stretch)
create table helper_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id),
  user_id uuid not null references auth.users(id),
  campus_area text,
  preferred_time text,
  status text default 'open' check (status in ('open','offered','closed')),
  created_at timestamptz default now()
);

-- Per-category grounding data (S4 fills; S2 reads in prompts)
create table category_reference (
  category text primary key,
  failure_modes jsonb not null,
  cost_bands jsonb not null,
  diagnostic_questions jsonb not null,
  safety_warnings jsonb not null
);

-- Ergonomics view: current-run outputs for hot-path UI reads
create view current_case_outputs as
  select c.id as case_id, c.user_id, r.id as run_id,
         d.top_causes, d.confidence, d.safety_flags,
         v.rrr_score, v.rrr_breakdown, v.label, v.rationale, v.uncertainty_note,
         v.repair_low_cents, v.repair_high_cents, v.replacement_value_cents,
         a.steps, a.technician_questions, a.safety_preamble
  from cases c
  join case_runs r on r.case_id = c.id and r.is_current
  left join diagnoses d on d.run_id = r.id
  left join verdicts v on v.run_id = r.id
  left join action_plans a on a.run_id = r.id;
```

### 8.2 RLS posture

- `cases`, `case_media`, `case_runs`, `case_messages`, `case_events`, `diagnoses`, `verdicts`, `action_plans`: `select` / `insert` / `update` restricted to `user_id = auth.uid()`. No delete policy (demo-grade; add later).
- `helper_requests`: `select` for all authenticated users (community); `insert` / `update` restricted to own `user_id`.
- `category_reference`: `select` for all authenticated users; no writes.
- `technician_profiles`: public authenticated `select`; profile owner or service role may update helper metadata.
- `user_id` is denormalized onto every case-owned table to support fast RLS pushdown without joining back to `cases`.

### 8.3 Realtime topology

- Only `case_events` publishes Realtime events.
- Phone subscribes `realtime:case_events:case_id=eq.<caseId>` (case-wide). Client-side filter by the active `currentRun`. When a `{phase:'orchestrator', status:'started'}` event arrives with a new `run_id`, the phone switches `currentRun` — catches reruns initiated from other clients.
- Laptop director view (stretch) subscribes identically; may render all runs or just current.

---

## 9. Event & state contracts (the integration glue — S3 publishes at Hr 4)

### 9.1 TypeScript contracts (workspace package `lib/types/**`)

```typescript
export type CaseCategory = 'laptop' | 'bicycle' | 'e_scooter' | 'mini_fridge';
export type ModelTier = 'flash' | 'pro';
export type Urgency = 'low' | 'normal' | 'urgent';
export type VerdictLabel =
  | 'repair_now' | 'repair_if_cheap' | 'wait_monitor'
  | 'replace_soon' | 'replace_now';

export type AgentPhase =
  | 'orchestrator' | 'intake' | 'diagnosis'
  | 'economics' | 'action_plan' | 'helper_routing';

export type PhaseStatus =
  | 'started' | 'running' | 'awaiting_user' | 'complete' | 'failed';

export interface CaseEvent {
  id: number;
  caseId: string;
  runId: string;
  userId: string;
  phase: AgentPhase;
  status: PhaseStatus;
  modelTier: ModelTier | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

// Phase payloads
export interface IntakePayload {
  symptoms: string[];
  evidenceQuality: 'low' | 'medium' | 'high';
  missingEvidence: string[];
  askingFollowup?: string | null;
}

export interface DiagnosisCompletePayload {
  topCauses: { cause: string; confidence: number; reasoning: string }[];
  confidence: number;
  missingEvidence: string[];
  safetyFlags: string[];
}

export interface DiagnosisAwaitingUserPayload {
  question: string;
  reason: string;
  missingEvidence: string[];
}

export interface RrrBreakdown {
  confidence: number;       // 0.35 × diagnosis_confidence
  costFactor: number;       // 0.25 × (1 − repair_cost / replacement_value)
  effortFactor: number;     // 0.20 × effort_factor
  partAvailability: number; // 0.10 × part_availability
  urgencyFactor: number;    // 0.10 × urgency_factor
  total: number;
}

export interface EconomicsPayload {
  repairLowCents: number;
  repairHighCents: number;
  replacementValueCents: number;
  rrrScore: number;
  rrrBreakdown: RrrBreakdown;
  label: VerdictLabel;
  rationale: string;
  uncertaintyNote: string;
}

export interface ActionPlanPayload {
  steps: { action: string; when: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  technicianQuestions: string[];
  helperRequestTemplate?: string;
  safetyPreamble?: string;  // set when safety_flags non-empty
}
```

### 9.2 Sub-agent interface

```typescript
export interface SubAgent<TIn, TOut> {
  name: AgentPhase;
  model: ModelTier;
  run(input: TIn, ctx: AgentContext): Promise<TOut>;
}

export interface AgentContext {
  caseId: string;
  runId: string;
  userId: string;
  emit(evt: {
    phase: AgentPhase;
    status: PhaseStatus;
    modelTier: ModelTier | null;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
```

---

## 10. API surface

| Method & path | Purpose | Auth |
|---|---|---|
| `POST /api/cases` | Create draft case | user |
| `PATCH /api/cases/:id` | Update editable fields (symptoms, urgency, model #, quote) — only when no run is active | user, owner |
| `POST /api/cases/:id/media` | Upload + attach media (returns signed storage URL) | user, owner |
| `POST /api/cases/:id/run` | In a single transaction: acquire case-id advisory lock, set any existing `is_current=true` row for this case to `is_current=false`, insert a new `case_runs` row with `is_current=true` + snapshot fields + selected media ids into `input_snapshot`, then start orchestration. | user, owner |
| `POST /api/cases/:id/runs/:runId/followup` | Write follow-up answer to `case_messages`, flip run to `running`, resume from `diagnosis` onward | user, owner |
| `GET /api/cases/:id/current` | Read `current_case_outputs` view | user, owner |
| `POST /api/helpers` *(stretch)* | Post to community board | user |

Retry after `complete` or `failed` always creates a **new** `case_runs` row with `trigger_reason` in `{manual_retry, field_edit, new_info}`. A follow-up resume does **not** create a new run, does not change `trigger_reason`, and does not write a new `diagnoses` / `verdicts` / `action_plans` row until the run produces its fresh `diagnosis · complete`. Partial state during `awaiting_user` lives only in the `case_events.payload` of the emitting event + in `case_runs.awaiting_question`; the `diagnoses` row is written only when a complete diagnosis is produced (either on first reach or after resume).

---

## 11. Scoring rubric & safety rules

### 11.1 Repair-vs-replace (RRR) formula

The verdict score is produced by the Economics agent. It is a transparent weighted sum — no model, no black box. The component factors are written to `verdicts.rrr_breakdown` and rendered in the UI next to the total, so judges can audit the math.

```
RRR = 0.35 × diagnosis_confidence        // how sure are we of the root cause
    + 0.25 × cost_factor                 // cost_factor = clamp(1 − repair_cost / replacement_value, 0, 1)
    + 0.20 × effort_factor               // easy=1.0, medium=0.6, hard=0.3
    + 0.10 × part_availability           // in_stock=1.0, special_order=0.5, scarce=0.0
    + 0.10 × urgency_factor              // low=1.0, normal=0.7, urgent=0.4
```

**`repair_cost`** is the midpoint of `repair_low_cents` and `repair_high_cents`.
**`replacement_value_cents`** is the *comparable used/refurb* anchor, not the new-retail price. This is critical for demo honesty: the hook may mention a new-retail number for drama, but the rubric denominator must be the refurb comparable. The Economics agent is required to populate `replacement_value_cents` from `category_reference.cost_bands.replacement_refurb` (falling back to `replacement_used` if refurb unavailable).

**Label thresholds:**

| Score | Label |
|---|---|
| ≥ 0.70 | `repair_now` |
| ≥ 0.55 | `repair_if_cheap` |
| ≥ 0.40 | `wait_monitor` |
| ≥ 0.25 | `replace_soon` |
| < 0.25 | `replace_now` |

**`rrr_breakdown` payload shape** (typed in §9.1): each of the five weighted components, plus `total`. All five component values are in [0, weight]; `total` is the sum.

**Uncertainty note** is always populated and always rendered — never empty. It names the single weakest input (e.g., *"Confidence held back by missing power-supply test; verify before purchase"*). This is a prompt-level requirement for the Economics agent and also a UI-level validation (a verdict with empty `uncertainty_note` is rejected by the zod schema).

**Test coverage requirement:** `lib/agents/economics.test.ts` contains boundary tests for each of the five label thresholds and a golden test verifying the laptop demo case lands on `repair_now` with `rrr_score ∈ [0.77, 0.80]` given the scripted inputs.

### 11.2 Safety rules (Action-Plan invariant)

This is a hard rule, not a prompt guideline, because judges will poke the swollen-battery case.

**Rule:** if `DiagnosisCompletePayload.safetyFlags` is non-empty, the Action-Plan agent:
1. Suppresses any step with `difficulty ∈ {medium, hard}` that involves disassembly, pressure, heat, or electricity.
2. Prepends `safetyPreamble` with category-specific safety copy (e.g., for `battery_swelling`: *"Swollen lithium batteries are a fire risk. Do not press, puncture, or attempt disassembly. Use a professional service."*).
3. Replaces self-fix steps with professional-service wording.
4. Still provides technician questions.

Safety flags in MVP: `battery_swelling`, `refrigerant_leak`, `brake_failure`, `scooter_battery_thermal`. Defined in `category_reference.safety_warnings`.

**Enforcement location (not a prompt):**
- File: `lib/agents/action-plan.ts`
- Function: `applySafetyGuard(payload: ActionPlanPayload, safetyFlags: string[]): ActionPlanPayload`
- Called unconditionally *after* the LLM returns and *before* the result is written to `action_plans` — so a misbehaving prompt cannot bypass it.

**Test coverage requirement:** `lib/agents/action-plan.test.ts`:
- `applySafetyGuard(<plan with hard steps>, [])` → plan unchanged, `safetyPreamble` undefined.
- `applySafetyGuard(<plan with hard steps>, ['battery_swelling'])` → hard + medium-disassembly steps removed, `safetyPreamble` populated with the `battery_swelling` copy from `category_reference.safety_warnings`, `technicianQuestions` preserved.
- Regression test for every safety flag in the MVP set (`battery_swelling`, `refrigerant_leak`, `brake_failure`, `scooter_battery_thermal`) — each must produce its own preamble and strip DIY disassembly steps.
- `action_plans` write-path integration test: a plan persisted after `applySafetyGuard` round-trips `safety_preamble` through the DB and the `current_case_outputs` view.

---

## 12. Parallel work streams

Four streams, one per specialist (+ their Claude Code agents).

| Stream | Owner specialty | Owns | Depends on |
|---|---|---|---|
| **S1 Frontend/UX** | Frontend | Mobile-first shell, V0 scaffolds, camera capture component, case form, event timeline UI, verdict panel, "Load Demo Case" button, stretches 1 & 2 UI; **prototype: all 8 marketplace/repair/rewards/messaging routes (see §5.1b), design system tokens from Figma file Q1U2pgxm0XqISBmUpGRe1g, 4-step create listing wizard, rewards dashboard** | `lib/types/**` (Hr 4) |
| **S2 Agent layer** | AI/agent plumbing | Orchestrator state machine, 5 sub-agent modules, Gemini SDK wrapper, model router, prompt templates, zod validation + retry | `lib/types/**`, `category_reference` (Hr 4) |
| **S3 Data & Infra** | Backend / DB | Supabase schema + migrations, RLS, Auth, Storage buckets, Realtime wiring, typed client SDK, advisory-lock helper, demo seed data, deploy; **marketplace listings + trades + messages + Green Points tables (if wired beyond prototype)** | — (kickoff) |
| **S4 Content + UX polish + maps** | Design / presentation | `category_reference` data for all 4 categories, diagnosis prompt tuning, RRR rubric copy, demo script copy, design polish, stretch: maps, stretch: community board; **Green Points copy, badge copy, vendor redemption copy** | `lib/types/**` (Hr 4) for schema |

**Shape freeze at Hr 2** (enums, event shape, `case_runs` control-plane fields, output payload contracts).
**Publish at Hr 4** (`lib/types/**` workspace package + migrated schema + one fixture-driven E2E path).

---

## 13. Build timeline (24hr)

| Block | S1 Frontend | S2 Agents | S3 Data/Infra | S4 Content + Polish |
|---|---|---|---|---|
| **Hr 0–2 Kickoff** | Monorepo, Tailwind theme, V0 scaffolds for shell | Gemini SDK wrapper skeleton, model router stub | Supabase project, env, RLS template. **Hr 2 shape freeze** | Demo storyboard locked, brand tokens |
| **Hr 2–4 Foundation** | Camera capture prototype | Sub-agent interface + Intake agent vs fixture. **`applySafetyGuard` scaffolded + full unit-test suite green (no LLM needed — pure function).** **Novice-ramp pairing: 1hr Realtime subscription + 1hr zod-validated Gemini prompt — golden-path references.** | **Schema + RLS + types committed → `lib/types/**` published.** Category `safety_warnings` seeded for demo hero (`battery_swelling`). | Category reference v1 (laptop + mini fridge), including `safety_warnings` copy |
| **Hr 4–8** | Case form wired to API, event timeline subscribed to fixture | Diagnosis agent E2E, JSON validation, `awaiting_user` emit | Storage buckets, signed URL endpoint, Realtime hook, advisory-lock helpers (case + run) | Category reference for bicycle + e-scooter, including `safety_warnings` |
| **Hr 8–12 First E2E** | Action-plan UI (incl. `safetyPreamble` banner), RRR-breakdown panel, model-routing badges | Economics + Action-Plan agents wired; **`applySafetyGuard` integrated into Action-Plan write path (already unit-tested at Hr 2–4).** Round-trip test: diagnosis with `safety_flags=['battery_swelling']` → persisted `safety_preamble` in `action_plans` → readable via `current_case_outputs`. | `current_case_outputs` view published, demo seed data | Prompt tuning vs real Gemini |
| **Hr 12–16 Polish** | Responsive sweep, framer-motion event arrivals | Follow-up flow E2E (`awaiting_user` → followup → resume) | Replay mechanism for "Load Demo Case" | Laptop swollen-battery demo fully scripted w/ seeded media |
| **Hr 16–20 Stretches** | Stretch 1: director view (QR pair + laptop subscriber) | Stretch 4: persistent memory prompt prefix | helper_requests seed | Stretch 2: Places API + leaflet |
| **Hr 20–22 Demo polish** | Copy + design polish | Stretch 3: video intake — only if stretch 1&2 done | Backup data verification | Rehearsal copy edits |
| **Hr 22–23 Freeze** | **Code freeze. Rehearsals #2 and #3. Venue-network tested. Safety-flag branch rehearsed on-stage.** |
| **Hr 23–24 Buffer** | Slide deck (3 slides). Printed demo script. Backup laptop + 2 charged phones + power bank staged. |

**Critical path:** Hr 2 shape freeze → Hr 4 contracts publish → Hr 12 first user-facing E2E → Hr 16 stretch start → Hr 20 stretch cutoff → Hr 22 code freeze.

**Hr 20 cutoff is absolute.** Any stretch not working cleanly at Hr 20 gets reverted, not force-landed. Demo polish always wins the tie.

---

## 14. Demo script (2 minutes, 4 beats)

**Setup:** Presenter on stage with phone. Laptop on projector in director view (if stretch 1 shipped; otherwise laptop mirrors phone screen via scrcpy/QuickTime).

**Beat 1 (0:00–0:25) — Hook**
*"It's finals week. My laptop fan is loud, battery dies in 90 minutes, Geek Squad quoted $250 for a battery swap, a new M3 Air is $999. What do I do?"*
Phone: open app → category **laptop** → capture 2 photos (battery health screen + trackpad close-up showing slight bulge) → type *"fan loud, battery dies in 90min, quoted $250 for battery, laptop is 3 yrs old"* → urgency normal → submit.

**Beat 2 (0:25–1:15) — Orchestrator on the projector**
Director view animates:
- `orchestrator · started`
- `intake · running` (badge **Flash**) → `intake · complete` — *2 photos, quality high*
- `diagnosis · running` (badge **Pro** — *"high-stakes, routed to Pro"*) → `diagnosis · awaiting_user`
  Question on phone: *"Has the trackpad become harder to click or started lifting / feeling uneven?"*
- Presenter taps **Yes** on phone → run resumes
- `diagnosis · complete` — top cause: *swollen LiPo battery (0.86 confidence)*. Safety flag: `battery_swelling`.
- `economics · complete` (Flash) — repair $80–$130; comparable refurb replacement ~$450
- `action_plan · complete` (Flash) — **DIY steps suppressed, safety preamble shown, professional-service wording enforced**
- `orchestrator · complete`

**Beat 3 (1:15–1:45) — Verdict + community**
Verdict panel on laptop/phone (two distinct UI fields — do not conflate):
- **Safety banner** (from `action_plans.safety_preamble`, top of Action-Plan card, yellow/amber): *"Swollen lithium batteries are a fire risk. Do not press, puncture, or attempt disassembly. Use a professional service."*
- Score **0.78 → REPAIR NOW**
- `rrr_breakdown` panel visible:
  - confidence 0.30 (0.86 × 0.35)
  - cost factor 0.19 ((1 − $110/$450) × 0.25)
  - effort 0.12 (0.6 × 0.20, "professional service")
  - parts 0.10 (1.0 × 0.10, in-stock)
  - urgency 0.07 (0.7 × 0.10, normal)
- **Uncertainty note** (from `verdicts.uncertainty_note`, the weakest-input caveat): *"Battery-health cycle count was not provided — confidence held back. Ask the technician to confirm before paying."*
- 3 technician questions displayed
- DIY disassembly steps **suppressed** (guarded by `applySafetyGuard`); action plan shows professional-service steps only.
- *(Stretch 2)* Leaflet map: 3 nearby authorized Apple service shops
- *(Stretch 5)* Community panel: 2 pre-seeded peer offers

**Beat 4 (1:45–2:00) — Pitch**
*"In 90 seconds, a $999 e-waste decision became a $100 repair. Four categories — laptop, bike, e-scooter, mini fridge. Multi-agent orchestration. Routed to Pro only when it mattered. Transparent scoring. This is Bronco Repair Desk."*

**Math sanity check:** confidence 0.30 + cost 0.19 + effort 0.12 + parts 0.10 + urgency 0.07 = **0.78** ✓ (matches the RRR formula in §11.1).

---

## 15. Risks & mitigations

| Risk | L | I | Mitigation |
|---|---|---|---|
| Gemini latency/timeout on stage | M | H | "Load Demo Case" fallback replays seeded events at realistic cadence; trigger if any phase >15s |
| Camera permission denied on demo phone | M | H | Pre-grant on rehearsal device + backup phone with permission + pre-uploaded case as 3rd fallback |
| Hostile venue network | H | H | 2nd phone hotspot; venue network tested Hr 22 |
| Vercel function timeout (60s) during diagnosis | L-M | H | Typical orchestrator 10–25s; if creeping, split diagnosis into separate function invocation |
| S3 schema delay blocks all streams | L | H | **Hard Hr 4 publish deadline** preceded by Hr 2 shape freeze |
| Pro returns malformed JSON | M | M | zod validation + 1 retry with schema in prompt; second fail → `failed` event |
| Stretch creep eats polish time | H | H | **Hard freeze on stretches at Hr 20.** Polish wins ties. |
| Concurrent reruns on same case | L | M | Two-level advisory lock: `pg_advisory_xact_lock(hashtext('case:'||case_id))` serializes run-start; `pg_advisory_xact_lock(hashtext('run:'||run_id))` serializes resume. Unique partial index `case_runs_one_current` is the DB-level backstop. |
| Realtime drop mid-demo | L-M | M | Phone polls `case_events` every 3s after 5s gap; resumes push when events flow |
| Gemini quota / cost spike | L | M | $25 cap on shared key; budget ~$3 per research; plenty for 24hr |
| Demo phone battery | M | H | 2 charged phones + power bank |
| Judge tries off-script category | M | M | All 4 categories have hand-tuned reference data |
| **Novice ramp (team new to Supabase Realtime + Gemini structured prompting)** | **M** | **H** | **Reserve 2 hours in Hr 0–4 for pairing, fixture-first development, one golden-path Realtime subscription + one zod-validated prompt/retry loop as reference implementations** |
| **Unsafe DIY guidance on battery-swelling case** | **L-M** | **H** | **Action-Plan agent code enforces: `safety_flags` non-empty → suppress DIY disassembly, force safety preamble, professional-service wording. Rehearsed on-stage before freeze.** |

---

## 16. Success metrics (internal, not for judges)

- **Hr 4** ✅ — `lib/types/**` published, S1/S2/S4 unblocked
- **Hr 12** ✅ — phone submits a real case E2E → verdict renders
- **Hr 16** ✅ — laptop demo case with follow-up question runs cleanly 3× in a row
- **Hr 22** ✅ — code freeze; demo path rehearsed 2× without intervention; safety branch rehearsed

---

## 17. Deferred decisions (don't block spec; resolve Hr 0 with team)

1. **Stack A (TS-only) vs Stack B (Python agent service).** Contracts + schema work either way; only orchestrator runtime changes. Default: A. Switch to B if a teammate wants to own agents in Python and can ship on time.
2. **Hosting region.** Default `us-west-2`.
3. **Domain / vanity URL.** Decide Hr 22.

---

## 18. Appendix A — Research-driven decisions

From the Haiku research agent (cited in brainstorm transcript):

| Decision | Why |
|---|---|
| Skip Google ADK, use Vercel AI SDK 6 | ADK has learning curve unsuitable for 24hr; AI SDK 6 ships streaming + tool-calling out of the box |
| Skip custom Google Maps MCP wrapper | No official Maps MCP; direct Places API via Gemini function-calling is faster |
| Leaflet.js + OpenStreetMap for map render | Zero API quota, zero cost, looks clean |
| SSE-equivalent via Supabase Realtime | Hackathon winners (Microsoft AI Agents 2025) used streamed event UI; we get it for free on Supabase |
| 3 JPEG photos, no video in MVP | iOS Safari PWA `getUserMedia` bug; video is ~3–5× token cost |
| Gemini 2.5 Pro for diagnosis | Multimodal + structured JSON reliability; Gemini 3 not yet released |
| Supabase Auth over Auth0 | 30-min setup vs hours; not chasing Auth0 prize |

## 19. Appendix B — Prior art

| Product | Positioning | Our differentiation |
|---|---|---|
| iFixit FixBot | AI diagnosis trained on 125k repair guides | We add **economic verdict + technician match + peer community** + campus-relevant categories |
| Sortly / generic inventory | Not repair-focused | Not a comparable product |
| (generic) Geek Squad / local repair | Opaque quote, no AI | We add the *second opinion* layer |
| Facebook Marketplace / Craigslist | General-purpose C2C marketplace | We add AI repair verdicts, sustainability framing, Green Points incentives, and campus-scoped trust (no strangers off-campus) |
| OfferUp / Letgo | Mobile-first resale | We add the repair desk integration: a Repair Needed listing is backed by an AI diagnosis, giving buyers real data on what it costs to fix |
| Campus Buy/Sell/Trade groups (FB, Discord) | Informal, no structure | We add structured listing types (Sale / Trade / Free / Repair Needed), in-app messaging, and a gamification layer to reward participation |

---

## 20. Appendix C — Open questions for implementation

These surface during planning phase (next: writing-plans skill) but do not block design approval:

- Exact V0 scaffolds to generate first (shell + case form + event timeline).
- zod schemas as canonical source (generated from contracts package), or hand-written to match.
- Supabase row-level cache strategy for `current_case_outputs` (likely none for 24hr; direct view reads are fine under demo load).
- Monitoring / error capture service (Sentry? Postgres-only? Likely none for 24hr; console logs acceptable).

---

*End of design.*
