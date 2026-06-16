# Сквозной телефон: scrollytelling по сегментам приложения

**Проект:** spark-landing · **Ветка:** feature/landing-build (НЕ создаём новую) · **Дата:** 2026-06-16
**Тип:** feature (большой) — развитие iPhone-блока (AppPreview) в сквозной scrollytelling

## Settings
- Тесты-как-код: **нет** (UI/визуал). Проверка — Playwright 390px + 1440px.
- Логирование: минимальное (фронт-лендинг); реюз `DEBUG_SCROLL` где уместно.
- Docs: нет.
- Деплой: оба зеркала через `scripts/deploy.sh` (после подтверждения).

## Решения пользователя (AskUserQuestion)
1. **3 сегмента:** Колоды → Игра → Своя колода (листание колод → игра со свайпом карт → ИИ-наборщик).
2. **Размещение:** телефон СКВОЗНОЙ — постоянно на экране через все 3 сегмента, по очереди меняет сторону; описание сегмента анимированно появляется с противоположной стороны. Реализуем как один закреплённый (pinned) блок с 3 внутренними сегментами.
3. **Свайп карт:** записать реальный свайп ПОШАГОВО (инкрементальный drag + скриншот на каждом шаге, dsf3); фолбэк — синтез слайда.
4. **Мобайл:** телефон по центру (без смены сторон), текст активного сегмента — сверху, по очереди.

## Контекст (из кода)
- `AppPreview.astro/.tsx/.css` — текущий одиночный pinned scroll-scrub (1 сценарий, 8 карт hard-cut). Будет заменён на `ThroughPhone`.
- Реюз: `CanvasSequence.tsx` (грузит `/hero-frames/<name>/manifest.json`, API: `progress: ScrollValue`, `poster`, `name`, `enabled`), `use-scroll-scene.ts` (ScrollValue по offset), `Scene3D`/`Layer` (parallax), `WordReveal`.
- `ScrollValue` (scroll-progress.ts): интерфейс `get()/on('change')/attach()/destroy()`. CanvasSequence использует только `get()` и `on('change')` → можно подсунуть ДЕРИВАТИВНЫЙ ScrollValue-адаптер (локальный прогресс сегмента поверх главного).
- Кадры — в `public/hero-frames/<name>/` (gitignore; едут через dist/). Существующий набор: `app/` (8 карт). Новые: `decks/`, `play/`, `create/`.
- Capture-пайплайн: `/tmp/cap-app.cjs` (Playwright по `cards-staging.duckdns.org`, инъекция localStorage `app-storage`/`tutorial-storage` → skip онбординг/согласие/тултипы, locale ru-RU, viewport 393×852, dsf3) → screenshot → `magick -resize 720x -strip` → webp + manifest `{name,count,width,ext,pad}`.
- Контент `ru.json`: `decks` (Девять колод…), `game` (Одна карта…), `order` (Печатня «Искра» / Своя колода). Их тексты ложатся на 3 сегмента.
- Баг island: верхний UI приложения (X, «2/40», табы) налазит на dynamic island (см. скрин). Фикс — статус-бар-инсет внутри экрана.

## Архитектура сквозного телефона
```
section.through-phone  height = (1 + N*scrubSeg)*100svh   (N=3, scrubSeg≈1.0 desktop / 0.8 mobile)
└─ .tp-stage  position:sticky; top:0; height:100svh
   ├─ .tp-phone        ← ОДИН телефон; X-позиция = f(progress): seg0→право, seg1→лево, seg2→право (ease у границ)
   │   └─ .tp-screen (aspect 393/852, top status-band под island)
   │        └─ 3× CanvasSequence (name: decks|play|create) стопкой, crossfade по активному сегменту,
   │             каждый на ДЕРИВАТИВНОМ ScrollValue (localP сегмента)
   ├─ .tp-panel[i] (×3)  ← текст+картинки сегмента; въезжает с СТОРОНЫ, противоположной телефону; opacity/translate по близости к центру сегмента
   └─ Scene3D/Layer  ← parallax-искры/гравюры за телефоном
```
- **Прогресс-математика:** главный `progress` p∈[0,1] на всю секцию. `segF = p*N`; `seg = clamp(floor(segF),0,N-1)`; `localP = clamp(segF - seg,0,1)`. Активность панели i = «треугольник» вокруг центра сегмента i. X телефона = smoothstep между сторонами соседних сегментов в окне границы.
- **Деривативный ScrollValue** (адаптер): `{ get:()=>localPForSeg(i), on:(e,cb)=>main.on('change',()=>cb(...)), attach(){}, destroy(){} }` — чтобы переиспользовать CanvasSequence без правок его API.
- **Reduced-motion / нет кадров:** без пина, статик-постер seg0, тексты сегментов простым стеком. (как у hero/AppPreview)

## Tasks

### Фаза A — Запись сценариев приложения (кадры)
- [x] **A1 — Capture-скрипт: 3 сценария → кадры+манифесты.** ✅ `/tmp/cap-scenarios.cjs` → decks(12)/play(22)/create(7) webp 720w в `public/hero-frames/{decks,play,create}/` (~1.5МБ).
  Расширить `/tmp/cap-app.cjs` (или новый `/tmp/cap-scenarios.cjs`) — те же настройки (ru-RU, dsf3, инъекция localStorage):
  - **decks** (`/decks?tab=editorial`): плавный скролл списка колод сверху вниз (≈10–14 кадров `wheel`/scrollTo с шагом) — листание 9 колод.
  - **play** (`/game/play`): СВАЙП карт ПОШАГОВО. Драйвить жест мышью/тачем инкрементально (`mouse.move(... , {steps})` или серия `dispatch` pointermove с малым Δx), на каждом шаге screenshot → карта частично уехала влево, следующая въезжает. 2–3 перехода × ~8 шагов ≈ 20–26 кадров. Снять и «покой» по краям.
  - **create** (ИИ-наборщик: кнопка «Напечатать свою колоду» → флоу Печатня «Искра»): пройти до экрана генерации/визарда, снять 8–12 кадров (поля/печать/результат). Селекторы выяснить через snapshot.
  Обработка: `magick -resize 720x -strip` → `public/hero-frames/{decks,play,create}/NNNN.webp` + `manifest.json`.
