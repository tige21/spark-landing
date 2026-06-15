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
| `src/components/hero/HeroScene.tsx` | The hero diorama: layered engravings (bg → grid floor → press centerpiece → sparks) in one `Scene3D`, camera dolly on scroll. |
| `src/components/hero/CanvasSequence.tsx` | Scroll-scrubbed `<canvas>` frame player for the hero centerpiece. |

## Motion guards (a11y + perf)

`src/lib/motion-guards.ts` → `useMotionPrefs()` returns `{ reduced, small, factor }` via
**matchMedia** (not framer's `useReducedMotion`, which was inconsistent across Astro islands).

- `factor === 0` (reduced-motion) → every motion component renders a **flat static** fallback; Lenis is disabled; the canvas is not fetched.
- `factor === 0.5` (small screens ≤760px) → gentler parallax; Lenis off; canvas off (poster only).
- `factor === 1` (desktop) → full effect.

Only GPU-composited props (`transform`, `opacity`) are animated; debug `console` is `import.meta.env.DEV`-gated (never ships).

## Adding the hero scroll-scrub animation

The hero centerpiece shows the static `phase-print` poster until a frame sequence exists.

1. Produce a new engraving animation per `.ai-factory/HERO_3D_PROMPTS.md` (do **not** reuse old assets).
2. Run: `scripts/extract-frames.sh <source-video> hero 1100 24`
   → writes `public/hero-frames/hero/0001.webp …` + `manifest.json`.
3. Rebuild. `Hero.astro` detects the manifest at build time (`hasFrames`) and enables scrubbing automatically. Keep the sequence **< ~1.5 MB** for the RU load budget.

## See also
- `.ai-factory/HERO_3D_PROMPTS.md` — asset spec & prompt
- `.ai-factory/plans/landing-3d-scroll.md` — the implementation plan
