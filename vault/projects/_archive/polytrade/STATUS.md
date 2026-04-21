# polytrade — Status

**Repo:** https://github.com/lionmaker11/polytrade
**First Detected:** 2026-04-04 (repo-watch)
**Created:** 2026-03-20
**Last Commit:** 2026-03-20 (15 days ago)
**Status:** PARKED? — Needs T.J. answer

## What This Is

Quantitative trading system for Polymarket prediction markets. Built entirely in one Claude Code session (`https://claude.ai/code/session_0111tyEKkr1CgvrF2ou6TBME`).

**Stack:** Python, py-clob-client, EIP-712 signing, WebSocket feeds

**Models Implemented:**
- Kyle's Lambda — price impact estimation
- Hawkes process — self-exciting order flow modeling
- VPIN — informed trading detection
- Almgren-Chriss — optimal execution
- Avellaneda-Stoikov — market maker with inventory management

**Backtest Results:** 64% win rate, 0.63 Sharpe, $1,401 mean P&L over 100 simulations

**Modes:**
- Paper trading: `polytrade-live --condition-id <ID> --paper`
- Live trading: `polytrade-live --condition-id <ID> --live` (real money)

## Branch Status
- Default branch: `claude/trading-system-order-book-Op8mH` — **never merged to main**
- 4 commits, all from one session, all on the agent branch

## Activity
- No commits since 2026-03-20 — 15 days silent
- No follow-up development after initial Claude Code build

## Questions for T.J.
- [ ] Is polytrade active or parked?
- [ ] Is this related to Marcusv2 or a completely separate play?
- [ ] Has this ever been tested in paper mode?
- [ ] Should this be archived or moved to an active sprint?

## Health
UNKNOWN — Agent-built, never followed up on. Potentially valuable system sitting dormant.
