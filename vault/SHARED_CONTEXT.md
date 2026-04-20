---
aliases: [Shared Context, Cross-Project Context]
tags: [system]
---

# Shared Context — Lionmaker Vault

> **This file is read by every Claude Code project at session start.**
> It gives any coding agent access to T.J.'s full ecosystem so it can pull patterns, architecture decisions, and lessons from other projects.

## How to Use This File
Add this line to any project's `CLAUDE.md`:
```
Read ~/Documents/lionmaker-vault/SHARED_CONTEXT.md for cross-project awareness.
```

---

## T.J.'s Projects — Architecture & Patterns

### MARCUS (Crypto Trading System)
- **Repo:** `~/Marcusv2`
- **Stack:** TypeScript, Express, PostgreSQL, Drizzle ORM, Vite, Railway
- **Architecture:** Signal Engine (20 modules) → Backtest Engine → Commodus (execution) → Hyperliquid
- **Key patterns worth reusing:**
  - Modular pipeline architecture (each analyzer is independent, verdict merges results)
  - Phase-gated deployment (Phase 1-5, each validated before next)
  - AES-256-GCM encryption for secrets (no plaintext fallback)
  - Health monitor (10 checks every 5 min)
  - Structured JSON error logging
  - A/B testing framework (3-tier: Marcus/LIVE/PROPOSED)
  - Anti-overfit system (Wilson score, walk-forward validation)
  - Parameter governor with safety gates + rollback
- **Current state (2026-03-28):** v0.8.31 in PR pipeline, NY-only trading (quant panel optimization), 9-gate execution chain now including `allowed_sessions` (session whitelist) and `allowed_daysOfWeek` (Mon-Thu default, Fri/Sat blocked), Bayesian learning active, institutional module live
- **Active PR Pipeline (March 2026):**
  - **PR #2 (v0.8.31):** Safety gates hardening — added `allowed_sessions` gate + `allowedDaysOfWeek` config with Mon-Thu default (Sat data shows -6.11%, Fri provisionally blocked pending 20 more trades). Tests: 1960/1960 passing. Build: clean.
  - **PR #1 (v0.8.30):** Earlier gates improvements, already merged.
- **Trade Analysis (2026-03-28):**
  - **194 closed trades across all sessions.** NY is the only positive session (+1.12% cumulative, 47.4% WR).
  - **ASIA also slightly positive (+2.56%)** but via few large HYPE wins masking poor SOL/ETH performance.
  - **LDN hemorrhaging (-6.66%)** due to NEUTRAL HTF bias in short mode.
  - **Pattern discovered:** "Lots of small losses, few big wins" — 80 small/med losses (-31.91%) swamp 65 small/med wins (+21.62%). Loss trades have 67.7% avg confidence vs 75.2%+ for wins.
  - **NY's edge:** Trending short mode + clean ORB lock + neutral HTF = 65.4% WR, +7.96% PnL. Forced ORB is costing -5.47%.
  - **Day-of-week patterns:** Wed/Thu strong for NY (+7.59%, +4.09%), Fri weak (-3.87%), Sat disaster (-6.11%).
  - **Recommendation (from data):** Go NY-only, disable ASIA/LDN/LC, filter out forced ORB trades and <60 confidence signals.
- **Lessons learned:**
  - Build Etiquette Protocol works: ARCHITECT → CRITIC → INTEGRATOR prevents bad deploys
  - Shadow testing before live is non-negotiable when money is involved
  - Modular decomposition pays off — v3 was 2,400 lines monolithic, v4 is 13 focused libraries
  - Silent failure hunting is critical — two bugs (Bayesian stuck at 0.500, MFE/MAE all NULL) went undetected across 700+ decisions due to fire-and-forget error swallowing
  - Full agent pipeline (Architect → Engineer → SFH → Code Review → QA) catches issues that single-pass review misses
  - **Config-driven gates pattern** (allowedSessions, allowedDaysOfWeek) allows surgical market/session filtering without code changes

