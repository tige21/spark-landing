import { LazyMotion, domAnimation, m, useScroll } from 'framer-motion';
import { useRef } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

const PATH = 'M30,70 C190,18 330,122 510,70 S840,18 990,70';
const TICKS = [30, 510, 990];

export default function PostalRoute() {
  const { reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'end 55%'],
  });

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
            d={PATH}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.55}
            style={{ pathLength: reduced ? 1 : scrollYProgress }}
          />
          {TICKS.map((cx, i) => (
            <circle
              key={i}
              cx={cx}
              cy={i % 2 === 0 ? 70 : 70}
              r={4}
              fill="currentColor"
              opacity={0.5}
            />
          ))}
        </svg>
      </LazyMotion>
    </div>
  );
}
