# Bronco Repair Desk — Architecture & Coordination

> Shared planning artifact. Read once at kickoff; reference during merges and cut decisions.
> Source spec: [`docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`](../superpowers/specs/2026-04-22-bronco-repair-desk-design.md)
> Platform schema contract: [`docs/plan/platform-feature-contracts.md`](platform-feature-contracts.md)

## 0. TL;DR

- **Stack:** Next.js 16 App Router + Supabase + Vercel AI SDK 6 + Gemini 2.5 Flash/Pro. Single Next.js app, folder-owned (no monorepo packages). *(Prototype scaffolded with Next.js 16; original spec referenced Next.js 15 — 16 is the authoritative version.)*
- **Team:** 4 specialists — Platform · Agent/AI · Frontend · Integration.
- **Branching:** trunk-based, no PRs; cross-stream files announce-first.
- **Milestones:** feature-locks, not hour-locks. Every feature has a machine-checkable done-when and a cut-rule.
- **Demo safety net:** `F-agent-mockdata` is in the cut-floor — it's a production fallback, not a test fixture.

---

## 1. Repo skeleton (single Next.js app)

```
bronco-repair-desk/
├── app/
│   ├── page.tsx                           # Landing page (marketplace preview + verdict preview)
│   ├── marketplace/
│   │   ├── page.tsx                       # Campus marketplace grid
│   │   └── [id]/page.tsx                  # Item detail
│   ├── repair/
│   │   └── [id]/page.tsx                  # Agent consultation workspace (desktop-first)
│   ├── dashboard/
│   │   └── page.tsx                       # Repair student dashboard
│   ├── messages/
│   │   └── page.tsx                       # In-app messaging (buyer↔seller)
│   ├── rewards/
│   │   └── page.tsx                       # Rewards & impact dashboard
│   ├── create-listing/
│   │   └── page.tsx                       # 4-step listing creation form
│   ├── (app)/
│   │   ├── new/page.tsx                   # Camera intake (phone hero)
│   │   ├── case/[id]/page.tsx             # Live verdict view
│   │   └── demo/page.tsx                  # Dual-screen director view [stretch]
│   ├── api/
│   │   ├── cases/route.ts                 # POST create case
│   │   ├── cases/[id]/
│   │   │   ├── route.ts                   # GET metadata, PATCH field edit
│   │   │   ├── current/route.ts           # GET latest snapshot (polling fallback)
│   │   │   ├── media/route.ts             # POST attach media (≤3 per case)
│   │   │   ├── run/route.ts               # POST new run (atomic is_current demotion)
│   │   │   └── runs/[runId]/followup/route.ts   # POST follow-up answer
│   │   ├── listings/route.ts              # GET list (filtered), POST create
│   │   ├── listings/[id]/
│   │   │   ├── route.ts                   # GET detail, PATCH update, DELETE archive
│   │   │   └── media/route.ts             # POST attach listing images
│   │   ├── messages/route.ts              # GET thread list, POST new message
│   │   ├── messages/[threadId]/route.ts   # GET thread, POST reply, PATCH mark read
│   │   ├── listings/[id]/bids/route.ts    # POST bid/offer
│   │   ├── listings/[id]/bids/[bidId]/route.ts # PATCH accept/decline
│   │   ├── points/transactions/route.ts   # POST internal point transaction
│   │   ├── user/
│   │   │   ├── points/route.ts            # GET user points balance
│   │   │   └── achievements/route.ts      # GET derived user achievements
│   │   └── rewards/
│   │       ├── route.ts                   # GET campus rewards
│   │       └── redemptions/route.ts       # POST/GET reward redemptions
│   ├── layout.tsx
│   └── globals.css
│
├── lib/
│   ├── agents/                            # ← AGENT stream owns
│   │   ├── orchestrator.ts
│   │   ├── intake.ts · diagnosis.ts · economics.ts
│   │   ├── action-plan.ts                 # applySafetyGuard lives here
│   │   ├── helper-routing.ts
│   │   ├── tools/{places.ts, mock-data.ts}
│   │   ├── schemas.ts                     # Zod per-phase payloads
│   │   ├── model-routing.ts               # Flash/Pro tier selection
│   │   └── safety.ts                      # safety-flag constants + copy
│   ├── db/                                # ← PLATFORM stream owns
│   │   ├── client.ts                      # server + browser factories
│   │   ├── migrations/{001_init.sql, 002_rls.sql, seed.sql}
│   │   ├── queries/{cases,runs,events,outputs}.ts
│   │   └── locks.ts                       # advisory-lock helpers
│   ├── events/                            # ← INTEGRATION stream owns
│   │   ├── bus.ts                         # insert + emit (server)
│   │   ├── subscribe.ts                   # client Realtime hook
│   │   └── types.ts                       # discriminated union of events
│   ├── types/                             # ← SHARED — announce before editing
│   │   ├── case.ts · phases.ts · api.ts · index.ts
│   ├── utils/{env.ts, rrr.ts, logger.ts}
│   └── config.ts                          # thresholds + feature flags
│
├── components/                            # ← FRONTEND stream owns
│   ├── ui/                                # shadcn primitives
│   ├── Navbar.tsx                         # shared navigation (all routes)
│   ├── camera/CameraCapture.tsx
│   ├── timeline/AgentTimeline.tsx
│   ├── verdict/{VerdictCard,RRRBadge,SafetyBanner,UncertaintyNote}.tsx
│   ├── map/HelperMap.tsx                  # leaflet + OSM
│   └── demo/DirectorView.tsx              # [stretch]
│
├── hooks/                                 # ← FRONTEND stream owns
│   ├── useCaseRun.ts · useRealtimeEvents.ts · useCamera.ts
│
├── public/
│   ├── demo-seed/{laptop.jpg,bicycle.jpg,e_scooter.jpg,mini_fridge.jpg}
│   └── icons/
│
├── scripts/
│   └── seed-demo.ts                       # ← INTEGRATION owns; populates demo cases
│
├── docs/
│   ├── superpowers/specs/                 # PRD spec
│   ├── plan/architecture.md               # this file
│   └── roles/{platform,agents,frontend,integration}.md
│
├── tests/
│   ├── unit/{rrr,safety-guard,model-routing}.test.ts
│   ├── integration/{run-lifecycle,safety-persistence}.test.ts
│   └── fixtures/demo-cases.ts             # ← INTEGRATION owns; published Hr 0
│
├── .env.example · .gitignore
├── next.config.js · tailwind.config.ts · tsconfig.json · package.json
└── README.md
```