### GrillaHQ (MCD Command Center)
- **Repo:** https://github.com/lionmaker11/MCDCommand.git
- **Basecamp projects:** MCD Command Center (46595076), GrillaHQ Acquisition (46594881), Disposition (46594882)
- **Purpose:** Multi-tenant SaaS (GrillaHQ) with Motor City Deals as org #1
- **Stack:** Next.js + React + shadcn/ui (dark) | Node.js + Express | PostgreSQL | BullMQ + Redis | Railway
- **Deployed:** Railway with auto-deploy on main merge
- **Architecture & Patterns:**
  - **Multi-tenant from day one**: org-scoped schema (organizationId required on all 21 models), org-scoped auth (OrganizationMembership), org isolation in every API query (verified via data regression)
  - **Real-time SSE with replay buffer**: org-scoped subscriber registry, 5-min event buffer in Redis (handles reconnections <5min, full-refresh fallback >5min)
  - **Async job queue with safety**: BullMQ delayed jobs for SMS/email pacing (compliance + carrier reputation), auto-timeout for stuck agent jobs (10+ min active = error state), safe retries with exponential backoff
  - **Webhook ingestion + DNC compliance**: Inbound SMS replies auto-parsed, STOP keyword triggers instant DNC, status callbacks logged per-message
  - **Config-driven pipeline stages**: 81 total sub-statuses across 9 main stages, forward-only transitions, human override gates on negotiation columns
  - **AI agent workflow with LED visualization**: 6 agent roles × 5 LED states, colored indicators show real-time work, failure states flash red
  - **Intelligence layer**: Conversation intel extraction (occupancy, motivation, timeline), tone profiles (DB + markdown skill files), A/B testing via variantTag on Message model, weekly briefing generation
  - **Org branding injection**: Dynamic CSS variables (--primary, --accent) set from org.brandColor, persistent across all pages, sidebar shows org.displayName
  - **Shadow ops (upcoming)**: Agent activity auditable, all conversation intel stored for ML training
- **Key decisions locked:**
  - SMS provider: Telnyx (A2P 10DLC, $0.004/msg vs Twilio $0.01+)
  - Email provider: Amazon SES ($0.10 per 1,000 emails)
  - Onboarding: 10-step checklist (any order), Go Live gate blocks pipeline access until complete
  - Timezone: org.timezone (default America/Detroit)
  - Billing: Stripe placeholder (ready for wiring)
- **Test coverage:** 365 unit tests, 88/94 browser E2E (shadcn migration in progress)
- **QA discipline:** Three-level gauntlet (pre-PR code checks, post-merge regression, full browser E2E post-deploy)

### Motor City Deals
- **Basecamp project:** 46594879
- **Key tech:**
  - GoHighLevel CRM
  - SMS marketing templates
  - Previous RealComp MLS scraper experience
  - Facebook group with 10,000+ members
  - NDA under Motor City Deals REI LLC

### Alex OpenClaw (Crowne Property Group)
- **Basecamp project:** 46594885
- **Purpose:** Replacing a virtual assistant with OpenClaw for property management
- **Client setup:** 16GB Mac Mini, Haiku API
- **5 rehab properties being managed

### BiggerSpreads (ON HOLD)
- **Status:** On hold, may be obsolete (AI can do what it does natively)
- **Key tech worth preserving:**
  - CompGPT: High-performance ARV engine with persistent database
  - Data sources: Data.gov, city GIS, Redfin, Realtor.com, Zillow, Google Maps API/Geopy
  - Strict comping rules: zip code, style, exterior, basement/garage, radius constraints
  - Reverse-engineered ChatARV.ai backend endpoints
  - These data patterns could be reused in GrillaHQ or MCD Command Center

