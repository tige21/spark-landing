import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';
import { animateOnScroll } from '../../lib/scroll-anim';
import type { ScrollValue } from '../../lib/scroll-progress';

interface LayerProps {
  progress: ScrollValue;
  depth?: number; // static translateZ (px) — depth within the Scene3D
  zRange?: [number, number]; // scroll-driven translateZ (camera dolly)
  y?: number; // vertical parallax travel (px) across the scene
  x?: number; // horizontal parallax travel (px)
  scale?: [number, number];
  opacity?: [number, number];
  rotateX?: [number, number];
  spring?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// A single depth plane inside a Scene3D, driven by the scene's shared scroll
// `progress` (vanilla ScrollValue — no framer). Under reduced-motion / small
// (factor === 0) it renders a plain static div, so the whole 3D scene collapses
// to a flat composition.
export default function Layer({
  progress,
  depth = 0,
  zRange,
  y = 0,
  x = 0,
  scale,
  opacity,
  rotateX,
  spring = true,
  className,
  style,
  children,
}: LayerProps) {
  const { factor } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const isStatic = factor === 0;

  useEffect(() => {
    if (isStatic) return;
    const el = ref.current;
    if (!el) return;

    const channels = {
      y: { from: y / 2, to: -y / 2, spring },
      x: { from: x / 2, to: -x / 2, spring },
      z: { from: (zRange ?? [depth, depth])[0], to: (zRange ?? [depth, depth])[1] },
      scale: { from: (scale ?? [1, 1])[0], to: (scale ?? [1, 1])[1] },
      rotateX: { from: (rotateX ?? [0, 0])[0], to: (rotateX ?? [0, 0])[1] },
      opacity: { from: (opacity ?? [1, 1])[0], to: (opacity ?? [1, 1])[1] },
    };

    return animateOnScroll(progress, {
      channels,
      render: (v) => {
        el.style.transform = `translate3d(${v.x}px, ${v.y}px, ${v.z}px) scale(${v.scale}) rotateX(${v.rotateX}deg)`;
        if (opacity) el.style.opacity = String(v.opacity);
      },
    });
  }, [progress, isStatic, depth, y, x, spring, zRange, scale, rotateX, opacity]);

  if (isStatic) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, transform: `translateZ(${depth}px)`, willChange: 'transform' }}
    >
      {children}
    </div>
  );
}
