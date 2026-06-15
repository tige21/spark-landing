import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { observeInView } from '../../lib/in-view';

interface TiltInProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Perspective "postcard" entrance: section tilts up from rotateX + lift + fade as
// it enters view, settling flat. One-shot CSS (.reveal-tilt) via IntersectionObserver.
export default function TiltIn({ children, className, style }: TiltInProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => observeInView(ref.current), []);
  return (
    <div ref={ref} className={className ? `reveal-tilt ${className}` : 'reveal-tilt'} style={style}>
      {children}
    </div>
  );
}
