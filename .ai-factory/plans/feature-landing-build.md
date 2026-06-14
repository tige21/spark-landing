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

---

## Phase 5 — Scroll "wow" pass (2026-06-14)

**Goal:** current reveals are flat fade-up — add depth + scroll-driven motion for a premium "wow", staying on-brand and fast. **Scope (user):** full set + 3D scroll coupling. **Verify:** visual + smoke (add reduced-motion). Logging minimal, no docs.

**Design (cohesive, on-brand):**
- **Layered parallax depth** — engravings drift behind sections at different speeds (back/mid/front).
- **Stamp-press reveals** — headings & deck stamps press in like a wax stamp (scale 1.12 + slight rotate → settle) instead of plain fade.
- **Hero scroll dissolve** — content rises + fades, 3D camera pushes back / particles fade as you leave the hero (desktop).
- **Postal route draw** — engraved dashed route draws across "How it works" via SVG `pathLength` ← `scrollYProgress`.
- **Counter-parallax** — Order/Premium engravings move opposite to their copy.

**Tech (framer-motion 12, verified via context7):** `useScroll({target, offset})` + `useTransform` (transform-only) + optional `useSpring({skipInitialAnimation:true})` smoothing; SVG `pathLength`; `staggerChildren` variants; `useReducedMotion`. **Guards (mandatory):** every animation honors `prefers-reduced-motion` (→ static) and reduces magnitude on mobile (<760px); only `transform`/`opacity` animated; islands `client:visible`; three.js stays lazy/desktop-only.

### Tasks
- [x] **#52** Primitives: rework `ui/Parallax.tsx` (axis/distance/rotate/scale/spring + guards), add `ui/StampReveal.tsx`, stagger support, `lib/motion-guards.ts`.
- [x] **#53** `ui/SectionDecor.tsx` — layered parallax engravings behind What/Decks/Order/Premium/FinalCta. (blocked by #52)
- [x] **#54** Hero scroll coupling — content dissolve + 3D camera/particle reactivity (desktop). (blocked by #52)
- [x] **#55** How "postal route" draw-on-scroll (SVG pathLength) + sequential stamp-in steps. (blocked by #52)
- [x] **#56** Decks stamp-in stagger + crest scroll-rotate. (blocked by #52)
- [x] **#57** Order + Premium counter-parallax engravings + stamp-in headings. (blocked by #52)
- [x] **#58** FinalCta seal press-in + footer parallax + global reduced-motion/mobile magnitude pass. (blocked by #52)
- [x] **#59** Playwright visual QA at scroll points + update smoke (reduced-motion + no-overflow) + perf/Lighthouse + commit. (blocked by #53–#58)

### Commit Plan (phase 5)
- After #52 — `feat(landing): scroll animation primitives (parallax, stamp-reveal)`
- After #58 — `feat(landing): scroll-driven wow — layered parallax, hero dissolve, postal route`
- After #59 — `test(landing): reduced-motion smoke + scroll perf verify`

---

## Phase 6 — Performance pass (2026-06-14, prod live)

**Goal:** measure & improve load performance of https://sparkcards.space. **Scope (user):** keep React (no Preact); focus fonts/favicon/images. **Verify:** Lighthouse (≥90) + curl size-diff + smoke. Logging minimal, no docs.

### Measured baseline (curl, gzipped over the wire)
- HTML 41.5 KB gz, ~0.5s · hero poster webp **11 KB** · `/_astro` + `/fonts` cached `immutable 1y` ✓
- Eager JS **~62 KB gz** — 58 KB is the React runtime (`client.js`); 8 island chunks 0.5–1 KB each → **leave as-is (user kept React)**
- 🔴 Fonts **~517 KB raw TTF** (Lora 131+132+132, Tangerine 59+63); **263 KB preloaded** (Lora-Bold+Regular) — LCP contention
- 🔴 favicon.png **112 KB** (256px) · 🟡 og.png 178 KB (social only)

### Bottlenecks → fixes
1. **Fonts** (biggest): TTF → subsetted **woff2** (Latin+Cyrillic+punctuation), woff2-only `@font-face`, preload only Lora-Bold. Expect ~517 KB → ~120-180 KB + faster LCP text.
2. **favicon** 112 KB → 48px + apple-touch-icon 180px, pngquant → few KB.
3. **og.png** 178 KB → pngquant ~60-90 KB (off critical path).
4. **JS** — React kept by decision; islands already `client:visible`, runtime unavoidable. No change.
5. Caching/HTML/on-page images already good — no change.

