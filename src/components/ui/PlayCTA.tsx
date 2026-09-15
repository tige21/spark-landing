import type { CSSProperties } from 'react';
import { PLAY_URL, TELEGRAM_BOT_URL } from '../../config/site';

type Variant = 'primary' | 'hero' | 'seal';
type Target = 'browser' | 'telegram';

interface PlayCTAProps {
  label: string;
  target?: Target;
  variant?: Variant;
  className?: string;
}

const SIZES: Record<Variant, CSSProperties> = {
  primary: { fontSize: '1rem', padding: '12px 22px' },
  hero: { fontSize: '1.125rem', padding: '16px 30px' },
  seal: { fontSize: '1.25rem', padding: '20px 38px' },
};

function PaperPlane({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </svg>
  );
}

function PlayMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M10 8.5 16 12l-6 3.5Z" fill="currentColor" />
    </svg>
  );
}

// The two ways into the game, as one component so the pair can never drift apart.
// Both render identically — the choice is between destinations, not between a
// main action and a lesser one, so neither is styled down. `browser` stays on
// this domain (/play, the Expo web build) and opens in the same tab; `telegram`
// leaves for the bot and opens in a new one.
export default function PlayCTA({ label, target = 'telegram', variant = 'primary', className }: PlayCTAProps) {
  const browser = target === 'browser';

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: 'var(--font-serif)',
    fontWeight: 600,
    color: 'var(--paper)',
    background: 'var(--wine)',
    borderRadius: 'var(--radius-full)',
    textDecoration: 'none',
    boxShadow: '0 6px 16px -9px color-mix(in srgb, var(--wine) 55%, transparent)',
    border: '1px solid color-mix(in srgb, var(--wine) 78%, #000)',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    ...SIZES[variant],
  };

  const iconSize = variant === 'seal' ? 24 : 20;

  return (
    <a
      href={browser ? PLAY_URL : TELEGRAM_BOT_URL}
      {...(browser ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      className={className ? `cta-btn ${className}` : 'cta-btn'}
      data-cta={target}
      aria-label={label}
      style={style}
    >
      {browser ? <PlayMark size={iconSize} /> : <PaperPlane size={iconSize} />}
      <span>{label}</span>
    </a>
  );
}
