import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const SMALL_SCREEN_QUERY = '(max-width: 760px)';

export interface MotionPrefs {
  reduced: boolean;
  small: boolean;
  factor: number;
}

export function useMotionPrefs(): MotionPrefs {
  const reduced = useReducedMotion() ?? false;
  const [small, setSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(SMALL_SCREEN_QUERY);
    const update = () => setSmall(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const factor = reduced ? 0 : small ? 0.5 : 1;
  return { reduced, small, factor };
}
