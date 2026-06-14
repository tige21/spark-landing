import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';

interface HeroVideoProps {
  poster: string;
  mp4?: string;
  webm?: string;
  className?: string;
  style?: CSSProperties;
}

// Hero centerpiece "living engraving": static poster (LCP-safe) with a lazy, muted, looping
// video layered on top via mix-blend-mode: multiply (the cream video background drops out onto
// the paper). Video is never fetched when reduced-motion / small screen / no source — poster only.
export default function HeroVideo({ poster, mp4, webm, className, style }: HeroVideoProps) {
  const { reduced, small } = useMotionPrefs();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);

  const noVideo = reduced || small || (!mp4 && !webm);

  // Load the video only once the hero is in view.
  useEffect(() => {
    if (noVideo) return;
    const node = wrapRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [noVideo]);

  // Pause when offscreen or tab hidden.
  useEffect(() => {
    if (!load) return;
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !document.hidden) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.1 }
    );
    io.observe(v);
    const onVis = () => {
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  const blend: CSSProperties = { mixBlendMode: 'multiply' };

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: 'relative', ...style }}
      aria-hidden="true"
    >
      <img
        src={poster}
        alt=""
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          opacity: ready ? 0 : 1,
          transition: 'opacity 0.5s ease',
          ...blend,
        }}
      />
      {load && !noVideo && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          poster={poster}
          onLoadedData={() => setReady(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            ...blend,
          }}
        >
          {webm && <source src={webm} type="video/webm" />}
          {mp4 && <source src={mp4} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}
