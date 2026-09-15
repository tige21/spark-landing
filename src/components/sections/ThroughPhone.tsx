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
  scenario: string;
  actions: number; // discrete actions/snap-stops this feature shows (one swipe each)
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
  id?: string;
  eyebrow: string;
  segments: PhoneSegment[];
  sparkSrc: string;
}

// Layout effect on the client (positions the phone before first paint → no
// corner-flash), plain effect on the server (avoids the SSR useLayoutEffect warning).
const useIsoLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// A derived ScrollValue exposing ONE feature's local progress (0..1 across its
// own actions) on top of the section's flat action progress. The section maps
// scroll → `fa = p * A` (A = total actions); a feature spanning actions
// [start, start+count) plays its full frame set over featP = (fa-start)/count.
// CanvasSequence only reads get()+on('change'), so this thin adapter feeds it.
function useFeatureProgress(main: ScrollValue, start: number, count: number, total: number): ScrollValue {
  return useMemo<ScrollValue>(() => {
    const compute = () => clamp01((main.get() * total - start) / count);
    return {
      get: compute,
      on: (_evt: 'change', cb: (v: number) => void) => main.on('change', () => cb(compute())),
      attach: () => {},
      destroy: () => {},
    } as unknown as ScrollValue;
  }, [main, start, count, total]);
}

