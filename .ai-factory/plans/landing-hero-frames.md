# Plan: Wire storyboard frames into the scroll-scrub hero

**Branch:** feature/landing-build (stay on it; no branch off main)
**Created:** 2026-06-15
**Mode:** full
**Implement with:** `/aif-implement @.ai-factory/plans/landing-hero-frames.md`

## Settings
- Testing: no new tests (existing smoke must stay 10/10; visual verification via Playwright)
- Logging: standard (DEBUG-gated console already in CanvasSequence; processing scripts echo sizes)
- Docs: yes — docs checkpoint at completion

## Goal
Turn the ready storyboard frames into the **pinned scroll-scrub hero** (desktop + mobile),
using the engine already built (HeroScroll + CanvasSequence). No logo overlay needed — the
frames already carry our logo on the card (the Kling clip was built from our hero-end stills).

## Source asset
`~/Downloads/ezgif-84c14d3f9a71c5a2-jpg/` — **271 frames, 1528×1356** (~square),
`ezgif-frame-NNN.jpg`. Arc: blank card placed on press → card printed (our logo) → finished
card lifted, front-facing.

## Decisions (locked with user)
- Branding: **none** — our logo is already on the frames.
- Mobile: **cover-crop the same roll** to vertical (separate lighter `hero-mobile` set).
- 271 frames is heavy → **subsample + resize + cwebp** to hit RU budget (engravings compress
  poorly; tune empirically). ffmpeg here lacks libwebp → use **cwebp**.

## Tasks

### Phase 1 — Process frames
- [x] #93 Locked: desktop every-5th @960w q52; mobile every-8th 9:16-crop @600w q40.
- [x] #94 Desktop `hero/` — 55 frames, 2.1MB + poster hero-poster.webp.
- [x] #95 Mobile `hero-mobile/` — 34 frames (9:16, 600×1067), 1.1MB + poster hero-poster-mobile.webp.

### Phase 2 — Wire + ship
- [x] #96 Hero.astro posters wired; verified scrub desktop (3 distinct frame hashes) + mobile (vertical), no overflow, 0 console errors.
- [ ] #97 Build + smoke 10/10 + deploy + verify live + docs. *(blocked by #96)*

## Commit Plan
- After #95 — `feat(landing): hero scroll-scrub frame sequences (desktop + mobile)`
- After #97 — `feat(landing): wire scrub posters + ship`

## Risks
- **Payload vs smoothness:** 271 detailed frames won't all fit the budget — subsample (fewer frames = choppier but lighter). Log what was dropped; tune count/width/quality empirically.
- **Square→vertical mobile crop:** the press may crop on sides; keep the card/press centered.
- `public/hero-frames/` is gitignored (built into dist locally on deploy).