### Lighthouse baseline (prod, 2026-06-14, local LH via system Chrome)
- **Mobile:** Perf **81**, A11y **86**, BP 100, SEO 100 · LCP **4.4s** 🔴, FCP 2.1s, SI 4.5s, TBT 0, CLS 0 · total 843 KiB
- **Desktop:** Perf **99** · LCP 0.9s, total 1060 KiB — already great
- Root cause of mobile LCP/bytes = fonts (517 KB TTF). A11y issues: color-contrast (`.lang`, `.legal`) + list semantics (How `<ol>`→island div→`<li>`).

### Result (after, deployed to prod 2026-06-14)
- **Mobile:** Perf **81→99**, A11y **86→100**, BP 100, SEO 100 · LCP **4.4s→1.7s**, FCP 2.1→1.4s, SI 4.5→2.6s · total **843→405 KiB**
- Fonts 517 KB TTF → **124 KB woff2** subset; favicon 112 KB → **5 KB**; old .ttf removed (404). Desktop already 99. Smoke 10/10.

### Tasks
- [x] **#60** Lighthouse baseline (mobile+desktop) on prod — recorded above.
- [x] **#61** Fonts → woff2 + Latin/Cyrillic subset (pyftsubset+brotli) + woff2 `@font-face` + preload tuning + drop .ttf. (blocked by #60)
- [x] **#62** Optimize favicon (48px) + apple-touch-icon (180px) + og.png. (blocked by #60)
- [x] **#64** A11y: contrast (`--meta-strong` for `.lang`/`.legal`) + valid How list semantics (`<li>` direct child of `<ol>`). (blocked by #60)
- [x] **#63** Build + deploy to prod + Lighthouse-after vs baseline + curl size-diff + smoke. (blocked by #61, #62, #64)

### Commit Plan (phase 6)
- After #62 — `perf(landing): woff2 subset fonts + optimized favicon/og`
- After #63 — `chore(landing): deploy perf pass + verify`

---

## Phase 7 — Cinematic "living engraving" hero (2026-06-14)

**Goal:** bring the Kyle-Skelly/Seedance "insane website" trick into OUR identity — a hero with a perspective engraved grid (depth) + a subtly **animated engraving video** composited via `mix-blend-mode: multiply`, word-by-word headline, all on the Postcard/Letterpress palette. **No three.js** (removed). **Scope (user):** 1 hero centerpiece asset · grid OVER current celestial bg · visual + smoke. Logging minimal, no docs.

**Source technique (from video F2OpUJsf68g, Kyle Skelly):** perspective grid + radial vignette; AI-generated character **stills → Seedance image→video** (static camera, subtle motion); pseudo-transparency via `mix-blend-mode: darken`; ffmpeg compress; word-by-word H1 + grid grow-in; deploy Cloudflare. **Our adaptation:** engravings instead of Pixar; `mix-blend-mode: **multiply**` (dark ink on cream); deploy to existing RU nginx.

**Asset dependency:** user generates the hero asset on **Higgs Field** (Nano Banana still → Seedance 2.0 video) from prompts in #65; we process (ffmpeg) + embed.

**Guards (mandatory):** video lazy (preload=none, play on visible/idle), `prefers-reduced-motion` → poster only (no video fetch), mobile → poster/light encode, pause offscreen; LCP stays the static poster; postcardTokens only.

### Tasks
- [x] **#65** Asset spec + exact Higgs Field prompts (Nano Banana still on CREAM bg + Seedance video, static camera) → `HERO_VIDEO_PROMPTS.md`; user generates in parallel.
- [x] **#66** `HeroGrid.astro` — SVG perspective grid + radial vignette mask over celestial + grow-in (reduced-motion safe).
- [x] **#67** `HeroVideo` — lazy `<video>` (autoplay/muted/loop/playsinline) + poster + `mix-blend-mode:multiply` + reduced-motion/mobile/offscreen guards (placeholder until asset).
- [x] **#68** `WordReveal.tsx` (staggerChildren) on H1 + assemble hero layering. (blocked by #66, #67)
- [ ] **#69** ffmpeg-process the Seedance MP4 (h264+webm, <1MB, poster) + wire real video. (blocked by #65 asset, #67)
- [ ] **#70** Playwright visual + reduced-motion + perf (Lighthouse ≥90, LCP=poster) + smoke + deploy to RU VPS. (blocked by #68, #69)

### Commit Plan (phase 7)
- After #68 — `feat(landing): living-engraving hero — perspective grid, video centerpiece, word reveal`
- After #70 — `feat(landing): wire Seedance hero video + deploy`
