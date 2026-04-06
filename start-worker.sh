#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start-worker.sh — Wrapper PM2 pour le worker BullMQ
#
# Charge .env.production puis lance src/worker.ts via tsx.
# Si REDIS_URL n'est pas défini, le worker ne démarre pas.
# ─────────────────────────────────────────────────────────────────────────────

set -a
source /home/u507379921/surnaturel/.env.production
set +a

if [ -z "$REDIS_URL" ]; then
  echo "[worker] REDIS_URL non défini — worker BullMQ désactivé (fallback synchrone)"
  # Rester vivant pour que PM2 ne tente pas de redémarrer en boucle
  sleep infinity
fi

exec /opt/alt/alt-nodejs20/root/usr/bin/npx tsx \
  /home/u507379921/surnaturel/src/worker.ts
