import { useEffect, useRef, useState } from 'react';
import { useScrollScene } from '../../lib/use-scroll-scene';
import { useMotionPrefs } from '../../lib/motion-guards';
import CanvasSequence from './CanvasSequence';
import Scene3D from '../ui/Scene3D';
import Layer from '../ui/Layer';
import WordReveal from '../ui/WordReveal';
import PlayCTA from '../ui/PlayCTA';
import './HeroScroll.css';

const SCRUB = 2; // hero is (1 + SCRUB) × 100vh tall → ~2 viewports of scrub

interface HeroScrollProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  facts: string[];
  ctaLabel: string;
  ctaTelegramLabel: string;
  posterDesktop: string;
  posterMobile: string;
  sparkSrc: string;
  hasFrames?: boolean;
  hasFramesMobile?: boolean;
}

// Full-bleed pinned scroll-scrub hero. A card-creation engraving sequence plays
// frame-by-frame as the background while you scroll ~2 viewports; the headline
// fades out over the second half to reveal the cinematic frame. Works on mobile
// (separate vertical sequence, native-scroll driven). Reduced-motion or a missing
// sequence → a normal 100vh hero with the static poster (no pin, no scrub).
export default function HeroScroll({
  eyebrow,
  title,
  subtitle,
  facts,
  ctaLabel,
  ctaTelegramLabel,
  posterDesktop,
  posterMobile,
  sparkSrc,
  hasFrames,
  hasFramesMobile,
}: HeroScrollProps) {
  const { ref, progress } = useScrollScene(['start start', 'end end']);
  const { reduced, small } = useMotionPrefs();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeHasFrames = small ? hasFramesMobile : hasFrames;
  const pinned = mounted && !reduced && !!activeHasFrames;
  const scrub = small ? 1.4 : SCRUB; // shorter pin on mobile (lighter, less scroll-hijack)

  // Fade the copy out as the scrub plays so the cinematic frame (rising card/seal)
  // reveals cleanly and never collides with the CTA. Header CTA stays for action.
  // Static if not pinned.
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (!pinned) {
      el.style.opacity = '1';
      el.style.transform = '';
      el.style.pointerEvents = '';
      return;
    }
    const apply = (p: number) => {
      // Desktop: the copy stays put while the engraving sequence plays behind it
      // (a persistent headline over a playing "video"), so never fade it.
      if (!small) {
        el.style.opacity = '1';
        el.style.transform = '';
        el.style.pointerEvents = 'auto';
        return;
      }
      // Mobile: fade only over the last fifth of the scrub. Fading by 45% left
      // ~1.2 viewports of artwork with no words on it at all — the visitor was
      // scrolling a picture that no longer said what the product was.
      const o = Math.max(0, Math.min(1, (1 - p) / 0.2));
      el.style.opacity = String(o);
      el.style.transform = `translateY(${(1 - o) * -24}px)`;
      el.style.pointerEvents = o < 0.05 ? 'none' : 'auto';
    };
    apply(progress.get());
    return progress.on('change', apply);
  }, [pinned, progress, small]);

  // `svh` (small viewport height) is stable when the mobile browser chrome /
  // Telegram address bar shows or hides — `vh` would change and reflow the pinned
  // scene mid-scroll, causing the jank. svh keeps the geometry fixed.
  const sectionStyle = pinned
    ? { height: `${(1 + scrub) * 100}svh` }
    : { minHeight: '100svh' };
  const stageStyle = pinned
    ? ({ position: 'sticky', top: 0, height: '100svh' } as const)
    : ({ position: 'relative', minHeight: '100svh' } as const);

  return (
    <section ref={ref} className="hero" style={sectionStyle}>
        <div className="hero-stage" style={stageStyle}>
          <div className="hero-bg">
            <CanvasSequence
              progress={progress}
              poster={posterDesktop}
              posterMobile={posterMobile}
              name="hero"
              nameMobile="hero-mobile"
              enabled={!!hasFrames}
              enabledMobile={!!hasFramesMobile}
              fit="cover"
            />
          </div>

          <div className="hero-scrim" />

          {!reduced && (
            <Scene3D perspective={1000} className="hero-fg">
              <Layer
                progress={progress}
                depth={160}
                y={140}
                x={-30}
                scale={[0.9, 1.2]}
                style={{ position: 'absolute', top: '16%', left: '12%' }}
              >
                <img src={sparkSrc} alt="" style={{ width: 'clamp(40px, 6vw, 84px)', opacity: 0.7 }} />
              </Layer>
              <Layer
                progress={progress}
                depth={110}
                y={110}
                x={40}
                scale={[0.85, 1.1]}
                style={{ position: 'absolute', bottom: '20%', right: '14%' }}
              >
                <img src={sparkSrc} alt="" style={{ width: 'clamp(30px, 4vw, 64px)', opacity: 0.55 }} />
              </Layer>
            </Scene3D>
          )}

          <div className="hero-content" ref={contentRef}>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="t-display">
              <WordReveal text={title} />
            </h1>
            <p className="t-lead subtitle">{subtitle}</p>
            <div className="hero-cta">
              <PlayCTA label={ctaLabel} target="browser" variant="hero" />
              <PlayCTA label={ctaTelegramLabel} target="telegram" variant="hero" />
            </div>
            <ul className="hero-facts">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
  );
}
