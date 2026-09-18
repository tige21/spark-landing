import { PLAY_URL, TELEGRAM_BOT_URL } from '../../config/site';
import './PlayCTA.css';

type Variant = 'primary' | 'hero' | 'seal';
type Target = 'browser' | 'telegram';

interface PlayCTAProps {
  label: string;
  target?: Target;
  variant?: Variant;
  className?: string;
}

const SIZE_CLASS: Record<Variant, string> = {
  primary: 'cta-btn--sm',
  hero: 'cta-btn--md',
  seal: 'cta-btn--lg',
};

// The two ways into the game, as one component so the pair can never drift apart.
// Both render identically — the choice is between destinations, not between a
// main action and a lesser one, so neither is styled down. `browser` stays on
// this domain (/play, the Expo web build) and opens in the same tab; `telegram`
// leaves for the bot and opens in a new one. The labels name the destination, so
// the buttons carry no icon: the outlined play/plane pair read as stock UI.
export default function PlayCTA({ label, target = 'telegram', variant = 'primary', className }: PlayCTAProps) {
  const browser = target === 'browser';

  return (
    <a
      href={browser ? PLAY_URL : TELEGRAM_BOT_URL}
      {...(browser ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      className={['cta-btn', SIZE_CLASS[variant], className].filter(Boolean).join(' ')}
      data-cta={target}
      aria-label={label}
    >
      {label}
    </a>
  );
}