### AgentSideHustle (ACTIVE — Launched March 2026)
- **Purpose:** Passive digital product factory — builds 3–5 products per week across multiple marketplaces for compounding revenue
- **Tech stack:** Google Sheets (spreadsheets) | Canva (PDFs, printables, covers) | Notion (templates) | Stripe/Gumroad/Etsy (payments) | Pinterest (distribution) | Amazon KDP (ebooks) | Kit/Substack/Mailchimp (email automation)
- **Demand research tool:** Firecrawl CLI (`firecrawl scrape`) — NOT MCP-based. Scrapes Etsy searches, Gumroad trending, Reddit threads, Amazon listings for real pricing + review counts (no estimates)
- **Architecture:** 9 experiments, each with 7-day sprint cycle
  - **Daily structure:** 
    - Day 1: Niche research + competitor validation (Firecrawl)
    - Days 2–6: Product build + testing
    - Day 7: Launch + nurture sequence copy
    - Days 8–9: Post-launch monitoring + 14-day kill checks
  - **State files (append-only):**
    - `SPRINT-SYSTEM.md` — read-only playbook (574 lines, all 9 experiments, day-by-day execution instructions)
    - `sprint-tracker.md` — current sprint state + full product portfolio registry (read/write daily)
    - `sprint-log.md` — retrospective history + demand signals with actual links + 14-day kill results (never modify past entries)
  - **Pricing:** 10% of value rule (never effort-based). Minimums: $19 spreadsheets/$19 Notion/$12 Etsy/$4.99 ebooks/$29 question banks
- **Claude Code setup (Lionmaker `.claude/` standard):**
  - `CLAUDE.md` — mission locked in + tech stack
  - `.claude/rules/sprint-workflow.md` — daily patterns + product quality + state management + Firecrawl research rule
  - `.claude/commands/sprint.md` — `/sprint` command executes current day tasks
  - `.claude/` folder structure — rules, commands, skills, agents (all scaffolded)
  - Project memory files (user_profile.md, feedback files, reference_ecosystem.md) — essential for session continuity
- **Key patterns worth reusing:**
  - **Sprint-driven development:** Fixed 7-day cycles + daily "Done When" checklists prevent scope creep
  - **Append-only logging:** Historical retrospectives without data loss; enables demand signal → sales trajectory analysis
  - **Firecrawl CLI integration:** Preferred method for demand research (installed as CLI, not MCP). Use directly via Bash for competitor analysis.
  - **Day-by-day execution framework:** Discrete daily gates ensure consistency across multiple experiments + sprints
  - **15-min human involvement ceiling:** All platform accounts managed by human (Etsy, KDP, Pinterest). Claude prepares copy-paste; human handles account management only.
- **Key decisions locked:**
  - Each product must be revenue-generating on actual marketplace (trackable sales)
  - Max 1 human action per day (15 min/week ceiling)
  - Test all products with real inputs before listing
  - Listing formula: Problem → Solution → What's Inside → Who It's For
- **Status (2026-04-01):** Sprint 1 Day 1 in progress — niche research phase using Firecrawl, top 3 recommendations pending T.J. selection
- **Lessons learned:**
  - `.claude/` folder standard now locked across all projects (rules, commands, skills, agents pattern)
  - Session memory files critical for Claude Code continuity (user_profile.md, feedback_communication.md, reference_ecosystem.md act as session state)
  - Firecrawl CLI beats estimates — use real data (pricing, reviews, keywords) instead of assumptions
  - Append-only logs enable pattern discovery — compare demand signal dates to eventual sales trajectories across multiple experiments

---

## Lionmaker Coding Standards (All Projects)

### Code Style
- Descriptive variable and function names
- Functions under 50 lines where possible
- Comments explain WHY, not WHAT
- No dead code — delete it, don't comment it out
- TypeScript strict mode for all projects

### API Design
- Plural nouns for resources: /users, /projects
- Proper HTTP methods and status codes
- Consistent error format: `{ error: { code, message, details } }`
- Pagination, filtering, sorting via query params
- Rate limiting on all endpoints

### Security (Non-Negotiable)
1. Never store plaintext secrets — use env vars or encrypted storage
2. All user input validated and sanitized
3. SQL: parameterized queries only (Drizzle ORM preferred)
4. Auth: JWT with HttpOnly cookies, token rotation, bcrypt (cost 12+)
5. HTTPS only in production
6. Secrets in `.env` files, never committed
7. Dependency audit on every PR
8. Admin routes must check user role

