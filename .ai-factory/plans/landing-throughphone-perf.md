# ThroughPhone perf: ленивые сегменты + мобильные кадры + preload-постер

**Проект:** spark-landing · **Ветка:** feature/landing-build (НЕ создаём) · **Дата:** 2026-06-16
**Тип:** perf-оптимизация (по итогам /aif-review)

## Settings
- Тесты-как-код: нет (UI/перф). Проверка — Playwright 390+1440 + замер веса/запросов.
- Логирование: минимальное (реюз `DEBUG_SCROLL`).
- Docs: нет.
- Деплой: оба зеркала через `scripts/deploy.sh` (после OK). Деплой также вынесет весь прежний прогресс сессии (телефон/контейнер/Decks).

## Контекст (из ревью)
- `CanvasSequence.tsx`: fetch `/hero-frames/<name>/manifest.json` → decode `ImageBitmap` на `requestIdleCallback`, `CONCURRENCY=4`, `capWidth` small=540/large=900, парковка rAF; cleanup закрывает все bitmap (`frames.forEach(close)`); `enabled`/`activeName` в deps `useEffect` → смена `enabled` корректно перезапускает/чистит эффект.
- `ThroughPhone.tsx`: 3 сегмента (decks/play/create), у каждого свой `CanvasSequence` с `enabled={s.hasFrames}` (ВСЕ true) + деривативный `ScrollValue`. Pinned sticky. Активность сегмента уже считается в scroll-хендлере (`activeness = clamp01(1-|f-(i+0.5)|)`) для opacity/zIndex.
- `ThroughPhone.astro`: `existsSync` манифеста + poster=`/hero-frames/<scenario>/0001.webp`; прокидывает segments. `nameMobile = scenario` (тот же набор).
- Кадры: hero 2.4M(55), hero-mobile 1.2M(28), decks 1.6M(36), play 1.6M(52), create 228K(7). У сценариев мобильного варианта НЕТ.
- `Layout.astro`: `<link rel=preload href="/hero/hero-poster.webp" fetchpriority=high>` — всегда десктоп-постер; на мобиле hero рендерит `hero-poster-mobile.webp` → лишняя загрузка.
- Исходные PNG сценариев лежат в `/tmp/scn/{decks,play,create}/*.png` (для генерации мобильных webp).

## Tasks

- [x] **P1 — КРИТИЧНО: ленивое включение сегментов (память).**
  `src/components/sections/ThroughPhone.tsx`: вычислять индекс активного сегмента `activeSeg = clamp(round(f-0.5),0,n-1)` в scroll-хендлере; хранить в `useState` и обновлять ТОЛЬКО при смене (не на каждый кадр скролла, чтобы не было ре-рендеров). Передавать в каждый `CanvasSequence` `enabled={s.hasFrames && Math.abs(i - activeSeg) <= 1}` (активный ±1 сосед). При уходе сегмента из окна `enabled→false` → эффект CanvasSequence чистится, bitmap’ы закрываются (память освобождается); при возврате — перезагрузка (приемлемо, сосед ±1 предзагружен). Пиновый старт: до первого расчёта `activeSeg=0`. Reduced-motion/не-pinned: показывать постеры (как сейчас). Цель: одновременно в памяти ≤2 сиквенса вместо 3 (decks+play+create=95 кадров → активные ≤~2). Проверить, что переключение `enabled` у `CanvasSequence` не мигает постером заметно (poster fade 0.5s) — при необходимости держать активный+оба соседа на мобиле = всё равно ≤3, но без hero-параллели. Лог: `DEBUG_SCROLL` — смена activeSeg.

- [x] **P2 — Мобильные кадры сценариев (трафик).**
  Сгенерить уменьшенные наборы из `/tmp/scn`: `magick /tmp/scn/<s>/*.png -resize 500x -strip public/hero-frames/<s>-mobile/NNNN.webp` + `manifest.json` (count/width 500/ext webp/pad 4) для `decks-mobile`, `play-mobile`, `create-mobile`. В `ThroughPhone.astro`: для каждого сегмента проверять `existsSync(<scenario>-mobile/manifest.json)` → прокинуть `nameMobile` (имя -mobile набора) и `posterMobile=/hero-frames/<scenario>-mobile/0001.webp`; `hasFramesMobile` флаг. В `ThroughPhone.tsx`: добавить проп `nameMobile`/`posterMobile`/`enabledMobile` в `CanvasSequence` (он уже умеет `nameMobile/posterMobile/enabledMobile/small`). Эффект: мобила качает ~500w вместо 720w → −1.5–2МБ. (Если `/tmp/scn` уже очищен — перезаписать кадры повторным прогоном `cap-scenarios.cjs` перед ресайзом.)

- [x] **P3 — Media-условный preload hero-постера.**
  `src/layouts/Layout.astro`: заменить безусловный `<link rel=preload href="/hero/hero-poster.webp">` на два с `media`: `media="(min-width:761px)"` для десктоп-постера и `media="(max-width:760px)"` для `/hero/hero-poster-mobile.webp` (порог как в HeroScroll.css object-fit). Браузер тянет только нужный → нет лишнего постера на мобиле, чуть быстрее LCP. Сверить пути постеров с `Hero.astro` (`existsSync` fallback на bg-celestial — если мобильного постера нет, не плодить битую ссылку).

- [~] **P4 (пропущено — кадры оставляем ради плавности) — (ОПЦИЯ, нужно подтверждение) пересмотр числа кадров.**
  Компромисс с «60fps», который пользователь просил. Варианты: play 52→~40, decks 36→~28, или поднять webp-сжатие (`magick -quality 75`). НЕ резать без явного OK — иначе пропустить. Если ок — перегенерить desktop+mobile наборы и manifest. Эффект: −1–2МБ.

- [x] **P5 — Проверка (390+1440) + замер + деплой.**
  Playwright: десктоп — скраб 3 сегментов плавный, переезд сторон ок, в DevTools/через `performance.memory` (если доступно) или по числу одновременно загруженных кадров видно ≤2 активных сиквенса; мобайл 390 — грузятся `*-mobile` наборы (проверить сетевые запросы `/hero-frames/*-mobile/`), плавность ок, нет фриза. Замерить суммарный вес кадров блока до/после (особенно мобайл). Консоль чистая. `bash scripts/deploy.sh` на оба зеркала после OK пользователя.

## Commit Plan
- **C1** (P1): `perf(landing): lazy-enable through-phone segments (active ±1) to bound bitmap memory`
- **C2** (P2): `perf(landing): mobile-downscaled scenario frame sets for through-phone`
- **C3** (P3): `perf(landing): media-conditional hero poster preload`
- (P4 при согласии — отдельный commit `perf(landing): trim scenario frame counts`)
- Деплой после P5.

## Порядок / зависимости
P1 → P2 → P3 → (P4 опц.) → P5. P1 и P3 независимы; P2 перед P5 (нужны мобильные кадры для проверки). P4 — только после подтверждения.

## Открытые вопросы
1. P4: режем число кадров ради веса или оставляем ради плавности? (по умолчанию — оставляем, не режем).
2. Мобильные постеры сегментов — генерить отдельный `*-mobile/0001.webp` (да, выйдет из ресайза автоматически — первый кадр набора).
