import { useEffect, useMemo, useRef, useState } from 'react';
import { useScrollScene } from '../../lib/use-scroll-scene';
import { useMotionPrefs } from '../../lib/motion-guards';
import type { ScrollValue } from '../../lib/scroll-progress';
import CanvasSequence from '../hero/CanvasSequence';
import Scene3D from '../ui/Scene3D';
import Layer from '../ui/Layer';
import './ThroughPhone.css';

export interface PhoneSegment {
  id: string;
  side: 'right' | 'left';
  scenario: string;
  eyebrow: string;
  headline: string;
  body: string;
  poster: string;
  imageSrc?: string;
  hasFrames: boolean;
}

interface ThroughPhoneProps {
  eyebrow: string;
  segments: PhoneSegment[];
  sparkSrc: string;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x); };

// A derived ScrollValue exposing one segment's LOCAL progress (0..1 within its
// slice) on top of the section's main progress. CanvasSequence only reads
// `get()` + `on('change')`, so this thin adapter lets each segment reuse it
// unchanged. Memoised per (main, i, n) so CanvasSequence's effect stays stable.
function useSegmentProgress(main: ScrollValue, i: number, n: number): ScrollValue {
  return useMemo<ScrollValue>(() => {
    const compute = () => clamp01(main.get() * n - i);
    return {
      get: compute,
      on: (_evt: 'change', cb: (v: number) => void) => main.on('change', () => cb(compute())),
      attach: () => {},
      destroy: () => {},
    } as unknown as ScrollValue;
  }, [main, i, n]);
}

