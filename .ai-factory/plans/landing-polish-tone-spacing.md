# Лендинг: тон кадров, вотермарк, видимость текста, эффекты карточек, ритм отступов

**Проект:** spark-landing (Astro)
**Ветка:** feature/landing-build (новую не создаём)
**Дата:** 2026-06-16
**Тип:** UI-полировка + обработка изображений (кадры героя)

## Settings
- Тесты-как-код: нет. Проверка — Playwright (desktop / 21:9 / mobile) + визуальный обзор.
- Docs: нет.
- Деплой: на ОБА зеркала через `scripts/deploy.sh`.

## Контекст находок (из разведки)
- Hero subtitle невидим: `HeroScroll.css .subtitle` наследует `.t-lead` → `color: var(--meta)`.
- `What.astro` `.pill` (секция «Это не игра…») — нет hover/press-эффекта; у `DecksShelf` `.deck-card` есть 3D tilt-lift (нужно унифицировать; пользователь просит эффект «при нажатии» → добавить `:active` обоим).
- Кадры героя `public/hero-frames/{hero,hero-mobile}/*.webp` + постеры `public/hero/hero-poster*.webp`: фон светлее `--table` (#E4D7BE) → после `contain` виден шов; «KlingAI 3.0» в правом нижнем углу.
- `How.astro`: `.step p` без `margin-inline:auto`, большой разрыв арт↔заголовок; `.art` 200×200 `contain`.
- `Decks.astro`: декоративный `.crest` (bg-decks) обрезается в `.crest-clip`.
- `Section.astro`: `padding-block: clamp(var(--space-2xl), 4vw, 56px)` — 56px вне токенов; между секциями копятся большие зазоры.

---

## Tasks

- [x] **P1 — Hero subtitle видимым.**
  `src/components/hero/HeroScroll.css`: для `.subtitle` переопределить цвет на контрастный (`var(--meta-strong)` #5E5240 или `var(--ink)`) + лёгкий `text-shadow` (как у h1) для читаемости поверх гравюры. Проверить на светлых и тёмных кадрах.

- [x] **P2 — Карточки `.pill` (секция What) — тот же press-эффект, что у колод.**
  `src/components/sections/What.astro`: добавить `perspective` на `.pills` (как `.deck-grid`); на `.pill` — `transition` + `:hover`/`:active` `translateY(-8px) rotateX(-6deg)` + `box-shadow: var(--shadow-float)` (паритет с `.deck-card`). Reduced-motion: сбросить трансформы.
  `src/components/sections/Decks.astro`: добавить `.deck-card:active` (тот же 3D), чтобы тап-эффект совпадал на обоих. Вынести общие значения, не дублировать магические числа.

- [x] **P3 — Ритм отступов в рамках токен-системы.**
  Воспроизвести всю страницу в Playwright (desktop), замерить зазоры между секциями. `src/components/layout/Section.astro`: заменить `clamp(...,56px)` на токен-границы (например `clamp(var(--space-2xl), 3.5vw, var(--space-3xl))`); нормализовать внутренние `margin-top` (How `.steps-wrap`, What `.pills`, Decks) к единому токену. Цель — ровный ритм без «огромных» дыр, всё из `@shared/theme`-токенов (spacing.ts).

- [x] **P4 — Шаг «Как это работает»: выравнивание и разрыв.**
  `src/components/sections/How.astro`: `.step p { margin-inline: auto; }` (центрирование описания); сократить разрыв арт↔заголовок (нормализовать `gap`, при необходимости поджать `.art` высоту/вотписейс). Проверить в Playwright desktop+mobile, что текст по центру и блок плотный.

- [x] **P5 — Decks: обрезанная картинка.**
  `src/components/sections/Decks.astro`: воспроизвести в Playwright; поправить `.crest`/`.crest-holder` (размер/позиция/overflow) или параметры `Parallax rotate`, чтобы декоративная гравюра не обрезалась некрасиво на фоне заголовка «Девять колод…».

- [ ] **P6 — Кадры героя: тон под сайт + удаление вотермарка.**
  `public/hero-frames/{hero,hero-mobile}/*.webp` + `public/hero/hero-poster.webp`, `hero-poster-mobile.webp`.
  1. Бэкап оригиналов (например `public/hero-frames-orig/`).
  2. **Прототип на 1-2 кадрах** (desktop + mobile): дуотон в палитру сайта — `magick in.webp -colorspace Gray -level-colors '#2C2620','#E4D7BE' …` (фон→`--table`, линии→`--ink`); вотермарк в углу закрыть заливкой `--table` (`-fill '#E4D7BE' -draw 'rectangle …'`) или кропом. Определить bbox вотермарка из сэмпла.
  3. **Показать результат пользователю** (тон может стать «площе» — согласовать) → при ОК батчить все кадры desktop+mobile+постеры, сохранить размеры/имена, перекодировать `cwebp`.
  4. Сверить вес кадров (не вырасти).
  Логика: после дуотона фон кадров == `--table`, шов от `contain`-pillarbox исчезает; вотермарк убран.

- [ ] **P7 — Деплой обоих зеркал + проверка.**
  `bash scripts/deploy.sh` (vdsina + NL). Playwright на desktop / 21:9 / mobile: шов тона исчез, вотермарка нет, subtitle читается, у `.pill` press-эффект как у колод, ритм секций ровный, шаг How центрирован и плотный, crest в Decks не обрезан. Консоль без ошибок.

---

## Commit Plan
- **C1** (P1-P5): `fix(landing): subtitle contrast, card press effect, section rhythm, how/decks layout`
- **C2** (P6): `chore(assets): retone hero frames to site palette + strip watermark`
- **C3** (P7): деплой (без коммита кода; зеркала)

## Порядок
```
P1,P2,P3,P4,P5 (CSS, параллельно) ─┐
P6 (кадры: прототип → ревью → батч) ─┴─> P7 (деплой обоих + проверка)
```
P6 независим от CSS-правок; P7 после всех.
