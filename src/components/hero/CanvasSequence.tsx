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
  className,
  style,
}: CanvasSequenceProps) {
  const { reduced, small } = useMotionPrefs();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const activeName = small ? nameMobile : name;
  const activeEnabled = small ? enabledMobile : enabled;
  const activePoster = small && posterMobile ? posterMobile : poster;

  useEffect(() => {
    setReady(false);
    if (reduced || !activeEnabled) return; // poster only

    let cancelled = false;
    let rafId = 0;
    let idleId: number | undefined;
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

    const tick = () => {
      if (cancelled || count === 0) { running = false; return; }
      const target = Math.min(count - 1, Math.max(0, progress.get() * (count - 1)));
      curr += (target - curr) * 0.22; // ease toward target
      if (Math.abs(target - curr) < 0.15) curr = target; // soft snap so the settle doesn't jump
      const idx = Math.round(curr);
      if (idx !== lastDrawn && drawIndex(idx)) lastDrawn = idx;
      if (curr === target && lastDrawn === Math.round(target)) { running = false; return; } // park
      rafId = requestAnimationFrame(tick);
    };
    const ensureRunning = () => {
      if (!running && !cancelled && count > 0) { running = true; rafId = requestAnimationFrame(tick); }
    };

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
        idleId = 'requestIdleCallback' in window
          ? (window as Window & typeof globalThis).requestIdleCallback(startBatch, { timeout: 1500 })
          : (setTimeout(startBatch, 300) as unknown as number);
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
      unsub();
      frames.forEach((f) => { if (f && 'close' in f) (f as ImageBitmap).close(); });
    };
  }, [reduced, activeEnabled, activeName, small, progress]);

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
      <img
        src={activePoster}
        alt=""
        fetchPriority="high"
        decoding="async"
        style={{ ...media, opacity: ready ? 0 : 1, transition: 'opacity 0.5s ease' }}
      />
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
