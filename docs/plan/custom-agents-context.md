# Custom Hackathon Agents — Design Context

> Paused design thread. Resume with the handoff prompt at the end of this file or in the conversation that spawned it. No decisions below are final — Q1 in §4 is still open.

## 1. Purpose

Design and ship custom agents / skills / commands that work across **Claude Code AND OpenAI Codex**, purpose-built for the Bronco Repair Desk 24-hour hackathon workflow. These exist to speed up the team's *shared processes* (shape-freeze verification, cut decisions, demo ops, etc.) — not the product itself.

**Non-goal:** these are tooling agents, not runtime agents. `lib/agents/orchestrator.ts` and its 5 sub-agents are product code, out of scope here.

## 2. Research findings (Haiku subagent, 2026-04-22)

### Framework inventory

| Framework | Source | Value prop |
|---|---|---|
| **everything-claude-code** | github.com/affaan-m/everything-claude-code | 38 agents, 156 skills, 72 commands; research-first dev patterns across Claude Code, Codex, Cursor, OpenCode |
| **GSD V2.0** | github.com/gsd-build/gsd-2 | Unified Orchestration Kernel, 29 skills; spec-driven meta-prompting for autonomous milestone work, context isolation, crash recovery |
| **superpowers** | github.com/obra/superpowers | Agentic skills framework (brainstorming, TDD, subagent-driven, systematic-debugging) |
| **SuperClaude** | github.com/SuperClaude-Org/SuperClaude_Framework | 30+ `/sc:` slash commands; behavioral instruction injection |
| **claude-swarm** | MCP server | Spawns workers in git worktrees, coordinates via filesystem |
| **Ruflo** | github.com/ruvnet/ruflo | Agent orchestration for Claude Code/Codex swarms with RAG + tmux monitoring |

### File formats (authoritative)

**Claude Code agent** — `~/.claude/agents/<name>.md` (user-scope) or `.claude/agents/<name>.md` (project-scope):
YAML frontmatter — `name`, `description`, `model` (opus/sonnet/haiku), `tools` (array), `disallowedTools`, `permissionMode`, `mcpServers`, `maxTurns`, `skills`, `memory`, `effort`, `isolation`, `color`. Body is the markdown system prompt.

**Claude Code skill** — `~/.claude/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md`:
YAML frontmatter — `name`, `description`. Body is markdown instructions. Optional subdirs: `scripts/`, `references/`, `assets/`.

**Claude Code slash command** — `~/.claude/commands/<name>.md` or `.claude/commands/<name>.md`:
Markdown with optional YAML frontmatter. Invoked as `/<command-name>`.

**OpenAI Codex `AGENTS.md`** — repo root, loose Markdown, no strict schema. Codex reads at session start. Contents: project structure, arch patterns, coding standards, testing, naming, tech stack.

### Cross-tool portability recommendation

**Pragmatic shape for this hackathon — dual-target, repo-as-source-of-truth:**

