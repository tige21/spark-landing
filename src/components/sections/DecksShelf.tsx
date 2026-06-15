import { LazyMotion, domAnimation, m } from 'framer-motion';
import { DECKS } from '../../config/site';
import { stamp } from '../../assets/images';
import { useMotionPrefs } from '../../lib/motion-guards';

interface Props {
  lang: 'ru' | 'en';
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, z: -90, rotateX: 22, y: 30 },
  visible: {
    opacity: 1,
    z: 0,
    rotateX: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 230, damping: 20, mass: 0.7 },
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
        style={reduced ? undefined : { perspective: 1100, transformStyle: 'preserve-3d' }}
      >
        {cards.map((c) => (
          <m.li
            key={c.id}
            className="deck-cell"
            variants={reduced ? undefined : item}
            style={reduced ? undefined : { transformStyle: 'preserve-3d' }}
          >
            <m.div
              className="deck-card"
              style={reduced ? undefined : { transformPerspective: 600 }}
              whileHover={reduced ? undefined : { rotateX: -7, y: -8, z: 36 }}
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
