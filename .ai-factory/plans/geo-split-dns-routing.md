# Geo-split DNS routing для sparkcards.space

**Проект:** spark-landing (статический Astro-сайт)
**Ветка:** feature/landing-build (остаёмся на ней, новую не создаём)
**Дата:** 2026-06-15
**Тип:** инфраструктура (DNS / nginx / деплой), не код приложения

## Settings

- **Тесты (как код):** нет — это инфра. Проверка через verification-чеклист (dig/curl из РФ и из-за границы).
- **Логирование:** пошаговый `echo`-лог в деплой-скрипте (как сейчас в `scripts/deploy.sh`).
- **Документация:** да — короткий `docs/INFRA-geo-routing.md` (схема, IP, провайдер, как деплоить, как продлевать серт) + verification-чеклист.

## Research Context (из /aif-explore)

**Проблема:** ни один сервер в одиночку не покрывает обе аудитории.

```
                  РФ без VPN          VPN / заграница
NL 62yun          ❌ режется из РФ      ✅ работает
185.214.108.29
RU vdsina         ✅ работает          ❌ не достучаться
83.217.215.66                            с VPN-выхода
```

**Решение:** geo-DNS. Запрос «из РФ» → vdsina; default (заграница/VPN) → NL. Оба сервера отдают **идентичную статику** (`dist/`). VPN-юзер для DNS выглядит иностранцем → попадает на NL, который у него и так открывается.

**Ключевые факты:**
- Домен на reg.ru, NS = `ns1/ns2.reg.ru`. Меняем только NS → Bunny; домен остаётся на reg.ru.
- DNS-провайдер: **Bunny DNS** (geo SmartRecords, anycast, фактически бесплатно — центы за запросы). Запасной — Route53 (~$1/мес).
- Веб идёт **напрямую** с VPS, без иностранного CDN в пути → РФ-без-VPN ни от чего иностранного не зависят.
- vdsina: серт sparkcards.space **уже есть**, лендинг отдаёт. nginx-конфиг в репо: `deploy/nginx-sparkcards.space.conf`.
- NL: занят staging-приложением (default vhost → 401), серта для sparkcards.space **нет**. Нужен co-host: отдельный server_name + root.
- Серт на NL: **DNS-01** (HTTP-01 не пройдёт — geo уведёт валидатор на default-сервер). Первичный выпуск — ручной TXT в reg.ru (пока он authoritative), после смены NS — автопродление через Bunny API.
- **Критический порядок:** NL должен ПОЛНОСТЬЮ работать (vhost + серт + контент) ДО смены NS. Иначе заграница хлынет на сломанный NL.
- Риск geo-промахов ~5-10% (DNS-лики, резолверы без ECS); промах = «не открылось вообще». Митигируем клиентским фолбэком на второе зеркало.

**Секреты (не коммитить):** `LANDING_SSH_PASS` → root@83.217.215.66 (vdsina); NL → root@185.214.108.29, пароль `8zgsro6V` (хранить в env как `NL_SSH_PASS`).

**Условные обозначения:** 🧑 = шаг руками в панели (reg.ru / Bunny) — у меня нет доступа, готовлю точные значения и инструкцию. 🤖 = делаю я (сервер/скрипт/код).

---

## Tasks

### Фаза 0 — Гейт: проверить Bunny из РФ

- [ ] **T1 🧑 Проверить доступность Bunny anycast NS из РФ (без VPN).**
  Я готовлю команды (`dig @<bunny-ns> sparkcards.space`, `curl` к Bunny). Ты прогоняешь с машины в РФ без VPN.
  - NS Bunny отвечают быстро → берём Bunny, продолжаем.
  - Не отвечают/таймаут → переключаемся на Route53 (план остаётся тот же, меняется только провайдер и cert-hook).
  Лог: вывод команд в чат.

### Фаза 1 — NL становится рабочим зеркалом

- [ ] **T2 🤖 Поднять на NL nginx-vhost для sparkcards.space (co-host рядом со staging).**
  Файл на сервере: `/etc/nginx/sites-available/sparkcards.space` (адаптировать из репо `deploy/nginx-sparkcards.space.conf`), отдельный `server_name sparkcards.space www.sparkcards.space`, `root /var/www/sparkcards.space`, не трогать существующий staging-vhost. `nginx -t` перед reload.
  Блокирует: T3, T4. Лог: `nginx -t` + статус reload.

- [ ] **T3 🤖 Выпустить TLS-серт для sparkcards.space на NL через DNS-01.**
  Первичный выпуск — `acme.sh`/certbot в режиме manual DNS-01: добавить TXT `_acme-challenge` в reg.ru (он ещё authoritative), провалидировать, поставить серт в nginx-vhost. Заготовить автопродление через Bunny DNS API (включится после T7, когда зона уедет в Bunny).
  Зависит от: T2. Лог: путь к серту, результат `openssl x509 -noout -dates`.

