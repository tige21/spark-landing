import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

interface TiltInProps {
  children: ReactNode;
  tilt?: number; // initial rotateX (deg) — "postcard laid onto the table"
  lift?: number; // initial translateY (px)
  className?: string;
  style?: CSSProperties;
}

// Perspective entrance: content tilts up from rotateX(tilt) + lift + faded as it
// scrolls into view, settling flat. Guarded — under reduced-motion / small
// (factor 0) it renders a plain static div.
export default function TiltIn({
  children,
  tilt = 8,
  lift = 36,
  className,
  style,
}: TiltInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { factor } = useMotionPrefs();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start center'],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
    skipInitialAnimation: true,
  });
  const rotateX = useTransform(p, [0, 1], [tilt, 0]);
  const y = useTransform(p, [0, 1], [lift, 0]);
  const opacity = useTransform(p, [0, 0.6], [0.45, 1]);

  if (factor === 0) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={ref}
        className={className}
        style={{
          ...style,
          transformPerspective: 1000,
          transformOrigin: '50% 100%',
          rotateX,
          y,
          opacity,
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
