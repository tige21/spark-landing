import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

interface StampRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export default function StampReveal({
  children,
  delay = 0,
  className,
  style,
}: StampRevealProps) {
  const { reduced } = useMotionPrefs();

  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className={className}
        style={{ ...style, transformOrigin: 'center' }}
        initial={{ opacity: 0, scale: 1.08, rotate: -3 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ type: 'spring', stiffness: 240, damping: 17, mass: 0.7, delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
