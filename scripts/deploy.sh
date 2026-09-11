#!/bin/bash
#
# Static deploy for the Spark Cards landing (sparkcards.space).
# Geo-split: deploys the SAME static build to BOTH mirrors.
#   - vdsina (RU)  83.217.215.66  — плечо гео для юзеров из РФ
#   - 62yun  (FRA) 194.5.65.182   — плечо гео для всех остальных, включая всех под VPN
# Старый бокс 185.214.108.29 умер и выведен 2026-07-09 — деплой в него не попадал никуда.
# Builds once, then per server: backs up remote dir, rsyncs dist/, reloads nginx.
# Requires both SSH passwords in the environment (never commit them):
#   LANDING_SSH_PASS -> root@83.217.215.66 (vdsina, RU)
#   FRA_SSH_PASS     -> root@194.5.65.182  (62yun, FRA); принимаются и старые имена
#                       NL_SSH_PASS / STAGING_SSH_PASS — чтобы не ломать уже настроенные окружения
#

set -euo pipefail

# На сервер уезжает ровно то, что лежит в репозитории: иначе на проде оказывается код, которого
# нет в git — не воспроизвести, не отревьюить, не откатить. Поэтому сначала коммит и пуш.
# Аварийный обход: SKIP_GIT_GUARD=1 (в логе останется предупреждение).
git_guard() {
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "ВНИМАНИЕ: каталог не является git-репозиторием, проверка пропущена" >&2
    return 0
  fi
  if [ -n "$(git status --porcelain)" ]; then
    echo "ДЕПЛОЙ ОСТАНОВЛЕН: есть незакоммиченные изменения — сначала коммит, потом деплой." >&2
    git status --short >&2
    exit 1
  fi
  local upstream ahead
  upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)
  if [ -z "$upstream" ]; then
    echo "ВНИМАНИЕ: у ветки нет upstream — пушить некуда, деплой пойдёт из локальных коммитов" >&2
    return 0
  fi
  git fetch -q origin 2>/dev/null || true
  ahead=$(git rev-list --count "$upstream"..HEAD 2>/dev/null || echo 0)
  if [ "$ahead" != "0" ]; then
    echo "ДЕПЛОЙ ОСТАНОВЛЕН: $ahead коммит(ов) не отправлено в $upstream — сначала push, потом деплой." >&2
    exit 1
  fi
  echo "==> git: дерево чисто, всё отправлено в $upstream"
}

if [ "${SKIP_GIT_GUARD:-0}" = "1" ]; then
  echo "ВНИМАНИЕ: git-гард отключён (SKIP_GIT_GUARD=1) — на сервер может уехать код, которого нет в репозитории" >&2
else
  git_guard
fi

REMOTE_DIR="/var/www/sparkcards.space"
REMOTE_PARENT="/var/www"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"

# label | user@host | port | password-env-var
TARGETS=(
  "vdsina-RU (плечо для РФ)|root@83.217.215.66|22|LANDING_SSH_PASS"
  "62yun-FRA (зарубежное плечо)|root@194.5.65.182|22|FRA_SSH_PASS"
)

echo "==> Landing deploy starting (geo-split: 2 mirrors)"

# Fail fast if any secret is missing — both mirrors must stay in sync.
for t in "${TARGETS[@]}"; do
  IFS='|' read -r label host port passvar <<< "$t"
  # окружения, настроенные до переезда, держат пароль в NL_SSH_PASS или STAGING_SSH_PASS
  if [ "$passvar" = "FRA_SSH_PASS" ] && [ -z "${FRA_SSH_PASS:-}" ]; then
    FRA_SSH_PASS="${NL_SSH_PASS:-${STAGING_SSH_PASS:-}}"
    export FRA_SSH_PASS
  fi
  if [ -z "${!passvar:-}" ]; then
    echo "ERROR: $passvar is not set (needed for $label / $host). Export it before deploying (never commit it)." >&2
    exit 1
  fi
done

