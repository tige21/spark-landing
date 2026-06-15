import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { createScrollValue } from './scroll-progress';
import type { ScrollValue } from './scroll-progress';
import { useMotionPrefs } from './motion-guards';

export interface ScrollScene {
  ref: RefObject<HTMLDivElement>;
  progress: ScrollValue;
  factor: number;
  isStatic: boolean;
}

// Shared scroll driver for a 3D scene: attach `ref` to the scene's tall/pinned
// container and feed `progress` (0..1) to its Layers. Vanilla ScrollValue replaces
// framer's useScroll. `factor` comes from useMotionPrefs (0 under reduced-motion /
// small) so consumers can flatten.
export function useScrollScene(
  offset: [string, string] = ['start end', 'end start']
): ScrollScene {
  const ref = useRef<HTMLDivElement>(null);
  const { factor } = useMotionPrefs();
  const progressRef = useRef<ScrollValue>();
  if (!progressRef.current) progressRef.current = createScrollValue(offset);

  useEffect(() => {
    const sv = progressRef.current!;
    sv.attach(ref.current);
    return () => sv.destroy();
  }, []);

  return { ref, progress: progressRef.current, factor, isStatic: factor === 0 };
}
