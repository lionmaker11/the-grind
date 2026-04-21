# Trish Paints Joy — Artist Portfolio & E-Commerce
**Project ID:** TPJ (internal)  
**Client:** Trish (artist, trishpaintsjoy.com)  
**Status:** Build Prompt Ready → Phase 1 Build  
**Started:** 2026-03-29  
**Next Milestone:** Phase 1 architecture + component scaffolding (target: 2026-04-05)  

---

## PROJECT OVERVIEW

Full custom build: production-ready artist portfolio + e-commerce website for Trish Paints Joy.

**The ask:** Clean, intentional gallery-quality presentation of Trish's artwork. Not a template. Handcrafted aesthetic with impeccable typography, whitespace, and image handling.

**Current site:** https://trishpaintsjoy.com (Squarespace, password: Abuelita) — use for reference + content extraction

---

## TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15 (App Router, TypeScript) | Latest stable. SSG/ISR for perf. |
| Styling | Tailwind CSS v4 | Custom design tokens — NOT default look |
| CMS | Sanity v3 (embedded Studio) | Free tier. Trish manages content. |
| E-Commerce | Snipcart | Drop-in cart overlay. Test mode for launch. |
| Hosting | Vercel | Free tier. Auto-deploy from GitHub. |
| Images | Sanity CDN + Next.js Image Optimization | CRITICAL: images must be perfect |
| Newsletter | Mailchimp or Resend | Simple signup, no complex automation yet |
| Repo | github.com/lionmaker11/trishpaintsjoy | |

---

## DESIGN DIRECTION

**Aesthetic:** "Gallery Minimalism with Warmth"  
Warm, inviting, gallery-quality. Think: bright airy gallery in converted loft. White walls, natural light, beautiful floors, art that pops against clean space.

### Typography
- **Display:** Playfair Display or Cormorant Garamond (character that evokes joy, NOT corporate)
- **Body:** DM Sans or Outfit (clean, readable, pairs beautifully with display)
- **Loaded via:** `next/font/google`
- **Spacing:** Generous (1.6-1.8 line height body, generous letter spacing headings)

### Color Palette
```
--color-bg:          #FEFCF9        warm off-white (gallery walls)
--color-bg-alt:      #F5F0EB        slightly deeper warm
--color-text:        #2C2420        warm near-black, not pure black
--color-text-muted:  #8A7E76        warm gray
--color-accent:      #C4653A        terracotta/burnt sienna (pulled from art palette)
--color-accent-hover: #A8522E       darker accent for hover
--color-border:      #E8E0D8        subtle warm border
--color-white:       #FFFFFF        pure white for cards/overlays
```

**Key rule:** Artwork provides ALL visual color. Site's palette stays neutral + warm. Accent (terracotta) used sparingly: buttons, links, hover, small highlights.

### Layout Principles
- Maximum whitespace (80-120px between major sections)
- Large images (art at max reasonable size, full-bleed hero)
- Consistent vertical rhythm
- Mobile-first (Instagram → website)
- Subtle animations (Intersection Observer, no heavy libraries)
- Smooth image hover zoom on gallery
- Elegant page transitions

### Inspiration (Reference)
Nikki Heaton Studio (`nikkiheatonstudio.com`):
- Numbered sections (01. / 02. / 03.) for rhythm
- Full-bleed hero with overlaid text
- Clean horizontal image strips
- Commission process (numbered steps)
- Persistent footer email signup

**BUT:** Trish's site should be WARMER + SIMPLER. Fewer pages, friendlier tone, less "high art" more "joyful artist sharing work."

---

## SITE STRUCTURE

### Navigation
```
WORK  |  ABOUT  |  SHOP  |  JOURNAL  |  CONNECT
```
Five items, no dropdowns. Logo/wordmark left. Sticky on scroll with subtle background blur. Hamburger menu mobile (full-screen overlay).

---

## PAGES

### 1. HOMEPAGE (`/`)

**Section 1 — Hero**
- Full-viewport hero image (one of her strongest pieces)
- Overlaid: "Trish Paints Joy" wordmark
- Subtitle: "Original paintings that bring color and joy into everyday spaces"
- Animated scroll indicator (arrow or "scroll" text)
- Image from Sanity CMS (editable)

**Section 2 — Featured Works**
- "01 — Featured Work" (small, uppercase, muted)
- 4-6 artwork images in grid (2 cols desktop, 1 col mobile)
- Hover: subtle zoom + overlay (title)
- Click: navigate to work detail page
- Images marked "featured" in Sanity

**Section 3 — About Preview**
- "02 — The Artist" label
- Split layout: Trish photo + 2-3 sentence intro
- "Read my story →" link to full About page
- Photo + text from Sanity

**Section 4 — Newsletter CTA**
- "03 — Stay Connected"
- Copy: "Get studio updates, new work announcements, and first access to available pieces."
- Email input + subscribe button
- Centered, generous whitespace
- Mailchimp embed or Resend API

**Section 5 — Footer**
- Minimal: Logo/name, nav links, Instagram icon (primary social)
- Email signup (small inline form)
- Copyright: "© 2026 Trish Paints Joy. All rights reserved."

