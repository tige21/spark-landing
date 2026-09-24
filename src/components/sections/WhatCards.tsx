import { useState } from 'react';
import './WhatCards.css';

export interface WhatCard {
  label: string;
  icon: string; // resolved SVG src (from What.astro)
  occasion: string;
  sample: string;
  gated?: boolean;
  gate?: string;
  confirm?: string;
}

interface Props {
  cards: WhatCard[];
}

// The sample question is the strongest thing this section has, so it is on the
// card from the start — behind a click it was invisible to everyone who only
// scrolls. The 18+ card still hides its question behind the age gate.
export default function WhatCards({ cards }: Props) {
  return (
    <div className="what-cards">
      {cards.map((c, i) => (
        <Card key={c.label + i} card={c} />
      ))}
    </div>
  );
}

function Card({ card }: { card: WhatCard }) {
  const [revealed, setRevealed] = useState(!card.gated);

  return (
    <article className="what-card">
      <img className="what-card-icon" src={card.icon} alt="" width="72" height="72" loading="lazy" />
      <h3 className="t-h3 what-card-label">{card.label}</h3>
      <p className="what-card-occasion">{card.occasion}</p>

      {revealed ? (
        <p className="what-card-q">
          <span className="what-card-q-mark">«</span>
          <span>{card.sample}</span>
        </p>
      ) : (
        <div className="what-card-gate">
          <p className="what-card-gate-text">{card.gate}</p>
          <button type="button" className="what-card-confirm" onClick={() => setRevealed(true)}>
            {card.confirm}
          </button>
        </div>
      )}
    </article>
  );
}
