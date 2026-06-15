import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MotionValue } from 'framer-motion';
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
  progress: MotionValue<number>; // 0..1 scene scroll progress
  poster: string; // LCP-safe still (desktop)
  posterMobile?: string; // optional mobile poster
  name?: string; // desktop frames folder under /hero-frames/
  nameMobile?: string; // mobile frames folder
  enabled?: boolean; // desktop sequence exists (build-time check)
  enabledMobile?: boolean; // mobile sequence exists
  fit?: 'cover' | 'contain';
  className?: string;
  style?: CSSProperties;
}

// Scroll-scrubbed frame player. Full-bleed friendly (object-fit), responsive
// (separate desktop / mobile sequences), and ENABLED on mobile (only reduced
// motion or a missing sequence falls back to the static poster). Frames + manifest
// are produced by scripts/extract-frames.sh.
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
    let raf = 0;
    const frames: HTMLImageElement[] = [];
    let count = 0;

    const draw = (p: number) => {
      const canvas = canvasRef.current;
      if (!canvas || count === 0) return;
      const idx = Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))));
      const img = frames[idx];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
    };

    const schedule = (p: number) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(p));
    };

    (async () => {
      try {
        const res = await fetch(`/hero-frames/${activeName}/manifest.json`);
        if (!res.ok) {
          if (DEBUG_SCROLL) console.log('[canvas-seq] no manifest', activeName);
          return;
        }
        const m: Manifest = await res.json();
        if (cancelled) return;
        count = m.count;
        const pad = m.pad ?? 4;
        const url = (i: number) =>
          `/hero-frames/${activeName}/${String(i + 1).padStart(pad, '0')}.${m.ext}`;

        const first = new Image();
        first.src = url(0);
        await first.decode().catch(() => {});
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = first.naturalWidth;
          canvas.height = first.naturalHeight;
        }
        frames[0] = first;
        for (let i = 1; i < count; i++) {
          const img = new Image();
          // Redraw the current frame once a frame finishes loading, so the canvas
          // isn't stuck on an early frame when the user stops scrolling mid-load.
          img.onload = () => schedule(progress.get());
          img.src = url(i);
          frames[i] = img;
        }
        await Promise.allSettled(
          frames.slice(0, Math.min(8, count)).map((f) => f.decode().catch(() => {}))
        );
        if (cancelled) return;
        setReady(true);
        draw(progress.get());
        if (DEBUG_SCROLL) console.log('[canvas-seq] ready', activeName, count);
      } catch (err) {
        if (DEBUG_SCROLL) console.log('[canvas-seq] error', err);
      }
    })();

    const unsub = progress.on('change', schedule);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [reduced, activeEnabled, activeName, progress]);

  const media: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: fit,
  };

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <img
        src={activePoster}
        alt=""
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
