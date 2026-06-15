import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { observeInView } from '../../lib/in-view';

interface StampRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

// "Stamp" reveal: scale+rotate settle as it enters view. CSS (.reveal-stamp)
// toggled by IntersectionObserver; `delay` → transition-delay.
export default function StampReveal({ children, delay = 0, className, style }: StampRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => observeInView(ref.current), []);
  return (
    <div
      ref={ref}
      className={className ? `reveal-stamp ${className}` : 'reveal-stamp'}
      style={delay ? { transitionDelay: `${delay}s`, ...style } : style}
    >
      {children}
    </div>
  );
}
