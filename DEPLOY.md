# Spark Cards Landing — Build & Deploy

Static Astro site. No server runtime — `astro build` emits a plain `dist/` you can host anywhere.

## Build

```bash
npm install
npm run build      # → dist/  (static HTML + hashed assets, images pre-converted to WebP)
npm run preview    # serve dist/ locally at http://localhost:4321
```

## Test (visual smoke)

```bash
npx playwright install chromium   # once
npm run test:e2e                  # desktop + mobile, ru + en
```

## Deploy

The output is fully static — `dist/` can go to any static host.

**Option A — nginx (same box as the app staging):**
```bash
npm run build
rsync -az --delete dist/ <user>@<host>:/var/www/spark-landing/
# nginx: root /var/www/spark-landing;  try_files $uri $uri/ /index.html;
```

**Option B — Netlify / Vercel / Cloudflare Pages:** point at the repo, build command `npm run build`, publish dir `dist`. No env vars required.

## Notes
- **i18n:** `/` = RU (default, no prefix), `/en` = EN. Both render the same section components from `src/content/{ru,en}.json`.
- **Primary CTA:** Telegram bot — `TELEGRAM_BOT_URL` in `src/config/site.ts` (`https://t.me/SparkCards_TestingBot`). Change there; it propagates to every CTA.
- **Performance:** static-first, no WebGL. The hero is a static engraving poster (LCP) + logo seal. All motion is framer-motion (transform/opacity only), `prefers-reduced-motion`-aware, reduced on mobile. Heaviest JS chunk is React (~180 KB).
- **Assets:** engravings live in `src/assets/engravings/`; PNGs are auto-optimized to WebP at build. Deck stamps are SVG. OG image is `public/og.png` (1200×630).
