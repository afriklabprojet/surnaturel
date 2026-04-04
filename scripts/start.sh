#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Wrapper PM2 pour le serveur Next.js standalone
#
# Pourquoi ce fichier existe :
#   PM2 sauvegarde la config de l'écosystème (dump.pm2) MAIS PAS les variables
#   d'environnement héritées du shell au démarrage. Si le daemon PM2 se relance
#   (crash, redémarrage du serveur, resource kill), le processus surnaturel
#   repart SANS les secrets de .env.production → emails, DB, etc. brisés.
#
#   Solution : PM2 lance ce wrapper (interpreter: bash) qui source .env.production
#   AVANT de démarrer node. Ainsi, chaque (re)démarrage a les bonnes variables.
# ─────────────────────────────────────────────────────────────────────────────

set -a
source /home/u507379921/surnaturel/.env.production
set +a

exec /opt/alt/alt-nodejs20/root/usr/bin/node \
  /home/u507379921/surnaturel/.next/standalone/server.js
