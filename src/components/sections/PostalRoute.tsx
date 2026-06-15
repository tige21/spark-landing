import { useEffect, useRef } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';
import { createScrollValue } from '../../lib/scroll-progress';

const PATH = 'M30,70 C190,18 330,122 510,70 S840,18 990,70';
const TICKS = [30, 510, 990];

// Postal route that draws itself as you scroll, with a wax-stamp dot riding the
// path. Vanilla ScrollValue drives stroke-dashoffset (the line draw) and the dot
// position via getPointAtLength — no framer-motion.
export default function PostalRoute() {
  const { reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);

    if (reduced) {
      path.style.strokeDashoffset = '0';
      return;
    }

    path.style.strokeDashoffset = String(len);
    const dot = dotRef.current;
    const sv = createScrollValue(['start 85%', 'end 55%']);
    sv.attach(ref.current);

    const update = (v: number) => {
      const p = v < 0 ? 0 : v > 1 ? 1 : v;
      path.style.strokeDashoffset = String(len * (1 - p));
      if (dot) {
        const pt = path.getPointAtLength(len * p);
        dot.setAttribute('cx', String(pt.x));
        dot.setAttribute('cy', String(pt.y));
      }
    };
    update(sv.get());
    const unsub = sv.on('change', update);
    return () => {
      unsub();
      sv.destroy();
    };
  }, [reduced]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <svg
        viewBox="0 0 1020 140"
        fill="none"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', color: 'var(--meta)' }}
      >
        <path
          ref={pathRef}
          d={PATH}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.55}
        />
        {TICKS.map((cx, i) => (
          <circle key={i} cx={cx} cy={70} r={4} fill="currentColor" opacity={0.5} />
        ))}
        {!reduced && <circle ref={dotRef} cx={30} cy={70} r={6} fill="var(--wine)" />}
      </svg>
    </div>
  );
}