- [x] **A2 — Проверка свайпа.** ✅ Реальный pointer-drag по шагам сработал — карта уезжает влево с поворотом, следующая видна за ней. Синтез не понадобился. Убедиться, что responder приложения следует за инкрементальным жестом (карта реально уезжает по шагам). Если НЕТ — фолбэк: снять 2 ключевых стилла (до/после) и синтезировать слайд `magick`-композитингом (карта-слой translateX), либо CSS-слайд в компоненте. Зафиксировать в плане выбранный путь.

### Фаза B — Компонент сквозного телефона
- [ ] **B1 — Контент-модель сегментов.** В `src/content/ru.json` добавить `phone.segments[]`: `{ id, side:'right'|'left', scenario:'decks'|'play'|'create', headline, body, images:[engravingKey,...] }`. Тексты взять из `decks`/`game`/`order`. 3 элемента, чередование сторон right→left→right.
- [ ] **B2 — `ThroughPhone.tsx`.** Новый остров: `useScrollScene(['start start','end end'])`; вычисление seg/localP; X-позиция телефона (slide между сторонами с ease у границ); 3× `CanvasSequence` (поля name из сегментов) стопкой в экране, crossfade по активному сегменту, каждый на деривативном ScrollValue; `.tp-panel` ×3 с анимацией въезда с противоположной стороны (opacity+translateX, по активности сегмента); parallax `Scene3D/Layer` (искры/гравюры). pinned = `mounted && !reduced && hasFrames`. Мобайл (`small`): телефон по центру, X фиксирован, панели сверху (translateY). Reduced/нет кадров → постер seg0, стек панелей, без пина.
- [ ] **B3 — `ThroughPhone.css`.** Рамка телефона (перенести из AppPreview.css: bezel, dynamic island, screen aspect 393/852) + **status-band инсет под island** (см. B5). Раскладка: desktop — телефон absolute слева/справа, панель на противоположной стороне (grid/absolute); mobile (≤860) — телефон по центру, панель сверху. Переходы панелей (`var(--ease-out)`, `var(--dur-*)`). Только токены `@shared/theme`-аналоги проекта (`--space-*`, `--radius-*`, `--shadow-*`, цвета). Высота секции по `svh`.
- [ ] **B4 — `ThroughPhone.astro`.** `existsSync` манифестов `{decks,play,create}` → флаги; постеры = первый кадр каждого (`/hero-frames/<name>/0001.webp`); `getImage` искры + гравюры сегментов; прокинуть `phone.segments` + ассеты в остров `client:visible`.
- [ ] **B5 — Фикс island overlap.** Внутри `.tp-screen` верхний инсет-бэнд высотой ≈6% высоты экрана цвета `--table` (как статус-бар), CanvasSequence сдвинут вниз на этот инсет → верхний UI приложения (X/прогресс/табы) начинается НИЖЕ island, островок сидит в бэнде. Проверить на всех 3 сценариях.

### Фаза C — Интеграция
- [ ] **C1 — Встроить в `index.astro`, убрать старый AppPreview.** Заменить `<AppPreview/>` на `<ThroughPhone .../>` между `How` и `Decks`. Удалить `AppPreview.tsx/.astro/.css` и кадры `public/hero-frames/app/` (dead code, заменены). Оставить существующие `Decks` (интерактивная сетка всех 9 колод — дополняет) и `Order`. ⚠️ Открытый вопрос: возможный дубль текста seg «Своя колода» ↔ `Order` — пометить, по желанию пользователя убрать `Order` позже.

### Фаза D — Проверка и деплой
- [ ] **D1 — Playwright 1440 + 390.** Пин держится; 3 сегмента сменяются; телефон анимированно переезжает право→лево→право (desktop); панели въезжают с нужной стороны с текстом+картинками; в сегменте «Игра» карта уезжает свайпом (слайд, не дизолв); island НЕ перекрывает UI приложения; мобайл — телефон по центру, текст сверху по сегментам; консоль чистая; деградация reduced-motion ок.
- [ ] **D2 — Деплой обоих зеркал** `bash scripts/deploy.sh` (после OK пользователя).

## Commit Plan
- **C1** (A1–A2): `feat(landing): capture deck/play/create app scenarios for through-phone`
- **C2** (B1–B5): `feat(landing): through-phone scrollytelling section (3 segments, side-swap)`
- **C3** (C1): `refactor(landing): replace app-preview with through-phone; fix screen island inset`
- Деплой после D1.

## Порядок / зависимости
A1 → A2 → B1 → (B2,B3,B4 параллельно-ish) → B5 → C1 → D1 → D2.
A (запись) — предусловие для B2 (нужны манифесты/кадры). B5 зависит от B3. C1 — после рабочего B. D после C.

## Открытые вопросы (по ходу)
1. Сценарий «create»: точный флоу ИИ-наборщика на staging (узнать селекторы/шаги через Playwright snapshot перед записью).
2. Дубль «Своя колода»(seg2) ↔ секция `Order` — оставляем обе или убираем `Order` (по желанию пользователя после просмотра).
3. Память: 3 декодированных сиквенса одновременно — если тяжело на мобиле, включать только активный±1 сегмент (lazy `enabled`).