- [ ] **T4 🤖 Залить текущий `dist/` на NL и проверить отдачу по имени.**
  `npm run build` локально → rsync `dist/` в `/var/www/sparkcards.space` на NL. Проверка: `curl -I --resolve sparkcards.space:443:185.214.108.29 https://sparkcards.space/` → 200 + валидный серт (без `-k`).
  Зависит от: T2, T3. Лог: код ответа + проверка серта.

### Фаза 2 — Двойной деплой

- [ ] **T5 🤖 Расширить `scripts/deploy.sh` на dual-target.**
  После `build` — бэкап + rsync `dist/` + reload nginx на ОБА сервера (vdsina и NL). Хосты/секреты параметризовать: `LANDING_SSH_PASS` (vdsina), `NL_SSH_PASS` (NL). Падение одного сервера не должно молча пропускаться — явный лог по каждому. Секреты не коммитить.
  Зависит от: T4. Лог: пошаговый `echo` per-server.

### Фаза 3 — Geo-DNS на Bunny

- [x] **T6 ✅ Зона + geo-записи в Bunny (через Playwright): @ и www, Geographic, Moscow→vdsina / Amsterdam→NL, TTL 300. Проверено dig.**
  Я готовлю точный список записей; ты создаёшь в панели Bunny:
  - A (apex) + A (www): **RU → 83.217.215.66**, **default → 185.214.108.29** (geo SmartRecord).
  - Перенести существующие записи с reg.ru: сначала выгрузить текущие (MX/TXT/SPF/прочее — я дам команды посмотреть), затем воспроизвести в Bunny, чтобы почта/верификации не отвалились.
  Зависит от: T1 (Bunny подтверждён). Блокирует: T7. Лог: скрин/список записей.

- [x] **T7 ✅ NS у reg.ru → kiki.bunny.net / coco.bunny.net (через Playwright). Идёт распространение в реестре .space.**
  ТОЛЬКО после того как NL полностью отдаёт сайт с валидным сертом (T4) и зона Bunny готова (T6). Я даю точные значения NS Bunny + чеклист. Ты меняешь в панели reg.ru. Затем ждём пропагацию.
  Зависит от: T4, T6. Лог: `dig NS sparkcards.space` до/после.

### Фаза 4 — Надёжность, проверка, доки

- [ ] **T8 🤖 Клиентский фолбэк на второе зеркало (защита от geo-промахов).**
  Крошечный inline-скрипт в `<head>` (Astro `src/layouts/Layout.astro`): если страница не «ожила» за N сек (не сработал маркер загрузки) — `location` на второе зеркало по IP/субдомену. Идентичный контент на обоих → редирект безопасен. Затрагивает код приложения (минимально). Под `prefers-reduced`/SSR-safe.
  Зависит от: T4. Лог: dev-консоль `[geo-fallback]` (убрать в prod-сборке или за флагом).

- [ ] **T9 🤖🧑 Финальная проверка + `docs/INFRA-geo-routing.md`.**
  Матрица: из РФ без VPN (🧑 прогоняешь) и из-за границы/VPN (🤖 я с NL-egress) — оба кейса открывают сайт, серт валиден на обоих, NS = Bunny, Telegram OG-превью тянется. Записать в `docs/INFRA-geo-routing.md`: схему, IP, провайдера, порядок деплоя, как продлевать серт на NL, как откатиться (NS обратно на reg.ru).
  Зависит от: T7, T8. Лог: заполненная матрица проверки.

---

## Commit Plan

- **C1** (после T2-T4): `chore(deploy): nl mirror vhost + tls for sparkcards.space` — конфиги/заметки по NL (серверные изменения вне репо документируем в docs).
- **C2** (после T5): `feat(deploy): dual-target deploy (vdsina + nl mirror)`
- **C3** (после T8): `feat(landing): client-side mirror fallback for geo misses`
- **C4** (после T9): `docs(infra): geo-split dns routing runbook`

DNS-шаги (T1/T6/T7) — руками в панелях, в гит не коммитятся (отражаются только в docs).

## Порядок выполнения (критично)

```
T1 (гейт Bunny)
   └─> T2 ─> T3 ─> T4 ──┬─> T5 (dual deploy)
                        ├─> T8 (фолбэк)
                        └─> T6 (зона Bunny) ─> T7 (смена NS) ─> T9 (проверка+доки)
```
NL обязан работать (T4) до смены NS (T7).