### Folder ownership map

| Owner | Folders / files |
|---|---|
| **Platform** | `lib/db/**`, `lib/utils/env.ts` (DB section) |
| **Agent/AI** | `lib/agents/**`, `lib/utils/rrr.ts`, `tests/unit/{rrr,safety-guard,model-routing}.test.ts` |
| **Integration** | `app/api/**`, `lib/events/**`, `scripts/seed-demo.ts`, `tests/fixtures/demo-cases.ts`, `tests/integration/**` |
| **Frontend** | `app/(app)/**`, `app/page.tsx`, `app/marketplace/**`, `app/repair/**`, `app/dashboard/**`, `app/messages/**`, `app/rewards/**`, `app/create-listing/**`, `app/layout.tsx`, `app/globals.css`, `components/**`, `hooks/**`, `tailwind.config.ts` |
| **Shared (announce-first)** | `lib/types/**`, `lib/db/migrations/**`, any frozen SF-N artifact, `package.json` (deps), `next.config.js` |

---

## 2. Shape-freezes (SF-N)

| # | Artifact | Owner | Locks when this ships | Unblocks |
|---|---|---|---|---|
| **SF-1** | DB schema 001 + 002 + `lib/types/case.ts` | Platform | `F-platform-core` (10 core Agent Council Diagnose tables — `cases`, `case_runs`, `case_events`, `case_media`, `case_messages`, `diagnoses`, `verdicts`, `action_plans`, `helper_requests`, `category_reference` — RLS on, `current_case_outputs` view). Marketplace and shared tables from [`platform-feature-contracts.md`](platform-feature-contracts.md) ship in follow-on migrations and extend SF-1 without breaking it. | Agent writes, Integration bus, Frontend → live data |
| **SF-2** | Event union (`lib/events/types.ts`) | Integration | `F-event-contract` (discriminated union covers every `phase · status` pair) | Agent emits real events, Frontend timeline renders |
| **SF-3** | Phase Zod schemas (`lib/agents/schemas.ts`) | Agent/AI | `F-agent-contracts` (Zod for intake/diagnosis/economics/action-plan w/ `safety_preamble`/helper-routing) | Frontend swaps fixtures for live payloads |
| **SF-4** | API contracts (`lib/types/api.ts`) | Integration | all of `F-api-cases`, `F-api-current`, `F-api-media`, `F-api-run`, `F-api-followup` ship (req/resp types in `lib/types/api.ts`) | Frontend hits real backend |

