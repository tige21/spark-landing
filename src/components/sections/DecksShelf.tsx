import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { DECKS } from '../../config/site';
import { stamp } from '../../assets/images';

interface Props {
  lang: 'ru' | 'en';
}

export default function DecksShelf({ lang }: Props) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  const cards = DECKS.map((d) => ({
    id: d.id,
    url: stamp(d.stamp.replace(/\.svg$/, '')),
    name: d.name[lang],
    sample: d.sample[lang],
  }));

  return (
    <LazyMotion features={domAnimation} strict>
      <ul className="deck-grid">
        {cards.map((c) => {
          const isActive = active === c.id;
          return (
            <li key={c.id} className="deck-cell">
              <m.button
                type="button"
                className={`deck-card${isActive ? ' is-active' : ''}`}
                onClick={() => setActive(isActive ? null : c.id)}
                onMouseEnter={() => setActive(c.id)}
                onMouseLeave={() => setActive((prev) => (prev === c.id ? null : prev))}
                aria-expanded={isActive}
                whileHover={reduce ? undefined : { y: -6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                <img src={c.url} alt={c.name} width="120" height="120" loading="lazy" />
                <span className="deck-name">{c.name}</span>
                <span className={`deck-sample${isActive ? ' show' : ''}`}>
                  {c.sample}
                </span>
              </m.button>
            </li>
          );
        })}
      </ul>
    </LazyMotion>
  );
}
