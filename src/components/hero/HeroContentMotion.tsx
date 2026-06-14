import { LazyMotion, domAnimation, m, useScroll, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

interface Props {
  children: ReactNode;
}

export default function HeroContentMotion({ children }: Props) {
  const { reduced } = useMotionPrefs();
  const { scrollY } = useScroll();

  const y = useTransform(scrollY, [0, 600], [0, -140], { clamp: true });
  const opacity = useTransform(scrollY, [0, 480], [1, 0], { clamp: true });
  const scale = useTransform(scrollY, [0, 600], [1, 0.94], { clamp: true });

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div style={{ y, opacity, scale, willChange: 'transform' }}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
