import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ScrollValue } from '../../lib/scroll-progress';
import { useMotionPrefs } from '../../lib/motion-guards';
import { DEBUG_SCROLL } from '../../lib/smooth-scroll';

interface Manifest {
  name: string;
  count: number;
  width: number;
  ext: string;
  pad: number;
}

interface CanvasSequenceProps {
  progress: ScrollValue; // 0..1 scene scroll progress
  poster: string; // LCP-safe still (desktop)
  posterMobile?: string;
  name?: string;
  nameMobile?: string;
  enabled?: boolean;
  enabledMobile?: boolean;
  fit?: 'cover' | 'contain';
  eager?: boolean; // decode frames immediately (above-the-fold hero) instead of on idle
  autoplay?: boolean; // time-based playback (ignore scroll progress) — for the through-phone demo
  playNonce?: number; // bump to (re)start the autoplay from frame 0
  className?: string;
  style?: CSSProperties;
}

type Frame = ImageBitmap | HTMLImageElement;

// Scroll-scrubbed frame player. Smoothness strategy:
//  - frames are pre-decoded to ImageBitmap (GPU-ready, no re-decode jank), resize-
//    capped so a phone holds ~tens of MB rather than ~100MB of bitmaps;
//  - a single rAF loop reads scroll progress and EASES a displayed index toward the
//    target, drawing only when the integer frame changes (decoupled from the flood
//    of scroll events). It snaps to the exact endpoint so the final frame lands, and
//    parks itself when settled to save battery.
// Reduced-motion or a missing sequence → static poster only.
export default function CanvasSequence({
  progress,
  poster,
  posterMobile,
  name = 'hero',
  nameMobile = 'hero-mobile',
  enabled = true,
  enabledMobile = true,
  fit = 'cover',
  eager = false,
  autoplay = false,
  playNonce = 0,
  className,
  style,
}: CanvasSequenceProps) {
  const { reduced, small } = useMotionPrefs();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Autoplay state (component scope so a separate effect can toggle it without
  // re-running the decode effect). 'idle' = scroll-driven (default / hero);
  // 'playing' = time-based ramp 0→last; 'held' = hold the last frame.
  const playModeRef = useRef<'idle' | 'playing' | 'held'>('idle');
  const playStartRef = useRef(0);
  const playDurRef = useRef(1600);
  const ensureRunningRef = useRef<(() => void) | null>(null);

  const activeName = small ? nameMobile : name;
  const activeEnabled = small ? enabledMobile : enabled;

  useEffect(() => {
    setReady(false);
    if (reduced || !activeEnabled) return; // poster only

    let cancelled = false;
    let rafId = 0;
    let idleId: number | undefined;
    let onLoad: (() => void) | undefined;
    let running = false;
    let count = 0;
    let curr = 0; // displayed index (float)
    let lastDrawn = -1;
    let ctx: CanvasRenderingContext2D | null = null;
    const frames: (Frame | undefined)[] = [];
    const capWidth = small ? 540 : 900; // bitmap resize cap → bounds memory

    const drawIndex = (i: number): boolean => {
      const canvas = canvasRef.current;
      const bmp = frames[i];
      if (!canvas || !bmp) return false;
      if (!ctx) ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.drawImage(bmp as CanvasImageSource, 0, 0, canvas.width, canvas.height);
      return true;
    };

    // Draw the exact frame if it's decoded, otherwise the NEAREST decoded frame
    // (search outward). Returns the index actually drawn, or -1. This keeps the
    // scrub alive while frames are still streaming in (first visit), instead of
    // freezing on frame 0.
    const drawNearest = (idx: number): number => {
      if (drawIndex(idx)) return idx;
      for (let r = 1; r < count; r++) {
        if (idx - r >= 0 && drawIndex(idx - r)) return idx - r;
        if (idx + r < count && drawIndex(idx + r)) return idx + r;
      }
      return -1;
    };

    const tick = () => {
      if (cancelled || count === 0) { running = false; return; }
      // ---- autoplay branch: time-based playback, ignores scroll progress ----
      const mode = playModeRef.current;
      if (mode !== 'idle') {
        if (mode === 'playing') {
          const t = Math.min(1, (performance.now() - playStartRef.current) / playDurRef.current);
          curr = t * (count - 1);
          if (t >= 1) playModeRef.current = 'held';
        } else {
          curr = count - 1; // hold the final frame
        }
        const pidx = Math.round(curr);
        if (pidx !== lastDrawn || !frames[pidx]) {
          const drawn = drawNearest(pidx);
          if (drawn !== -1) lastDrawn = drawn;
        }
        // Park only once held AND the final frame is actually on screen.
        if (playModeRef.current === 'held' && frames[count - 1] && lastDrawn === count - 1) { running = false; return; }
        rafId = requestAnimationFrame(tick);
        return;
      }
      const target = Math.min(count - 1, Math.max(0, progress.get() * (count - 1)));
      curr += (target - curr) * 0.22; // ease toward target
      if (Math.abs(target - curr) < 0.15) curr = target; // soft snap so the settle doesn't jump
      const idx = Math.round(curr);
      const exactReady = !!frames[idx];
      // Redraw when the target frame changed, OR while the exact frame isn't
      // decoded yet (so we upgrade from a nearest fallback to the real frame).
      if (idx !== lastDrawn || !exactReady) {
        const drawn = drawNearest(idx);
        if (drawn !== -1) lastDrawn = drawn;
      }
      // Park only once settled AND the exact target frame is on screen — never
      // park while still waiting for frames to decode.
      if (curr === target && exactReady && lastDrawn === idx) { running = false; return; }
      rafId = requestAnimationFrame(tick);
    };
    const ensureRunning = () => {
      if (!running && !cancelled && count > 0) { running = true; rafId = requestAnimationFrame(tick); }
    };
    ensureRunningRef.current = ensureRunning;

    const decode = async (url: string, w?: number, h?: number): Promise<Frame | undefined> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return undefined;
        const blob = await res.blob();
        if ('createImageBitmap' in window) {
          if (w && h) return await createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
          return await createImageBitmap(blob);
        }
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await img.decode().catch(() => {});
        return img;
      } catch {
        return undefined;
      }
    };

    (async () => {
      try {
        const res = await fetch(`/hero-frames/${activeName}/manifest.json`);
        if (!res.ok) { if (DEBUG_SCROLL) console.log('[canvas-seq] no manifest', activeName); return; }
        const m: Manifest = await res.json();
        if (cancelled) return;
        count = m.count;
        // Autoplay duration scales with frame count (~16fps), clamped so short
        // sets aren't a flash and long ones aren't a slog.
        playDurRef.current = Math.min(3000, Math.max(1200, (count / 16) * 1000));
        const pad = m.pad ?? 4;
        const url = (i: number) => `/hero-frames/${activeName}/${String(i + 1).padStart(pad, '0')}.${m.ext}`;

        const first = await decode(url(0));
        if (cancelled || !first) return;
        const nw = (first as ImageBitmap).width;
        const nh = (first as ImageBitmap).height;
        const tw = Math.min(nw, capWidth);
        const th = Math.round((tw / nw) * nh);
        const canvas = canvasRef.current;
        if (canvas) { canvas.width = tw; canvas.height = th; }
        frames[0] = first;
        setReady(true);
        curr = progress.get() * (count - 1);
        drawIndex(0); lastDrawn = 0;
        ensureRunning();

        // Defer the rest off the critical path (idle) + cap concurrency so the
        // frame downloads don't contend with first paint / LCP.
        const startBatch = () => {
          let next = 1;
          let inflight = 0;
          const CONCURRENCY = 4;
          const pump = () => {
            while (!cancelled && inflight < CONCURRENCY && next < count) {
              const i = next++;
              inflight++;
              decode(url(i), tw, th).then((f) => {
                inflight--;
                if (cancelled) { if (f && 'close' in f) (f as ImageBitmap).close(); return; }
                frames[i] = f;
                if (Math.round(curr) === i) ensureRunning();
                pump();
              });
            }
          };
          pump();
        };
        // Frame batch is the bulk of the bytes — keep it OUT of the LCP window.
        // eager → now; otherwise wait until after `load` (so only the poster +
        // critical JS/fonts compete for LCP), then decode on idle. Frame 0 is
        // already decoded above (canvas ready, visually == poster).
        const scheduleIdle = () => {
          idleId = 'requestIdleCallback' in window
            ? (window as Window & typeof globalThis).requestIdleCallback(startBatch, { timeout: 1500 })
            : (setTimeout(startBatch, 300) as unknown as number);
        };
        if (eager) {
          idleId = setTimeout(startBatch, 0) as unknown as number;
        } else if (document.readyState === 'complete') {
          scheduleIdle();
        } else {
          onLoad = () => scheduleIdle();
          window.addEventListener('load', onLoad, { once: true });
        }
        if (DEBUG_SCROLL) console.log('[canvas-seq] ready', activeName, count, `${tw}x${th}`);
      } catch (err) {
        if (DEBUG_SCROLL) console.log('[canvas-seq] error', err);
      }
    })();

    const unsub = progress.on('change', ensureRunning);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (idleId !== undefined) {
        if ('cancelIdleCallback' in window) cancelIdleCallback(idleId);
        else clearTimeout(idleId);
      }
      if (onLoad) window.removeEventListener('load', onLoad);
      unsub();
      ensureRunningRef.current = null;
      frames.forEach((f) => { if (f && 'close' in f) (f as ImageBitmap).close(); });
    };
  }, [reduced, activeEnabled, activeName, small, progress]);

  // Toggle autoplay without re-running the (expensive) decode effect. When
  // `autoplay` turns on or `playNonce` changes, restart the time-based playback
  // from frame 0; otherwise return to scroll-driven ('idle'). Kicks the rAF loop.
  useEffect(() => {
    if (reduced || !activeEnabled) return;
    if (autoplay) {
      playModeRef.current = 'playing';
      playStartRef.current = performance.now();
    } else {
      playModeRef.current = 'idle';
    }
    ensureRunningRef.current?.();
  }, [autoplay, playNonce, reduced, activeEnabled]);

  // object-fit/position are driven by CSS (see HeroScroll.css) — a media query is
  // reliable across SSR/hydration, unlike a JS `small` flag on an inline style.
  const media: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  };

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      {/* <picture> so the browser picks the mobile poster on small screens
          regardless of SSR/JS — avoids fetching the desktop poster on mobile. */}
      <picture>
        {posterMobile && <source media="(max-width: 760px)" srcSet={posterMobile} />}
        <img
          src={poster}
          alt=""
          fetchPriority="high"
          decoding="async"
          style={{ ...media, opacity: ready ? 0 : 1, transition: 'opacity 0.5s ease' }}
        />
      </picture>
      {!reduced && activeEnabled && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ ...media, opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}
        />
      )}
    </div>
  );
}
