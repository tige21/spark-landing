# Spark Cards — Landing Build (from existing assets)

**Repo:** `spark-landing` (standalone) · **Branch:** `feature/landing-build` (from `main`)
**Created:** 2026-06-14
**Stack:** Astro 6 + React 19 islands · RU + EN i18n · framer-motion (Motion) + three.js / react-three-fiber
**Goal:** Ship a premium, **very fast** one-page landing that reuses the app's exact Postcard/Letterpress identity (postcardTokens + Lora/Tangerine), built entirely from the **27 engravings already in the repo** — no waiting for Kling video or new stills. A max-wow 3D hero, tasteful framer-motion scroll reveals, and a **Telegram bot as the primary CTA**.

## Decisions (from user, 2026-06-14)
- **Primary CTA = Telegram bot.** Big wax-seal button "Открыть в Telegram" / "Open in Telegram". Store badges removed/hidden. Bot URL: `https://t.me/SparkCards_TestingBot` (handle `@SparkCards_TestingBot`).
- **3D = maximum wow** (full WebGL hero scene) — but architected to stay fast (see Performance Contract).
- **Tests = minimal** — Playwright visual smoke + Lighthouse. No unit tests.
- **No video, no new image generation** in this plan. Build from what exists.

## Settings
- Testing: minimal (visual smoke + Lighthouse)
- Logging: minimal
- Docs: short deploy one-pager only

## Roadmap Linkage
- Milestone: "none" — marketing surface, outside the app roadmap.

---

## Visual identity (already in `src/styles/tokens.css`)
- Palette: paper `#FBF7EF`, table/bg `#E4D7BE`, ink `#2C2620`, hairline `#E0D6C4`, meta `#9A8C78`, gold `#E7C200`, wine `#7E3B4E`; intensity inks + stamp inks present as CSS vars.
- Fonts: **Lora** (serif, self-hosted, has Cyrillic) + **Tangerine** (script). `.eyebrow` (uppercase, letter-spaced) and `.script` helpers exist.
- Spacing/radius/shadow tokens + reduced-motion media query already defined. **Extend, never hardcode.**

## Assets on hand (32 files in `src/assets/engravings/`)
- Backgrounds: `bg-celestial`, `bg-decks`, `bg-post`, `hero-master` (panorama), `hero-printer-start/end`, `kling-start-left/end-right`.
- Marks/objects: `seal`, `seal-approved`, `postmark`, `parcel`, `paywall-crest`, `empty-mailbox`, `colophon`, `spark-mark`, `age-emblem`.
- Onboarding: `onb-postoffice`, `onb-cards`, `onb-talk`. Phases: `phase-brief`, `phase-print`, `phase-critic`.
- 9 deck stamps (SVG): `stamp-couples-v2`, `stamp-classic`, `stamp-icebreaker`, `stamp-spicy`, `stamp-family`, `stamp-drinking`, `stamp-newyear`, `stamp-truth`, `stamp-dare`.

---

## Architecture

**Islands strategy (Astro partial hydration):**
- Page is static Astro by default (zero JS). React islands only where needed.
- `client:idle` — lightweight reveal/CTA islands.
- `client:visible` — section animations (hydrate on viewport entry).
- `client:only="react"` — the 3D hero Canvas (WebGL can't SSR), wrapped to lazy-mount.

**Animation:**
- framer-motion via `LazyMotion` + `m` + `domAnimation` (smaller bundle than full `motion`).
- Scroll-linked accents with `useScroll` + `useTransform`; reveals with `whileInView`.
- `useReducedMotion()` guard on every animated component → static fallback.

**3D Performance Contract (mandatory — reconciles "max wow" with "very fast"):**
1. `three` / `@react-three/fiber` / `drei` are **dynamically imported inside the hero island** — they must NOT appear in the initial/critical JS bundle.
2. The hero's **static engraving poster `<img>` is the LCP element** and renders instantly; the Canvas fades in once ready.
3. `<Canvas dpr={[1, 1.5]}>`, capped particle count, render **paused when offscreen** (IntersectionObserver) and on `document.hidden`.
4. Bail-out to poster-only when: `prefers-reduced-motion`, no WebGL, or small-screen/low-end device.

---

## Tasks (build phases)

### Phase 0 — Foundation
- [x] **#42** Deps (motion, three, @react-three/fiber, @react-three/drei) + `src/config/site.ts` (bot URL, app name, store placeholders) + token extensions (typography + animation scale) + Astro AVIF/WebP asset optimization + `Section.astro`/`Container.astro` primitives.

### Phase 1 — Shell & primitives (blocked by #42)
- [x] **#43** Global shell: nav (brand + anchors + lang switch + bot CTA), footer colophon, full SEO/OG + hreflang.
- [x] **#44** Motion primitives (`Reveal`, scroll/parallax helper) + `TelegramCTA` wax-seal button (the primary CTA).

### Phase 2 — Hero (3D)
- [x] **#45** 3D hero island (r3f) per Performance Contract — depth parallax + drifting spark particles + lamp flicker, poster fallback. (blocked by #42)
- [x] **#46** Hero section: content overlay (brand/tagline/eyebrow/scroll cue) + primary bot CTA; bot-centric copy. (blocked by #44, #45)

### Phase 3 — Content sections (blocked by #43, #44)
- [x] **#47** What-is-it (3 engraved pills) + How-it-works (4 steps, staggered reveal).
- [x] **#48** Decks shelf: 9 stamps on crest bg, hover/tap reveals name + sample question.
- [x] **#49** AI order (Печатня «Искра») + Premium/vibe + Final CTA (big bot wax-seal) + footer.

### Phase 4 — Parity & ship
- [x] **#50** EN parity — both pages render the same section components from ru/en json; lang switch + hreflang verified. (blocked by #46–#49)
- [x] **#51** Perf (Lighthouse ≥90, 3D lazy, AVIF, font preload, LCP=poster) + responsive + Playwright visual smoke + deploy one-pager. (blocked by #50)

## Commit Plan
- After #42 — `chore(landing): deps + tokens + asset pipeline`
- After #44 — `feat(landing): shell, motion primitives, telegram CTA`
- After #46 — `feat(landing): 3D hero`
- After #49 — `feat(landing): content sections (what/how/decks/order/premium/cta)`
- After #51 — `feat(landing): en parity + perf pass`
