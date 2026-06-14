#!/bin/bash
#
# Static deploy for the Spark Cards landing (sparkcards.space).
# Builds the site, backs up the remote dir, rsyncs dist/, reloads nginx.
# Requires STAGING_SSH_PASS in the environment (never commit it).
#

set -euo pipefail

REMOTE_HOST="root@185.214.108.29"
REMOTE_PORT="22"
REMOTE_DIR="/var/www/sparkcards.space"
REMOTE_PARENT="/var/www"
SSH_OPTS="-o StrictHostKeyChecking=accept-new"

echo "==> Landing deploy starting"

if [ -z "${STAGING_SSH_PASS:-}" ]; then
  echo "ERROR: STAGING_SSH_PASS is not set. Export it before deploying (never commit it)." >&2
  exit 1
fi

echo "==> Step 1/5: Building static site"
npm run build

echo "==> Step 2/5: Ensuring remote dir + backing up current contents"
sshpass -p "$STAGING_SSH_PASS" ssh $SSH_OPTS -p "$REMOTE_PORT" "$REMOTE_HOST" \
  "mkdir -p $REMOTE_DIR; if [ -n \"\$(ls -A $REMOTE_DIR 2>/dev/null)\" ]; then tar czf $REMOTE_PARENT/sparkcards-space-backup-\$(date +%Y%m%d-%H%M%S).tar.gz -C $REMOTE_PARENT sparkcards.space; fi"

echo "==> Step 3/5: Syncing dist/ to $REMOTE_HOST:$REMOTE_DIR"
sshpass -p "$STAGING_SSH_PASS" rsync -avz --delete \
  -e "ssh $SSH_OPTS -p $REMOTE_PORT" \
  dist/ "$REMOTE_HOST:$REMOTE_DIR/"

echo "==> Step 4/5: Fixing ownership and reloading nginx"
sshpass -p "$STAGING_SSH_PASS" ssh $SSH_OPTS -p "$REMOTE_PORT" "$REMOTE_HOST" \
  "chown -R www-data:www-data $REMOTE_DIR && nginx -t && systemctl reload nginx"

echo "==> Step 5/5: Done — https://sparkcards.space"
