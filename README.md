# Spark Cards — Landing

Premium one-page marketing site for **Spark Cards**, built in the app's Postcard/Letterpress engraving identity (postcardTokens + Lora/Tangerine). RU (`/`) + EN (`/en`). The primary call-to-action is the **Telegram bot**.

## Stack
- **Astro 6** (static output, island architecture) + **React 19** islands
- **framer-motion** — scroll reveals & micro-interactions (`LazyMotion` for a small bundle)
- **three.js / @react-three/fiber** — the 3D hero scene (lazy, desktop-only)
- Design tokens ported from the app into `src/styles/tokens.css`

## Structure
```
src/
├── assets/engravings/   # reusable engravings (PNG) + 9 deck stamps (SVG)
├── assets/images.ts     # image registry (auto WebP for PNGs)
├── components/
│   ├── layout/          # Nav, Footer, Section, Container
│   ├── hero/            # Hero.astro + HeroScene/HeroCanvas (3D island)
│   ├── sections/        # What, How, Decks, Order, Premium, FinalCta
│   └── ui/              # Reveal, Parallax, TelegramCTA
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
The 3D hero (`three`, ~890 KB) is a lazy chunk loaded **only** on desktop with WebGL and motion allowed. Mobile / reduced-motion / no-WebGL get a static engraving poster (LCP), and three.js is never fetched.

See **[DEPLOY.md](./DEPLOY.md)** for build & hosting.
