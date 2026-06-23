#!/bin/bash
#
# Static deploy for the Spark Cards landing (sparkcards.space).
# Geo-split: deploys the SAME static build to BOTH mirrors.
#   - vdsina (RU)  83.217.215.66  — serves RU-source traffic
#   - 62yun  (NL)  185.214.108.29 — serves default / foreign / VPN traffic
# Builds once, then per server: backs up remote dir, rsyncs dist/, reloads nginx.
# Requires both SSH passwords in the environment (never commit them):
#   LANDING_SSH_PASS -> root@83.217.215.66 (vdsina, RU)
#   NL_SSH_PASS      -> root@185.214.108.29 (62yun, NL)
#

set -euo pipefail

REMOTE_DIR="/var/www/sparkcards.space"
REMOTE_PARENT="/var/www"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"

# label | user@host | port | password-env-var
TARGETS=(
  "vdsina-RU|root@83.217.215.66|22|LANDING_SSH_PASS"
  "62yun-NL|root@185.214.108.29|22|NL_SSH_PASS"
)

echo "==> Landing deploy starting (geo-split: 2 mirrors)"

# Fail fast if any secret is missing — both mirrors must stay in sync.
for t in "${TARGETS[@]}"; do
  IFS='|' read -r label host port passvar <<< "$t"
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
echo "==> Done — both mirrors updated. https://sparkcards.space"
