# Plan: Landing 3D scroll experience (Apple-style, Postcard/Letterpress identity)

**Branch:** feature/landing-build (stay on it — landing always ships from here; no branch off main)
**Created:** 2026-06-15
**Mode:** full
**Implement with:** `/aif-implement @.ai-factory/plans/landing-3d-scroll.md`

## Settings
- Testing: **no new tests** (visual verification via Playwright screenshots; existing smoke must keep passing)
- Logging: standard — DEBUG-gated `console` for scroll progress / canvas frame index during dev, removable; no prod console
- Docs: **yes** — mandatory docs checkpoint at completion

## Goal
Replace the (removed) background hero video with **real scroll-driven 3D effects** in the spark identity, across the whole page — Apple/award-site feel without reintroducing three.js.

## Locked decisions
- **Technique = Tier 2:** CSS 3D diorama (`perspective` + `transform-style: preserve-3d` + `translateZ`/`rotateX`) + pinned scenes + multi-layer parallax (framer-motion `useScroll`/`useTransform`/`useSpring`) **+ canvas frame-scrubbing** for the hero. **No three.js/WebGL.**
- **Scope = whole page:** hero diorama + 3D in all sections.
- **Smooth-scroll = Lenis**, synced to scroll animations, **hard-guarded**: fully off under `prefers-reduced-motion` and on mobile/small (reuse `useMotionPrefs {reduced, small, factor}`); reduced-motion shows a static composition.
- **Hero asset = NEW, user-provided** (do NOT reuse the old Kling video). I write a spec/prompt; user generates; pipeline turns it into the scrub sequence.

## Stack & constraints
- Astro 6 static + React islands + framer-motion v12 (`lenis` to be added). Prod nginx on RU VPS, deploy `npm run deploy`.
- Build on existing primitives: `ui/Parallax.tsx` (guarded scroll-parallax with spring + `factor===0` static fallback), `Reveal.tsx`, `StampReveal.tsx`, `WordReveal.tsx`, `HeroContentMotion.tsx`, `PostalRoute.tsx`, `DecksShelf.tsx`, `HeroGrid.astro`, `lib/motion-guards.ts`.
- Perf: GPU-only props (transform/opacity), rAF throttle, lazy+preload canvas frames with poster, reserve aspect-ratio (CLS), dpr cap. Keep Lighthouse mobile ~99. Verify `use context7` for current framer-motion scroll / Lenis / canvas APIs during implementation.

## Tasks

### Phase 0 — Foundation
- [x] #76 Add Lenis smooth-scroll (guarded) — `lenis` dep, `lib/smooth-scroll.ts` + SmoothScroll island in base layout; reduced/small → native scroll.
- [x] #77 Build 3D scene primitives — `Scene3D.tsx` (perspective/preserve-3d), `Layer.tsx` (translateZ depth, extends Parallax), `lib/use-scroll-scene.ts` (pin + 0..1 progress). *(blocked by #76)*

### Phase 1 — Hero diorama + canvas scrubbing
- [x] #78 Hero asset spec + frame pipeline — `.ai-factory/HERO_3D_PROMPTS.md` (prompt for NEW engraving animation) + `scripts/extract-frames.sh` (ffmpeg → WebP frames + manifest). *(user supplies new source)*
- [x] #79 CanvasSequence scrub component — `hero/CanvasSequence.tsx`, scroll-scrubbed canvas, preload/decode, poster fallback, reduced/small → static. *(blocked by #77; real frames from #78)*
- [x] #80 Hero 3D diorama composition — pinned layered planes (celestial + HeroGrid floor → mid scene/canvas → foreground filigree/sparks/dove), camera push on scroll, keep WordReveal/CTA; replace current static hero. *(blocked by #79)*

### Phase 2 — Page-wide 3D
- [x] #81 Section perspective-entrance primitive — postcard tilt (rotateX/Y + translateZ + opacity) on scroll-in, wired into Section.astro. *(blocked by #77)*
- [x] #82 Decks 3D fan-out in perspective. *(blocked by #81)*
- [x] #83 How: parallax depth + stamps travel along PostalRoute. *(blocked by #81)*
- [x] #84 Wax-seal press 3D beat. *(blocked by #81)*
- [x] #85 Depth for remaining sections — delivered by global TiltIn entrance + existing SectionDecor parallax. *(blocked by #81)*

### Phase 3 — Perf / a11y / ship
- [x] #86 Perf + a11y guard pass — reduced/small fully static, rAF throttle, will-change hygiene, lazy+preload frames, CLS/aspect-ratio, dpr cap, no prod console. *(blocked by #80,#82,#83,#84,#85)*
- [ ] #87 Build, verify (Playwright desktop+mobile + existing smoke 10/10 + Lighthouse ~99), deploy, verify live; docs checkpoint. *(blocked by #86)*

## Commit Plan
- After #77 — `feat(landing): smooth-scroll + 3D scene primitives`
- After #80 — `feat(landing): 3D scroll hero diorama with canvas scrubbing`
- After #85 — `feat(landing): page-wide 3D scroll depth`
- After #87 — `perf(landing): guard + ship 3D scroll experience`

## Key risks
- **Asset dependency:** canvas scrubbing needs the user's new frame sequence; hero can ship with diorama + poster first, scrubbing wired when the asset lands.
- **Perf/jank on mobile:** mitigated by hard reduced/small guards (effects off) + GPU-only transforms + rAF throttle.
- **Lenis vs accessibility/native scroll:** off under reduced-motion; keep anchor links + keyboard scroll working.
- **CLS from canvas/diorama:** reserve aspect-ratio.
