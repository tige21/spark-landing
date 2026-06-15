import { LazyMotion, domAnimation, m, useScroll, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

const PATH = 'M30,70 C190,18 330,122 510,70 S840,18 990,70';
const TICKS = [30, 510, 990];

export default function PostalRoute() {
  const { reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'end 55%'],
  });

  // A "stamp" rides along the route as you scroll (point sampled off the path).
  const mx = useMotionValue(30);
  const my = useMotionValue(70);
  useEffect(() => {
    if (reduced) return;
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const update = (v: number) => {
      const pt = path.getPointAtLength(len * Math.min(1, Math.max(0, v)));
      mx.set(pt.x);
      my.set(pt.y);
    };
    update(scrollYProgress.get());
    return scrollYProgress.on('change', update);
  }, [reduced, scrollYProgress, mx, my]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <LazyMotion features={domAnimation} strict>
        <svg
          viewBox="0 0 1020 140"
          fill="none"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', color: 'var(--meta)' }}
        >
          <m.path
            ref={pathRef}
            d={PATH}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.55}
            style={{ pathLength: reduced ? 1 : scrollYProgress }}
          />
          {TICKS.map((cx, i) => (
            <circle key={i} cx={cx} cy={70} r={4} fill="currentColor" opacity={0.5} />
          ))}
          {!reduced && (
            <m.circle r={6} fill="var(--wine)" style={{ cx: mx, cy: my }} />
          )}
        </svg>
      </LazyMotion>
    </div>
  );
}
