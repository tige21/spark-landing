import Parallax from './Parallax';
import { engravings } from '../../assets/images';

export interface DecorLayer {
  name: string;
  width: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  speed?: number;
  rotate?: number;
  opacity?: number;
}

interface SectionDecorProps {
  layers: DecorLayer[];
}

export default function SectionDecor({ layers }: SectionDecorProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {layers.map((l, i) => {
        const asset = engravings[l.name];
        if (!asset) return null;
        return (
          <Parallax
            key={i}
            distance={(l.speed ?? 0.3) * 240}
            rotate={l.rotate ?? 0}
            style={{
              position: 'absolute',
              top: l.top,
              left: l.left,
              right: l.right,
              bottom: l.bottom,
              width: `${l.width}px`,
            }}
          >
            <img
              src={asset.src}
              alt=""
              loading="lazy"
              style={{
                width: '100%',
                height: 'auto',
                opacity: l.opacity ?? 0.1,
                display: 'block',
              }}
            />
          </Parallax>
        );
      })}
    </div>
  );
}
