# Fix landing CI deploy wiping hero-frames (Git LFS)

**Проект:** spark-landing (+ personal-assistant doc) · **Ветка:** main (НЕ создаём ветку) · **Дата:** 2026-06-23
**Тип:** fix (deploy/infra)

## Проблема (подтверждено)

`public/hero-frames/` (8.9 МБ, 303 webp: hero/hero-mobile/decks/play/create + -mobile) **в `.gitignore`** → его нет в git. CI-воркфлоу `.github/workflows/deploy-landing.yml` (`actions/checkout@v4` → `npm ci` → `astro build`) собирает **dist без кадров**, затем `rsync -avz --delete dist/ → оба зеркала` **стирает `hero-frames/` с серверов**. Ломается: hero-видео, экран телефона (broken-img), пин секции ThroughPhone (страница схлопывается ~15000→6000px) → «всё поехало». Повторяется на **каждом** пуше бота, трогающем `src/**`/`public/**` (последний прогон CI `28007470358`, 06:41Z, как раз затёр кадры; ручной `deploy.sh` с этого Mac временно восстановил).

`scripts/deploy.sh` уже имеет guard (коммит `0cd3d71`), но CI его НЕ использует (свой inline-rsync) — нужна правка CI.

## Решение (выбрано пользователем)

**Git LFS** для `public/hero-frames/**`: кадры становятся версионируемым build-input. Любой checkout (CI, dev, бот) получает их → `astro build` всегда полный → `--delete` безопасен. Репозиторий остаётся лёгким (указатели). Плюс guard в CI — fail loud вместо тихого затирания.

## Settings
- Тесты-как-код: нет (как и во всех landing-планах).
- Логирование: минимальное (shell `echo`/`::error::` в CI).
- Docs: да — обновить `personal-assistant/docs/deploy-recipe.md`.
- Деплой: через CI (`deploy-landing.yml`); финальная проверка обоих зеркал.

## Tasks

- [x] **CI-1 — Включить Git LFS и затрекать кадры (spark-landing).**
  `brew install git-lfs` (если нет) → `git lfs install`. `git lfs track "public/hero-frames/**"` (создаст/обновит `.gitattributes`). Убрать строку `public/hero-frames/` из `.gitignore` (строка 32). **Оставить** игнор `public/hero-frames-orig/` и `public/hero-orig/` (это локальные исходники ретона, не build-input). Проверить: `git check-attr filter public/hero-frames/decks/0001.webp` → `filter: lfs`.

- [ ] **CI-2 — Закоммитить кадры в LFS и запушить.**
  `git add .gitattributes public/hero-frames` → коммит `fix(landing): track hero-frames via Git LFS (CI builds were shipping frameless dist)` → `git push`. Убедиться, что объекты ушли в LFS: `git lfs ls-files | wc -l` ≈ 303; `git show HEAD:public/hero-frames/decks/0001.webp | head -c 40` показывает LFS-указатель (`version https://git-lfs…`), а не webp-байты. Квота GitHub LFS (1 ГБ free) — 8.9 МБ, ок.

- [x] **CI-3 — Научить CI тянуть LFS + guard на кадры (spark-landing).**
  `.github/workflows/deploy-landing.yml`:
  - В шаге `Checkout` (`actions/checkout@v4`) добавить `with: { lfs: true }` (раннер ubuntu-latest имеет git-lfs предустановленным).
  - В шаг `Verify build output` (или отдельным шагом перед деплоем) добавить guard: для `hero decks play create` проверить `test -f dist/hero-frames/$s/0001.webp || { echo "::error::hero-frames/$s missing in dist — refusing to deploy (rsync --delete would wipe frames)"; exit 1; }`. Зеркалит guard из `scripts/deploy.sh`.
  - rsync `--delete` оставить как есть (кадры теперь всегда в dist; guard — страховка).

- [ ] **CI-4 — Прогнать CI и проверить оба зеркала.**
  Запушить (CI-2 уже триггерит) или `gh workflow run deploy-landing.yml -R tige21/spark-landing`; `gh run watch <id> --exit-status`. Проверка: `curl --resolve sparkcards.space:443:<ip> https://sparkcards.space/hero-frames/{hero,decks,play,create}/0001.webp` → **200** на `83.217.215.66` и `185.214.108.29`. Playwright 1440: 0 битых запросов, `.through-phone` `data-pinned=true`, высота страницы ~15000px, телефон рендерит экран (не broken-img).

- [ ] **CI-5 — Документировать ловушку (personal-assistant).**
  `personal-assistant/docs/deploy-recipe.md`: в разделе про Model B (CI) добавить предупреждение: «gitignored build-input ассеты (напр. `public/hero-frames/`) ОБЯЗАНЫ быть в Git LFS — иначе cloud-checkout соберёт неполный билд и `rsync --delete` сотрёт их с серверов». В таблице статусов отметить, что spark-landing использует LFS для кадров + `lfs:true` в воркфлоу. Закоммитить в personal-assistant.

## Проверка / приёмка
- CI зелёный; кадры 200 на обоих зеркалах; ThroughPhone снова пинится; hero-видео играет.
- Контроль регрессии: следующий бот-пуш, трогающий `src/**`, → CI деплоит С кадрами (а не затирает).

## Риски / заметки
- **git-lfs нужен на dev-машинах** (этот Mac) и желательно там, где регенерят кадры. Без LFS checkout даст указатели → `astro build` положит указатели в dist → guard CI/`deploy.sh` это поймает (fail loud), не даст затереть.
- Бот (hermes) только commit+push кода (не кадров) — LFS на нём не обязателен; указатели кадров он не трогает.
- `hero-frames-orig/` (3 МБ исходники) остаются gitignored — это не build-input.
- Кросс-репо: CI-1..CI-4 в spark-landing, CI-5 в personal-assistant.

## Commit Plan
- **C1** (CI-1+CI-2): `fix(landing): track hero-frames via Git LFS (CI builds were shipping frameless dist)`
- **C2** (CI-3): `ci(landing): fetch LFS on checkout + guard build has hero-frames before rsync`
- **C3** (CI-5, personal-assistant): `docs(deploy): gitignored build-input assets must be in LFS or CI --delete wipes them`
- Деплой/проверка (CI-4) — через прогон воркфлоу.
