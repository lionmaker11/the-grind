---
date: 2026-03-24
project: motor-city-deals
title: GrillaHQ Composio Integration Analysis & Rebuild Plan
tags: [grillahq, composio, architecture, decision]
---

# GrillaHQ + Composio Integration Analysis

## Current State (March 24, 2026)

**Build Status:** Production-ready on Railway
- 494/500 tests passing (98.8%)
- 6 E2E failures (test framework issues, not app bugs)
- All core features shipped: pipeline, messaging, onboarding, compliance
- Multi-tenant architecture complete

**Critical Problem:** Agent orchestration is broken
- 6 agents (Acquisition, Disposition, etc.) run in isolation
- No state passing between agents
- Inbound SMS → Acquisition stores in agent memory (not DB)
- Disposition agent doesn't see context → duplicates work
- Result: Lost conversations, duplicate tasks, integration fails

---

## Why Composio Is The Solution

### Current Architecture Problem

```
SMS Input → Acquisition Agent
            ↓ (stores in local memory)
         Disposition Agent
            ↓ (no context, starts over)
         General Mgmt Agent
            ↓ (confused, creates duplicates)
```

### With Composio Orchestrator

```
SMS Input → Composio Orchestration Layer
            ↓ (passes full context + state)
         Acquisition Agent (consults orchestrator state)
            ↓ (executor confirms with orchestrator)
         Disposition Agent (inherits context from prior agent)
            ↓ (executor confirms with orchestrator)
         General Mgmt Agent (complete journey visible)
            ↓ (executor confirms with orchestrator)
         PostgreSQL (full audit trail stored)
```

---

## Composio Capabilities vs. mmt.gg

| Capability | Composio | mmt.gg | Winner |
|-----------|----------|--------|--------|
| Open source | ✅ Yes | ❌ Proprietary | Composio |
| Self-hosted | ✅ Yes | ❌ Cloud only | Composio |
| Next.js integration | ✅ Excellent | ⚠️ Generic | Composio |
| Express.js backend | ✅ Native | ⚠️ Generic | Composio |
| Agent routing | ✅ Built-in | ✅ Built-in | Tie |
| State management | ✅ Persistent | ⚠️ Session-based | Composio |
| Tool unification | ✅ Tool SDK | ⚠️ Tool registry | Composio |
| Error handling | ✅ Retry + timeout | ✅ Retry + timeout | Tie |
| Modular agents | ✅ Yes | ✅ Yes | Tie |
| Workflow definition | ✅ YAML/JSON | ⚠️ Implicit | Composio |

**Decision: Composio is the better fit for GrillaHQ's Next.js + Express stack and your need for persistent state across agents.**

---

## Implementation Plan — 8-Day Rebuild

### Phase 1: Foundation (Days 1-2)
**Goal:** Composio running, single agent testable

1. Install `@composio/sdk` in backend
2. Auth with Composio (API key)
3. Define 6 agent specs: name, inputs, outputs, tools list
4. Build tool registry (wrappers for Telnyx SMS, Resend email, DB logs, CRM calls)
5. Test single agent (Acquisition) invocation through Composio
6. Verify state captured, returned correctly

**Deliverable:** Acquisition agent working, state visible in logs

### Phase 2: Orchestration (Days 3-4)
**Goal:** Agents hand off context to each other

1. Define workflow YAML (Acquisition → Disposition → Fulfillment with gate conditions)
2. Composio passes execution context between agents
3. Store all agent states in PostgreSQL `agent_executions` table
4. Test full workflow: SMS → all 3 agents → DB complete
5. Verify zero context loss, no duplicates

**Deliverable:** Full agent handoff working, conversation history intact

### Phase 3: Integration (Days 5-6)
**Goal:** Hook into existing GrillaHQ UI/API

1. Composio webhooks emit events on agent state changes
2. Your `/api/webhooks/composio` captures, broadcasts via SSE
3. Update `/api/agents/invoke` to call Composio instead of local agents
4. LED visualization updates from Composio webhook events
5. Conversation panel pulls agent reasoning from Composio trace

**Deliverable:** Real-time UI reflects agent orchestration, LED working

### Phase 4: Testing & Validation (Days 7-8)
**Goal:** System verified end-to-end

1. Unit tests: each agent invocation, tool calls, context passing
2. Integration tests: full workflow, state persistence
3. QA (bottom-up): execution layer → state management → UI layer
4. Browser E2E: full flow through UI, ledger matches state

**Deliverable:** All tests passing, system production-ready

---

## Immediate Actions (Today)

1. ✅ T.J. approves Composio (vs mmt.gg) — **APPROVED**
2. ✅ Chief prepares 10K-ft implementation plan — **READY**
3. ⏳ npm install GrillaHQ repo — **IN PROGRESS**
4. 🚀 Spawn Claude Code with 10K-ft plan + repo access
5. 📅 Schedule daily debrief 1445–1515 to oversee build

---

## Remote Access & Oversight Setup

**During rebuild, T.J. needs:**
1. Real-time visibility into agent state (which agent running, what context it has)
2. Ability to trigger workflows remotely (not on device)
3. Log access to debug failures
4. Dashboard showing current pipeline state

**Chief will provide:**
1. Web dashboard: agent status, current deal, LED visualization
2. Telegram command routing: `/invoke workflow [dealId]` → execute
3. SSH tunnel for deep debugging
4. Real-time log streaming during build

---

## Success Criteria

✅ Inbound SMS flows through all agents without manual intervention
✅ Disposition agent receives full context from Acquisition
✅ No duplicate tasks created
✅ Full conversation history stored + queryable
✅ LED visualization updates in real-time
✅ Agent can be modified/swapped without touching others
✅ All tests passing (focus on E2E first, fix test locators after)

---

## Notes for Claude Code

This rebuild solves the root cause of MCD Command Center's integration failure. The agents are solid individually; the problem is they never talk to each other. Composio bridges that gap with persistent state management and unified tool access.

The phased approach (foundation → orchestration → integration → validation) ensures each layer works before adding complexity. Bottom-up testing catches issues early.

**High confidence:** This approach will work. The architecture is proven in MARCUS (signal engine + execution pipeline). Same pattern, different domain.