echo "==> Step 1/2: Building static site"
npm run build

# Guard: hero-frames/ is gitignored, so it only exists in dist when built on a
# machine that has the source frames. A frames-less build + `rsync --delete`
# would WIPE the scroll-scrub frames off the server (breaks the hero video, the
# phone screen image, and unpins the ThroughPhone section → "всё поехало").
# Abort before rsync if the frames are missing, so a bad build can't nuke them.
for probe in hero/0001.webp decks/0001.webp play/0001.webp create/0001.webp; do
  if [ ! -f "dist/hero-frames/$probe" ]; then
    echo "ERROR: dist/hero-frames/$probe missing — refusing to deploy (rsync --delete would wipe scroll frames off the live servers). Build on a machine that has public/hero-frames/." >&2
    exit 1
  fi
done

TS=$(date +%Y%m%d-%H%M%S)
FAIL=0

echo "==> Step 2/2: Syncing to both mirrors"
for t in "${TARGETS[@]}"; do
  IFS='|' read -r label host port passvar <<< "$t"
  echo
  echo "==> [$label] $host"
  export SSHPASS="${!passvar}"

  echo "  - backup remote dir"
  if ! sshpass -e ssh $SSH_OPTS -p "$port" "$host" \
      "mkdir -p $REMOTE_DIR; if [ -n \"\$(ls -A $REMOTE_DIR 2>/dev/null)\" ]; then tar czf $REMOTE_PARENT/sparkcards-space-backup-${TS}.tar.gz -C $REMOTE_PARENT sparkcards.space; fi"; then
    echo "  ! backup FAILED on $label — skipping this mirror" >&2; FAIL=1; continue
  fi

  echo "  - rsync dist/"
  if ! sshpass -e rsync -az --delete -e "ssh $SSH_OPTS -p $port" dist/ "$host:$REMOTE_DIR/"; then
    echo "  ! rsync FAILED on $label" >&2; FAIL=1; continue
  fi

  echo "  - chown + nginx reload"
  if ! sshpass -e ssh $SSH_OPTS -p "$port" "$host" \
      "chown -R www-data:www-data $REMOTE_DIR && nginx -t && systemctl reload nginx"; then
    echo "  ! nginx reload FAILED on $label" >&2; FAIL=1; continue
  fi

  echo "  ✓ [$label] done"
done

echo
if [ "$FAIL" -ne 0 ]; then
  echo "==> Deploy finished WITH ERRORS — mirrors may be OUT OF SYNC. Check the log above." >&2
  exit 1
fi
# rsync и reload могут пройти, а наружу отдаваться старое. Домен под гео-DNS, поэтому каждое
# плечо проверяем по своему адресу через --resolve: с этой машины DNS отдаст только одно из двух.
echo "==> Проверка: оба плеча отдают одну и ту же сборку"
LOCAL_SHA=$(shasum -a 256 dist/index.html | cut -d' ' -f1)
VERIFY_FAIL=0
for t in "62yun-FRA (зарубежное плечо)|194.5.65.182" "vdsina-RU (плечо для РФ)|83.217.215.66"; do
  IFS='|' read -r vlabel vip <<< "$t"
  served=$(curl -sS -m 30 --resolve "sparkcards.space:443:$vip" https://sparkcards.space/ 2>/dev/null | shasum -a 256 | cut -d' ' -f1)
  if [ "$served" = "$LOCAL_SHA" ]; then
    echo "  ✓ [$vlabel] отдаёт свежую сборку"
  else
    echo "  ! [$vlabel] отдаёт другую сборку — эта часть аудитории осталась на прошлой версии" >&2
    VERIFY_FAIL=1
  fi
done
if [ "$VERIFY_FAIL" -ne 0 ]; then
  echo "==> Заливка прошла, но плечи разошлись. Разбираться по ../spark/docs/INFRA_GEODNS.md" >&2
  exit 1
fi

echo "==> Done — both mirrors updated. https://sparkcards.space"
