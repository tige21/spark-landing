import { useEffect } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';
import { createLenis, DEBUG_SCROLL } from '../../lib/smooth-scroll';

// Inertial smooth scroll (Lenis). Renders nothing. HARD-guarded: under
// prefers-reduced-motion or on small screens we never initialise Lenis and the
// page uses native scrolling. Lenis drives the real scroll position, so
// framer-motion's useScroll-based scenes stay in sync automatically.
export default function SmoothScroll() {
  const { reduced, small } = useMotionPrefs();

  useEffect(() => {
    if (reduced || small) {
      if (DEBUG_SCROLL) console.log('[smooth-scroll] disabled (reduced/small) — native scroll');
      return;
    }

    const lenis = createLenis();
    let rafId = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    if (DEBUG_SCROLL) console.log('[smooth-scroll] Lenis enabled');

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (DEBUG_SCROLL) console.log('[smooth-scroll] Lenis destroyed');
    };
  }, [reduced, small]);

  return null;
}
