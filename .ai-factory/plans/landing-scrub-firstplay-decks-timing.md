# Фикс: hero-скраб не играет при первом заходе + поздний Decks

**Проект:** spark-landing · **Ветка:** feature/landing-build (НЕ создаём) · **Дата:** 2026-06-16
**Тип:** fix (2 бага из /aif-review)

## Settings
- Тесты-как-код: нет. Проверка — Playwright 390+1440.
- Логирование: минимальное.
- Docs: нет.
- Деплой: оба зеркала `scripts/deploy.sh` (пользователь сказал «сразу задеплой»).

## Tasks

- [x] **B1 — Hero scroll-scrub graceful + eager (CanvasSequence.tsx).**
  Баг: при первом заходе кадры декодятся лениво (`requestIdleCallback`, timeout 1500), а `tick`/`drawIndex` не имеют фолбэка → канвас застывает на кадре 0, скраб «мёртвый»; при возврате уже играет.
  - **Graceful nearest-decoded:** в `tick` если `frames[idx]` не декодирован — нарисовать БЛИЖАЙШИЙ уже декодированный кадр (поиск наружу r=1..count); `lastDrawn` = реально нарисованный индекс. НЕ парковать `tick`, пока точный целевой кадр (`frames[round(target)]`) не готов — продолжать rAF, чтобы по мере подгрузки догнать; припарковаться только когда точный кадр нарисован и `curr===target`.
  - **Eager-проп:** добавить `eager?: boolean`. Если `eager` — стартовать батч кадров сразу (`setTimeout(startBatch, 0)`) вместо `requestIdleCallback`. (Through-phone оставить ленивым — ниже фолда.)
  - Лог: при DEBUG_SCROLL — когда рисуется fallback-кадр.

- [x] **B2 — Передать eager в hero (HeroScroll.tsx).**
  В `HeroScroll.tsx` у `CanvasSequence` добавить `eager` (hero — первое «видео», LCP-зона) → кадры начинают грузиться сразу, окно «мёртвого скраба» исчезает. Через `_phone`/through-phone НЕ трогать (остаётся idle).

- [x] **B3 — Сократить высоту пина ThroughPhone (поздний Decks).**
  `ThroughPhone.tsx`: `scrubSeg = small ? 0.9 : 1.05` → **`small ? 0.62 : 0.72`**. Секция `(1+n*scrubSeg)*100svh` станет ~3.16 (desktop) / ~2.86 (mobile) экрана вместо ~4.15/3.7 → Decks появляется на ~1 экран раньше, скраб снапнее. Проверить, что 3 сегмента всё ещё успевают скрабиться (decks 36 / play 52 / create 7 кадров на ~0.72 экрана — ок).
  - Опц.: `in-view.ts` rootMargin `'0px 0px 15% 0px'` → `'0px 0px 25% 0px'` для чуть более раннего reveal Decks (если после B3 всё ещё ощущается поздним).

- [x] **B4 — Проверка Playwright (1440 + 390) + деплой.**
  - 1440: загрузить, СРАЗУ проскроллить hero — кадры играют (не застывают на 0-м); Decks появляется раньше; переезд телефона цел; консоль чистая.
  - 390: то же.
  - `bash scripts/deploy.sh` оба зеркала.

## Commit Plan
- **C1** (B1+B2): `fix(landing): graceful scroll-scrub draw + eager hero frame decode (first-visit playback)`
- **C2** (B3): `fix(landing): shorter through-phone pin so decks section appears sooner`
- Деплой после B4.

## Порядок
B1 → B2 → B3 → B4. B1 — корень бага 1 (чинит и hero, и любой scroll-scrub). B3 независим.