// Through-phone scrollytelling: ONE pinned iPhone travels across N segments,
// alternating sides while each segment's app scenario scrubs on its screen and
// the matching copy slides in from the opposite side. Reuses the hero's
// CanvasSequence (frames) + Scene3D/Layer (parallax). Reduced-motion / missing
// frames / SSR → a plain stacked fallback (poster + copy per segment, no pin).
export default function ThroughPhone({ eyebrow, segments, sparkSrc }: ThroughPhoneProps) {
  const n = segments.length;
  const { ref, progress } = useScrollScene(['start start', 'end end']);
  const { reduced, small } = useMotionPrefs();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allFrames = segments.every((s) => s.hasFrames);
  const pinned = mounted && !reduced && allFrames;
  const scrubSeg = small ? 0.9 : 1.05;

  const phoneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Build derived per-segment progress values (hooks must run unconditionally).
  const seg0 = useSegmentProgress(progress, 0, n);
  const seg1 = useSegmentProgress(progress, 1, n);
  const seg2 = useSegmentProgress(progress, 2, n);
  const seg3 = useSegmentProgress(progress, 3, n);
  const derived = [seg0, seg1, seg2, seg3].slice(0, n);

  // Imperative scroll driver: positions the phone (side slide), and fades/slides
  // each panel + crossfades each canvas by how close we are to its segment centre.
  // Mutating styles directly (no React state) keeps scrolling jank-free.
  useEffect(() => {
    if (!pinned) {
      if (phoneRef.current) phoneRef.current.style.transform = '';
      panelRefs.current.forEach((p) => { if (p) { p.style.opacity = ''; p.style.transform = ''; } });
      canvasRefs.current.forEach((c, i) => { if (c) { c.style.opacity = i === 0 ? '1' : '0'; } });
      return;
    }

    const sideOf = (i: number) => (segments[i].side === 'right' ? 1 : -1);

    const apply = (pv: number) => {
      const p = clamp01(pv);
      const f = p * n; // 0..n
      // ---- phone position (JS owns the full transform incl. centring) ----
      if (phoneRef.current) {
        if (small) {
          phoneRef.current.style.transform = 'translateX(-50%)';
        } else {
          const sc = f - 0.5; // segment-centre space (centres at integers)
          const i0 = Math.max(0, Math.min(n - 1, Math.floor(sc)));
          const i1 = Math.max(0, Math.min(n - 1, i0 + 1));
          const frac = clamp01(sc - i0);
          // hold near a side through the segment, slide across the boundary window
          const t = smooth((frac - 0.3) / 0.4);
          const sideX = sideOf(i0) * (1 - t) + sideOf(i1) * t;
          // Slide distance is measured from the CONTAINER (track), not the
          // viewport, so the phone stays within the site grid on any width.
          const trackW = trackRef.current?.clientWidth ?? 1100;
          const d = Math.min(trackW * 0.25, 340);
          phoneRef.current.style.transform = `translate(calc(-50% + ${sideX * d}px), -50%)`;
        }
      }
      // ---- per-segment panels + canvases ----
      for (let i = 0; i < n; i++) {
        const activeness = clamp01(1 - Math.abs(f - (i + 0.5)));
        const panel = panelRefs.current[i];
        if (panel) {
          const o = clamp01((activeness - 0.25) / 0.55);
          panel.style.opacity = String(o);
          if (small) {
            panel.style.transform = `translate(-50%, ${(1 - o) * 18}px)`;
          } else {
            const dir = segments[i].side === 'right' ? -1 : 1; // panel sits opposite the phone
            panel.style.transform = `translate(${(1 - o) * dir * 26}px, -50%)`;
          }
          panel.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
        }
        const cv = canvasRefs.current[i];
        if (cv) {
          cv.style.opacity = String(clamp01(activeness * 1.15));
          cv.style.zIndex = String(Math.round(activeness * 10));
        }
      }
    };

    apply(progress.get());
    return progress.on('change', apply);
  }, [pinned, small, progress, n, segments, ref]);

  const sectionStyle = pinned
    ? { height: `${(1 + n * scrubSeg) * 100}svh` }
    : { minHeight: 'auto' };
  const stageStyle = pinned
    ? ({ position: 'sticky', top: 0, height: '100svh' } as const)
    : ({ position: 'relative' } as const);

  return (
    <section ref={ref} className="through-phone" style={sectionStyle} data-pinned={pinned}>
      <div className="tp-stage" style={stageStyle}>
        {!reduced && (
          <Scene3D perspective={1100} className="tp-sparks" aria-hidden="true">
            <Layer progress={progress} depth={120} y={90} x={-24} scale={[0.9, 1.15]} style={{ position: 'absolute', top: '12%', left: '7%' }}>
              <img src={sparkSrc} alt="" style={{ width: 'clamp(32px, 4vw, 60px)', opacity: 0.45 }} />
            </Layer>
            <Layer progress={progress} depth={90} y={70} x={28} scale={[0.85, 1.1]} style={{ position: 'absolute', bottom: '16%', right: '9%' }}>
              <img src={sparkSrc} alt="" style={{ width: 'clamp(26px, 3vw, 48px)', opacity: 0.35 }} />
            </Layer>
          </Scene3D>
        )}

        <p className="eyebrow tp-eyebrow">{eyebrow}</p>

        <div className="tp-track" ref={trackRef}>
          {segments.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => { panelRefs.current[i] = el; }}
              className={`tp-panel tp-panel--${s.side === 'right' ? 'left' : 'right'}`}
            >
              <p className="eyebrow tp-step">{s.eyebrow}</p>
              <h2 className="t-h2 tp-headline">{s.headline}</h2>
              <p className="t-lead tp-body">{s.body}</p>
              {s.imageSrc && <img className="tp-panel-img" src={s.imageSrc} alt="" loading="lazy" />}
            </div>
          ))}

          <div ref={phoneRef} className="tp-phone">
            <div className="tp-screen">
              <div className="tp-statusband" aria-hidden="true">
                <span className="tp-island" />
              </div>
              <div className="tp-canvas-area">
                {segments.map((s, i) => (
                  <div
                    key={s.id}
                    ref={(el) => { canvasRefs.current[i] = el; }}
                    className="tp-canvas"
                    style={{ opacity: i === 0 ? 1 : 0 }}
                  >
                    <CanvasSequence
                      progress={derived[i]}
                      poster={s.poster}
                      name={s.scenario}
                      nameMobile={s.scenario}
                      enabled={s.hasFrames}
                      enabledMobile={s.hasFrames}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
