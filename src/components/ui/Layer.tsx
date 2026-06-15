import { LazyMotion, domAnimation, m, useSpring, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

interface LayerProps {
  progress: MotionValue<number>;
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

// A single depth plane inside a Scene3D. Driven by the scene's shared scroll
// `progress`. Reuses the guarded-parallax pattern of Parallax.tsx: hooks run
// unconditionally, then under reduced-motion / small (factor === 0) it renders a
// plain static div — the whole 3D scene collapses to a flat composition.
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

  const rawY = useTransform(progress, [0, 1], [y / 2, -y / 2]);
  const rawX = useTransform(progress, [0, 1], [x / 2, -x / 2]);
  const ySpring = useSpring(rawY, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
    skipInitialAnimation: true,
  });
  const xSpring = useSpring(rawX, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
    skipInitialAnimation: true,
  });
  const z = useTransform(progress, [0, 1], zRange ?? [depth, depth]);
  const scl = useTransform(progress, [0, 1], scale ?? [1, 1]);
  const op = useTransform(progress, [0, 1], opacity ?? [1, 1]);
  const rotX = useTransform(progress, [0, 1], rotateX ?? [0, 0]);

  if (factor === 0) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const motionStyle: Record<string, unknown> = {
    ...style,
    z: zRange ? z : depth,
    willChange: 'transform',
  };
  if (y) motionStyle.y = spring ? ySpring : rawY;
  if (x) motionStyle.x = spring ? xSpring : rawX;
  if (scale) motionStyle.scale = scl;
  if (opacity) motionStyle.opacity = op;
  if (rotateX) motionStyle.rotateX = rotX;

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div className={className} style={motionStyle}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
