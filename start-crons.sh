#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start-crons.sh — Wrapper PM2 pour les crons node-cron
#
# Charge .env.production puis lance src/cron.ts via tsx.
# ─────────────────────────────────────────────────────────────────────────────

set -a
source /home/u507379921/surnaturel/.env.production
set +a

exec /opt/alt/alt-nodejs20/root/usr/bin/npx tsx \
  /home/u507379921/surnaturel/src/cron.ts
