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
  poster: string; // LCP-safe still; shown until frames are ready / always under guards
  name?: string; // frames folder under /hero-frames/
  enabled?: boolean; // frame sequence exists (skip fetch/scrub when false)
  className?: string;
  style?: CSSProperties;
}

// Apple-style scroll scrubbing: draws the frame matching scroll progress to a
// <canvas>. Frames + manifest are produced by scripts/extract-frames.sh. Until a
// manifest exists (or under reduced-motion / small) it just shows the poster —
// no fetch, no canvas, no errors.
export default function CanvasSequence({
  progress,
  poster,
  name = 'hero',
  enabled = true,
  className,
  style,
}: CanvasSequenceProps) {
  const { reduced, small } = useMotionPrefs();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced || small || !enabled) return; // poster only

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
        const res = await fetch(`/hero-frames/${name}/manifest.json`);
        if (!res.ok) {
          if (DEBUG_SCROLL) console.log('[canvas-seq] no manifest — poster only');
          return;
        }
        const m: Manifest = await res.json();
        if (cancelled) return;
        count = m.count;
        const pad = m.pad ?? 4;
        const url = (i: number) =>
          `/hero-frames/${name}/${String(i + 1).padStart(pad, '0')}.${m.ext}`;

        const first = new Image();
        first.src = url(0);
        await first.decode().catch(() => {});
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = first.naturalWidth;
          canvas.height = first.naturalHeight;
          canvas.style.aspectRatio = `${first.naturalWidth} / ${first.naturalHeight}`;
        }
        frames[0] = first;
        for (let i = 1; i < count; i++) {
          const img = new Image();
          img.src = url(i);
          frames[i] = img;
        }
        await Promise.allSettled(
          frames.slice(0, Math.min(8, count)).map((f) => f.decode().catch(() => {}))
        );
        if (cancelled) return;
        setReady(true);
        draw(progress.get());
        if (DEBUG_SCROLL) console.log('[canvas-seq] frames ready:', count);
      } catch (err) {
        if (DEBUG_SCROLL) console.log('[canvas-seq] load error', err);
      }
    })();

    const unsub = progress.on('change', schedule);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [reduced, small, enabled, name, progress]);

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <img
        src={poster}
        alt=""
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          opacity: ready ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      />
      {!(reduced || small) && enabled && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}
    </div>
  );
}
