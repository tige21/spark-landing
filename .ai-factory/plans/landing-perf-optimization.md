# Plan: Landing performance optimization

**Branch:** feature/landing-build (stay; no branch off main)
**Created:** 2026-06-15
**Mode:** full · Settings: tests no, docs yes, logging standard

## Goal
Make the landing load fast. From the perf audit: get the LCP image off the JS
critical path, defer/cut JS (~100KB gz today), lighten frames/fonts/images.

## Baseline (measured)
- JS gz ~100KB: React 57 + framer 26 + Lenis 5 + framer-internals ~6 + islands ~12.
- Hero is `client:load` (React+framer load before first paint); SmoothScroll `client:load`.
- LCP poster set via island props → **not preloadable**, waits for hydration.
- Fonts ~127KB (Lora ×3 + Tangerine), `font-display: swap` ✓, only Lora-Bold preloaded.
- Hero frames: desktop 2.1MB / mobile ~1MB, fetched all-at-once on hydrate.
- CSS inlined ✓ (no render-blocking request).

## Tasks (priority order)
- [ ] #108 **P0** LCP poster as static `<img>` + `<link rel=preload as=image>` (responsive); Hero `client:load→visible`, SmoothScroll `client:load→idle`. *(biggest win, low effort)*
- [ ] #109 Defer + throttle hero-frame fetching (idle start, batched), trim mobile.
- [ ] #110 Replace simple in-view framer (Reveal/StampReveal/TiltIn/WordReveal) with IntersectionObserver + CSS.
- [ ] #111 Replace scroll-linked framer (Parallax/Layer/useScrollScene/DecksShelf/PostalRoute) with vanilla rAF driver → **remove framer-motion dep** (−26KB gz + internals). *(blocked by #110)*
- [ ] #112 Subset fonts (Cyrillic+Latin, drop unused weight) + AVIF for engravings.
- [ ] #113 Lighthouse before/after + smoke 10/10 + Playwright + deploy + docs. *(blocked by #108–#112)*

## Commit Plan
- After #108 — `perf(landing): preload LCP poster + defer hero/Lenis hydration`
- After #109 — `perf(landing): defer + throttle hero frame loading`
- After #111 — `perf(landing): drop framer-motion (vanilla scroll/CSS reveals)`
- After #112 — `perf(landing): subset fonts + AVIF images`
- After #113 — `chore(landing): measure + ship perf pass`

## Notes / optional stretch
- **Drop React entirely** (rewrite remaining islands — DecksShelf/PostalRoute/TelegramCTA/hero — as vanilla TS) would save the 57KB gz React runtime. Large refactor, separate decision — NOT in this plan unless requested.
- Keep `prefers-reduced-motion` + mobile guards through every rewrite.
- Pending tiny change to commit first: mobile hero `padding-top: 10vh` (text raise).

## Risks
- Removing framer touches the hero scrub/parallax — verify scrub + reveals still work (Playwright) after #110/#111.
- Font subsetting must keep all glyphs used in RU + EN copy.