**Freeze protocol:**
1. Owner pushes commit with message starting `FREEZE SF-N: <slug>`.
2. Owner posts one-line in chat: *"SF-N locked at commit `<sha>`."*
3. From that moment, edits to the frozen artifact are announce-first (see §4).
4. Consumers update their imports from `tests/fixtures/demo-cases.ts` → real types.

### Handoff matrix

```
Platform   ──(SF-1)──► Agent       (writes diagnoses/verdicts/action_plans)
Platform   ──(SF-1)──► Integration (reads current_case_outputs, acquires locks)
Integration ─(SF-2)─► Agent       (emits case_events via bus.ts)
Integration ─(SF-2)─► Frontend    (subscribes via useRealtimeEvents)
Integration ─(SF-4)─► Frontend    (typed API client for forms)
Agent      ──(SF-3)──► Frontend   (renders VerdictCard, AgentTimeline payloads)
Agent      ──(SF-3)──► Integration (orchestrator resume reads/writes same shapes)
```

Agent depends on SF-1 + SF-2 but produces SF-3 — so Agent's first work is pure-function tests (RRR, safety-guard, model-routing) that don't need DB or LLM.

---

## 3. Cut-priority list

Ordered first-to-cut (polish) → last-to-cut (demo-kill). Triggered by feature-state, not the clock.

### Tier 1 — stretch only, drop without regret

| Order | Feature | Lost on cut |
|---|---|---|
| 1 | `F-fe-director` | Dual-screen director view |
| 2 | `F-stretch-video` | Video + voice intake (Gemini 3 not released) |
| 3 | `F-stretch-memory` | Cross-session memory |
| 4 | `F-stretch-community` | Distress board |

**Trigger:** these don't start until every tier-2 + cut-floor feature has locked.

### Tier 2 — degrade gracefully

| Order | Feature | Degrade to | Saves |
|---|---|---|---|
| 5 | `F-fe-map` | Static list card (3 hardcoded shops) | leaflet/OSM wiring |
| 6 | Realtime subscription | Client polls `GET /api/cases/:id/current` every 1s | Realtime auth debugging (SSE proxy dropped from MVP — direct subscription is canonical) |
| 7 | `F-api-followup` | Orchestrator auto-commits best-guess when confidence low | Follow-up question beat |
| 8 | `F-agent-helpers` | Static 3-shop list | Google Places + function-calling |
| 9 | `F-fe-marketplace` | Static mock item grid | Listing CRUD + filter wiring |
| 10 | `F-fe-marketplace-detail` | Read-only detail view, no messaging or verdict link | In-app messaging CTA + cross-feature repair flow |
| 11 | `F-fe-messaging` | Email-link CTA on item detail | In-app negotiation |
| 12 | `F-fe-rewards` | Static mock rewards page | Live point tracking, redemption flow |
| 13 | `F-fe-create-listing` | Flat single-page form | Guided 4-step form UX |
| 14 | `F-platform-marketplace` | Mock data from fixtures | Real `marketplace_*` tables plus shared conversation tables |
| 15 | `F-platform-gamification` | Mock data on rewards page | Real `user_points`, `point_transactions`, `rewards`, and `reward_redemptions` tables |
| 16 | `F-api-listings` | Static fixture data | Listing CRUD, filter, status transitions |
| 17 | `F-api-messages` | Email-link CTA | Thread creation, chat history, mark-read |
| 18 | `F-api-points` | Stubbed no-op | Real point ledger and awards on transaction completion |

**Trigger:** *cut-floor before cut-tier* — if your cut-tier feature would push a cut-floor feature to risk, cut the tier first.

### Tier 3 — painful but survivable

| Order | Feature | Degrade to | Why painful |
|---|---|---|---|
| 19 | `F-agent-orchestrator-resume` | Single-run only, no retries | Loses manual-retry beat |
| 20 | `F-fe-camera` (live) | File-picker upload of pre-staged photo | Less "wow" but keeps multimodal |
| 21 | `F-fe-timeline` (per-phase chips) | Single progress bar | **Hurts AI/ML prize story** — last resort |
| 22 | `F-fe-student-dashboard` | Static seeded-case table | Personal repair tracking |
| 23 | `F-api-bids` | "Contact seller" copy on item detail | Bid/offer flow, matched-status transitions |
| 24 | `F-api-achievements` | Static mock badge list | Derived badge unlock logic from `point_transactions` |
| 25 | `F-api-reward-redemptions` | Stub returning hardcoded code | Real reward redemption tracking, point deduction |

