import type { ScrollValue } from './scroll-progress';

// Drives a set of numeric channels off a ScrollValue (0..1) and renders them via
// a callback. Replaces framer-motion's useTransform + useSpring: linear channels
// map progress straight through, spring channels ease toward their target with an
// rAF lerp tuned to feel like framer's stiffness 120 / damping 30 spring. A single
// loop runs only while values are unsettled, then parks — same battery profile.
type Channel = { from: number; to: number; spring?: boolean };

interface ScrollAnimOpts {
  channels: Record<string, Channel>;
  render: (vals: Record<string, number>) => void;
  smooth?: number;
}

export function animateOnScroll(progress: ScrollValue, opts: ScrollAnimOpts): () => void {
  const { channels, render, smooth = 0.16 } = opts;
  const keys = Object.keys(channels);
  const curr: Record<string, number> = {};
  const target: Record<string, number> = {};

  const at = (k: string, p: number) => {
    const c = channels[k];
    return c.from + (c.to - c.from) * p;
  };

  const p0 = progress.get();
  for (const k of keys) {
    const v = at(k, p0);
    curr[k] = v;
    target[k] = v;
  }
  render({ ...curr });

  let raf = 0;
  let running = false;

  const tick = () => {
    let settled = true;
    for (const k of keys) {
      if (channels[k].spring) {
        curr[k] += (target[k] - curr[k]) * smooth;
        if (Math.abs(target[k] - curr[k]) > 0.01) settled = false;
        else curr[k] = target[k];
      } else {
        curr[k] = target[k];
      }
    }
    render({ ...curr });
    if (settled) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const ensure = () => {
    if (running || typeof requestAnimationFrame === 'undefined') return;
    running = true;
    raf = requestAnimationFrame(tick);
  };

  const recompute = (p: number) => {
    let changed = false;
    for (const k of keys) {
      const t = at(k, p);
      if (t !== target[k]) {
        target[k] = t;
        changed = true;
      }
    }
    if (changed) ensure();
  };

  const unsub = progress.on('change', recompute);
  return () => {
    if (raf) cancelAnimationFrame(raf);
    unsub();
  };
}
