import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';
import { createScrollValue } from '../../lib/scroll-progress';
import { animateOnScroll } from '../../lib/scroll-anim';

interface ParallaxProps {
  children: ReactNode;
  axis?: 'x' | 'y';
  distance?: number;
  rotate?: number;
  scaleFrom?: number;
  scaleTo?: number;
  className?: string;
  style?: CSSProperties;
}

// Scroll-linked parallax (vanilla ScrollValue + rAF spring — no framer). Under
// reduced-motion / small (factor === 0) it renders a plain static div.
export default function Parallax({
  children,
  axis = 'y',
  distance = 80,
  rotate = 0,
  scaleFrom,
  scaleTo,
  className,
  style,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { factor } = useMotionPrefs();
  const isStatic = factor === 0;
  const hasScale = scaleFrom != null || scaleTo != null;

  useEffect(() => {
    if (isStatic) return;
    const el = ref.current;
    if (!el) return;

    const sv = createScrollValue(['start end', 'end start']);
    sv.attach(el);

    const d = distance * factor;
    const stop = animateOnScroll(sv, {
      channels: {
        move: { from: d / 2, to: -d / 2, spring: true },
        rot: { from: -rotate * 0.5 * factor, to: rotate * 0.5 * factor },
        scale: { from: scaleFrom ?? 1, to: scaleTo ?? 1 },
      },
      render: (v) => {
        const t = axis === 'y' ? `translateY(${v.move}px)` : `translateX(${v.move}px)`;
        el.style.transform =
          `${t}${rotate ? ` rotate(${v.rot}deg)` : ''}${hasScale ? ` scale(${v.scale})` : ''}`;
      },
    });

    // scroll-progress parks an item's MEASUREMENT when it is more than a viewport
    // away, but `will-change` is inline and was never withdrawn — every decorative
    // layer on the page kept a compositor layer alive for the whole session, seven
    // of them sitting up to 8500px off screen. Follow the same near/far rule.
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              el.style.willChange = entry.isIntersecting ? 'transform' : 'auto';
            },
            { rootMargin: '100% 0px 100% 0px' }
          );
    io?.observe(el);

    return () => {
      io?.disconnect();
      stop();
      sv.destroy();
    };
  }, [axis, distance, rotate, scaleFrom, scaleTo, factor, isStatic, hasScale]);

  if (isStatic) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ ...style, willChange: 'auto' }}>
      {children}
    </div>
  );
}
