# Marcusv2 — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/Marcusv2

## What This Is
MARCUS — an autonomous crypto trading system with three tightly integrated components: (1) Marcus: TradingView Pine Script v6 sensor generating ICT/ORB signals across 4 sessions (LDN, NY, LC, ASIA); (2) Logos: full-stack React + Express dashboard for real-time monitoring, analytics, backtesting, and subscriber management; (3) Commodus: adaptive trade execution intelligence with 12 modules that sizes trades 0.5x–2.0x based on historical performance. Deployed on Hyperliquid (perpetuals exchange). Subscriber fan-out system replicates owner trades proportionally. Shadow testing pipeline runs alongside live system.

CONFIRMED: System is LIVE ON MAINNET. Streaming continuously.

## Tech Stack
Languages: TypeScript (strict), Pine Script v6
Frameworks: Express.js (backend), React + Vite (frontend), Drizzle ORM
Databases: PostgreSQL (v2_ prefix tables, shared with v1 system — never touch non-v2 tables)
External Services (from .env.example):
  - PostgreSQL: primary database (DATABASE_URL)
  - Resend (from: noreply@mtmp.trade): subscriber welcome emails, 2FA, trade alerts
  - Anthropic API: hypothesis generation for Commodus anomaly detection (optional)
  - Hyperliquid exchange: trade execution (HL private keys per session, stored encrypted in Railway)
  - Sentry: error monitoring (SENTRY_DSN, SENTRY_WEBHOOK_SECRET)
Deployment (from railway.json — 1 service):
  - startCommand: npm run start (single service deployment)

## Current State
✅ Working:
  - Live mainnet trading (confirmed — NOT dry-run)
  - 4-session signal engine (20 modules: ICT/ORB/OTE/Silver Bullet/re-entry/ASL)
  - Commodus adaptive sizing (12 modules, 5 verdict analyzers)
  - Shadow trading pipeline (parallel simulation vs live)
  - Subscriber fan-out (Autarkeia) — trade replication with proportional sizing
  - Backtest engine (parameter sweeps, anti-overfit validation)
  - 2FA (TOTP) on all critical admin actions
  - Audit log (append-only, 6 log types)
  - Health monitor (10 checks every 5 min, UptimeRobot deadman switch)
  - ~116 API endpoints fully implemented
  - Allowed Trading Days config (most recent feature, Apr 3 commit)

🔨 In progress:
  - Ongoing signal engine improvements (MDD breaker, aggression promotion, session continuity)
  - Open feature branches: tradfi-spot-integration, institutional-production, mission-control-overhaul

📋 Planned:
  - feature/MV2-235-oc-linear-access
  - feature/MV2-243-252-session-continuity
  - feature/mathematical-upgrade

❌ Broken/placeholder:
  - V2_EXECUTION_ENABLED=false in .env.example (CONFIRMED STALE — system is live mainnet per confirmed facts)
  - V2_EXECUTION_MODE=dry-run in .env.example (CONFIRMED STALE — system is live mainnet)

## Activity
Last commit: 2026-04-03T02:41:15Z — feat: add Allowed Trading Days checkboxes to Config page (#365)
Commits (30d): 270 (pages 1+2+3: 100+100+70; page 4: 0)
Branches: develop, feature/MV2-235-oc-linear-access, feature/MV2-243-252-session-continuity, feature/MV2-institutional-production, feature/MV2-mission-control-overhaul, feature/agent-observatory-v1, feature/aggression-promotion-check, feature/choppy-entry-blocking, feature/config-min-rr, feature/config-min-rr-v2, feature/history-projected-vs-actual, feature/mathematical-upgrade, feature/session-risk-allocation, feature/tradfi-spot-integration, feature/trading-card-levels-rr, feature/119-trading-card-upgrade, fix/MV2-226-oc-state-freshness, fix/MV2-254-execution-price-format, fix/MV2-254-hl-order-execution, fix/MV2-mc-review-fixes, fix/MV2-mission-control-data-mapping, fix/choppy-stale-consecutive-reset, fix/commodus-audit-log, fix/dashboard-data-perp-watchdog-safety, fix/disable-ote-addins-data-driven, fix/finance-bro-review-round2, fix/monitor-qa-fixes, fix/observatory-hardening-v2, fix/position-sizing-use-global-config, fix/qa-audit-p0-p1-p2 (30 branches total)

## Open Issues / PRs
None open

## Health
ACTIVE — Most active repo in the account (270 commits in 30 days). Live mainnet trading system under continuous improvement. 30 open branches indicates high parallel feature velocity. Critical financial system — every change must clear shadow testing before production.

## External Services (verified from .env.example)
- PostgreSQL: primary data store (v2_ prefix tables)
- Resend: subscriber emails (welcome, 2FA, trade alerts)
- Anthropic/Claude: Commodus hypothesis generation (optional, gracefully degrades)
- Hyperliquid: trade execution + subscriber fan-out (private keys encrypted in Railway)
- Sentry: error monitoring + webhook alerts

## Cross-Project Links
- marcus-execution-layer: direct predecessor — Marcusv2 superseded it (confirmed via CLAUDE.md review)
- marcusv3 / marcus-master-indicator: Pine Script v4.0 indicator libraries being developed — feeds signals to Marcusv2 via TradingView webhooks
- marcus: v1 Pine Script indicator archive

## Questions for T.J.
1. feature/tradfi-spot-integration is open — is TradFi spot trading on the near-term roadmap, or is this exploratory?
2. feature/MV2-institutional-production — what does institutional production mean in this context? A separate deployment for institutional subscribers?
3. 30 open branches — are the fix/* branches all stale/already merged to develop, or are they still being worked? Should the closed/merged ones be pruned?
