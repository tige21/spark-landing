# Plan: Mobile scrub smoothness + UI polish

**Branch:** feature/landing-build (stay; no branch off main)
**Created:** 2026-06-15
**Mode:** full
**Implement with:** `/aif-implement @.ai-factory/plans/landing-scrub-perf-ui-polish.md`

## Settings
- Testing: no new tests (existing smoke must stay 10/10; Playwright visual)
- Logging: standard (DEBUG-gated console)
- Docs: yes — docs checkpoint at completion

## Goal
Polish the shipped scroll-scrub hero + chrome: (1) make the **mobile scrub smooth** (it lags),
(2) **subtle/in-style scrollbar**, (3) **minimalist header**, (4) **calmer but still-primary**
Telegram CTA.

## Tasks

### Perf
- [ ] #98 Mobile scrub smoothness — `CanvasSequence.tsx`: pre-decode to **ImageBitmap**, single **rAF loop** that lerps displayed→target index (decoupled from scroll events, draw on change only); regenerate a lighter `hero-mobile` set (≤~1MB) and optionally shorter mobile pin in `HeroScroll.tsx`. Keep reduced/poster guards.

### UI
- [ ] #99 Custom subtle scrollbar — global in `tokens.css` (thin, cream track + wine thumb, near-invisible; webkit + Firefox `scrollbar-color`). Don't break Lenis.
- [ ] #100 Minimalist header — `Nav.astro`: lighter, less noise; keep brand, links, lang switch, CTA.
- [ ] #101 Tone down Telegram CTA — `TelegramCTA.tsx`: softer fill/shadow but still the clear primary; handle hero + header variants.

### Ship
- [ ] #102 Build + smoke 10/10 + Playwright desktop+mobile (smooth scrub, no overflow, scrollbar/header/CTA, reduced-motion) + deploy + verify + docs. *(blocked by #98–#101)*

## Commit Plan
- After #98 — `perf(landing): smooth mobile scroll-scrub (ImageBitmap + rAF lerp)`
- After #101 — `style(landing): subtle scrollbar, minimal header, calmer CTA`
- After #102 — `chore(landing): verify + ship polish`

## Risks
- ImageBitmap memory on low-end mobile — keep mobile frame count modest; close()/release on unmount.
- rAF lerp must still reach exact endpoints (snap when |target−current| tiny) so the final frame (logo) lands.
- Scrollbar styling must not conflict with Lenis smooth-scroll.
