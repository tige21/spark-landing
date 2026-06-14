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

interface ParallaxProps {
  children: ReactNode;
  axis?: 'x' | 'y';
  distance?: number;
  rotate?: number;
  scaleFrom?: number;
  scaleTo?: number;
  className?: string;
  style?: CSSProperties;
}

export default function Parallax({
  children,
  axis = 'y',
  distance = 80,
  rotate = 0,
  scaleFrom,
  scaleTo,
  className,
  style,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { factor } = useMotionPrefs();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const d = distance * factor;
  const rawMove = useTransform(scrollYProgress, [0, 1], [d / 2, -d / 2]);
  const move = useSpring(rawMove, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
    skipInitialAnimation: true,
  });
  const rot = useTransform(
    scrollYProgress,
    [0, 1],
    [-rotate * 0.5 * factor, rotate * 0.5 * factor]
  );
  const scl = useTransform(
    scrollYProgress,
    [0, 1],
    [scaleFrom ?? 1, scaleTo ?? 1]
  );

  if (factor === 0) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const motionStyle: Record<string, unknown> = {
    ...style,
    willChange: 'transform',
  };
  motionStyle[axis] = move;
  if (rotate) motionStyle.rotate = rot;
  if (scaleFrom != null || scaleTo != null) motionStyle.scale = scl;

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div ref={ref} className={className} style={motionStyle}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
