import { useState } from 'react';
import { useMotionPrefs } from '../../lib/motion-guards';
import './WhatCards.css';

export interface WhatCard {
  label: string;
  icon: string; // resolved SVG src (from What.astro)
  sample: string;
  gated?: boolean;
  gate?: string;
  confirm?: string;
}

interface Props {
  cards: WhatCard[];
}

// Flip cards for the "What" section. Click a card → it flips to reveal a sample
// question. The gated (18+) card first shows an on-card age/rules confirm; only
// after confirming does the question appear. Reduced-motion → no 3D flip, the
// faces cross-fade instead (handled in CSS via the .is-reduced class).
export default function WhatCards({ cards }: Props) {
  return (
    <div className="what-cards">
      {cards.map((c, i) => (
        <FlipCard key={c.label + i} card={c} />
      ))}
    </div>
  );
}

function FlipCard({ card }: { card: WhatCard }) {
  const { reduced } = useMotionPrefs();
  const [flipped, setFlipped] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const gated = !!card.gated;

  const toggle = () => setFlipped((f) => !f);

  return (
    <div className={`flip${flipped ? ' is-flipped' : ''}${reduced ? ' is-reduced' : ''}`}>
      <div className="flip-inner">
        <button
          type="button"
          className="flip-face flip-front"
          onClick={toggle}
          aria-label={`${card.label} — показать пример вопроса`}
        >
          <img className="flip-icon" src={card.icon} alt="" width="72" height="72" loading="lazy" />
          <span className="t-h3 flip-label">{card.label}</span>
          <span className="flip-hint">пример вопроса →</span>
        </button>

        <div className="flip-face flip-back">
          {gated && !confirmed ? (
            <div className="flip-gate">
              <p className="flip-gate-text">{card.gate}</p>
              <button type="button" className="flip-confirm" onClick={() => setConfirmed(true)}>
                {card.confirm}
              </button>
              <button type="button" className="flip-back-link" onClick={toggle}>
                Назад
              </button>
            </div>
          ) : (
            <button type="button" className="flip-q" onClick={toggle} aria-label="Скрыть пример">
              <span className="flip-q-mark">«</span>
              <span className="flip-q-text">{card.sample}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
