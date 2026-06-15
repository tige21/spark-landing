# Plan: Remove hero scroll-cue

**Branch:** feature/landing-build · **Mode:** fast · **Created:** 2026-06-15
Settings: tests no, docs no (trivial UI removal).

## Goal
User likes the current hero (Variant 1). Remove only the "Посмотреть, как это ↓"
scroll-cue from the hero.

## Tasks
- [ ] Remove the `a.scroll-cue` element from `src/components/hero/HeroScroll.tsx`.
- [ ] Remove `.scroll-cue` + `@keyframes hero-bob` from `src/components/hero/HeroScroll.css`.
- [ ] Leave `scrollLabel` prop in place for compatibility (Hero.astro still passes it; unused is harmless) — or drop cleanly if trivial.
- [ ] Build + smoke 10/10 + deploy `npm run deploy` + verify live.
