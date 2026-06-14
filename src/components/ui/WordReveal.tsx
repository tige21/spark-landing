import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

interface WordRevealProps {
  text: string;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}

const container = {
  hidden: {},
  visible: (delay: number) => ({
    transition: { staggerChildren: 0.08, delayChildren: delay },
  }),
};

const word = {
  hidden: { opacity: 0, y: '0.5em' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24, mass: 0.7 },
  },
};

// Headline that reveals one word at a time (framer-motion staggerChildren).
// Reduced motion → plain static text.
export default function WordReveal({ text, className, delay = 0.1, style }: WordRevealProps) {
  const { reduced } = useMotionPrefs();
  const words = text.split(' ');

  if (reduced) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.span
        className={className}
        style={{ display: 'inline-block', ...style }}
        variants={container}
        custom={delay}
        initial="hidden"
        animate="visible"
      >
        {words.map((w, i) => (
          <m.span
            key={i}
            variants={word}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
          >
            {i < words.length - 1 ? `${w} ` : w}
          </m.span>
        ))}
      </m.span>
    </LazyMotion>
  );
}
