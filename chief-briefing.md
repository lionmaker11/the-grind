# Chief Briefing — 2026-04-03

> Vault context for in-app Chief. T.J.'s projects only. No client data.

---

## Active Ventures

### MARCUS — Autonomous Crypto Trading
- **Status:** LIVE ON MAINNET. Streaming continuously. 270+ commits in last 30 days.
- **System:** Pine Script sensor (TradingView) → Signal Engine → Commodus (adaptive sizing 0.5x–2x) → Hyperliquid execution. 4 sessions: LDN, NY, LC, ASIA.
- **Version:** v0.7.14+. All 15 phases complete. 1,559+ tests.
- **Goal:** .75 BTC by June 2026.
- **Next:** TradFi spot integration + institutional production mode (task logged).
- **Blocker:** T.J. hasn't provided Hyperliquid API key or MARCUS login to Chief yet.

### Motor City Deals (MCD / GrillaHQ)
- **Status:** ACTIVE. Primary income ~$5K/month. 218+ commits in last 30 days.
- **Partner:** Ali Shields — Mon/Thu sessions.
- **System:** MCDCommand (Next.js/PostgreSQL/Redis/BullMQ) — 6 Railway services. AI agents find real estate agents, send email outreach, manage replies.
- **10DLC SMS:** STILL PENDING. Switched to new Twilio account + new number Apr 3. Follow up with Ali Mon Apr 7.
- **Email outreach:** Live and running while waiting for SMS approval.
- **GrillaHQ:** Multi-tenant version — NOT being built yet. MCD single-tenant first.
- **Open:** Roman/GM agent org role unclear — task logged to investigate.

### 708 Pallister
- **Status:** Active, needs to FINISH. 2.5 year burden. Goal: break even and move on.
- **Contractor:** Sam Haidar. Partner: Rick.
- **Current:** Basement framing + drywall due Sat EOD. Site visit Saturday.
- **Countertops:** Sam owed answer by EOD Apr 3 — follow up if not received.
- **Budget spreadsheet:** Overdue. Still not done.
- **Legal:** Ali Chami lawsuit pending. Jeremy Manson is the lawyer.

### Digital Product Empire (DPE)
- **Status:** Sprint 1 COMPLETE. 6 products live on Gumroad with copy.
- **Sprint 2:** Started Apr 3. New product set in progress.
- **Revenue:** $0 so far — products live, no sales yet.

### BiggerSpreads
- **Status:** ON HOLD until June 2026. Do not surface tasks for this.

### VA Appeal
- **Status:** Docket status. Expedite request processing 2-3 weeks. Decision 60-120 days out.
- **Income:** VA disability ~$5K/month currently.

---

## Financial Position
- **Monthly income:** ~$10K/month ($5K MCD + $5K VA)
- **Monthly target:** $25,000
- **90-day goal:** $50K/month by June 15, 2026
- **Mortgage:** $3,400/month — current
- **Unpaid:** Water bill, trash bill
- **Credit cards:** Maxed. Andrea may need bankruptcy evaluation.
- **Bill audit due:** Apr 17

---

## Patterns to Watch
- Financial avoidance is T.J.'s #1 blind spot. Surface it even when he resists.
- Starts strong, fades at 60-90 days. Watch project age.
- New ideas mid-day → "Backlog. No exceptions."
- Sleep and workouts are the foundation — protect them before business.
- Active projects > 3 → push back hard.

---

## This Week's Commitments
1. MCD email outreach to agents (10DLC pending — emails only for now)
2. 708 Pallister site visit Saturday — framing/drywall + countertop date
3. Ask Claude Code: what does Roman/mcd-agent-org actually do? (due Apr 7)
4. Alex Buildium integration (due Apr 8)
5. Full unpaid bills list (due Apr 17)

---

## Family / Schedule
- **Custody:** Week B — no Aurelia school logistics
- **Children:** Tommy (~2), Niko (~1), Sofia (newborn), Aurelia (8, with mom)
- **Andrea:** Stay-at-home, postpartum exhaustion. T.J. is sole provider.
- **Family dinner:** Every evening, non-negotiable.
- **Sunday:** No work. 6 PM planning only.

---

## In-App Chief Standards
- Address T.J. by name, never "user."
- Short, punchy. No fluff.
- Push back on financial avoidance.
- Celebrate wins briefly, redirect to what's next.
- Revenue tasks outrank building tasks.
- New idea mid-day: "Backlog. Finish what's active."

---QUEUE---
{
  "date": "2026-04-03",
  "finances": {
    "month_income": 10000,
    "month_target": 25000
  },
  "projects": [
    { "id": "marcus", "name": "MARCUS", "health": "green", "category": "On Business", "days_silent": 0 },
    { "id": "mcd", "name": "Motor City Deals", "health": "green", "category": "In Business", "days_silent": 0 },
    { "id": "708p", "name": "708 Pallister", "health": "yellow", "category": "In Business", "days_silent": 0 },
    { "id": "dpe", "name": "Digital Product Empire", "health": "green", "category": "On Business", "days_silent": 0 },
    { "id": "va", "name": "VA Appeal", "health": "yellow", "category": "Finances", "days_silent": 0 }
  ],
  "tasks": [
    { "id": "task-001", "text": "Provide Hyperliquid API key + MARCUS login to Chief", "project_id": "marcus", "project_name": "MARCUS", "category": "On Business", "type": "quick", "estimated_pomodoros": 1, "priority": 1, "health": "green" },
    { "id": "task-002", "text": "Call Sam — countertop answer due EOD + framing/drywall status", "project_id": "708p", "project_name": "708 Pallister", "category": "In Business", "type": "quick", "estimated_pomodoros": 1, "priority": 2, "health": "yellow" },
    { "id": "task-003", "text": "Follow up 10DLC SMS switch — new Twilio account status", "project_id": "mcd", "project_name": "Motor City Deals", "category": "In Business", "type": "quick", "estimated_pomodoros": 1, "priority": 3, "health": "green" },
    { "id": "task-004", "text": "DPE Sprint 2 — build next product set", "project_id": "dpe", "project_name": "Digital Product Empire", "category": "On Business", "type": "pomodoro", "estimated_pomodoros": 2, "priority": 4, "health": "green" },
    { "id": "task-005", "text": "708P budget spreadsheet — overdue, get it done", "project_id": "708p", "project_name": "708 Pallister", "category": "Finances", "type": "pomodoro", "estimated_pomodoros": 1, "priority": 5, "health": "red" },
    { "id": "task-006", "text": "List all unpaid bills (water, trash, cards) — bill audit prep", "project_id": "finances", "project_name": "Finances", "category": "Finances", "type": "pomodoro", "estimated_pomodoros": 1, "priority": 6, "health": "red" },
    { "id": "task-007", "text": "Workout — protect the foundation", "project_id": "fitness", "project_name": "Fitness", "category": "Physical", "type": "pomodoro", "estimated_pomodoros": 1, "priority": 7, "health": "green" }
  ],
  "needs_you": [
    "708P: Sam owes countertop answer by EOD today",
    "MARCUS: Hyperliquid API key + login still not provided to Chief",
    "MCD: 10DLC SMS pending — follow up with Ali Mon Apr 7"
  ],
  "falling_through_cracks": [
    { "name": "708P Budget Spreadsheet", "days_silent": 14 },
    { "name": "Unpaid Bills Audit", "days_silent": 7 }
  ]
}