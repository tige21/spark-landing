# Добить mobile LCP <3с — отложить кадры за load + сжать hero-mobile

**Проект:** spark-landing · **Ветка:** feature/landing-build (НЕ создаём) · **Дата:** 2026-06-16
**Тип:** perf-fix (LCP)

## Settings
- Тесты-как-код: нет. Проверка — Lighthouse mobile+desktop + Playwright.
- Логирование: минимальное.
- Docs: нет.
- Деплой: оба зеркала `scripts/deploy.sh`.

## База / цель
- Сейчас: mobile Perf 83, **LCP 4.4с**; desktop 99 (LCP 0.9с). Цель: **mobile LCP <3с, Perf ≥88**, desktop ≥97.
- Остаток LCP: batch кадров hero (idle-батч на `requestIdleCallback` timeout 1500) стартует в окне LCP и грузит ~976КБ поверх постера-LCP.

## Tasks

- [ ] **D1 — Отложить batch кадров за `window.load` (главный рычаг LCP).**
  `CanvasSequence.tsx` (НЕ-eager путь): запускать `startBatch` (основная масса кадров) не по `requestIdleCallback`-1500, а **после события `load`** (если `document.readyState==='complete'` — сразу через rIC; иначе `window.addEventListener('load', …, {once:true})` → затем rIC). Кадр 0 оставить ранним (canvas ready, визуально = постер) — он лёгкий (~35КБ) и LCP не душит; конкурирующую массу убираем из окна LCP. eager-путь не трогаем (hero его не передаёт). Cleanup: снять load-listener и rIC/raf. Лог DEBUG_SCROLL — старт батча.
  Итог: в окне LCP — только постер (preload ~62КБ) + критичный JS/шрифты; кадры стримятся после load. graceful рисует ближайший по мере подгрузки.

- [ ] **D2 — Облегчить hero-mobile (q60).**
  Пережать `public/hero-frames/hero-mobile/*.webp` `magick -quality 60` (число кадров 28 НЕ режем — сохранить плавность hero; graceful + полный набор). Цель −150–250КБ. (Резерв, если LCP всё ещё >3с после D1+D2: проредить 28→~20 кадров — но сначала проверить без прореживания.) Кадры в gitignore (через dist).

- [ ] **D3 — Перезамер Lighthouse + Playwright + деплой.**
  - Lighthouse mobile+desktop: цель mobile LCP <3с, Perf ≥88; desktop ≥97 (не просел).
  - Проверить по network, что hero-кадры грузятся ПОСЛЕ load (не в окне LCP).
  - Playwright 1440+390: hero scrub играет при скролле (graceful), сквозной телефон ок, консоль чистая.
  - `bash scripts/deploy.sh` оба зеркала.

## Commit Plan
- **C1** (D1): `perf(landing): defer hero frame batch until after load (mobile LCP <3s)`
- (D2 — кадры в gitignore, без кода; объединить в C1 или без отдельного commit)
- Деплой после D3.

## Порядок / зависимости
D1 → D2 → D3. D1 — основной выигрыш LCP (убирает конкуренцию кадров). D2 — добавочный вес. Перезамер обязателен (подтвердить <3с).

## Открытые вопросы
1. Если после D1+D2 LCP всё ещё >3с — проредить hero-mobile 28→~20 кадров (резерв в D2).
2. Проверить, что отсрочка батча не делает первый скролл «мёртвым» дольше обычного (graceful + поздний `load` обычно < пары секунд; на hero пользователь скроллит не мгновенно).
