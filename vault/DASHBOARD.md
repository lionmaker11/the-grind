---
aliases: [Dashboard, Home]
---

# 🏠 Dashboard

> Open this file to see the live state of everything Chief knows. Powered by Dataview.

---

## 🔴 Active Projects (by priority)

```dataview
TABLE status, priority, aliases
FROM "projects"
WHERE status = "active"
SORT priority ASC
```

## ⏸️ On Hold

```dataview
TABLE status, priority
FROM "projects"
WHERE status = "on-hold"
SORT priority ASC
```

---

## 👥 People (last updated)

```dataview
TABLE role, project, last_updated
FROM "people"
SORT last_updated DESC
```

---

## ✅ Open Action Items

```dataview
LIST
FROM "action-items"
WHERE file.name = "ACTIVE"
```

*See [[ACTIVE]] for full action item tracker.*

---

## 📋 Recent Decisions

```dataview
TABLE date, project, aliases
FROM "decisions"
WHERE file.name != "TEMPLATE"
SORT date DESC
LIMIT 10
```

---

## 📅 Recent Daily Briefs

```dataview
LIST
FROM "daily-briefs"
SORT file.name DESC
LIMIT 7
```

---

## 💰 Financial Snapshot

*See [[FINANCES]] for full tracker.*

| Metric | Value |
|--------|-------|
| Monthly income | ~$10K |
| Freedom target | $25K/month |
| Gap | $15K/month |
| Crypto goal | .75 BTC in 90 days |

---

## 🧭 Quick Links

- [[MEMORY]] — Master index
- [[NORTH_STAR]] — Values & priorities
- [[FINANCES]] — Bills & income
- [[ACTIVE]] — Action items
- [[weekly-board]] — This week's plan

---

## 📊 Category Balance (This Week)

| Category | Target | Actual |
|----------|--------|--------|
| 💪 Physical | 3 | — |
| 🧠 Mental | 2 | — |
| 🙏 Spiritual | 7 | — |
| 📐 On the Business | 2 | — |
| 🔨 In the Business | 8 | — |
| 💰 Finances | 1 | — |
| ❤️ Relationships | 7 | — |

*Chief updates actuals during daily briefs and EOD wrap.*