**Trigger:** team ack required in chat — these change the demo narrative.

### Cut-floor — not cuttable

```
Platform:    F-platform-core · F-platform-locks · F-platform-seed
Agent:       F-agent-rrr · F-agent-safety · F-agent-contracts
             F-agent-intake · F-agent-diagnosis
             F-agent-economics · F-agent-actionplan · F-agent-mockdata
Integration: F-event-contract · F-event-bus
             F-api-cases · F-api-run · F-integration-seedscript
Frontend:    F-fe-baseline · F-fe-intake · F-fe-verdict
```

Any cut-floor feature at risk = team huddle, not a one-person decision.

> `F-agent-mockdata` is in the floor because it's the **demo safety net**. If live Gemini fails twice during demo, the orchestrator falls through to mock and produces a verdict in <200ms. Build once.

---

## 4. Coordination rhythm

### 4a. Sync triggers (replace standups)

| Trigger | Who | What happens |
|---|---|---|
| **Any SF-N locks** | Everyone, async chat | Owner posts: *"SF-N locked at `<sha>`; consumers swap fixtures"* |
| **Cut-floor feature at risk** | Everyone, live huddle | Re-plan: who pivots, which cut-tier frees capacity |
| **Tier-3 cut invoked** | Everyone, live huddle | Demo script owner updates narrative; all 4 ack |
| **Announce-first edit** | Touched-file owners | One-liner in chat, 2 min wait, push |
| **First green end-to-end run** | Everyone, async | Triggers move from "build" → "harden + polish"; tier-1 stretch features unlock |

### 4b. Trunk-based merge hygiene

- **Cut-floor files are protected** — any commit touching `lib/agents/action-plan.ts`, `lib/db/migrations/*`, `lib/utils/rrr.ts`, or `lib/agents/safety.ts` ships with its own tests passing locally.
- **Broken main is a siren** — if `pnpm build` or unit tests fail on `main`, whoever pushed drops everything until green. No new commits on top of red.
- **No force-push to main, ever** — revert-commit, don't rewrite.
- **Announce-first files** — `lib/types/**`, `lib/db/migrations/**`, any frozen SF-N: one-line chat message, wait 2 min, push.

---

## 5. Demo ops

### 5a. Pre-demo checklist (run in order)

1. **Seed reset** — `pnpm db:seed` → verify 4 demo cases (`laptop`, `bicycle`, `e_scooter`, `mini_fridge`), `case_events` empty for each.
2. **Router smoke test** — create laptop case live → confirm Flash badge on intake, Pro badge on diagnosis + economics.
3. **Safety banner smoke test** — laptop hero case MUST render amber swollen-battery banner. Hardest demo-kill to notice ahead of time.
4. **Fallback drill** — pull `GOOGLE_API_KEY` env var, rerun laptop case → confirm orchestrator falls through to `F-agent-mockdata`. Restore key.
5. **Dual-device handoff** (if director view shipped) — phone creates case, laptop shows live timeline. If Realtime fails silently, fall back to phone-only — don't debug on stage.

### 5b. In-demo decision table

| Symptom | Action |
|---|---|
| Gemini call hangs >10s | Narrate *"showing cached result for time"*; tap pre-seeded case button. Never retry live. |
| Camera capture fails on phone | File-picker upload of pre-staged photo. Say *"iOS Safari being iOS Safari."* Move on. |
| Timeline stops updating | Refresh once. If still broken, switch to phone-only view. |
| Verdict card empty | `current_case_outputs` is broken — cannot recover on stage. Cut to screenshot slide of a successful verdict. |

The last row is why `F-platform-core` is the highest-priority cut-floor feature.

---

## 6. References

- Source spec: [`docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`](../superpowers/specs/2026-04-22-bronco-repair-desk-design.md)
- Per-role PRDs: [`docs/roles/platform.md`](../roles/platform.md) · [`agents.md`](../roles/agents.md) · [`frontend.md`](../roles/frontend.md) · [`integration.md`](../roles/integration.md)
