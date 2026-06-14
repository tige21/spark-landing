# Plan: Remove hero video + tighten landing spacing

**Branch:** feature/landing-build (no new branch — polish on existing work)
**Created:** 2026-06-15
**Mode:** fast

## Settings
- Testing: update existing smoke suite only (no new tests)
- Logging: n/a (static Astro site)
- Docs: no

## Goal
1. Remove the hero "living engraving" video entirely; keep the perspective grid (HeroGrid).
2. Fix the oversized vertical spacing across the landing — currently too airy/gigantic — by tightening the global section rhythm and the heaviest internal gaps to a denser, deliberate scale.

## Root cause of the "gigantic" feel
- `src/components/layout/Section.astro:21` — `padding-block: clamp(var(--space-3xl), 9vw, 120px)` applies up to **120px top + 120px bottom** to every section (≈240px between section contents at desktop). This is the dominant offender.
- Secondary: heavy `var(--space-3xl)` (48px) content separators in Premium / Order / How / What / Decks / Footer / Hero.

## Tasks

### Phase 1 — Remove hero video (#71)
- Delete `src/components/hero/HeroVideo.tsx`.
- In `src/components/hero/Hero.astro`: remove the `HeroVideo` import (line 5), the `.hero-centerpiece` block (lines 33–35), and its CSS incl. the mobile media query (lines 89–97).
- Delete assets `public/hero/printer.mp4`, `public/hero/printer-poster.webp`.
- Keep `HeroGrid.astro` and the celestial bg. Rebalance hero centering now that the centerpiece is gone.

### Phase 2 — Spacing pass (#72, #73)
- `Section.astro`: `clamp(var(--space-3xl), 9vw, 120px)` → denser (target `clamp(var(--space-2xl), 5vw, 72px)`); tune by eye.
- Reduce `var(--space-3xl)` → `var(--space-2xl)` where too airy: `Premium.astro:46`, `Order.astro:48`, `How.astro:64`, `What.astro:53`, `Decks.astro:75`, `Footer.astro:35`, and `Hero.astro:87` content padding. Verify each visually; keep any that already read well.

### Phase 3 — Test + ship (#74, #75)
- `tests/smoke.spec.ts`: drop the two `.hero-centerpiece` reduced-motion assertions (centerpiece removed); keep the rest.
- Build, Playwright screenshots desktop (1366) + mobile (Pixel 7), full smoke (`npm run test:e2e`), commit on `feature/landing-build`, deploy via `npm run deploy`, verify live.

## Commit Plan
- Single commit after Phase 3 verification: `refactor(landing): remove hero video, tighten section spacing`.
