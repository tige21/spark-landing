import { useScroll } from 'framer-motion';
import { useRef } from 'react';
import type { RefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import { useMotionPrefs } from './motion-guards';

type Offset = Parameters<typeof useScroll>[0] extends { offset?: infer O }
  ? O
  : unknown;

export interface ScrollScene {
  ref: RefObject<HTMLDivElement>;
  progress: MotionValue<number>;
  factor: number;
  isStatic: boolean;
}

// Shared scroll driver for a 3D scene: attach `ref` to the scene's tall/pinned
// container and feed `progress` (0..1) to its Layers. `factor` comes from
// useMotionPrefs (0 under reduced-motion / small) so consumers can flatten.
export function useScrollScene(
  offset: Offset = ['start end', 'end start'] as Offset
): ScrollScene {
  const ref = useRef<HTMLDivElement>(null);
  const { factor } = useMotionPrefs();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return { ref, progress: scrollYProgress, factor, isStatic: factor === 0 };
}
