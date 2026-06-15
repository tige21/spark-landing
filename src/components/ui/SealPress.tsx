import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

interface SealPressProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Wax-seal "press": the seal arrives from +Z (toward the viewer), scaled up and
// tilted, then presses flat onto the paper with a drop-shadow that blooms and
// settles. Guarded — static under reduced-motion.
export default function SealPress({ children, className, style }: SealPressProps) {
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
        style={{
          ...style,
          transformPerspective: 700,
          transformOrigin: 'center',
          willChange: 'transform, filter',
        }}
        initial={{
          opacity: 0,
          z: 120,
          scale: 1.35,
          rotate: -8,
          filter: 'drop-shadow(0 18px 22px rgba(44,38,32,0))',
        }}
        whileInView={{
          opacity: 1,
          z: 0,
          scale: 1,
          rotate: 0,
          filter: 'drop-shadow(0 6px 9px rgba(44,38,32,0.28))',
        }}
        viewport={{ once: true, margin: '0px 0px -15% 0px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, mass: 0.8 }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
