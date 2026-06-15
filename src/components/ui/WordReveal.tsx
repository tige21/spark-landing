import type { CSSProperties } from 'react';

interface WordRevealProps {
  text: string;
  className?: string;
  style?: CSSProperties;
}

// Headline that reveals word-by-word on mount (above the fold). Pure CSS stagger
// (animation-delay via per-word `--i`) — no framer. Reduced-motion handled in CSS.
export default function WordReveal({ text, className, style }: WordRevealProps) {
  const words = text.split(' ');
  return (
    <span className={className ? `word-reveal ${className}` : 'word-reveal'} style={style}>
      {words.map((w, i) => (
        <span key={i} style={{ '--i': i } as CSSProperties}>
          {i < words.length - 1 ? `${w} ` : w}
        </span>
      ))}
    </span>
  );
}