// Through-phone showcase: ONE pinned iPhone demonstrates the app's CAPABILITIES
// (Колоды / Игра / Своя колода). Each capability is broken into discrete ACTIONS;
// the section is a flat list of A actions with one snap-stop each, so a single
// finger-swipe (mobile) or wheel gesture (desktop) advances exactly ONE action —
// the user is walked through every screen instead of flying past. Reduced-motion
// / missing frames / SSR → a plain stacked fallback (no pin).
export default function ThroughPhone({ id, eyebrow, segments, sparkSrc }: ThroughPhoneProps) {
  const n = segments.length;
  const { ref, progress } = useScrollScene(['start start', 'end end']);
  const { reduced, small } = useMotionPrefs();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allFrames = segments.every((s) => s.hasFrames);
  const pinned = mounted && !reduced && allFrames;

  // Gate for the phone's 0.6s side-to-side travel (--tp-move in the CSS). The
  // island is client:visible, so the server-rendered stacked fallback is on
  // screen until React hydrates; the swap to the pinned scene moves the phone a
  // long way, and with the transition already live that swap PLAYED as a flight
  // across the viewport. Arming it one painted frame after the pinned layout
  // lands makes the swap instant and leaves the capability move animated.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!pinned) {
      setReady(false);
      return;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setReady(true);
        if (DEBUG_SCROLL) console.log('[FIX][through-phone] pinned layout painted, phone travel armed');
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [pinned]);

  // ---- flat action model ----
  // featureCounts[f] = actions in feature f; featureStart[f] = its first action
  // index in the flat list; A = total actions across all features.
  const featureCounts = useMemo(() => segments.map((s) => Math.max(1, s.actions || 1)), [segments]);
  const featureStart = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const c of featureCounts) { out.push(acc); acc += c; }
    return out;
  }, [featureCounts]);
  const A = useMemo(() => featureCounts.reduce((a, b) => a + b, 0), [featureCounts]);
  const actionList = useMemo(() => {
    const out: { f: number; k: number }[] = [];
    featureCounts.forEach((c, f) => { for (let k = 0; k < c; k++) out.push({ f, k }); });
    return out;
  }, [featureCounts]);
  const featureOf = useCallback((ai: number) => {
    for (let f = n - 1; f >= 0; f--) { if (ai >= featureStart[f]) return f; }
    return 0;
  }, [featureStart, n]);

  // Scroll length PER ACTION (in 100svh units). Each action gets ~one comfortable
  // swipe; the section is (1 + A*perAction) tall. Tuned smaller on desktop.
  const perAction = small ? 0.82 : 0.7;

  const barFillRef = useRef<HTMLSpanElement>(null);

  // Active FEATURE (drives copy, indicator, lazy frame decode).
  const [activeFeat, setActiveFeat] = useState(0);
  const activeFeatRef = useRef(0);
  // Once the user reaches a later capability, the first "scroll on" cue has done
  // its job — keep it hidden so it never nags on revisit.
  const [advanced, setAdvanced] = useState(false);

  // The section's document position, cached. Reading it (rect + offsetHeight)
  // forces a layout, and the wheel handler runs on EVERY wheel event — a trackpad
  // fires ~100/s, so that was ~100 forced layouts a second on a 9700px section
  // while the user was scrubbing. The page does not reflow mid-scroll, so a short
  // TTL is enough to stay correct.
  const geomRef = useRef({ at: 0, top: 0, range: 0 });
  const geometry = useCallback(() => {
    const now = performance.now();
    const g = geomRef.current;
    if (now - g.at < 250) return g;
    const el = ref.current;
    if (!el) return g;
    g.at = now;
    g.top = el.getBoundingClientRect().top + window.scrollY;
    g.range = el.offsetHeight - window.innerHeight;
    return g;
  }, [ref]);

  // Move to a specific ACTION (0..A-1) and rest there. Used by the wheel-step
  // (desktop) and idle-snap. Drives the shared Lenis instance on desktop (no
  // inertia fight) or native smooth scroll on mobile (Lenis off there).
  const goToAction = useCallback(
    (target: number, opts: { duration?: number; lock?: boolean; onDone?: () => void } = {}) => {
      const el = ref.current;
      if (!el) { opts.onDone?.(); return; }
      const { top, range } = geometry();
      if (range <= 0) { opts.onDone?.(); return; }
      const t = Math.max(0, Math.min(A - 1, target));
      const ty = Math.round(top + range * ((t + 0.5) / A));
      const lenis = getLenis();
      const duration = opts.duration ?? 0.6;
      if (lenis) lenis.scrollTo(ty, { duration, lock: opts.lock ?? false, onComplete: opts.onDone });
      else { window.scrollTo({ top: ty, behavior: 'smooth' }); if (opts.onDone) window.setTimeout(opts.onDone, duration * 1000 + 80); }
      if (DEBUG_SCROLL) console.log('[through-phone] goToAction', t, ty);
    },
    [A, ref, geometry]
  );

  // Per-feature progress values (hooks must run unconditionally → fixed 4 slots).
  const fp0 = useFeatureProgress(progress, featureStart[0] ?? 0, featureCounts[0] ?? 1, A);
  const fp1 = useFeatureProgress(progress, featureStart[1] ?? 0, featureCounts[1] ?? 1, A);
  const fp2 = useFeatureProgress(progress, featureStart[2] ?? 0, featureCounts[2] ?? 1, A);
  const fp3 = useFeatureProgress(progress, featureStart[3] ?? 0, featureCounts[3] ?? 1, A);
  const derived = [fp0, fp1, fp2, fp3].slice(0, n);

  // Imperative driver: tracks the active feature and the intra-feature progress
  // bar. Everything positional (phone side, panel/canvas visibility) is declarative
  // — CSS + the `activeFeat` render — so it can't disagree with the CSS breakpoint.
  // The canvas FRAMES are scrubbed by the per-feature derived progress
  // (CanvasSequence subscribes to `progress` directly).
  useIsoLayoutEffect(() => {
    if (!pinned) {
      if (typeof document !== 'undefined') document.documentElement.classList.remove('tp-snap');
      return;
    }

    const apply = (pv: number) => {
      const p = clamp01(pv);
      const fa = p * A; // flat action position 0..A
      const ai = Math.max(0, Math.min(A - 1, Math.floor(fa)));
      const af = featureOf(ai);
      if (af !== activeFeatRef.current) {
        activeFeatRef.current = af;
        setActiveFeat(af);
        if (DEBUG_SCROLL) console.log('[through-phone] active feature', af);
      }
      // engaged window (mobile scroll-snap on; cue advance flag)
      const engaged = p > 0.005 && p < 0.995;
      if (engaged && af > 0) setAdvanced(true);
      document.documentElement.classList.toggle('tp-snap', small && engaged);

      // intra-feature progress bar (how far through the active capability's actions)
      if (barFillRef.current) {
        const featP = clamp01((fa - featureStart[af]) / featureCounts[af]);
        barFillRef.current.style.width = `${Math.round(featP * 100)}%`;
      }
    };

    apply(progress.get());
    const unsub = progress.on('change', apply);
    return () => {
      unsub();
      if (typeof document !== 'undefined') document.documentElement.classList.remove('tp-snap');
    };
  }, [pinned, small, progress, A, featureOf, featureStart, featureCounts]);

  // ---- Phase snap: settle to the nearest ACTION on scroll-idle (DESKTOP ONLY) ----
  // Desktop scrollbar/keyboard fallback; the wheel-stepper handles the wheel.
  // Mobile uses native CSS scroll-snap (per-action markers + html.tp-snap) — running
  // both would make the JS scrollTo fight the CSS snap. Off under reduced-motion.
  useEffect(() => {
    if (!pinned || small) return;
    const el = ref.current;
    if (!el) return;

    const invalidate = () => { geomRef.current.at = 0; };
    window.addEventListener('resize', invalidate);

    let idleTimer = 0;
    let guardUntil = 0;

    const snapToNearest = () => {
      const now = performance.now();
      if (now < guardUntil) return;
      const { top, range } = geometry();
      if (range <= 0) return;
      const y = window.scrollY;
      if (y < top - 1 || y > top + range + 1) return;
      const fa = clamp01((y - top) / range) * A;
      const i = Math.max(0, Math.min(A - 1, Math.round(fa - 0.5)));
      const target = Math.round(top + range * ((i + 0.5) / A));
      if (Math.abs(target - y) <= 6) return;
      guardUntil = now + 700;
      goToAction(i, { duration: 0.5 });
    };

    const onScroll = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = window.setTimeout(snapToNearest, 140);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', snapToNearest);
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', snapToNearest);
    };
  }, [pinned, small, A, ref, goToAction, geometry]);

  // ---- Desktop wheel-stepping: ONE wheel gesture = ONE action, then stop ----
  // Capture the wheel (capture + stopImmediatePropagation so Lenis doesn't also
  // scroll) and advance exactly one ACTION per gesture, locking until reached. A
  // cooldown means a held scroll steps action-by-action. Free exit at the ends.
  useEffect(() => {
    if (!pinned || small) return;
    const el = ref.current;
    if (!el) return;

    // ONE step per gesture is enforced by `cooldown`, which is held for the whole
    // step animation and released on its onDone. Held/repeated scroll then steps
    // action-by-action (one per animation); a quick flick = one action. We do NOT
    // gate on a "wheel events have paused" timer: that perpetually re-armed while
    // events kept coming, so a continuous scroll never advanced — the section only
    // moved after a full stop, reading as broken.
    let cooldown = false;
    const onWheel = (e: WheelEvent) => {
      const { top, range } = geometry();
      if (range <= 0) return;
      const y = window.scrollY;
      // While the sticky stage is still sliding up, its content is centred on a
      // box that hangs off the bottom of the screen — the phone sits low and half
      // cut. One wheel-down click pulls the section into place instead of leaving
      // the user parked in that half-entered frame. Wheeling UP is never grabbed,
      // so leaving the section upward stays free.
      if (y < top - 2) {
        if (y < top - window.innerHeight * 0.6 || e.deltaY <= 0) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (cooldown) return;
        cooldown = true;
        goToAction(0, { duration: 0.5, lock: true, onDone: () => { cooldown = false; } });
        return;
      }
      if (y > top + range + 2) return;
      const fa = clamp01((y - top) / range) * A;
      const dir = e.deltaY > 0 ? 1 : -1;
      // Free exit at the section ends so the user is never trapped on the phone.
      if (dir > 0 && fa >= A - 0.5 - 0.02) return;
      if (dir < 0 && fa <= 0.5 + 0.02) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (cooldown) return;
      const cur = Math.max(0, Math.min(A - 1, Math.round(fa - 0.5)));
      const atCenter = Math.abs(fa - (cur + 0.5)) <= 0.12;
      const target = Math.max(0, Math.min(A - 1, atCenter ? cur + dir : cur));
      cooldown = true;
      goToAction(target, { duration: 0.5, lock: true, onDone: () => { cooldown = false; } });
    };

    // A non-passive wheel listener on `window` is a page-wide cost, not a section
    // one: it runs in capture phase on EVERY wheel event, so while it was
    // registered for the life of the page it sat in the scroll path of sections
    // 10000px away from this one. It only ever steps when the section is near, so
    // attach it there and hand the rest of the page back. Margin covers the
    // approach, where the handler pulls a half-entered section into place.
    let attached = false;
    const attach = () => {
      if (attached) return;
      window.addEventListener('wheel', onWheel, { passive: false, capture: true });
      attached = true;
    };
    const detach = () => {
      if (!attached) return;
      window.removeEventListener('wheel', onWheel, { capture: true });
      attached = false;
    };
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? attach() : detach()),
      { rootMargin: '100% 0px 100% 0px' }
    );
    io.observe(el);
    return () => { io.disconnect(); detach(); };
  }, [pinned, small, A, ref, goToAction, geometry]);

  const sectionStyle = pinned
    ? { height: `${(1 + A * perAction) * 100}svh` }
    : { minHeight: 'auto' };
  // svh (not dvh): constant across the mobile address-bar toggle → no reflow jank.
  const stageStyle = pinned
    ? ({ position: 'sticky', top: 0, height: '100svh' } as const)
    : ({ position: 'relative' } as const);

  return (
    <section
      ref={ref}
      id={id}
      className="through-phone"
      style={sectionStyle}
      data-pinned={pinned}
      data-ready={ready}
      data-side={activeFeat % 2 === 0 ? 'right' : 'left'}
    >
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

        <div className="tp-track">
          {segments.map((s, i) => (
            <div
              key={s.id}
              className={`tp-panel tp-panel--${i % 2 === 0 ? 'left' : 'right'}${i === activeFeat ? ' is-active' : ''}`}
            >
              <p className="eyebrow tp-step">{s.eyebrow}</p>
              <h2 className="t-h2 tp-headline">{s.headline}</h2>
              <p className="t-lead tp-body">{s.body}</p>
              {s.imageSrc && <img className="tp-panel-img" src={s.imageSrc} alt="" loading="lazy" />}
            </div>
          ))}

          {pinned && (
            <div className="tp-progress" aria-hidden="true">
              <div className="tp-bar"><span ref={barFillRef} className="tp-bar-fill" /></div>
            </div>
          )}
          {pinned && (
            <div className={`tp-cue${activeFeat === 0 && !advanced ? '' : ' is-hidden'}`} aria-hidden="true">
              <span className="tp-cue-text">листайте</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          )}

          <div className="tp-phone">
            <div className="tp-screen">
              <div className="tp-statusband" aria-hidden="true">
                <span className="tp-island" />
              </div>
              <div className="tp-canvas-area">
                {segments.map((s, i) => (
                  <div
                    key={s.id}
                    className="tp-canvas"
                    style={{ opacity: i === activeFeat ? 1 : 0, zIndex: i === activeFeat ? 2 : 0 }}
                  >
                    <CanvasSequence
                      progress={derived[i]}
                      poster={s.poster}
                      posterMobile={s.posterMobile}
                      name={s.scenario}
                      nameMobile={s.scenarioMobile}
                      enabled={s.hasFrames && (i === activeFeat || i === activeFeat + 1)}
                      enabledMobile={s.hasFramesMobile && (i === activeFeat || i === activeFeat + 1)}
                      priority={i === activeFeat}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Native scroll-snap targets — ONE per ACTION (mobile only, via the toggled
          html.tp-snap class; inert on desktop). Direct children of the TALL section
          so their absolute offsets map to document scroll positions. Action i rests
          at scrollY = sectionTop + range*((i+0.5)/A); marker top = (i+0.5)*perAction
          *100svh. scroll-snap-stop:always (CSS) → a fling stops at EVERY action. */}
      {pinned && actionList.map((a, i) => (
        <span
          key={`snap-${a.f}-${a.k}`}
          className="tp-snap-point"
          style={{ top: `${(i + 0.5) * perAction * 100}svh` }}
          aria-hidden="true"
        />
      ))}
    </section>
  );
}
