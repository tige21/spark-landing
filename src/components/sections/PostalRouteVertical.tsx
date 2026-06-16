import { useEffect, useRef } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';
import { createScrollValue } from '../../lib/scroll-progress';

// Mobile vertical connector for the How steps (the horizontal PostalRoute is
// hidden on small screens). A faint vertical thread links the stacked steps; a
// wine fill + dot travel down as you scroll. Drives a `--p` (0..1) CSS var; the
// visuals live in How.astro's mobile styles. Reduced-motion → fully drawn, no dot.
export default function PostalRouteVertical() {
  const { reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.style.setProperty('--p', '1');
      return;
    }
    const sv = createScrollValue(['start 80%', 'end 55%']);
    sv.attach(el);
    const update = (v: number) => {
      el.style.setProperty('--p', String(v < 0 ? 0 : v > 1 ? 1 : v));
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
      <span className="route-v-fill" />
      <span className="route-v-dot" />
    </div>
  );
}
