# Geo-split DNS routing — sparkcards.space

Runbook для гео-маршрутизации лендинга на два зеркала. Создано 2026-06-16.

## Зачем

Ни один сервер не доступен обеим аудиториям одновременно:

| | РФ без VPN | VPN / заграница |
|---|---|---|
| **NL** 62yun `185.214.108.29` | ❌ режется из РФ | ✅ |
| **RU** vdsina `83.217.215.66` | ✅ | ❌ не достучаться с VPN-выхода |

Решение: geo-DNS отдаёт каждому ближайший сервер. РФ-юзеры → vdsina, все остальные (включая РФ с VPN, чей выход за границей) → NL. Оба сервера — **идентичные зеркала** одной статики.

## Архитектура

```
              sparkcards.space (домен на reg.ru)
                       │  NS → kiki.bunny.net / coco.bunny.net
                  Bunny DNS (geo)
          ┌────────────┴────────────┐
   ближе к Москве            ближе к Амстердаму (= всё остальное)
        │                          │
   vdsina РФ                   62yun NL
   83.217.215.66               185.214.108.29
   (домашний для РФ)           (глобально доступный)
        └──── один и тот же dist/ ────┘
```

## DNS (Bunny, зона id 810970)

Записи `@` и `www` — оба **Smart Record Type = Geographic**, TTL 300, по 2 записи в наборе:

| host | value | координаты | кому достаётся |
|---|---|---|---|
| @ / www | `83.217.215.66` (vdsina) | 55.75, 37.62 (Москва) | РФ-резолверы |
| @ / www | `185.214.108.29` (NL) | 52.37, 4.90 (Амстердам) | все остальные |

- Домен **остаётся зарегистрирован на reg.ru**; на Bunny делегированы только NS.
- У домена нет MX/TXT (почты/верификаций нет) — при переключении терять было нечего.
- Проверка geo: `dig @kiki.bunny.net sparkcards.space A +short` (из-за границы → NL; из РФ → vdsina).

## Серверы (nginx)

Оба: vhost `sparkcards.space` + `www`, root `/var/www/sparkcards.space`, TLS Let's Encrypt.

- **vdsina** `root@83.217.215.66` — секрет `LANDING_SSH_PASS`.
- **NL** `root@185.214.108.29` (62yun, многоарендный — рядом живёт staging) — секрет `NL_SSH_PASS`. vhost: `/etc/nginx/sites-available/sparkcards.space`.

## Деплой

```bash
LANDING_SSH_PASS=... NL_SSH_PASS=... bash scripts/deploy.sh
```
Собирает `dist/`, бэкапит и заливает на **оба** зеркала, перезагружает nginx. Падение одного — явный лог, exit 1. Секреты только в env, не в гит.

## Игра на `sparkcards.space/play` (PROD-приложение)

Помимо лендинга на апексе, **прод-игра Spark** (Expo web из репо `spark`) живёт на подпути `/play` того же домена — наследует гео-роутинг и TLS лендинга (отдельный домен/серт не нужен).

- **Отдельный webroot** на обоих зеркалах: `/var/www/sparkcards-play` (НЕ под `/var/www/sparkcards.space` — иначе landing-деплой с `rsync --delete` затёр бы игру).
- nginx в vhost `sparkcards.space` на обоих зеркалах: `location /play/ { alias /var/www/sparkcards-play/; try_files $uri $uri/ /play/index.html; }` + `location = /play { return 301 /play/; }`.
- **Сборка под подпуть:** прод-билд делается с `DEPLOY_TARGET=prod` → `app.config.ts` ставит `experiments.baseUrl='/play'` (staging остаётся на корне).
- **Деплой (из репо spark, вручную/по релизу, НЕ на пуш):**
  ```bash
  LANDING_SSH_PASS=... NL_SSH_PASS=... yarn deploy:prod
  ```
  Собирает с base-path `/play`, guard на `/play/_expo`, rsync на **оба** зеркала + reload.
- **API:** прод-игра пока ходит в общий `cards-api-staging` (185). ⚠️ Из РФ 185 режется → у РФ-юзеров без VPN запросы к API упадут (статика `/play` отдаётся с vdsina и доступна; бэкенд — нет). Полный РФ-доступ = reverse-proxy `/api` через RU-зеркало (отдельный шаг).
- Старая заглушка `spark-cards.duckdns.org` → 301 на `sparkcards.space/play/`; сломанный CI `deploy-production.yml` и секреты `PROD_*` удалены (2026-06-24).

## TLS-серт

- vdsina: серт есть, продлевается своим путём.
- **NL: серт sparkcards.space действует до 11 сен 2026, авто-продление НЕ настроено.** До сентября поднять через DNS-01 + Bunny API (acme.sh `dns_bunny`, нужен Bunny API-ключ). HTTP-01 не подойдёт — geo уведёт валидатор не на тот сервер.

## Откат

В reg.ru → домен → DNS-серверы → «Изменить» → вернуть `ns1.reg.ru` / `ns2.reg.ru`. Через распространение всё вернётся на vdsina-only (как было до geo).

## Проверка после распространения

```bash
# делегирование в реестре (должно стать kiki/coco.bunny.net):
dig sparkcards.space NS +short
# из РФ без VPN → 83.217.215.66; с VPN/заграницы → 185.214.108.29
dig sparkcards.space A +short
```
Открыть сайт без VPN (РФ) и с VPN — в обоих случаях должен грузиться.

## Известный трейдофф

Geo по близости: пользователи Восточной Азии (без VPN) могут попасть на vdsina (РФ ближе НЛ). vdsina для них доступен (просто медленнее) — не критично, целевая аудитория РФ. При необходимости добавить доп. NL-якоря на других координатах.
