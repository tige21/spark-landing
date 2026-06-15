import { useEffect, useState } from 'react';

const SMALL_SCREEN_QUERY = '(max-width: 760px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export interface MotionPrefs {
  reduced: boolean;
  small: boolean;
  factor: number;
}

function match(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

// Reduced-motion + small-screen detection via matchMedia directly. We do NOT use
// framer-motion's useReducedMotion here: it captures the value once at mount and
// proved inconsistent across separately-hydrated Astro islands (some islands kept
// animating under prefers-reduced-motion). matchMedia + lazy init is consistent
// for every island and updates reactively. factor === 0 is the signal every
// guarded motion component uses to render a flat/static fallback.
export function useMotionPrefs(): MotionPrefs {
  const [reduced, setReduced] = useState<boolean>(() => match(REDUCED_QUERY));
  const [small, setSmall] = useState<boolean>(() => match(SMALL_SCREEN_QUERY));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const rm = window.matchMedia(REDUCED_QUERY);
    const sm = window.matchMedia(SMALL_SCREEN_QUERY);
    const onReduced = () => setReduced(rm.matches);
    const onSmall = () => setSmall(sm.matches);
    onReduced();
    onSmall();
    rm.addEventListener('change', onReduced);
    sm.addEventListener('change', onSmall);
    return () => {
      rm.removeEventListener('change', onReduced);
      sm.removeEventListener('change', onSmall);
    };
  }, []);

  const factor = reduced ? 0 : small ? 0.5 : 1;
  return { reduced, small, factor };
}
