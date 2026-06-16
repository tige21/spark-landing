# Лендинг: навигация, How-отступы, тап-карты, контраст, баг блюра хедера

**Проект:** spark-landing · **Ветка:** feature/landing-build (новую не создаём) · **Дата:** 2026-06-16
**Тип:** UI-полировка + bugfix (хедер-блюр в Telegram)

## Settings
- Тесты-как-код: нет (CSS/UI). Проверка — Playwright 390px + десктоп; TG-специфику (N7) проверяет пользователь на устройстве.
- Docs: нет.
- Деплой: оба зеркала через `scripts/deploy.sh`.

## Контекст (из кода)
- `Nav.astro` — fixed-overlay хедер, `-webkit-backdrop-filter` уже добавлен, но в TG WebView блюра нет.
- Lenis (`smooth-scroll.ts`) активен только на десктопе (выключен при reduced/small) — на мобиле нужен нативный smooth.
- `config/site.ts` NAV_LINKS: `{ id:'order', ru:'Своя колода', en:'Your deck' }`.
- `How.astro` шаг: `StampReveal` flex-column (gap space-sm) → `.art` 200×200, `h3.t-h3`, `p.t-caption`. Разрывы раздуты дефолтным margin у `h3`.
- `.route-band` (PostalRoute, горизонтальный) — `display:none` на `<880` → на мобиле линии нет.
- `--meta: #9A8C78` на фоне `--table #E4D7BE` — низкий контраст.

## Tasks

- [x] **N1 — Плавный подскролл по якорям хедера.**
  Клик по nav-ссылке (`a[href^="#"]`) → плавный скролл к секции с offset фиксированного хедера (~64px). Десктоп: через `lenis.scrollTo(target, { offset: -64 })`. Мобайл (Lenis off): нативный `scrollIntoView({behavior:'smooth'})` + `scroll-margin-top` на секциях (есть `scroll-padding-top:64px` в tokens.css — проверить, что работает для нативного скролла). Реализация: общий click-handler. Файлы: `SmoothScroll.tsx` / `smooth-scroll.ts`, при необходимости `Section.astro` (scroll-margin-top).

- [x] **N2 — Переименовать nav «Своя колода» → «Создать колоду».**
  `src/config/site.ts` NAV_LINKS `order`: ru `Создать колоду`, en `Create a deck`.

- [x] **N3 — How: убрать раздутые разрывы шага (арт↔заголовок↔текст).**
  `How.astro`: `.step h3 { margin: 0; }` (убрать дефолтный browser-margin), поджать flex-`gap` (оставить `--space-sm` или `--space-xs`). Применяется и на мобиле, и на вебе. Проверить, что подпись плотно под заголовком.

- [x] **N6 — Затемнить серый текст (контраст).**
  `tokens.css`: `--meta` `#9A8C78` → темнее (старт `#7E715E`, подобрать в Playwright). Проверить eyebrow/`.t-lead`/`.t-caption`/`.deck-sample`/`.brand-press` — стали читабельнее, но остаются «приглушёнными» (не как `--ink`).

- [x] **N5 — Mobile: тап-анимация подъёма карточек (как hover на вебе).**
  `DecksShelf.tsx` (deck-card) + `What.astro` (.pill): на тач `:active` ненадёжен. Реализовать через JS pointer/touch-хендлер, добавляющий класс `is-tapped` на время нажатия → CSS lift (тот же transform, что hover). + `cursor:pointer`. Покрыть `@media (hover:none)`. Reduced-motion — без трансформа.

- [x] **N7 — BUGFIX: хедер не блюрит в Telegram WebView.**
  Расследовать (Lenis на мобиле выкл — не он). Попробовать force-composite на `.nav`: `transform: translateZ(0)` / `will-change: backdrop-filter`; проверить, не ломает ли `main{overflow-x:clip}` / overflow на `html,body`. **Гарантированный fallback** (на случай, если WebView не умеет backdrop-filter): поднять плотность фона хедера (`--table` ~90-94%) + лёгкий нижний градиент-маска, чтобы контент под хедером не просвечивал резко даже без блюра. Файлы: `Nav.astro`, возможно `tokens.css`. Финально проверяет пользователь в Telegram.

- [x] **N4 — Mobile: анимированный вертикальный коннектор между шагами How.**
  Сейчас горизонтальный `PostalRoute` скрыт на мобиле. Сделать вертикальный scroll-draw коннектор для stacked-колонки (≤480, 1 колонка): вертикальный SVG-путь по центру за шагами, рисуется по `createScrollValue` (stroke-dashoffset), узлы-точки у шагов + едущий wine-маркер. Новый `PostalRouteVertical.tsx` (или `vertical` проп в `PostalRoute.tsx`), показывать на мобиле вместо горизонтального. Reduced-motion: статичная линия. Файлы: `PostalRoute.tsx`/новый компонент, `How.astro` (разметка/CSS route-band для мобилы).

- [x] **N8 — Проверка Playwright (390px + 1440px) + деплой.**
  Десктоп: smooth-scroll по якорям с offset, How-разрывы поджаты, контраст текста, карты lift на hover, переименование в nav. Мобайл 390: smooth-scroll, How плотно, вертикальный коннектор рисуется при скролле, тап-lift карточек, контраст. Консоль чистая. Затем `bash scripts/deploy.sh` на оба зеркала. N7 (блюр) — пользователь в Telegram.

## Commit Plan
- **C1** (N2, N3, N6): `fix(landing): nav label, how-step spacing, darker muted text`
- **C2** (N1, N5): `feat(landing): smooth anchor scroll + mobile card tap-lift`
- **C3** (N7): `fix(landing): header readability in telegram webview (composite + opaque fallback)`
- **C4** (N4): `feat(landing): mobile vertical connector for how steps`
- Деплой после N8.

## Порядок
N2 → N3 → N6 → N1 → N5 → N7 → N4 → N8. (Быстрые/независимые сначала; N4 — самый объёмный; N8 — проверка+деплой.)
