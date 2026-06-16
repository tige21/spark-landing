import { useEffect, useState } from 'react';
import { useScrollScene } from '../../lib/use-scroll-scene';
import { useMotionPrefs } from '../../lib/motion-guards';
import CanvasSequence from '../hero/CanvasSequence';
import Scene3D from '../ui/Scene3D';
import Layer from '../ui/Layer';
import WordReveal from '../ui/WordReveal';
import './AppPreview.css';

interface AppPreviewProps {
  headline: string;
  caption: string;
  poster: string;
  sparkSrc: string;
  hasFrames?: boolean;
}

// Pinned scroll-scrub showcase: an iPhone mock-up whose screen plays the real app
// scenario (browsing party-deck cards) frame-by-frame as you scroll ~1.3 viewports,
// reusing the hero's CanvasSequence + Scene3D parallax. Reduced-motion or a missing
// sequence → a normal centred block showing the static first-card poster (no pin).
export default function AppPreview({
  headline,
  caption,
  poster,
  sparkSrc,
  hasFrames,
}: AppPreviewProps) {
  const { ref, progress } = useScrollScene(['start start', 'end end']);
  const { reduced, small } = useMotionPrefs();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pinned = mounted && !reduced && !!hasFrames;
  const scrub = small ? 1 : 1.3;

  const sectionStyle = pinned
    ? { height: `${(1 + scrub) * 100}svh` }
    : { minHeight: 'auto' };
  const stageStyle = pinned
    ? ({ position: 'sticky', top: 0, height: '100svh' } as const)
    : ({ position: 'relative' } as const);

  return (
    <section ref={ref} className="app-preview" style={sectionStyle}>
      <div className="app-stage" style={stageStyle}>
        {!reduced && (
          <Scene3D perspective={1100} className="app-sparks" aria-hidden="true">
            <Layer
              progress={progress}
              depth={120}
              y={90}
              x={-24}
              scale={[0.9, 1.15]}
              style={{ position: 'absolute', top: '14%', left: '8%' }}
            >
              <img src={sparkSrc} alt="" style={{ width: 'clamp(34px, 4vw, 64px)', opacity: 0.5 }} />
            </Layer>
            <Layer
              progress={progress}
              depth={90}
              y={70}
              x={30}
              scale={[0.85, 1.1]}
              style={{ position: 'absolute', bottom: '18%', right: '10%' }}
            >
              <img src={sparkSrc} alt="" style={{ width: 'clamp(28px, 3vw, 52px)', opacity: 0.4 }} />
            </Layer>
          </Scene3D>
        )}

        <div className="app-wrap">
          <div className="app-copy">
            <h2 className="t-h1">
              <WordReveal text={headline} />
            </h2>
            <p className="t-lead app-caption">{caption}</p>
          </div>

          <div className="app-phone">
            <div className="app-phone-screen">
              <CanvasSequence
                progress={progress}
                poster={poster}
                name="app"
                nameMobile="app"
                enabled={!!hasFrames}
                enabledMobile={!!hasFrames}
                fit="cover"
                style={{ position: 'absolute', inset: 0 }}
              />
            </div>
            <span className="app-phone-island" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
