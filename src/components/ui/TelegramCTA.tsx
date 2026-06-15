import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
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

export default function TelegramCTA({
  label,
  variant = 'primary',
  className,
}: TelegramCTAProps) {
  const reduce = useReducedMotion();

  const baseStyle: CSSProperties = {
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

  const content = (
    <>
      <PaperPlane size={variant === 'seal' ? 24 : 20} />
      <span>{label}</span>
    </>
  );

  const props = {
    href: TELEGRAM_BOT_URL,
    target: '_blank',
    rel: 'noopener noreferrer',
    className,
    'aria-label': label,
  };

  if (reduce) {
    return (
      <a {...props} style={baseStyle}>
        {content}
      </a>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.a
        {...props}
        style={baseStyle}
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      >
        {content}
      </m.a>
    </LazyMotion>
  );
}
