---
aliases: [BiggerSpreads]
project: biggerspreads
status: on-hold
priority: 4
last_updated: 2026-03-23
tags: [biggerspreads]
---

# BiggerSpreads — Project Status

## Overview
SaaS platform for real estate wholesalers. Being repositioned from deal calculator into full wholesaling OS.

## T.J.'s Current Stance (March 2026)
**Hesitant to invest more time.** T.J. believes AI can now do what BiggerSpreads does natively — someone can just ask Claude to underwrite a property. The product may be obsolete before it launches. Proud of the work but realistic about timing.

## What Was Built
- CompGPT: High-performance ARV engine using persistent database (Data.gov, city GIS, Redfin, Realtor.com, Zillow, Google Maps API/Geopy).
- Strict comping rules: zip code, style, exterior, basement/garage, radius (0.5mi Detroit, 1mi outside).
- Reverse-engineered ChatARV.ai (custom backend endpoints, Zillow data via ZPID).
- Captured full JSON responses from ChatARV backend for property data and autocomplete.

## Architecture Direction
- Scrape-first data architecture
- AI deal analyst
- Proprietary Deal Score
- Buyer matching
- Foundation: Prior RealComp MLS scraper experience
- $600/month data bill
- ~$20K in credit (not cash) available for marketing

## Decision — April 2026
$600/month data subscription CANCELLED as of April 4, 2026. T.J. stopped paying.
Project remains ON HOLD until June 2026 minimum. No active spend.

## ⚠️ Public Site is LIVE (Enriched 2026-04-14)
- **biggerspreads.com is publicly live.** Headline: "The Wholesaler's Toolkit To Sift Leads Fast & Close Bigger Deals." CTA: "Start your free trial." Login/Sign Up active.
- Homepage features a Mux-hosted demo video: **"How To Go From Underwriting to Purchase Agreement in Under 90 Seconds."**
- Tagline on deal cards (via Ali's @motorcityhomes IG): "Powered by BiggerSpreads™"
- **This contradicts the "on-hold, no active spend" status.** Someone (likely [[ali|Ali]]) is actively maintaining the public-facing site and using it as MCD's underwriting brand. T.J. may have stopped paying the $600/mo data bill, but the product is not dormant.
- VERIFY: Who is paying for hosting/Mux/any remaining infra? Who has admin access? Is there a free-trial signup funnel capturing leads right now — and where are those leads going?

Enriched: 2026-04-14
