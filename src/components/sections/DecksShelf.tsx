import { LazyMotion, domAnimation, m } from 'framer-motion';
import { DECKS } from '../../config/site';
import { stamp } from '../../assets/images';
import { useMotionPrefs } from '../../lib/motion-guards';

interface Props {
  lang: 'ru' | 'en';
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, scale: 1.08, rotate: -3 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 240, damping: 18, mass: 0.7 },
  },
};

export default function DecksShelf({ lang }: Props) {
  const { reduced } = useMotionPrefs();

  const cards = DECKS.map((d) => ({
    id: d.id,
    url: stamp(d.stamp.replace(/\.svg$/, '')),
    name: d.name[lang],
    sample: d.sample[lang],
  }));

  return (
    <LazyMotion features={domAnimation} strict>
      <m.ul
        className="deck-grid"
        variants={reduced ? undefined : container}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      >
        {cards.map((c) => (
          <m.li
            key={c.id}
            className="deck-cell"
            variants={reduced ? undefined : item}
          >
            <m.div
              className="deck-card"
              whileHover={reduced ? undefined : { y: -6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <img src={c.url} alt={c.name} width="110" height="110" loading="lazy" />
              <span className="deck-name">{c.name}</span>
              <span className="deck-sample">{c.sample}</span>
            </m.div>
          </m.li>
        ))}
      </m.ul>
    </LazyMotion>
  );
}
