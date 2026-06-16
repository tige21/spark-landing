import { useEffect } from 'react';
import type Lenis from 'lenis';
import { useMotionPrefs } from '../../lib/motion-guards';
import { createLenis, DEBUG_SCROLL } from '../../lib/smooth-scroll';

// Offset for the fixed header overlay so anchor targets aren't hidden under it.
const NAV_OFFSET = 64;

// Inertial smooth scroll (Lenis) + smooth anchor navigation. Renders nothing.
// Lenis is HARD-guarded: under prefers-reduced-motion or on small screens we never
// initialise it and the page uses native scrolling. The anchor click handler is
// always attached — it drives Lenis when present, otherwise native smooth scroll
// with the same header offset.
export default function SmoothScroll() {
  const { reduced, small } = useMotionPrefs();

  useEffect(() => {
    let lenis: Lenis | null = null;
    let rafId = 0;

    if (!reduced && !small) {
      lenis = createLenis();
      const loop = (time: number) => {
        lenis!.raf(time);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
      if (DEBUG_SCROLL) console.log('[smooth-scroll] Lenis enabled');
    } else if (DEBUG_SCROLL) {
      console.log('[smooth-scroll] disabled (reduced/small) — native scroll');
    }

    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.getElementById(href.slice(1));
      if (!el) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(el, { offset: -NAV_OFFSET });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
        window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      }
      history.replaceState(null, '', href);
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      if (lenis) {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        if (DEBUG_SCROLL) console.log('[smooth-scroll] Lenis destroyed');
      }
    };
  }, [reduced, small]);

  return null;
}
