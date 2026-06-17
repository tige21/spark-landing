import Lenis from 'lenis';

// DEBUG-gated logging (dev only — never ships to prod).
export const DEBUG_SCROLL = import.meta.env.DEV;

// Tuned for a calm, "premium" inertia that still feels responsive.
export function createLenis(): Lenis {
  return new Lenis({
    duration: 1.05,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });
}

// Shared singleton so islands (e.g. ThroughPhone's phase snap) can drive
// programmatic scroll through the SAME Lenis instance instead of fighting its
// inertia with native scrollTo. SmoothScroll registers it on create and clears
// it on destroy. NOTE: Lenis is disabled on mobile/reduced-motion, so on phones
// getLenis() is null by design — callers must fall back to native scrollTo.
let activeLenis: Lenis | null = null;
export function setLenis(instance: Lenis | null): void {
  activeLenis = instance;
}
export function getLenis(): Lenis | null {
  return activeLenis;
}
