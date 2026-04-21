# ai-business-survey — Repo Audit
**Repo:** https://github.com/lionmaker11/ai-business-survey
**Audit Date:** 2026-04-03
**Last Commit:** 2026-03-20 — Merge PR: Add raw VTT subtitle files for both videos

## What This Is
ai-business-survey is a single-page HTML survey titled "Autonomous AI Business System — Discovery Survey." Based on the page structure and the YouTube video transcriptions committed alongside it, this appears to be a discovery/onboarding survey used to qualify prospects or understand their situation before selling an AI business system. The PR that was merged added raw VTT subtitle files from two YouTube videos about "Building AI Agents that actually work" — suggesting this survey may be paired with video content for a course, coaching program, or lead generation funnel.

## Tech Stack
- Language(s): HTML (single file, all inline CSS/JS)
- Framework(s): None (vanilla HTML)
- Database(s): None
- APIs/Services: Google Fonts (DM Sans, DM Serif Display)
- Deployment: Unknown (no deployment config found)

## Current State
- ✅ Built and working: Single-page survey UI is complete — dark theme, branded styling, multi-section form layout
- 🔨 Scaffolded but incomplete: No backend to receive survey responses — the form has no action/method. No hosting config.
- 📋 Planned but not started: Unknown — no roadmap or issues found

## Activity
- Last meaningful commit: 2026-03-20 — Added VTT subtitle files for two YouTube videos (transcriptions also committed)
- Commits in last 30 days: 3
- Active branches: main, claude/export-video-transcriptions-5eVUN (merged)

## Open Issues / PRs
None open

## Health Assessment
STALLING — 3 commits total, all within 3 weeks. The survey HTML is built but there's no backend to actually receive responses, and no deployment config. Possibly built as a quick MVP to validate interest in something, then not followed up on.

## Cross-Project Dependencies
- Depends on: Unknown (no external APIs wired up)
- Used by: Nothing

## People Dependencies
Unknown

## Vault Cross-Reference
No existing vault folder. Purpose is unclear.

## Questions for T.J.
1. What is this survey actually for? Is it a lead gen tool for a course, a coaching program, or something else?
2. The two YouTube videos transcribed are about "Building AI Agents" — are these T.J.'s YouTube videos? What channel?
3. Where is this survey deployed/hosted (if at all)?
4. Is this connected to the Whop platform or any of the other business projects?
5. (NEW) The survey has no backend to receive form submissions — have you been receiving any responses? If so, how?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-03-20 — confirmed
- ✅ VERIFIED: 3 commits in last 30 days — confirmed
- ✅ VERIFIED: Branch: main, claude/export-video-transcriptions-5eVUN (merged) — confirmed
- ✅ VERIFIED: Single-page HTML, vanilla, no backend — confirmed
- ⚠️ LOW CONFIDENCE: Survey purpose — no README and no form action/method in HTML means this is unconfirmed as a lead-gen tool vs. internal planning tool
