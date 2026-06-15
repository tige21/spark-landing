import { LazyMotion, domAnimation, m, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useScrollScene } from '../../lib/use-scroll-scene';
import { useMotionPrefs } from '../../lib/motion-guards';
import CanvasSequence from './CanvasSequence';
import Scene3D from '../ui/Scene3D';
import Layer from '../ui/Layer';
import WordReveal from '../ui/WordReveal';
import TelegramCTA from '../ui/TelegramCTA';
import './HeroScroll.css';

const SCRUB = 2; // hero is (1 + SCRUB) × 100vh tall → ~2 viewports of scrub

interface HeroScrollProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  scrollLabel: string;
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
  ctaLabel,
  scrollLabel,
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

  const contentOpacity = useTransform(progress, [0, 0.5, 0.82], [1, 1, 0]);
  const contentY = useTransform(progress, [0, 0.82], [0, -40]);

  const sectionStyle = pinned
    ? { height: `${(1 + SCRUB) * 100}vh` }
    : { minHeight: '100vh' };
  const stageStyle = pinned
    ? ({ position: 'sticky', top: 0, height: '100vh' } as const)
    : ({ position: 'relative', minHeight: '100vh' } as const);

  return (
    <LazyMotion features={domAnimation} strict>
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

          <m.div
            className="hero-content"
            style={pinned ? { opacity: contentOpacity, y: contentY } : undefined}
          >
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="t-display">
              <WordReveal text={title} />
            </h1>
            <p className="t-lead subtitle">{subtitle}</p>
            <div className="hero-cta">
              <TelegramCTA label={ctaLabel} variant="hero" />
            </div>
            <a className="scroll-cue" href="#how">
              {scrollLabel}
            </a>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
}
