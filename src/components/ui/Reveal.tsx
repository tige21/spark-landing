import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { observeInView } from '../../lib/in-view';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

// Fade/translate-in on scroll into view — CSS transition toggled by a shared
// IntersectionObserver (no framer-motion). Reduced-motion handled in CSS.
export default function Reveal({ children, delay = 0, className, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => observeInView(ref.current), []);
  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : 'reveal'}
      style={delay ? { transitionDelay: `${delay}s`, ...style } : style}
    >
      {children}
    </div>
  );
}
