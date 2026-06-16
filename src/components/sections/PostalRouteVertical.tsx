import { useEffect, useRef } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';
import { createScrollValue } from '../../lib/scroll-progress';

// Serpentine vertical connector for the mobile How steps. The line weaves
// left→right→left between the stacked steps (so it curves AROUND the centred
// copy instead of running through it). It draws itself on scroll (stroke-dashoffset
// over a faint full path) with a wine dot riding the curve. viewBox is stretched
// to the band (preserveAspectRatio=none); `non-scaling-stroke` keeps the line crisp,
// and the dot is a plain HTML element positioned by % so it stays round.
// Symmetric serpentine whose centre-crossing NODES (y = 0, 1/3, 2/3, 1) land
// exactly on the four card centres (the band is positioned to span card1→card4
// centre in How.astro, and the cards are evenly spaced). It crosses through the
// middle of each block and bows out to the side over the gaps between them.
const PATH =
  'M60,0 C112,83 112,250 60,333 C8,417 8,583 60,667 C112,750 112,917 60,1000';
const VB_W = 120;
const VB_H = 1000;

export default function PostalRouteVertical() {
  const { reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const drawRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;
    const len = draw.getTotalLength();
    draw.style.strokeDasharray = String(len);

    if (reduced) {
      draw.style.strokeDashoffset = '0';
      return;
    }

    draw.style.strokeDashoffset = String(len);
    const dot = dotRef.current;
    const sv = createScrollValue(['start 80%', 'end 55%']);
    sv.attach(ref.current);

    const update = (v: number) => {
      const p = v < 0 ? 0 : v > 1 ? 1 : v;
      draw.style.strokeDashoffset = String(len * (1 - p));
      if (dot) {
        const pt = draw.getPointAtLength(len * p);
        dot.style.left = `${(pt.x / VB_W) * 100}%`;
        dot.style.top = `${(pt.y / VB_H) * 100}%`;
      }
    };
    update(sv.get());
    const unsub = sv.on('change', update);
    return () => {
      unsub();
      sv.destroy();
    };
  }, [reduced]);

  return (
    <div ref={ref} className="route-v" aria-hidden="true">
      <svg className="route-v-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} fill="none" preserveAspectRatio="none">
        <path className="route-v-track" d={PATH} />
        <path ref={drawRef} className="route-v-draw" d={PATH} />
      </svg>
      <span ref={dotRef} className="route-v-dot" />
    </div>
  );
}
