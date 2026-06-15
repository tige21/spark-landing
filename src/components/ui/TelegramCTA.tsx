import type { CSSProperties } from 'react';
import { TELEGRAM_BOT_URL } from '../../config/site';

type Variant = 'primary' | 'hero' | 'seal';

interface TelegramCTAProps {
  label: string;
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </svg>
  );
}

// Primary CTA. Hover/tap micro-interaction is pure CSS (.tg-cta — see tokens.css),
// no framer-motion.
export default function TelegramCTA({ label, variant = 'primary', className }: TelegramCTAProps) {
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

  return (
    <a
      href={TELEGRAM_BOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? `tg-cta ${className}` : 'tg-cta'}
      aria-label={label}
      style={style}
    >
      <PaperPlane size={variant === 'seal' ? 24 : 20} />
      <span>{label}</span>
    </a>
  );
}