### Git Workflow
- Branch naming: `feature/short-description`, `fix/issue-description`
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- All CI checks must pass before merge
- Squash merge to main

---

## Cross-Project Opportunities

> Claude Code: when building in any project, check if these connections apply.

| If you're building... | Check if you can reuse from... |
|----------------------|-------------------------------|
| Lead gen / data scraping | BiggerSpreads CompGPT patterns, MLS scraper |
| Pipeline/workflow engine | MARCUS signal engine architecture |
| A/B testing anything | MARCUS Commodus A/B framework |
| Real estate data analysis | BiggerSpreads strict comping rules |
| SMS/messaging automation | MCD SMS templates, GrillaHQ Twilio |
| Health monitoring | MARCUS health-monitor.ts pattern |
| Encryption/security | MARCUS crypto.ts (AES-256-GCM) |
| Parameter tuning | MARCUS parameter-governor + anti-overfit |

---

## Development Environment
- **Terminal:** iTerm2 + tmux
- **Claude Code:** `claude --dangerously-skip-permissions` via tmux
- **MCP stack:**
  - `@modelcontextprotocol/server-postgres` — Railway connection string
  - `@modelcontextprotocol/server-github` — PAT in env as GITHUB_PERSONAL_ACCESS_TOKEN
  - `@mektigboy/server-hyperliquid` — read-only
- **Git:** `.mcp.json` and `.claude/settings.json` are gitignored (prevents silent reversion)
- **Infrastructure:** Railway + PostgreSQL for deployed services
- **T.J. as terminal user:** Treat as beginner — always specify which app, where to type, no assumptions about terminal knowledge

---

## Chief (OpenClaw AI PM System)
**Status:** Major infrastructure completed (March 2026)  
**Repos:**  
- Main: `~/.openclaw/workspace/`  
- Dashboard: `~/chief-dashboard` (Next.js 16, TypeScript, standalone deployment)  
**Purpose:** T.J.'s personal AI project manager, communications via Telegram, source of truth is Basecamp

### Architecture Patterns
- **Telegram integration:** Daily check-ins (morning brief, midday, EOD wrap, evening summary)
- **Basecamp calendar sync:** Every 30 min via LaunchAgent, parses `(HH:MM–HH:MM)` time windows from card names, stores reverse-lookup IDs in card descriptions for idempotent sync (verified 0 duplicates on repeat runs)
- **Voice UI:** Independent ElevenLabs TTS (not affected by gateway TTS config)
- **Gateway communication:** Uses `openclaw.json` config

### Chief Dashboard (NEW — March 2026)
**Project:** Monitoring + visibility dashboard for Chief's OpenClaw infrastructure
**Basecamp project:** None (internal Chief infrastructure)
**Repo:** `~/chief-dashboard` as standalone Next.js deployment
**Deployment:** LaunchAgent `com.chief.dashboard` on port 3000
**Stack:** Next.js 16 + React + Tailwind CSS 4 (upstream from xmanrui/OpenClaw-bot-review)
**Build methodology:** 6-phase parallel agent execution:
  - Phase 1: Foundation (verify base dashboard with 2 agents + gateway health)
  - Phase 2: Parallel build (Agents 2-4 work in separate git worktrees — Telegram alerts | Cost+Budget | Service monitoring)
  - Phase 3: Assembly (merge customizations, integrate components, rebrand)
  - Phase 4: End-to-end verification (all integrations working, alerts tested)
  
