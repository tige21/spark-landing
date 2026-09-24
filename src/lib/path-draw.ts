const SAMPLES = 240;

// Draws an SVG path progressively and reports the point the drawing has reached.
//
// Both halves have to agree, and by default they do not: with
// `vector-effect: non-scaling-stroke` the browser measures the dash pattern in
// DEVICE pixels, while getPointAtLength measures in viewBox user units. Under
// `preserveAspectRatio="none"` those spaces are stretched differently (the
// serpentine connector runs x·2.83 and y·0.77), so a dash of `p * userLength`
// stops at a different place than the point at `p * userLength` — measured up to
// 43px apart mid-path, which is the dot visibly running ahead of its line.
// So the dash is driven by the RENDERED length, sampled at the same user-space
// position the dot uses.
//
// Only for paths that carry `non-scaling-stroke`. Without it the dash is already
// measured in user units, and feeding it a rendered length would break the very
// alignment this restores.
export function createPathDrawer(path: SVGPathElement) {
  let userLength = 0;
  let renderedTotal = 0;
  let renderedCum: number[] = [0];

  const clamp = (p: number) => (p < 0 ? 0 : p > 1 ? 1 : p);

  const measure = () => {
    userLength = path.getTotalLength();
    const m = path.getCTM();
    renderedCum = [0];
    let acc = 0;
    let prev: { x: number; y: number } | null = null;
    for (let i = 0; i <= SAMPLES; i++) {
      const pt = path.getPointAtLength((userLength * i) / SAMPLES);
      const x = m ? m.a * pt.x + m.c * pt.y + m.e : pt.x;
      const y = m ? m.b * pt.x + m.d * pt.y + m.f : pt.y;
      if (prev) acc += Math.hypot(x - prev.x, y - prev.y);
      prev = { x, y };
      if (i > 0) renderedCum.push(acc);
    }
    renderedTotal = acc;
    path.style.strokeDasharray = String(renderedTotal);
  };

  const renderedAt = (p: number) => {
    const f = clamp(p) * SAMPLES;
    const i = Math.floor(f);
    const a = renderedCum[i] ?? 0;
    const b = renderedCum[Math.min(SAMPLES, i + 1)] ?? a;
    return a + (b - a) * (f - i);
  };

  return {
    measure,
    /** Draws up to `p` (0..1 of the path) and returns that point in viewBox units. */
    drawTo(p: number) {
      path.style.strokeDashoffset = String(renderedTotal - renderedAt(p));
      return path.getPointAtLength(userLength * clamp(p));
    },
    fill() {
      path.style.strokeDashoffset = '0';
    },
  };
}
