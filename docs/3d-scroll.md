# 3D scroll system

Apple-style scroll-driven 3D for the landing, in the Postcard/Letterpress identity.
No three.js — pure CSS 3D (`perspective` + `translateZ`) + framer-motion scroll +
Lenis smooth-scroll + an optional `<canvas>` frame-scrub for the hero.

## Building blocks

| File | Role |
|------|------|
| `src/lib/smooth-scroll.ts` + `src/components/ui/SmoothScroll.tsx` | Lenis inertial scroll. Mounted once in `Layout.astro` (`client:load`). **Off** under reduced-motion / small. |
| `src/lib/use-scroll-scene.ts` | `useScrollScene()` → `{ ref, progress (0..1), factor, isStatic }`. Attach `ref` to a scene container, feed `progress` to Layers. |
| `src/components/ui/Scene3D.tsx` | `perspective` + `preserve-3d` container — establishes the 3D space. |
| `src/components/ui/Layer.tsx` | A depth plane: static `translateZ` (`depth`), scroll dolly (`zRange`), parallax `y`/`x`, `scale`, `opacity`, `rotateX`. Driven by the scene `progress`. |
| `src/components/ui/TiltIn.tsx` | Section perspective-entrance ("postcard laid onto the table"); wired into every `Section.astro` (opt out with `flat`). |
| `src/components/ui/SealPress.tsx` | Wax-seal 3D press beat (used by the last How step). |
| `src/components/ui/Parallax.tsx` | Pre-existing 2.5D parallax (decor crests via `SectionDecor`). |
| `src/components/hero/HeroScroll.tsx` (+ `.css`) | Full-bleed **pinned** scroll-scrub hero: a card-creation engraving sequence plays as the background while you scroll ~2 viewports; headline fades out over the second half; foreground sparks add depth. Works on mobile. Falls back to a normal 100vh poster hero under reduced-motion / no sequence. |
| `src/components/hero/CanvasSequence.tsx` | Scroll-scrubbed `<canvas>` frame player. `fit="cover"` for full-bleed; picks the desktop (`hero`) or mobile (`hero-mobile`) sequence by screen size; **enabled on mobile** (only reduced-motion / missing sequence → poster). Smoothness: frames pre-decoded to **ImageBitmap** (resize-capped to bound memory), a **single rAF loop eases** a displayed index toward the scroll target and draws only on frame change (snaps to endpoints, parks when idle). |

## Motion guards (a11y + perf)

`src/lib/motion-guards.ts` → `useMotionPrefs()` returns `{ reduced, small, factor }` via
**matchMedia** (not framer's `useReducedMotion`, which was inconsistent across Astro islands).

- `factor === 0` (reduced-motion) → every motion component renders a **flat static** fallback; Lenis is disabled; the canvas is not fetched.
- `factor === 0.5` (small screens ≤760px) → gentler parallax; Lenis off; canvas off (poster only).
- `factor === 1` (desktop) → full effect.

Only GPU-composited props (`transform`, `opacity`) are animated; debug `console` is `import.meta.env.DEV`-gated (never ships).

## Adding the hero scroll-scrub animation

The hero is a static 100vh poster (`bg-celestial`) until frame sequences exist. Two
sources cover every device (see `.ai-factory/HERO_3D_PROMPTS.md`): desktop 16:9 +
mobile vertical.

```bash
scripts/extract-frames.sh <desktop-video> hero        1280 24
scripts/extract-frames.sh <mobile-video>  hero-mobile 760  24
```

→ writes `public/hero-frames/hero/…` and `…/hero-mobile/…` (WebP via cwebp, since this
ffmpeg lacks libwebp) + `manifest.json` each. `Hero.astro` detects each manifest at
build time and enables it; the hero then becomes a pinned ~2× scroll-scrub. Keep
desktop **< ~1.5 MB**, mobile **< ~900 KB** for the RU budget. `public/hero-frames/`
is gitignored (built into `dist` locally on deploy).

## See also
- `.ai-factory/HERO_3D_PROMPTS.md` — asset spec & prompt
- `.ai-factory/plans/landing-3d-scroll.md` — the implementation plan