### 2. WORK (`/work`)

Gallery with category filtering.

- Top: "Work" title + intro line
- Filter tabs: "All" + categories from Sanity (Paintings, Prints, Sculpture, Mixed Media — CMS-managed, not hardcoded)
- Gallery grid: Masonry (CSS columns or lightweight approach, NOT heavy JS library)
- 3 cols desktop, 2 tablet, 1 mobile
- Hover overlay: title + medium + year
- Click: artwork detail page

### 3. WORK DETAIL (`/work/[slug]`)

Individual artwork page.

- Full-width image carousel (if multiple angles)
- Title, year, medium, dimensions, price (if available)
- "Add to Cart" button (Snipcart)
- Description + artist statement
- Related works carousel
- Commission request CTA: "Love this style? Commission me →"

### 4. ABOUT (`/about`)

- Hero image + "Meet Trish" headline
- Bio section (3-4 paragraphs, Sanity-managed)
- Process section: "How I Work" with images showing her studio/process
- Commission section: numbered steps (01, 02, 03, etc.)
- Testimonials section (optional, Sanity-managed)
- CTA: "Ready to work together? →" links to Connect

### 5. SHOP (`/shop`)

E-commerce listing (Snipcart-powered).

- Product grid (same as Work, but filtered to "For Sale" items)
- Price visible (Snipcart integration)
- Add to Cart buttons
- Filter by category, price range
- Snipcart handles checkout (overlay, no custom checkout page)

### 6. JOURNAL (`/blog`)

Blog/studio updates.

- List of blog posts (Sanity CMS)
- Post cards: featured image, title, date, excerpt
- Click: full post page
- Newsletter signup CTA at end of each post

### 7. CONNECT (`/contact`)

Contact + commission inquiry.

- Contact form: Name, email, message
- Commission inquiry form variant: subject (portrait, custom piece, large work, etc.), budget, timeline, reference images
- Social links: Instagram primary, email, newsletter signup
- Response time expectation: "I'll get back to you within 48 hours"

---

## CONTENT STRATEGY

### Content Source
Pull from current Squarespace site:
- All artwork images (download + re-host via Sanity CDN)
- Bio + artist statement
- Product descriptions
- Any existing testimonials

### Sanity Schema (To Build)
- **Artwork** — title, slug, year, medium, dimensions, image, price, featured, category, description
- **BlogPost** — title, slug, date, content (rich text), featuredImage, category, tags
- **Settings** — siteTitle, siteDescription, socialLinks, newsletter provider
- **Commission** — inquiry form submissions (stored for followup)
- **Testimonial** — author, quote, image (optional)

### Image Handling
- All artwork images optimized via Sanity CDN
- Next.js Image component with `fill` + aspect-ratio preservation
- Lazy load on scroll (Intersection Observer)
- AVIF + WebP with JPEG fallback
- Critical path images preload

---

## LAUNCH CHECKLIST

- [ ] Phase 1: Architecture + scaffolding (Next.js project, Sanity schema, Tailwind tokens)
- [ ] Phase 2: Homepage + foundation pages (hero, featured, about preview, footer)
- [ ] Phase 3: Work gallery + filtering
- [ ] Phase 4: Snipcart integration + Shop page
- [ ] Phase 5: About + Commission + Blog pages
- [ ] Phase 6: Contact form + submissions handling
- [ ] Phase 7: Deployment (Vercel) + domain setup
- [ ] Phase 8: Content migration (images, copy, data)
- [ ] Phase 9: QA + browser testing
- [ ] Phase 10: Launch + social announcement

---

## DECISIONS LOCKED

- Sanity v3 (free tier, embedded studio)
- Snipcart for e-commerce (test mode at launch)
- Vercel hosting (free tier, GitHub auto-deploy)
- Next.js 15 (latest stable)
- Tailwind v4 (custom tokens only)
- Mobile-first design
- No custom checkout (Snipcart overlay)
- No complex automation yet (launch with simple newsletter)

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Image quality critical for art site | Use Sanity CDN + Next.js Image optimization, test all formats |
| Typography choices make or break feel | Lock font pair early (Phase 1), test at all breakpoints |
| Masonry layout complexity | Use CSS columns (simplest), fallback to flexbox grid if issues |
| Content not ready at launch | Phase 8 can slip; launch Phase 1-7 with placeholder art (clearly marked TODO) |
| Snipcart licensing | Test mode works for launch; upgrade to paid only if sales materialize |

---

## TEAM & ASSIGNMENTS

- **Architect:** Claude Code (Phase 1)
- **Build:** Claude Code team (parallel phases)
- **Content:** Trish (imagery, descriptions, updates)
- **Deployment:** Railway or Vercel (auto-deploy)

---

## STATUS LOG

| Date | Update |
|------|--------|
| 2026-03-29 | Build prompt complete. Tech stack locked. Design direction finalized. Ready for Phase 1. |
|

---

**Last updated:** 2026-03-30 (cron mining cycle)
**Next review:** 2026-04-05 (Phase 1 completion target)
