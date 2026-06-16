# Mobile LCP / Performance (Lighthouse) — снять регресс eager + дедуп постеров + сжать кадры

**Проект:** spark-landing · **Ветка:** feature/landing-build (НЕ создаём) · **Дата:** 2026-06-16
**Тип:** perf-fix (по Lighthouse)

## Settings
- Тесты-как-код: нет. Проверка — Lighthouse (mobile+desktop) + Playwright.
- Логирование: минимальное.
- Docs: нет.
- Деплой: оба зеркала `scripts/deploy.sh`.

## Замеры (база, local preview)
- Desktop Perf **97** (LCP 1.2s) — ок, не трогаем.
- Mobile Perf **66**, **LCP 11.6s** (FCP 2.0 / TBT 330 / CLS 0.001 — норм). Цель: mobile LCP <3s, Perf >85.
- Причины: (1) `eager` грузит ВСЕ кадры hero сразу (mobile ~1.2МБ) → на slow-4G душит LCP; (2) на мобиле грузятся ОБА постера hero (desktop 70КБ + mobile 62КБ) — `<img>` от CanvasSequence на SSR отдаёт desktop-постер (`small=false`); постеры сквозного телефона на мобиле тоже тянут desktop-версии; (3) hero-mobile кадры ~1.2МБ — основная масса мобильного трафика.

## Tasks

- [x] **L1 — Снять eager-флуд hero (главный фикс LCP).**
  `HeroScroll.tsx`: убрать проп `eager` у `CanvasSequence` → hero вернётся к ленивой загрузке кадров (`requestIdleCallback`), постер (LCP) грузится первым. «Мёртвый первый скролл» уже прикрыт **graceful nearest-decoded** (оставляем) — рисует ближайший готовый кадр по мере стрима.
  Фолбэк (если после перезамера первый скролл на холодную всё ещё мёртвый): добавить в `CanvasSequence.tsx` параметр `eagerCount?: number` — декодить ТОЛЬКО первые N кадров рано (`setTimeout 0`), остальное idle; hero `eagerCount={8}` (≈344КБ вместо 1.2МБ). Сначала пробуем полный откат, eagerCount — резерв.

- [x] **L2 — Дедуп постеров: отдавать мобильный постер на мобиле (−~100–130КБ).**
  Корень: `CanvasSequence` рендерит `<img src={activePoster}>`, а `activePoster` на SSR = desktop-постер (`small=false`) → браузер тянет desktop-постер даже на мобиле (до гидрации). Фикс: заменить `<img>` постера на `<picture>` с `<source media="(max-width:760px)" srcSet={posterMobile}>` + `<img src={poster}>` — браузер сам выбирает правильный постер независимо от JS. Это чинит и hero, и постеры сквозного телефона (decks/play/create-mobile). Сверить `Layout.astro` media-preload — оставить только реально используемый постер на каждом брейкпоинте (или убрать дублирующий preload, раз `<picture>` уже выбирает).

- [x] **L3 — Сжать hero-mobile кадры (~1.2МБ → меньше).**
  Перекодировать существующие webp в `public/hero-frames/hero-mobile/` с меньшим качеством: `magick <f>.webp -quality 70 <f>.webp` (без исходников — пережать уже-webp, приемлемая потеря). Замерить итог; цель −400–600КБ. Опц. так же `hero/` (desktop), но desktop Perf и так 97 — по желанию. Кадры в gitignore (едут через dist/).

- [x] **L4 — Перезамер Lighthouse + Playwright + деплой.**
  - Lighthouse mobile+desktop ПОСЛЕ: цель mobile LCP <3s, Perf >85; desktop не просел (≥95).
  - Playwright 1440+390: hero scrub играет при первом скролле (graceful), на мобиле грузится ТОЛЬКО mobile-постер (проверить network — нет desktop hero-poster.webp), сквозной телефон ок.
  - `bash scripts/deploy.sh` оба зеркала.

## Commit Plan
- **C1** (L1+L2): `perf(landing): drop eager hero flood + responsive poster (mobile LCP)`
- **C2** (L3): `perf(landing): recompress hero-mobile frames` (кадры в gitignore — фактически меняется только пайплайн/нет кода; commit пустой по коду → можно объединить с C1 или пропустить commit, кадры едут через dist)
- Деплой после L4.

## Порядок / зависимости
L1 → L2 → L3 → L4. L1 даёт основной выигрыш LCP; L2 убирает лишний постер; L3 режет вес. Перезамер обязателен (подтвердить цель).

## Открытые вопросы
1. Если полный откат eager вернёт «мёртвый первый скролл» на холодной мобиле — включить `eagerCount~8` (резерв в L1).
2. Сжатие hero-mobile q70 — проверить, что качество кадров на телефоне приемлемо (мелкий экран — потеря почти незаметна).
