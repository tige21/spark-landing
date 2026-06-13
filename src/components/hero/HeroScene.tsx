import { Suspense, lazy, useEffect, useRef, useState } from 'react';

const HeroCanvas = lazy(() => import('./HeroCanvas'));

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function allowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth < 760) return false;
  return hasWebGL();
}

export default function HeroScene() {
  const [mount, setMount] = useState(false);
  const [active, setActive] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (allowed()) setMount(true);
  }, []);

  useEffect(() => {
    if (!mount) return;
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && !document.hidden),
      { threshold: 0.05 }
    );
    io.observe(node);

    const onVisibility = () => {
      const visible = ref.current
        ? ref.current.getBoundingClientRect().bottom > 0
        : false;
      setActive(!document.hidden && visible);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [mount]);

  if (!mount) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <HeroCanvas active={active} />
      </Suspense>
    </div>
  );
}
