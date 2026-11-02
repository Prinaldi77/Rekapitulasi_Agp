# Design System: perkedelcup.vercel.app

> Extracted 2026-10-08

---

## 1. Design Language Overview

**Vibe:** monochrome · modern · Dark theme

**Design rhythm:** 4px grid · subtly rounded · tight line-height (1.2) · flat (no shadows)

## 2. Color System

| Role     | Hex      | Usage |
|----------|----------|-------|
| Accent   | `#FFFFFF` | Highlights, success states, decorative |
| Surface  | `#070707` | Main page background |
| Elevated | `#262626` | Cards, raised containers |
| Text     | `#F5F5F2` | Body and heading text |
| Muted    | `#AAAAAA` | Secondary text, captions |
| Border   | `#262626` | Dividers, borders |

### Named color tokens (from CSS custom properties)

- `--bg` → `#090909`
- `--surface` → `#151515`
- `--surface-2` → `#202020`
- `--primary` → `#f5a900`
- `--primary-soft` → `#ffd166`
- `--accent-pink` → `#e95c8a`
- `--text` → `#f5f1e8`
- `--muted` → `#969696`
- `--border` → `#343434`
- `--success` → `#79c267`
- `--danger` → `#e85d5d`

## 3. Typography

- **H2** — Bebas_Neue 54px / weight 900, line-height 1, tracking -1.35px
- **H3** — Bebas_Neue 27px / weight 900, line-height 1.11
- **Body** — Inter 10.5px / weight 400, line-height 1.43
- **Scale:** 45px / 18px / 12px

## 4. Spacing & Layout

- **Spacing scale:** 4,8,12,16,20,24,32,36
- **Border radius:** 9px buttons, 6px inputs
- **Radius vocabulary:** button → 9px, input → 6px

## 6. Component Specs

### Button
- #F5F5F2 text
- 9px radius
- 400 weight

### Card
- dark surface bg
- subtle border
- 12px radius
- 24px padding

### Input
- #121212 bg
- 0.840336px solid #2B2B2B
- 6px radius
- 7.5px 27px 7.5px 30px padding

### Link
- #FFFFFF

## 7. Implementation Rules

**DO:**
- Reserve `#FFFFFF` for accent moments — don't overuse
- Stick to the spacing scale (4,8,12,16,20,24,32,36) — don't introduce arbitrary values
- Match the radius vocabulary: 9px buttons, 6px inputs
- Pair Bebas_Neue 700 headings with Permanent_Marker 12px 400, 1.2 line-height
- Honour the visual hierarchy: bold colour on primary actions, muted tones on secondary

**DON'T:**
- Copy this design verbatim — use the tokens as a system to build something original
- Mix in colours outside this palette (especially competing primary colours)
- Break the radius scale by introducing one-off values
- Use the same shadow tier for everything — match elevation to importance

---

*Source: perkedelcup.vercel.app · 2026-10-08*
*Do not copy the design. Use these tokens to build similar UI with the same feel.*

