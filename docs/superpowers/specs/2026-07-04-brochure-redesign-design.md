# WeldDoc Brochure Redesign — Design Spec
**Date:** 2026-07-04  
**Palette:** Forge Steel (navy #1C2B3A · surface #2E4A63 · amber #E8A030 · warm white #F5F0E8)  
**Output:** 2-page A4 PDF, generated via Puppeteer from a Next.js `/brochure` page

---

## Goal

Beat the WeldEye competitor brochure by combining:
- Emotional impact (real welding photography hero)
- Stronger narrative (audit-fear → qualification control)
- Visible pricing (WeldEye hides pricing)
- Warmer, more premium visual palette vs WeldEye's cold black/orange

---

## Hero Headline (combined A + C)

> **"Your welders are qualified. One registry — prove it in 30 seconds."**

Sub-tagline (amber): *Digital Welding Qualification & Compliance Management*

---

## Page 1 Layout

### 1. Photo Hero Band (~38% page height / ~113mm)

- Full-bleed Unsplash welding photo (arc sparks, dark industrial)
- CSS `background-image` from Unsplash CDN URL — fetched at PDF render time
- Bottom 40% of photo covered by a `linear-gradient` from `transparent` → `#1C2B3A` for text legibility
- **Top-left:** `Weld.Doc` logo — "Weld." in amber, ".Doc" in white, font-size ~28px
- **Top-right:** Industry pills — amber-outlined, semi-transparent dark background
- **Bottom of photo (on gradient):**
  - Headline in white, bold, ~20px, letter-spacing tight
  - Amber tagline below, ~9px
- **Bottom-right inset (picture-in-picture):**
  - Floating product card showing welder profile QR (`/images/4.png`)
  - 2px amber border, rounded corners, navy background
  - Label: "Scan to verify on-site" in amber

### 2. About + Challenge/Solution (~30mm, 2-column)

**Left column — About**
- Section kicker: "About WeldDoc" (amber, uppercase)
- Headline: "Welder qualification, finally under control" (navy, bold)
- Body: 2-sentence description of WeldDoc (warm muted tone)

**Right column — stacked 2 cards**
- *Challenge card:* white bg, 3px left border in `#E85A30`, kicker "The challenge", 3 bullet points
- *Solution card:* navy bg (`#1C2B3A`), amber kicker "Our solution", amber bullet dots, 3 bullet points in near-white

### 3. Feature Grid (~28mm, 5×2)

- Amber kicker: "Key features"
- 10 feature cards: white bg, navy 2.5px left-border, title bold navy, detail muted
- Grid: `repeat(5, 1fr)` × 2 rows, 5px gap

### 4. Workflow Strip (~18mm, 6 steps)

- Amber kicker: "How it works"
- 6 tiles: navy bg, amber step number (01–06), white label text
- Grid: `repeat(6, 1fr)`, no gaps, slight border-radius

### 5. Page Footer (~8mm)

- Left: standards footnote (muted)
- Right: page number "1 / 2"
- Separator: 1px `var(--line)` top border

---

## Page 2 Layout

### 1. Proof Bar (~18mm, full-width navy band)

Three amber stat columns across full width:

| Stat | Label |
|------|-------|
| 3 min | Certificate generated |
| 30 sec | QR audit verify |
| 0 paper | Complete digital trail |

Each: large amber number (~22px bold), white label (~8px), vertical dividers between columns.

### 2. Comparison Table (~90mm)

- Wrapper: warm white body, 1px `var(--line)` border, 7px border-radius
- Header row: navy surface `#2E4A63` background, off-white text
- **WeldDoc column header: solid amber `#E8A030`, navy bold text — visually dominant**
- Feature label column: warm `var(--soft)` background, left-aligned
- Row striping: alternating warm white / soft tint
- WeldDoc cells: amber tint `rgb(232 160 48 / 0.12)` background
- 12 rows covering: ISO standards, range-of-approval, certificate/ID PDF, QR verify, expiry alerts, bulk import, WPS authoring, traceability, UX, affordability
- Legend: amber / warning / inactive icons + labels

### 3. Benefits Row (~14mm)

- 5 navy chips (`#1C2B3A`), white text, 5px border-radius
- Grid: `repeat(5, 1fr)`, 5px gap

### 4. Security + Pricing (2-column, ~42mm)

**Left — Security card (navy surface)**
- Navy surface bg (`#2E4A63`), amber kicker, amber bullet dots
- 4 security/data points

**Right — Pricing**
- Amber kicker: "Pricing"
- 3 plan cards in `repeat(3, 1fr)` grid:
  - Starter: white bg, ₹0, muted border
  - Growth: **navy bg, amber price `₹24,999`**, amber "Most popular" badge
  - Enterprise: white bg, "Custom" price

### 5. Contact Footer Band (~18mm, full-width navy)

- Left: Brand name in amber (`WeldDoc`, bold ~13px) + contact lines in muted white
- Right: CTA text "Start free · 3 welders · 1 month · no credit card" in amber bold, page number below

---

## Implementation Notes

### Stock Photo
- Source: Unsplash CDN (free commercial use)
- Query: dramatic arc welding, dark background, sparks
- Confirmed URL: `https://images.unsplash.com/photo-1759847552281-60e45956124d?auto=format&fit=crop&w=1400&q=90`
  (Canon EOS 5D Mark IV — welder in dark industrial setting, professional quality, color)
- Backup URL: `https://images.unsplash.com/photo-1726421690313-2e0519335b82?auto=format&fit=crop&w=1400&q=90`
  (Sony ILCE-7M3 — welder in dark room, dramatic arc light)
- Used as CSS `background-image` in `.brochure-hero-photo` div
- Fallback: `background-color: var(--navy)` if image fails to load

### Product inset image
- `/images/4.png` (welder profile QR) — used as picture-in-picture in hero
- Remove dashboard screenshot (`/images/2.png`) from hero — dashboard looks sparse, QR profile is more unique and convincing

### Files to change
1. `src/app/brochure/brochure.css` — full CSS overhaul for photo hero
2. `src/components/brochure/brochure-document.tsx` — restructure hero section
3. `src/lib/brochure/content.ts` — update headline constants

### PDF generation
- `PUPPETEER_EXECUTABLE_PATH=/snap/bin/chromium npm run brochure:pdf`
- Puppeteer must have internet access to fetch Unsplash CDN image
- `deviceScaleFactor: 3` maintained for print quality

---

## Success Criteria

- Brochure fits exactly 2 A4 pages with no overflow and no empty white space
- Photo hero loads in both browser preview and PDF
- Comparison table WeldDoc column visually dominates
- Pricing is immediately visible (WeldEye doesn't show theirs)
- Print-quality PDF at 3× scale, all fonts anti-aliased
