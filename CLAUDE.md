# Spark Cards — Landing (`spark-landing`)

Маркетинговый одностраничник **sparkcards.space** (RU `/`, EN `/en`). Игра — в соседнем репозитории
`../spark` (Expo web, живёт на подпути `/play` того же домена). Репозитории отдельные, деплой разный.

## Stack

Astro 6 (static output, islands) + React 19 + `lenis` (smooth scroll). Node ≥ 22.12.
**framer-motion удалён** — вся анимация своя: `src/lib/{scroll-anim,scroll-progress,use-scroll-scene,in-view,motion-guards}.ts`
(transform/opacity, уважает `prefers-reduced-motion`). README.md и DEPLOY.md всё ещё упоминают framer-motion — это устаревший текст.

```bash
npm install      # deps
npm run dev      # localhost:4321
npm run build    # → dist/
npm run test:e2e # Playwright: desktop + mobile, ru + en
npm run deploy   # scripts/deploy.sh — build + rsync на оба зеркала + reload nginx
```

## Единые источники правды

| Что | Файл |
|---|---|
| URL Telegram-бота (главный CTA), навигация, данные колод | `src/config/site.ts` |
| Весь маркетинговый текст | `src/content/{ru,en}.json` |
| Дизайн-токены (порт из приложения) | `src/styles/tokens.css` |
| Кадры скролл-скраба | `public/hero-frames/**` (Git LFS) |

Правка текста — только в `content/*.json`, не в `.astro`. CTA — только `TELEGRAM_BOT_URL`
(сейчас прод-бот `@SparkCardsBot`), он растекается по всем кнопкам.

## Git LFS — обязателен для локального билда

`public/hero-frames/**` (279 файлов) трекаются через LFS. Без установленного `git lfs` клон получает
пойнтеры по ~130 байт, `astro build` кладёт в `dist/` мусор, а `rsync --delete` **стёр бы живые кадры
с зеркал** (ломает hero, экран телефона и пин секции ThroughPhone).

```bash
brew install git-lfs && git lfs install && git lfs pull
```

Гарды, которые это ловят (**никогда не отключать**): проверка `dist/hero-frames/{hero,decks,play,create}/0001.webp`
в `scripts/deploy.sh` и шаг `Verify build output` в CI (там же проверка на размер > 1000 байт = не пойнтер).

## Деплой

- **CI (основной путь):** push в `main`, затрагивающий `src/**`, `public/**`, `package*.json`,
  `astro.config.mjs` → `.github/workflows/deploy-landing.yml` собирает в облаке (`lfs: true`) и
  rsync'ит `dist/` на оба зеркала в `/var/www/sparkcards.space`.
- **Руками с дев-машины:** `LANDING_SSH_PASS=... NL_SSH_PASS=... npm run deploy`.
- **Никогда не собирать лендинг на боксах** — Node-билд конкурирует с живым продом, DevStand'ом и
  чужими проектами на 194. Билд — CI или дев-машина.
- Секреты (`LANDING_SSH_PASS`, `NL_SSH_PASS`) только в env, никогда в git.

### ⚠️ Расхождение с инфраструктурой (проверено 2026-09-11)

Репозиторий описывает инфраструктуру состояния июня 2026. По данным `../spark/CLAUDE.md` и
`../spark/docs/INFRA_GEODNS.md` с тех пор изменилось:

| В этом репо | Фактически |
|---|---|
| Зарубежное зеркало `185.214.108.29` (62yun NL) — в `scripts/deploy.sh`, `.github/workflows/deploy-landing.yml`, `docs/INFRA-geo-routing.md` | Бокс выведен 2026-07-09. Зарубежное зеркало — **`194.5.65.182`** (62yun, FRA) |
| Гео-DNS в Bunny (зона 810970) | Зона с 2026-09-10 в **Gcore**, одна динамическая A-запись с фильтрами `geodns → default → first_n` |
| `certbot --nginx` в DEPLOY.md | На 194 `certbot --nginx` **запрещён**: `:443` занят stream-роутером с `ssl_preread`; vhost ставится на `listen 127.0.0.1:8543 ssl proxy_protocol`, серты только `--webroot` |

С 2026-07-12 в репо не было коммитов, задевающих `paths:` воркфлоу, поэтому расхождение ещё не
выстрелило. **Первый же пуш в `src/**` уронит второе зеркало в CI.** Чинить до следующего релиза:
IP в `scripts/deploy.sh` + `deploy-landing.yml`, затем `docs/INFRA-geo-routing.md` и `DEPLOY.md`.
Перед правкой vhost на 194 снять эталон: `bash ../spark/scripts/check-fra-vhosts.sh /tmp/before.txt`.

## Поиск по коду

`.codegraph/` и `.serena/` подняты локально (оба в `.gitignore`).

| Намерение | Инструмент |
|---|---|
| «как работает X», архитектура, трассировка | `codegraph_explore` (`projectPath` = путь к этому репо) |
| Точные референсы/переименование TS-символа | Serena (`find_symbol`, `find_referencing_symbols`) |
| `.astro`, `.css`, `content/*.json` | **`Grep`** — codegraph их не парсит (в индексе только ts/tsx/js/yaml, 29 файлов) |

Секции страницы — это `.astro` (`src/components/sections/*.astro`, `src/pages/index.astro`);
острова — `.tsx` рядом. Правишь секцию — ищи оба файла.

## Планы и коммиты

- Планы: `.ai-factory/plans/<stem>.md` (fast — `.ai-factory/PLAN.md`).
  Правило проекта (`.ai-factory/skill-context/aif-plan/SKILL.md`): **план коммитится и пушится сразу
  после записи** (`git add <только план>` → `git commit -m "plan: <slug>"` → `git push`), чтобы бот на
  VPS подтянул его своим pre-run pull.
- Формат коммитов как в `../spark`: `feat(scope): …` / `fix(scope): …`, subject ≤ 72, без упоминаний AI.

### Перед деплоем — коммит и пуш (обязательно)

На сервер уезжает ровно то, что лежит в репозитории. Деплой из грязного дерева кладёт на прод код,
которого нет в git: его не воспроизвести, не отревьюить и не откатить. Все ручные деплой-скрипты
проверяют это сами и падают до первой заливки — грязное дерево или неотправленные коммиты
останавливают деплой. Аварийный обход `SKIP_GIT_GUARD=1` оставляет предупреждение в логе.
Деплой через GitHub Actions это правило соблюдает по построению: CI собирает из запушенного коммита.
