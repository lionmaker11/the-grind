# MCD Command Center ↔ Obsidian Two-Way Sync Integration

## Objective
Create a bidirectional sync system that keeps MCD Command Center deal data, campaign performance, and operational metrics in sync with the Obsidian vault.

## What Needs to Sync

### MCD Command Center → Obsidian (Pull)
- Active deals (stage, seller contact, property address, offer price)
- Campaign performance (open rates, click rates, SMS delivery rates)
- Contact database changes (new imports, enrichments, DNC updates)
- AI agent activity logs (Acquisition, Disposition, General Mgmt actions)
- Pipeline metrics (deals in each stage, promotion performance)
- Weekly deal summary (closed deals, revenue, cost per deal)

### Obsidian → MCD Command Center (Write)
- Deal stage updates (user moves deal in Obsidian, syncs back to platform)
- Campaign template changes (update follow-up sequences, messaging)
- Contact segment assignments (new segments created in Obsidian)
- Agent instructions or guardrails (update agent behavior from vault)
- Promotional strategy tweaks (adjust offer escalation rules)

## Technical Requirements

### Data Sources
- MCD Command Center API (Railway) — /api endpoints for deals, campaigns, contacts, agents
- Obsidian vault — ~/Documents/lionmaker-vault/projects/motor-city-deals/

### Sync Pattern
- **Pull frequency:** Every 30 minutes (deals, campaigns, agent activity)
- **Write frequency:** On-demand + batch hourly for campaign/strategy updates
- **Conflict resolution:** Obsidian edits take priority (user is source of truth)
- **Storage:** `projects/motor-city-deals/operational-dashboard.md` + `deals/YYYY-MM-DD.md` (daily logs)

### File Structure (Target)
```
projects/motor-city-deals/
├── operational-dashboard.md (pipeline summary, today's metrics, active deals count)
├── mcd-config.md (campaign templates, segment definitions, agent guardrails)
├── deals/
│   ├── 2026-03-24.md (deals closed today, revenue, metrics)
│   ├── 2026-03-23.md
│   └── [active deals index with status]
├── campaigns/
│   ├── campaign-template-acquisition.md (messaging, follow-up timing)
│   ├── campaign-template-disposition.md
│   └── performance-log.md (open rates, click rates by campaign)
└── agent-activity.md (daily log: Mira, Dispatcher, General Mgmt actions)
```

### API Integration
- Fetch endpoint: GET /api/deals?stage=X&limit=50 (active deals in stage)
- Fetch endpoint: GET /api/campaigns/performance (open rates, clicks, SMS delivery)
- Fetch endpoint: GET /api/contacts/changes?since=X (new imports, DNC updates)
- Fetch endpoint: GET /api/agents/activity (recent agent actions with timestamps)
- Fetch endpoint: GET /api/metrics/daily-summary (pipeline count, revenue, cost)
- Write endpoint: PUT /api/deals/{id}/stage (move deal based on Obsidian update)
- Write endpoint: POST /api/campaigns/{id}/template (update campaign messaging)
- Write endpoint: POST /api/agents/guardrails (update agent instructions)

### Implementation Approach
1. Create Node.js worker: `tasks/mcd-obsidian-sync.js`
2. Runs every 30 min via cron
3. Pulls latest deals, campaigns, agent activity from Railway API
4. Formats into Markdown with deal IDs, hyperlinks to MCD platform, metrics
5. Checks Obsidian vault for configuration changes (campaign templates, guardrails)
6. Posts updates back to MCD API (campaign changes, agent guardrails)
7. Logs all syncs to `mcd-vault-sync.log`

### Edge Cases to Handle
- Deal stage conflicts: if Obsidian and platform differ, Obsidian wins (user override)
- Campaign template conflicts: merge user changes with system defaults
- Contact DNC updates: ensure DNC flag syncs immediately (compliance critical)
- Timezone handling: America/Detroit (ET) for all timestamps
- Deal IDs: use unique identifiers to prevent duplicates across syncs
- API rate limits: batch requests, respect 429 Retry-After headers
- Large contact lists: paginate imports, process incrementally

### Definition of Done
✅ New deals appear in Obsidian within 30 min of creation in platform
✅ Pipeline metrics (stage counts, revenue) auto-updated in operational-dashboard.md
✅ Campaign performance (opens, clicks, SMS delivery) synced hourly
✅ Deal stage changes in Obsidian post back to platform within 5 min
✅ Agent activity logged with timestamps and action descriptions
✅ No duplicate deals or lost data in sync
✅ DNC updates sync immediately (compliance requirement)
✅ Hyperlinks from Obsidian to MCD platform deals work correctly
✅ Sync logs auditable for debugging and compliance review

### Notes for Claude Code
- T.J. checks MCD Command Center during Monday/Thursday (2-3 hrs with Ali)
- Obsidian vault stores strategic decisions about campaigns and deal handling
- This sync keeps platform and vault in sync without manual updates
- Critical: DNC and compliance flags must sync accurately
- Priority: reliability over speed (no data loss, no false positives)
