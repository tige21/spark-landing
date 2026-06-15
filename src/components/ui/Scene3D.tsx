import type { CSSProperties, ReactNode } from 'react';

interface Scene3DProps {
  perspective?: number;
  perspectiveOrigin?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// Establishes a 3D rendering context: `perspective` makes child translateZ read
// as real depth, `preserve-3d` lets nested Layers compose in the same space.
// Purely a container — no motion of its own.
export default function Scene3D({
  perspective = 1200,
  perspectiveOrigin = '50% 45%',
  className,
  style,
  children,
}: Scene3DProps) {
  return (
    <div
      className={className}
      style={{
        perspective: `${perspective}px`,
        perspectiveOrigin,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