1. Ship `AGENTS.md` at repo root — Codex reads this at session start.
2. Ship `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `.claude/commands/*.md` inside the repo — Claude Code picks these up when teammates clone.
3. Keep prompt *bodies* in the `.claude/*` files; have `AGENTS.md` reference them by path + inline key excerpts so Codex sees the same instructions without sharing files.
4. **No MCP required.** MCP would be overhead for a 24h build — drop it.

## 3. Gap analysis vs existing frameworks

| Candidate pain point | Exists elsewhere? | Novelty |
|---|---|---|
| P1 Shape-freeze verifier | Partial — generic API-schema watchers only; nothing does three-way Zod ↔ migration ↔ types check | Mostly novel |
| P2 Announce-first pre-commit | **Missing entirely** | Fully novel |
| P3 Safety-banner regression guard | **Missing** (hackathon-specific by definition) | Fully novel |
| P4 Stream status snapshot | Partial — GSD has `gsd:progress`, not feature-flag granular | Mostly novel |
| P5 Cut-tier advisor | Partial — GSD milestone planning, not cut-ladder aware | Mostly novel |
| P6 Fixture→live swap audit | **Missing entirely** | Fully novel |
| P7 Demo-rehearsal runner | **Missing entirely** | Fully novel |
| P8 Case-flow smoke test | Partial — generic e2e runners exist, none know our shapes | Adaptable |
| P9 Gemini budget watchdog | Partial — generic LLM cost trackers exist | Adaptable |

**High-ROI novel agents:** P2, P3, P6, P7 (all genuinely missing from existing catalogs).

## 4. The 9 pain-point candidates (Q1 — still unanswered)

### Safety / correctness guards
- **P1 · Shape-freeze verifier** — SF-N artifact matches declared contract (Zod schema ↔ migration DDL ↔ TypeScript types all agree), flags drift
- **P2 · Announce-first pre-commit** — blocks commits editing `lib/types/**`, migrations, or frozen SF-N files without a chat-announce marker in the commit message
- **P3 · Safety-banner regression guard** — ensures the laptop swollen-battery case always produces the amber banner (runs in CI + on demand)

### Coordination / speed
- **P4 · Stream status snapshot** — one command showing each stream's feature completion state (`F-platform-core: locked ✓`, `F-agent-safety: tested, not wired ⚠️`)
- **P5 · Cut-tier advisor** — scans current state, recommends next cut from the cut-priority ladder with justification
- **P6 · Fixture→live swap audit** — after SF-N locks, finds every file still importing from `tests/fixtures/demo-cases.ts` when it should now pull live types

### Demo ops
- **P7 · Demo-rehearsal runner** — executes the 5-step pre-demo checklist (seed reset → router smoke test → safety banner → fallback drill → dual-device) and reports pass/fail
- **P8 · Case-flow smoke test** — creates a case end-to-end, waits for verdict, validates payload shape

### Budget / ops
- **P9 · Gemini budget watchdog** — tracks Flash/Pro token spend, warns when projection exceeds budget

### Q1 (awaiting user)

Pick format:
- **A)** Top 3 are P_, P_, P_ — design just those three.
- **B)** "You pick" — minimum-viable set of 3–5 by highest ROI (my lean: **P2 + P3 + P6 + P7** — all four are genuinely novel vs existing frameworks).
- **C)** Custom — pain points not in the list above.

## 5. Open decisions (beyond Q1)

- **Shape mix** — which pain points become slash commands (one-shot runs), skills (methodology), or agents (longer-running)? My lean: demo-rehearsal and case-flow-smoke as slash commands; cut-tier-advisor as a skill; shape-freeze-verifier as an agent.
- **Naming convention** — suggest `bronco-<verb>-<noun>` (e.g., `bronco-verify-shape-freeze`, `bronco-rehearse-demo`, `bronco-audit-fixtures`) to avoid collisions with team members' existing personal agents.
- **Scope** — user-scope (`~/.claude/`) persists across projects but only on that person's machine; project-scope (`.claude/` in repo) travels with the team. Project-scope is the right default for a hackathon, but some pieces (e.g., pre-commit hook wiring) cross into user-scope territory.

## 6. Prototype reference

A working UI prototype is now in place at `bronco-repair-desk/` (Next.js 16, Tailwind v4, TypeScript). It can be used as a reference for:

- **Page structure and routing** — the prototype implements all routes described in `docs/plan/architecture.md §1`, including the marketplace, agent workspace, rewards, messaging, and create-listing pages. Any custom agent that inspects or validates app structure should use this layout as ground truth.
- **Agent Review Board** — `app/repair/[id]/page.tsx` contains a visual Agent Review Board with 4 agent cards (Intake / Diagnosis / Economics / Action Plan) and live status badges. The expected badge values (`COMPLETE`, `ANALYZING`, `WAITING`, `NEEDS INPUT`, `FAILED`) are defined in `docs/roles/agents.md §9` and must map to the `case_events.status` field. Custom agents that validate event emission should cross-reference this component.
- **Design tokens** — prototype uses Manrope + Work Sans fonts and color tokens `#1b4332` / `#012d1d` / `#f9faf2` / `#ffca98`. The **P3 Safety-banner regression guard** agent should confirm the amber color token is applied correctly to the safety banner rather than using a hard-coded hex value.

### Gamification integration agent (new)

The prototype introduces a gamification system (Green Points earned per completed action, redeemable at campus vendors). This requires a **custom integration agent** that listens for completion events and triggers point awards automatically:

| Trigger event | Points awarded | Handler |
|---|---|---|
| `marketplace_orders` row completes a sale | +50 pts to seller | `POST /api/points/transactions` with `reason = 'listing_sold'` |
| `marketplace_orders` row completes a trade | +40 pts to both parties | Two `POST /api/points/transactions` calls |
| `marketplace_orders` row completes a giveaway | +20 pts to giver | `POST /api/points/transactions` with `reason = 'listing_given_away'` |
| `case_events` row with `phase = 'economics'`, `status = 'complete'` | +30 pts to case owner | `POST /api/points/transactions` with `reason = 'repair_verdict_received'` |

The integration agent should: (a) subscribe to the relevant DB tables via Supabase Realtime or a DB trigger function, (b) call `POST /api/points/transactions` for each trigger, (c) be idempotent — use the `reference_id` field to prevent double-awarding on retry.

### Vendor redemption stub agent (new)

The prototype's rewards page includes reward partner cards for **Panda Express** and **Pony Express**. These are campus vendors without live API integrations at hackathon time. A **vendor reward-redemption stub agent** is needed to:

1. Accept a `POST /api/rewards/redemptions` call from the frontend.
2. Validate the user's points balance is sufficient for the vendor's cost.
3. Deduct points from `user_points`.
4. Generate a redemption code (format: `BRONCO-{vendor_prefix}-{random_6}`).
5. Insert a `reward_redemptions` row with `status = 'active'`.
6. Return the code to the frontend for display.

The stub does not call any external vendor API — it is purely internal. A real vendor API can be wired in later by replacing step 4–5 with an external call. The agent should log all redemptions for audit purposes. Vendor prefix map: `panda_express` → `PE`, `pony_express` → `PX`.

## 7. References

- Spec: `docs/superpowers/specs/2026-04-22-bronco-repair-desk-design.md`
- Architecture: `docs/plan/architecture.md`
- Platform feature contract: `docs/plan/platform-feature-contracts.md`
- Role PRDs: `docs/roles/{platform,agents,frontend,integration}.md`
- UI prototyping: `docs/plan/ui-prototyping.md`
- Prototype source: `bronco-repair-desk/` (Next.js 16)