**Customizations completed:**
1. **Telegram alerts:** Replaced Feishu notifications with Telegram Bot API using existing `channels.telegram.botToken` config, alert rules for token spend and service degradation
2. **Cost tracking:** Added dollar estimates using model pricing (Haiku $0.80/$4, Sonnet $3/$15, Opus $15/$75 per MTok), weekly budget bar vs $40 target, alerts at 80%/100%
3. **Voice + Calendar + Cron monitoring:** New endpoints for voice server health (probe :18800), calendar sync status (chief-sync-state.json), cron job health (reads cron/runs/*.jsonl with error trend analysis)
4. **Branding:** Rebranded as "Chief Dashboard — Lionmaker Consulting", English-only UI, military-themed Pixel Office with orange lion mascot
5. **Service health cards:** Visual status for gateway, voice server, calendar sync, cron jobs with latencies and error counts, color-coded (green/yellow/red)

**Data architecture:**
- All reads from `~/.openclaw/` (no database required, filesystem-native)
- Session data from `agents/{main,voice}/sessions/*.jsonl` JSONL streams
- Cron tracking from `cron/runs/` (312 files, execution timestamps + token usage + model info)
- Calendar state from `chief-sync-state.json` (21 verified events, last sync time, sync duration)
- Log parsing: gateway.log, voice-server.log, chief-sync.log with structured error extraction

**Key patterns worth reusing:**
- **Filesystem-native dashboard:** Perfect for air-gapped or minimal-dependency deployments. No database required — all data discoverable via crawling `~/.openclaw/`.
- **Parallel agent build pattern:** Split Phase 2 work into independent agents with git worktrees to speed builds (Telegram, Cost, Monitoring can work in parallel, then merge).
- **Probe-based health monitoring:** Lightweight endpoints for external service health (voice server HTTP GET, state file mtime, JSONL parsing) — no invasive instrumentation needed.
- **Cost tracking model:** Token count → USD conversion using model pricing map. Reusable for any multi-agent system needing budget visibility.
- **Telegram integration pattern:** Read bot token from config, use Bot API for notifications. Works offline if needed (stores messages, sends on reconnect).

### Pixel Office Customizations (March 2026)
**Military-themed Chief Command Center:**
- **Character:** Renamed "On-Call SRE" → **"Sentinel"** (gateway health indicator with pulsing color: green healthy, yellow degraded, red down)
- **Cat → Baby Lion:** Redrawn orange/gold lion cub with mane (all 8 animation frames: 4 directions × 2 walk poses)
- **Music:** Removed `pixel-adventure.mp3`, sound disabled by default
- **Theme:** Olive-green floor (hue 100, sat 20), dark military steel walls (#2B3A2B), "Chief Command Center" as title

### Key Discoveries (March 2026)
1. **TTS Config Not Hot-Reloadable:** `messages.tts.*` changes require full gateway restart, not just hot-reload. Other config (agents.defaults.models, agents.defaults.thinking) do hot-reload.
2. **Idempotent Sync Pattern:** Store reverse-lookup IDs (e.g., `cal_event_id:` in Trello card descriptions) to prevent duplicate calendar events on repeat syncs.
3. **Transcription leak fix:** Voice transcriptions were being captured in Telegram message summaries — isolated to message pipeline and removed from delivery path (voice web UI unaffected).
4. **OpenClaw data landscape:** Complete map of `~/.openclaw/` structure available for monitoring — sessions, cron runs, logs, device auth, telegram state, all filesystem-accessible.
5. **.claude/ Folder Configuration System:** Emerging standard for Claude Code projects:
   - `CLAUDE.md` (committed instructions) + `CLAUDE.local.md` (personal overrides, gitignored)
   - `/commands/` custom slash commands (status, deploy, review)
   - `/rules/` modular rules (code-style.md, security.md, testing.md)
   - `/skills/` auto-invoked skills (debugging, deployment)
   - `/agents/` isolated subagent personas
   - Apply this to Chief, MARCUS, MCD Command Center for consistency
6. **Heartbeat Loop Architecture (Mobile-First):** Pattern for staying aware of system state from phone:
   - Trigger: `/loop` command (can run from Telegram, Discord, Obsidian)
   - Checks: Email, PRs, deployments, agent activity
   - Routing: Through Channels service
   - Delivery: Phone alerts via bot
   - Use case: Chief accessing vault from mobile via Telegram/Discord while code runs in Claude Code
7. **Orchestrator Pattern for Agent Coordination:** Task-driven agent work pattern:
   - Read state files (session-context.md) + instructions (CLAUDE.md)
   - Check task board for approved cards (external source of truth)
   - Pick highest priority task and work on it
   - Update card status (in_progress → needs_review when PR created)
   - Before exit: capture discoveries to memory files via `/learn` + post session summary
   - Reusable for: MARCUS trading signals, MCD command center tasks, Chief infrastructure work

8. **Cost Tracking Pattern (Token → USD):** Financial visibility for AI agent work:
   - Model pricing map: Haiku $0.80/$4, Sonnet $3/$15, Opus $15/$75 per MTok (input/output)
   - Scan all session JSONL files: extract inputTokens + outputTokens + modelId
   - Calculate cost per session and aggregate to daily/weekly spend
   - Weekly budget tracking vs target ($40/week for Chief)
   - Alerts at 80% and 100% threshold via Telegram
   - Pattern used in: Chief Dashboard (realtime cost cards), cost monitoring API
   - Reusable for: Any multi-agent system needing budget visibility

9. **Service Health Monitoring Pattern (Probe-Based):** Real-time infrastructure health:
   - Voice server: HTTP GET to localhost:18800 with 5s timeout → healthy/degraded/down
   - Calendar sync: Read state file (chief-sync-state.json) → check lastSync timestamp, alert if >60min stale
   - Cron jobs: Parse cron/runs/*.jsonl files → extract status + error counts + duration trends
   - Dashboard cards show status + latency + error count with visual indicators (green/yellow/red)
   - Pattern used in: Chief Dashboard service health cards
   - Reusable for: MARCUS health monitor, GrillaHQ service status, any infrastructure needing real-time visibility

10. **Conviction-Based Execution Model (from MARCUS v0.8.30):**
    - Multi-factor scoring system: each signal contributes a conviction value (0.0-1.0)
    - Verdict aggregation: merge all signal convictions into final trading conviction
    - Execution gate: only execute if convictionScore >= threshold (e.g., 0.65)
    - Funding rate arbitrage: delta-neutral positioning for institutional opportunities
    - Session risk equalization: normalize session-level risk to target (e.g., 10% per session)
    - Applications: Not just trading — can apply to any decision that needs multi-factor scoring + confidence gating

### Security Fixes Applied (March 2026)
- **Command injection (media-attach.js):** Use `execFileSync` with array args, not `execSync` with string concatenation
- **Parameter injection (chief-sync.js):** Move card descriptions to JSON request body, not URL query params
- **Feishu config exposure:** Feishu token references removed entirely, Telegram tokens remain but sourced from config (no hardcodes)

---

## Emerging Architecture Patterns — March 2026

### The `.claude/` Folder Standard (Across All Projects)
All Claude Code projects now use a consistent structure:
```
project/
  CLAUDE.md (project instructions + cross-project awareness)
  .claude/
    CLAUDE.local.md (personal overrides, gitignored)
    rules/
      code-style.md
      security.md
      git.md
      testing.md
      [project-specific.md]
    commands/
      /status
      /deploy
      /review
      [project-specific commands]
    skills/
      [auto-invoked tools like debugging, deployment]
    agents/
      [isolated subagent personas]
    .gitignore (covers local files + secrets)
  
  Session Memory (preserved across restarts):
    user_profile.md
    feedback_communication.md
    feedback_coding.md
    reference_ecosystem.md
    MEMORY.md (index)
```
**Apply this to:** Chief, MARCUS, MCD Command Center for consistency.

### Multi-Agent Parallel Execution (Chief Dashboard Pattern)
When building large features:
1. **Phase 1:** Foundation with one agent (verify base system works)
2. **Phase 2:** Spawn independent agents in git worktrees (each agent tackles non-overlapping feature)
3. **Phase 3:** Lead agent merges all branches, assembles final system
4. **Phase 4:** QA agent verifies end-to-end

**Benefits:** Faster builds, clear task boundaries, natural error isolation.

### Append-Only Logging + Retrospective Analysis (AgentSideHustle Pattern)
Never modify historical logs. Instead:
- Daily/sprint logs are append-only (sprint-log.md — never edit past entries)
- Demand signals captured with **actual links** (Etsy product URL, Gumroad download count), not summaries
- Revenue captured as **actual numbers** ($ value, not estimates)
- 14-day kill checks: log which products met min revenue threshold, which didn't
- **Power:** Historical analysis reveals demand patterns, seasonal trends, what sells in your ecosystem

**Reusable for:** Any product business, content calendar, experiment tracking.

### Cost Tracking Pattern (Token → USD)
Convert AI agent work to financial visibility:
```
Token count (session JSONL)
  ↓
Apply model pricing (Haiku $0.80/$4, Sonnet $3/$15, Opus $15/$75 per MTok)
  ↓
Calculate cost per session + aggregate daily/weekly
  ↓
Compare to budget ($40/week for Chief)
  ↓
Alert at 80% and 100% threshold via Telegram
```
**Reusable for:** Any multi-agent system (MARCUS, MCD, other SaaS), client billing, cost forecasting.

### Service Health Monitoring (Lightweight Pattern)
Real-time infrastructure visibility without invasive instrumentation:
- **Voice server:** HTTP GET to localhost:18800 with 5s timeout → healthy/degraded/down
- **Calendar sync:** Read state file (chief-sync-state.json), check lastSync timestamp, alert if >60min stale
- **Cron jobs:** Parse cron/runs/*.jsonl, extract status + error trends + duration
- **Gateway:** Standard health endpoint
- **Dashboard:** Shows status + latency + error count with visual indicators (green/yellow/red)

**Reusable for:** MARCUS health monitor, GrillaHQ service status, any infrastructure needing real-time visibility.

### Conviction-Based Execution (MARCUS Pattern, Generalized)
Decision framework when multiple signals exist:
1. Each signal contributes a conviction score (0.0–1.0)
2. Merge all conviction scores into final conviction
3. Execute only if finalConviction >= threshold (e.g., 0.65)
4. Log conviction for retrospective analysis

**Reusable for:** Trading, content decisions, product launches, any multi-factor decision.

---

## Vault Location
Full project context, people, decisions, and financial tracking live in:
`~/Documents/lionmaker-vault/`

Key files:
- `MEMORY.md` — master index of everything
- `FINANCES.md` — income, bills, obligations
- `projects/[name]/[name]-status.md` — per-project status
- `decisions/` — logged decisions with rationale
- `sessions-mined-[date].md` — Claude Code session mining reports with architecture discoveries

---

## Session Mining Log

**Last Mined:** March 31, 2026 @ 06:03 AM ET  
**Sessions processed:** 25 (25 new/modified from Claude Code)  
**Significant sessions (30+ messages):**
- `claude-conversation-2026-03-30-64d9745b.md` (89 messages) — **AgentSideHustle setup complete**, full `.claude/` scaffolding, sprint system framework
- `claude-conversation-2026-03-24-dd5dac6b.md` (153 messages) — **Chief Dashboard implementation plan**, 6-phase parallel agent build strategy, Telegram integration, cost tracking
- `claude-conversation-2026-03-30-agent-as.md` (66+37+36 messages across 3 sessions) — **Setup completions** for AgentSideHustle, multi-agent coordination patterns
  
**Key discoveries captured:**
- ✅ `.claude/` folder standard is now established across projects (3 projects already using it)
- ✅ Session memory files (user_profile.md, feedback_*) essential for Claude Code consistency
- ✅ Append-only logging pattern enabling retrospective analysis
- ✅ Cost tracking model for token → USD conversion
- ✅ Parallel agent build methodology for faster feature delivery
- ✅ Filesystem-native monitoring dashboard pattern

**New people mentioned:** None  
**Projects touched:** AgentSideHustle (new), Chief (infrastructure), MARCUS (referenced)  
**Status:** All major discoveries documented in SHARED_CONTEXT.md above
