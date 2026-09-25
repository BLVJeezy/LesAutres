# DESIGN.md — Les Autres

## Design Tokens
```css
:root {
  --bg:          #101110;   /* "room" background — not pure black */
  --bg2:         #191a18;   /* secondary surface, slightly lighter */
  --surface:     #1e211a;   /* cards, chips, sticky bars */
  --border:      #34362f;
  --text:        #efeee8;
  --text-dim:    #989a92;
  --accent:      #d595a4;   /* brand pink — statement-print accent */
  --accent-dim:  rgba(213,149,164,0.15);
}
```
Do not use pure white or pure black — brief calls for a "looking from a room" ambient dark background, not a void.

## Typography
- Display (hero title): heavy weight, clamp(40px, 10vw, 96px), tracking -0.02em, lh 0.95 — this is the floating 3D hero title, so it needs to hold up rendered as/behind a 3D object
- Body: 16px, lh 1.6
- Label (size selector, tags): 600 weight, 11px, tracking 0.12em, uppercase

## 3D / Motion Principles
- Hero t-shirt: auto-spin idle state (slow, ~20s per rotation), manual drag-to-rotate overrides auto-spin, resumes auto-spin after ~3s idle
- Colorway swap: crossfade texture/material, no re-mount of the 3D object (avoid pop/flash)
- Reveal on scroll: opacity 0→1 + y 20px→0, 600ms, cubic-bezier(0.16,1,0.3,1)
- No filter:blur behind the 3D canvas (kills performance on mobile)
- Respect prefers-reduced-motion: disable auto-spin, keep drag-rotate

## Component Patterns
- "Koop nu" button: full-width on mobile, fixed/sticky above safe-area at bottom; states: default, pressed, disabled (out of stock), loading (adding to cart)
- Size selector: below CTA, horizontal pill row, selected/unselected/disabled(out of stock) states
- Colorway switcher: swatches under or beside the 3D viewer, active state = ring/border in --accent

## Do Not Touch
- Never make the background pure white or pure black
- Never let the 3D canvas block scroll on mobile (touch-action must allow vertical scroll to pass through outside the drag zone)
- Never auto-play sound
- Keep --accent and --accent-dim in sync if either changes

## Spacing
- Mobile-first: base unit 8px
- Section padding: 64px 0 mobile, 100px 0 desktop
- Container: full-bleed on mobile with 20px side padding; max-width 480px content column even on desktop (single-product page, no need to sprawl)

## Breakpoints
```css
--bp-mobile: 480px;
--bp-tablet: 768px;
--bp-desktop: 1200px;
```
Mobile-first: build and test the 3D interaction on mobile viewport first — this is the primary device per brief.

## Tone
Direct, minimal copy. Streetwear brand voice — no marketing fluff, let the product and photography carry it.
