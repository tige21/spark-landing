import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useScrollScene } from '../../lib/use-scroll-scene';
import { useMotionPrefs } from '../../lib/motion-guards';
import type { ScrollValue } from '../../lib/scroll-progress';
import CanvasSequence from '../hero/CanvasSequence';
import Scene3D from '../ui/Scene3D';
import Layer from '../ui/Layer';
import { DEBUG_SCROLL, getLenis } from '../../lib/smooth-scroll';
import './ThroughPhone.css';

export interface PhoneSegment {
  id: string;
  side: 'right' | 'left';
  scenario: string;
  scenarioMobile: string; // mobile-downscaled frame set name (falls back to scenario)
  eyebrow: string;
  headline: string;
  body: string;
  poster: string;
  posterMobile: string;
  imageSrc?: string;
  hasFrames: boolean;
  hasFramesMobile: boolean;
}

interface ThroughPhoneProps {
  eyebrow: string;
  segments: PhoneSegment[];
  sparkSrc: string;
}

// Layout effect on the client (positions the phone before first paint → no
// corner-flash), plain effect on the server (avoids the SSR useLayoutEffect warning).
const useIsoLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

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
  // Segment scroll length. The phase snap now supplies the "stop" cue, so we no
  // longer need an exaggerated dwell to make phases feel distinct — shorter
  // segments keep the snap travel (≤ half a segment) comfortable and let Decks
  // appear sooner, while each phase still fixes on release.
  const scrubSeg = small ? 0.72 : 0.88;

  const phoneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Only the active segment + the next one decode their frames at a time, so the
  // phone never holds all 3 scenarios' ImageBitmaps at once (memory blow-up on
  // mobile). `activeSegRef` throttles the state update to actual changes.
  const [activeSeg, setActiveSeg] = useState(0);
  const activeSegRef = useRef(0);

  // Autoplay trigger. `playNonce` bumps whenever the centred block changes (or
  // the section is (re)entered) so the active block's CanvasSequence (re)plays
  // its scenario. `playedForRef` tracks which block we last triggered.
  const [playNonce, setPlayNonce] = useState(0);
  const playedForRef = useRef(-1);
  // Once the user has reached any later block, the first-block "scroll on" cue
  // has done its job — keep it hidden so it never nags on revisit.
  const [advanced, setAdvanced] = useState(false);

  // Single source of truth for "move to phase i and rest there". Used by the
  // wheel-step (desktop), touch-step (mobile), and idle-snap. Drives the shared
  // Lenis instance on desktop (no inertia fight) or native smooth scroll on
  // mobile (Lenis is off there), and updates settledPhase + playNonce so the
  // copy/indicator/autoplay react to the new block.
  const goToPhase = useCallback(
    (target: number, opts: { duration?: number; lock?: boolean; onDone?: () => void } = {}) => {
      const el = ref.current;
      if (!el) { opts.onDone?.(); return; }
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      if (range <= 0) { opts.onDone?.(); return; }
      const t = Math.max(0, Math.min(n - 1, target));
      const ty = Math.round(top + range * ((t + 0.5) / n));
      const lenis = getLenis();
      const duration = opts.duration ?? 0.7;
      if (lenis) lenis.scrollTo(ty, { duration, lock: opts.lock ?? false, onComplete: opts.onDone });
      else { window.scrollTo({ top: ty, behavior: 'smooth' }); if (opts.onDone) window.setTimeout(opts.onDone, duration * 1000 + 80); }
      if (DEBUG_SCROLL) console.log('[through-phone] goToPhase', t, ty);
    },
    [n, ref]
  );

  // Scroll directly out of the section (past an end) so the forced stepping never
  // traps the user — used when a gesture pushes past the first/last block.
  const exitSection = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const ty = dir > 0 ? Math.round(top + range + window.innerHeight * 0.35) : Math.round(top - window.innerHeight * 0.35);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(ty, { duration: 0.5 });
    else window.scrollTo({ top: Math.max(0, ty), behavior: 'smooth' });
  }, [ref]);

  // Build derived per-segment progress values (hooks must run unconditionally).
  const seg0 = useSegmentProgress(progress, 0, n);
  const seg1 = useSegmentProgress(progress, 1, n);
  const seg2 = useSegmentProgress(progress, 2, n);
  const seg3 = useSegmentProgress(progress, 3, n);
  const derived = [seg0, seg1, seg2, seg3].slice(0, n);

  // Imperative scroll driver: positions the phone (side slide), and fades/slides
  // each panel + crossfades each canvas by how close we are to its segment centre.
  // Mutating styles directly (no React state) keeps scrolling jank-free. Runs as a
  // layout effect so the initial apply() positions the phone before first paint.
  useIsoLayoutEffect(() => {
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
      // ---- active segment (drives lazy frame decode); update only on change ----
      const a = Math.max(0, Math.min(n - 1, Math.round(f - 0.5)));
      if (a !== activeSegRef.current) {
        activeSegRef.current = a;
        setActiveSeg(a);
        if (DEBUG_SCROLL) console.log('[through-phone] active segment', a);
      }
      // ---- autoplay trigger: (re)play the centred block's scenario when the
      // section is engaged and the centred block changes (incl. first entry) ----
      const engaged = p > 0.01 && p < 0.99;
      if (engaged) {
        if (a !== playedForRef.current) { playedForRef.current = a; setPlayNonce((k) => k + 1); }
        if (a > 0) setAdvanced(true);
      } else {
        playedForRef.current = -1;
      }
      // ---- phone position (JS owns the full transform incl. centring) ----
      if (phoneRef.current) {
        if (small) {
          phoneRef.current.style.transform = 'translateX(-50%)';
        } else {
          const sc = f - 0.5; // segment-centre space (centres at integers)
          const i0 = Math.max(0, Math.min(n - 1, Math.floor(sc)));
          const i1 = Math.max(0, Math.min(n - 1, i0 + 1));
          const frac = clamp01(sc - i0);
          // Hold the phone at its side through the phase dwell, slide only in a
          // tight window at the boundary (clear per-phase rest).
          const t = smooth((frac - 0.34) / 0.32);
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
        const dist = Math.abs(f - (i + 0.5));
        // Triangle (overlaps at boundaries → canvas never blanks during crossfade).
        const activeTri = clamp01(1 - dist);
        // Trapezoid with a wide flat top → the phase's copy is fully shown across
        // a broad dwell band and only fades in the short boundary windows.
        const plateau = clamp01((0.5 - dist) / (0.5 - 0.34));
        const panel = panelRefs.current[i];
        if (panel && !small) {
          // Desktop: continuous fade + side-slide driven by the dwell plateau.
          // Mobile copy is discrete — driven by the `is-active` class + CSS
          // transition (see render + ThroughPhone.css), not inline styles here.
          const o = smooth(plateau);
          panel.style.opacity = String(o);
          const dir = segments[i].side === 'right' ? -1 : 1; // panel sits opposite the phone
          panel.style.transform = `translate(${(1 - o) * dir * 26}px, -50%)`;
          panel.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
        }
        const cv = canvasRefs.current[i];
        if (cv) {
          cv.style.opacity = String(clamp01(activeTri * 1.15));
          cv.style.zIndex = String(Math.round(activeTri * 10));
        }
      }
    };

    apply(progress.get());
    return progress.on('change', apply);
  }, [pinned, small, progress, n, segments, ref]);

  // ---- Phase snap: settle to the nearest phase centre on scroll-idle ----
  // The dwell plateau alone didn't read as discrete "stops" — a fast flick blew
  // through all three phases. When scrolling stops inside the pinned range we
  // ease the page to the active phase centre (f ∈ {0.5, 1.5, 2.5}) so each
  // logical block (Колоды/Игра/Своя колода) fixes itself. Desktop drives the
  // shared Lenis instance (no inertia fight); mobile (Lenis off) uses native
  // smooth scrollTo. Disabled under reduced-motion (pinned is false there).
  useEffect(() => {
    if (!pinned) return;
    const el = ref.current;
    if (!el) return;

    let idleTimer = 0;
    let guardUntil = 0; // ignore idle re-entry right after we initiate a snap

    const snapToNearest = () => {
      const now = performance.now();
      if (now < guardUntil) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      if (range <= 0) return;
      const y = window.scrollY;
      // Only inside the pinned range — leaving the block (to What above /
      // Decks below) must stay free.
      if (y < top - 1 || y > top + range + 1) return;
      const f = clamp01((y - top) / range) * n;
      const i = Math.max(0, Math.min(n - 1, Math.round(f - 0.5)));
      const target = Math.round(top + range * ((i + 0.5) / n));
      const delta = target - y;
      // Skip if already centred — only correct genuine off-centre rests
      // (scrollbar drag, keyboard); the wheel/touch steppers handle gestures.
      if (Math.abs(delta) <= 6) return;
      guardUntil = now + 720;
      goToPhase(i, { duration: 0.6 });
    };

    const onScroll = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = window.setTimeout(snapToNearest, 140);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', snapToNearest);
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', snapToNearest);
    };
  }, [pinned, n, ref, goToPhase]);

  // ---- Desktop wheel-stepping: ONE wheel gesture = ONE phase, then stop ----
  // Idle-snap alone let a single long wheel coast through all three phases
  // (Lenis keeps the scroll alive, so the idle never fires until the very end).
  // Inside the pinned section we take the wheel over (capture + stop, so Lenis
  // doesn't also scroll) and advance exactly one phase per gesture, locking the
  // page until that phase is reached. A short cooldown means a held/continuous
  // scroll steps phase-by-phase instead of blowing past. Free exit at the ends:
  // at the last phase scrolling down (or first phase scrolling up) we let go.
  // Wheel-only → mobile/touch keeps the idle-snap above; reduced-motion is off
  // (pinned is false). Native scroll-anchored fallbacks (keyboard, scrollbar)
  // still settle via the idle-snap.
  useEffect(() => {
    if (!pinned || small) return;
    const el = ref.current;
    if (!el) return;

    let cooldown = false;
    const onWheel = (e: WheelEvent) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      if (range <= 0) return;
      const y = window.scrollY;
      // Outside the pinned range → leave the wheel to Lenis (free page scroll).
      if (y < top - 2 || y > top + range + 2) return;
      const f = clamp01((y - top) / range) * n;
      const dir = e.deltaY > 0 ? 1 : -1;
      // Free exit at the section ends so the user is never trapped on the phone.
      if (dir > 0 && f >= n - 0.5 - 0.02) return;
      if (dir < 0 && f <= 0.5 + 0.02) return;
      // Take this gesture over: block native scroll AND Lenis (capture-phase
      // stopImmediatePropagation prevents Lenis's own wheel handler).
      e.preventDefault();
      e.stopImmediatePropagation();
      if (cooldown) return;
      const cur = Math.max(0, Math.min(n - 1, Math.round(f - 0.5)));
      const atCenter = Math.abs(f - (cur + 0.5)) <= 0.12;
      const target = Math.max(0, Math.min(n - 1, atCenter ? cur + dir : cur));
      cooldown = true;
      goToPhase(target, { duration: 0.7, lock: true, onDone: () => { cooldown = false; } });
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, { capture: true });
  }, [pinned, small, n, ref, goToPhase]);

  // ---- Mobile touch-stepping: ONE swipe = ONE block, momentum-proof ----
  // Mobile has no wheel and Lenis is off, so a native flick coasts (momentum)
  // through all blocks — and momentum fires AFTER touchend, so preventDefault on
  // touchmove can't catch it. Instead the pinned stage gets `touch-action: none`
  // (CSS; it only affects touches on the visible full-screen stage, i.e. exactly
  // while the section is engaged), so the browser NEVER scrolls/flings the page
  // from touches inside the section — we own movement entirely. Each
  // swipe advances exactly one block; at the ends an outward swipe scrolls
  // cleanly out (never trapped). Mobile only; reduced-motion is off (pinned false).
  useEffect(() => {
    if (!pinned || !small) return;
    const el = ref.current;
    if (!el) return;

    let startY = 0;
    let tracking = false;
    let cooldown = false;

    const metrics = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      const y = window.scrollY;
      return { top, range, y, inRange: range > 0 && y >= top - 2 && y <= top + range + 2 };
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
      tracking = metrics().inRange;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking || cooldown) { tracking = false; return; }
      tracking = false;
      const m = metrics();
      if (!m.inRange) return;
      const dy = (e.changedTouches[0]?.clientY ?? startY) - startY;
      const f = clamp01((m.y - m.top) / m.range) * n;
      const cur = Math.max(0, Math.min(n - 1, Math.round(f - 0.5)));
      if (Math.abs(dy) < 24) { goToPhase(cur, { duration: 0.35 }); return; } // too small → recentre
      const dir = dy < 0 ? 1 : -1; // swipe up → forward
      const target = cur + dir;
      if (target < 0 || target > n - 1) { exitSection(dir > 0 ? 1 : -1); return; }
      cooldown = true;
      goToPhase(target, { duration: 0.55, onDone: () => { cooldown = false; } });
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pinned, small, n, ref, goToPhase, exitSection]);

  const sectionStyle = pinned
    ? { height: `${(1 + n * scrubSeg) * 100}svh` }
    : { minHeight: 'auto' };
  const stageStyle = pinned
    ? ({ position: 'sticky', top: 0, height: '100dvh' } as const)
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
              className={`tp-panel tp-panel--${s.side === 'right' ? 'left' : 'right'}${i === activeSeg ? ' is-active' : ''}`}
            >
              <p className="eyebrow tp-step">{s.eyebrow}</p>
              <h2 className="t-h2 tp-headline">{s.headline}</h2>
              <p className="t-lead tp-body">{s.body}</p>
              {s.imageSrc && <img className="tp-panel-img" src={s.imageSrc} alt="" loading="lazy" />}
            </div>
          ))}

          {pinned && (
            <div className="tp-progress" aria-hidden="true">
              {segments.map((s, i) => (
                <span key={s.id} className={`tp-dot${i === activeSeg ? ' is-on' : ''}`} />
              ))}
            </div>
          )}
          {pinned && (
            <div className={`tp-cue${activeSeg === 0 && !advanced ? '' : ' is-hidden'}`} aria-hidden="true">
              <span className="tp-cue-text">листайте</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          )}

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
                      posterMobile={s.posterMobile}
                      name={s.scenario}
                      nameMobile={s.scenarioMobile}
                      enabled={s.hasFrames && (i === activeSeg || i === activeSeg + 1)}
                      enabledMobile={s.hasFramesMobile && (i === activeSeg || i === activeSeg + 1)}
                      autoplay={pinned && i === activeSeg}
                      playNonce={playNonce}
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
