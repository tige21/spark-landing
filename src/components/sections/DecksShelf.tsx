import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { DECKS } from '../../config/site';
import { stamp } from '../../assets/images';
import { observeInView } from '../../lib/in-view';

interface Props {
  lang: 'ru' | 'en';
}

// Deck grid. Staggered 3D entrance + hover tilt-lift via CSS (see Decks.astro):
// IntersectionObserver adds `is-in` to the grid; per-cell `--i` drives the stagger.
export default function DecksShelf({ lang }: Props) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => observeInView(ref.current), []);

  const cards = DECKS.map((d) => ({
    id: d.id,
    url: stamp(d.stamp.replace(/\.svg$/, '')),
    name: d.name[lang],
    sample: d.sample[lang],
  }));

  // Touch tap → lift (mirrors the desktop :hover). `:active` is unreliable on iOS,
  // so we toggle a class on touch pointers only.
  const tapOn = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') e.currentTarget.classList.add('is-tapped');
  };
  const tapOff = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('is-tapped');
  };

  return (
    <ul ref={ref} className="deck-grid">
      {cards.map((c, i) => (
        <li className="deck-cell" key={c.id} style={{ '--i': i } as CSSProperties}>
          <div
            className="deck-card"
            onPointerDown={tapOn}
            onPointerUp={tapOff}
            onPointerCancel={tapOff}
            onPointerLeave={tapOff}
          >
            <img src={c.url} alt={c.name} width="110" height="110" loading="lazy" />
            <span className="deck-name">{c.name}</span>
            <span className="deck-sample">{c.sample}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
