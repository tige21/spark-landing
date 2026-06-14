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

## Production — sparkcards.space (VPS, nginx)

Hosted on the same VPS as the app staging (`root@185.214.108.29`), served by nginx. Build is local, never CI.

### 1. DNS (reg.ru, one-time)
Add A records pointing the domain at the server:

| Type | Host | Value |
| :-- | :-- | :-- |
| A | `@` | `185.214.108.29` |
| A | `www` | `185.214.108.29` |

Wait for propagation (`dig +short sparkcards.space` returns the IP).

### 2. Server setup (root, one-time — after DNS resolves)
```bash
# upload + enable the vhost
scp deploy/nginx-sparkcards.space.conf root@185.214.108.29:/etc/nginx/sites-available/sparkcards.space
ssh root@185.214.108.29 'ln -sf /etc/nginx/sites-available/sparkcards.space /etc/nginx/sites-enabled/ \
  && mkdir -p /var/www/sparkcards.space && nginx -t && systemctl reload nginx'
# issue SSL (adds 443 + HTTP→HTTPS redirect)
ssh root@185.214.108.29 'certbot --nginx -d sparkcards.space -d www.sparkcards.space \
  --non-interactive --agree-tos -m you@example.com --redirect'
```

### 3. Deploy (repeatable)
```bash
export STAGING_SSH_PASS='…'   # same server password as the app; never commit
npm run deploy                # build → backup remote → rsync dist/ → reload nginx
```
`scripts/deploy.sh` is the source of truth. `deploy/nginx-sparkcards.space.conf` is the vhost.

## Notes
- **i18n:** `/` = RU (default, no prefix), `/en` = EN. Both render the same section components from `src/content/{ru,en}.json`.
- **Primary CTA:** Telegram bot — `TELEGRAM_BOT_URL` in `src/config/site.ts` (`https://t.me/SparkCards_TestingBot`). Change there; it propagates to every CTA.
- **Performance:** static-first, no WebGL. The hero is a static engraving poster (LCP) + logo seal. All motion is framer-motion (transform/opacity only), `prefers-reduced-motion`-aware, reduced on mobile. Heaviest JS chunk is React (~180 KB).
- **Assets:** engravings live in `src/assets/engravings/`; PNGs are auto-optimized to WebP at build. Deck stamps are SVG. OG image is `public/og.png` (1200×630).
