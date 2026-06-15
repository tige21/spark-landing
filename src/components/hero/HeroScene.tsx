import Scene3D from '../ui/Scene3D';
import Layer from '../ui/Layer';
import CanvasSequence from './CanvasSequence';
import { useScrollScene } from '../../lib/use-scroll-scene';

interface HeroSceneProps {
  bgSrc: string; // optimized bg-celestial url
  pressSrc: string; // optimized phase-print engraving (centerpiece poster)
  sparkSrc: string; // optimized spark-mark engraving
  hasFrames?: boolean; // scrub sequence available (built-time check)
}

const GRID_PLANE: React.CSSProperties = {
  position: 'absolute',
  inset: '-25%',
  backgroundImage:
    'linear-gradient(to right, color-mix(in srgb, var(--ink) 14%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--ink) 14%, transparent) 1px, transparent 1px)',
  backgroundSize: '56px 56px',
  transform: 'rotateX(38deg) scale(1.2)',
  transformOrigin: '50% 28%',
  opacity: 0.5,
};

const GRID_MASK =
  'radial-gradient(125% 95% at 50% 42%, #000 0%, rgba(0,0,0,0.4) 48%, transparent 78%)';

const fill: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// Hero "living engraving" diorama: layered planes at different depths inside one
// Scene3D, all driven by a single scroll progress. bg drifts slowly, the grid is
// the engraved floor, the press centerpiece dollies toward the viewer (camera
// push) via CanvasSequence (poster until a frame sequence exists), and foreground
// ink sparks parallax fastest. Under reduced-motion / small, every Layer renders
// static → a flat composition (handled inside Layer + CanvasSequence).
export default function HeroScene({ bgSrc, pressSrc, sparkSrc, hasFrames }: HeroSceneProps) {
  const { ref, progress } = useScrollScene();

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
      <Scene3D perspective={1100} className="hero-scene" style={{ position: 'absolute', inset: 0 }}>
        {/* Back: celestial field, slow drift + gentle zoom */}
        <Layer progress={progress} depth={-700} y={60} scale={[1.12, 1.24]} style={fill}>
          <img
            src={bgSrc}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, mixBlendMode: 'multiply' }}
          />
        </Layer>

        {/* Engraved floor grid */}
        <Layer
          progress={progress}
          depth={-360}
          y={30}
          style={{ ...fill, WebkitMaskImage: GRID_MASK, maskImage: GRID_MASK }}
        >
          <div style={{ position: 'absolute', inset: 0, perspective: '900px', overflow: 'hidden' }}>
            <div style={GRID_PLANE} />
          </div>
        </Layer>

        {/* Centerpiece press — camera dolly in + slight scale */}
        <Layer
          progress={progress}
          zRange={[-140, 160]}
          scale={[0.9, 1.08]}
          opacity={[1, 0.85]}
          style={fill}
        >
          <CanvasSequence
            progress={progress}
            poster={pressSrc}
            name="hero"
            enabled={hasFrames}
            style={{ width: 'min(440px, 64vw)' }}
          />
        </Layer>

        {/* Foreground ink sparks — nearest, fastest parallax */}
        <Layer progress={progress} depth={180} y={180} x={-40} scale={[0.9, 1.2]} rotateX={[0, 12]}
          style={{ position: 'absolute', top: '18%', left: '14%' }}>
          <img src={sparkSrc} alt="" style={{ width: 'clamp(48px, 7vw, 96px)', opacity: 0.8 }} />
        </Layer>
        <Layer progress={progress} depth={120} y={140} x={50} scale={[0.8, 1.1]} rotateX={[0, -10]}
          style={{ position: 'absolute', bottom: '20%', right: '16%' }}>
          <img src={sparkSrc} alt="" style={{ width: 'clamp(36px, 5vw, 72px)', opacity: 0.65 }} />
        </Layer>
      </Scene3D>
    </div>
  );
}
