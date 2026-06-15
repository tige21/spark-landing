# Hero 3D scroll asset — spec & prompt

The hero centerpiece is a **scroll-scrubbed frame sequence** (Apple-style): the
user scrolls and the engraving animation plays forward/back, drawn frame-by-frame
to a `<canvas>` (`CanvasSequence.tsx`). This file is the spec for generating the
**new** source animation (we do NOT reuse the old Kling video) and the pipeline
to turn it into web frames.

## What to generate

A short, **seamless, loopable** animation of a 19th-century **letterpress / printing
press** in the spark engraving identity — "Печатня Искра" printing a card. The motion
should read as a slow **camera push toward the press** (dolly-in) so scroll feels like
travelling into the scene.

- **Style:** dense copperplate/steel engraving, sepia ink `#2C2620` + wine accent
  `#7E3B4E`, on **solid cream `#E4D7BE`** background (so it sits flush on the page;
  we bake/keep that bg — same trick as the static engravings).
- **Composition:** press centered, slight 3/4 angle; a printed card with a small
  engraved **spark/star emblem** emerging. No playing-card suits/pips.
- **Motion:** gentle, continuous; subtle dolly-in + a few moving parts (press arm,
  paper, ink sparks). ~4–6 s. Must **loop seamlessly** (start frame ≈ end frame) OR
  be ping-pong-able.
- **Hard NOs:** no text, no captions, no watermark/signature, no fire, no smoke,
  no real playing cards, no photoreal — engraving only.
- **Format:** 16:9, ≥1280px wide, mp4/mov (or PNG sequence).

## Generation

Higgs Field / Kling / Seedance (image→video) from a Nano Banana still that matches the
identity, or a Blender render with a toon/engraving pass. Deliver the file into
`~/Downloads` (or anywhere) and run the pipeline below.

## Pipeline → web frames

```bash
scripts/extract-frames.sh <source-video> hero 1100 24
```

- Writes `public/hero-frames/hero/0001.webp …` + `public/hero-frames/hero/manifest.json`.
- `manifest.json` shape: `{ "name", "count", "width", "ext": "webp", "pad": 4 }`.
- `CanvasSequence.tsx` fetches the manifest, preloads/decodes frames, and scrubs them
  to scroll progress. Until a manifest exists, the hero shows the static poster
  (`phase-print` engraving) — no canvas, no errors.

### Tuning targets
- **120–180 frames** total (more = smoother scrub, heavier payload). 24fps × ~5s ≈ 120.
- Keep each WebP small; total sequence ideally **< 1.5 MB** for the RU load budget.
- If too heavy: lower `width` (e.g. 900) or `fps` (e.g. 18), or shorten the clip.
