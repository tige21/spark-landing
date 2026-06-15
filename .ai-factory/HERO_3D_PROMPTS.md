# Hero scroll-scrub asset — spec & pipeline

The hero is a **full-screen pinned scroll-scrub background**: as the visitor scrolls
~2 viewports, an engraving animation plays frame-by-frame on a `<canvas>` behind the
headline (which fades out to reveal the cinematic frame). Works on desktop **and
mobile**. This file specs the source animation and the pipeline.

Until a frame sequence exists, the hero is a normal 100vh screen with a static poster
(`bg-celestial`) — no pin, no scrub. Drop the asset → run the script → rebuild → it goes live.

## What to generate — "how the cards are created"

A beautiful, **seamless/loopable** sequence that shows cards being made in the
"Печатня Искра" world, engraving identity:

- Idea: ink/press → a card takes shape → the spark/star emblem strikes → the finished
  card. A slow **camera move** (push/pan) so scroll feels like travelling through it.
- **Style:** dense copperplate/steel engraving; sepia ink `#2C2620` + wine `#7E3B4E`;
  on **solid cream `#E4D7BE`** (fills the screen seamlessly — same paper as the page).
- **Hard NOs:** no text/captions, no watermark/signature, no fire/smoke, no real
  playing-card suits/pips, no photoreal.
- Calm, continuous motion, ~4–6 s, seamless start↔end.

## Two sources (cover the full screen on every device)

You picked **separate cuts** so nothing important is cropped:

1. **Desktop — 16:9 landscape**, ≥1280px wide.
2. **Mobile — vertical** (9:16 or 4:5), composition centered/safe for tall phones.

Both are background (`object-fit: cover`), so edges may crop slightly — keep the focal
action central.

## Pipeline → web frames

```bash
# desktop
scripts/extract-frames.sh <desktop-video> hero 1280 24
# mobile (vertical)
scripts/extract-frames.sh <mobile-video> hero-mobile 760 24
```

- Writes `public/hero-frames/hero/0001.webp …` + `manifest.json`, and the same under
  `hero-mobile/`. (ffmpeg → PNG → cwebp, since this ffmpeg lacks libwebp.)
- `CanvasSequence` auto-selects `hero` on desktop and `hero-mobile` on ≤760px, fetches
  the manifest, preloads/decodes, and scrubs to scroll. `Hero.astro` detects each
  manifest at build time and enables it.

### Tuning targets
- **Desktop:** ~120 frames, total **< ~1.5 MB**.
- **Mobile:** ~80–90 frames at width 760, total **< ~900 KB** (RU mobile budget).
- Too heavy → lower width / fps, or shorten the clip. Frame count = `fps × seconds`.

## See also
- `docs/3d-scroll.md` — system architecture & guards
- `.ai-factory/plans/landing-3d-scroll.md` — implementation plan
