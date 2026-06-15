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
