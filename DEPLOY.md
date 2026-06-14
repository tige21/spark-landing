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

## Production — sparkcards.space (Russian VPS, nginx)

Hosted on a **Russian VPS** (`root@83.217.215.66`) so the site loads from inside Russia. Debian 12 + nginx + certbot. Build is local, never CI. (Migrated 2026-06-14 from the foreign app-staging box, which was unreachable from RU.)

### DNS (reg.ru)
A records point the domain at the server:

| Type | Host | Value |
| :-- | :-- | :-- |
| A | `@` | `83.217.215.66` |
| A | `www` | `83.217.215.66` |

Check: `curl -s 'https://dns.google/resolve?name=sparkcards.space&type=A'`.

### Server setup (root, one-time — already done on 83.217.215.66)
The vhost (`/etc/nginx/sites-available/sparkcards.space`, the certbot-built version with 443 + HTTP→HTTPS redirect) and the Let's Encrypt cert were migrated from the old box, so HTTPS was live the moment DNS flipped. To re-provision from scratch on a fresh server:
```bash
scp deploy/nginx-sparkcards.space.conf root@<ip>:/etc/nginx/sites-available/sparkcards.space
ssh root@<ip> 'ln -sf /etc/nginx/sites-available/sparkcards.space /etc/nginx/sites-enabled/ \
  && mkdir -p /var/www/sparkcards.space && nginx -t && systemctl reload nginx'
# after DNS resolves to <ip>:
ssh root@<ip> 'certbot --nginx -d sparkcards.space -d www.sparkcards.space \
  --non-interactive --agree-tos -m mregoryt@gmail.com --redirect'
# certbot writes `listen 443 ssl;` WITHOUT http2 — enable it:
ssh root@<ip> "sed -i 's/listen 443 ssl;/listen 443 ssl http2;/; s/listen \[::\]:443 ssl;/listen [::]:443 ssl http2;/' /etc/nginx/sites-available/sparkcards.space && nginx -t && systemctl reload nginx"
```

### Deploy (repeatable)
```bash
export LANDING_SSH_PASS='…'   # Russian VPS root password; never commit
npm run deploy                # build → backup remote → rsync dist/ → reload nginx
```
`scripts/deploy.sh` is the source of truth (targets `83.217.215.66`).

## Notes
- **i18n:** `/` = RU (default, no prefix), `/en` = EN. Both render the same section components from `src/content/{ru,en}.json`.
- **Primary CTA:** Telegram bot — `TELEGRAM_BOT_URL` in `src/config/site.ts` (`https://t.me/SparkCards_TestingBot`). Change there; it propagates to every CTA.
- **Performance:** static-first, no WebGL. The hero is a static engraving poster (LCP) + logo seal. All motion is framer-motion (transform/opacity only), `prefers-reduced-motion`-aware, reduced on mobile. Heaviest JS chunk is React (~180 KB).
- **Assets:** engravings live in `src/assets/engravings/`; PNGs are auto-optimized to WebP at build. Deck stamps are SVG. OG image is `public/og.png` (1200×630).
