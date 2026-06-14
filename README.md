# Spark Cards — Landing

Premium one-page marketing site for **Spark Cards**, built in the app's Postcard/Letterpress engraving identity (postcardTokens + Lora/Tangerine). RU (`/`) + EN (`/en`). The primary call-to-action is the **Telegram bot**.

## Stack
- **Astro 6** (static output, island architecture) + **React 19** islands
- **framer-motion** — all animation: scroll-driven parallax, stamp-in reveals, hero dissolve, the postal-route draw (`LazyMotion` for a small bundle)
- Design tokens ported from the app into `src/styles/tokens.css`

## Structure
```
src/
├── assets/engravings/   # reusable engravings (PNG) + 9 deck stamps (SVG)
├── assets/images.ts     # image registry (auto WebP for PNGs)
├── components/
│   ├── layout/          # Nav, Footer, Section, Container
│   ├── hero/            # Hero.astro + HeroContentMotion (scroll dissolve)
│   ├── sections/        # What, How, Decks, Order, Premium, FinalCta, PostalRoute
│   └── ui/              # Reveal, StampReveal, Parallax, SectionDecor, TelegramCTA
├── config/site.ts       # bot URL, nav, deck data (single source of truth)
├── content/{ru,en}.json # all marketing copy
└── pages/               # index.astro (ru) + en/index.astro
```

## Commands
| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build static site to `./dist/` |
| `npm run preview` | Serve the built site |
| `npm run test:e2e` | Playwright visual smoke (desktop + mobile, ru + en) |

## Performance
Static-first: zero JS by default, React islands only where animation is needed. The hero is a static engraving poster (LCP) + the logo seal. All motion is framer-motion (transform/opacity only), honours `prefers-reduced-motion`, and reduces magnitude on mobile. No WebGL/three.js — the heaviest chunk is React itself (~180 KB).

See **[DEPLOY.md](./DEPLOY.md)** for build & hosting.
