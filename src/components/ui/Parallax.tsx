import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

export default function Parallax({
  children,
  speed = 0.2,
  className,
  style,
}: ParallaxProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const shift = 120 * speed;
  const y = useTransform(scrollYProgress, [0, 1], [shift, -shift]);

  if (reduce) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div ref={ref} className={className} style={{ ...style, y }}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
