import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { observeInView } from '../../lib/in-view';

interface SealPressProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Wax-seal "press": arrives scaled+tilted and presses flat with a shadow bloom
// as it enters view. CSS (.reveal-seal) toggled by IntersectionObserver.
export default function SealPress({ children, className, style }: SealPressProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => observeInView(ref.current), []);
  return (
    <div ref={ref} className={className ? `reveal-seal ${className}` : 'reveal-seal'} style={style}>
      {children}
    </div>
  );
}
