#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  deploy.sh — Déploiement MANUEL d'urgence (Hostinger SSH)          ║
# ║                                                                    ║
# ║  ⚡ DÉPLOIEMENT NORMAL : push sur main → GitHub Actions          ║
# ║     (voir .github/workflows/deploy.yml)                           ║
# ║                                                                    ║
# ║  Ce script sert uniquement aux interventions manuelles :           ║
# ║    - Rollback rapide                                              ║
# ║    - Déploiement hors-ligne (GitHub Actions indisponible)         ║
# ║    - Première mise en place du serveur                            ║
# ║                                                                    ║
# ║  Usage : bash scripts/deploy.sh [--skip-migrations]               ║
# ╚══════════════════════════════════════════════════════════════════════╝
set -euo pipefail

SKIP_MIGRATIONS=false
for arg in "$@"; do
  [[ "$arg" == "--skip-migrations" ]] && SKIP_MIGRATIONS=true
done

echo "═══════════════════════════════════════════════"
echo "  Déploiement Manuel — Le Surnaturel de Dieu"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════"

# ── 1. Vérifications préalables ───────────────────────────────────────
echo ""
echo "▶ 1/7 Vérifications préalables…"

# Les variables peuvent venir de :
#   - .env.production (VPS, déploiement manuel)
#   - L'environnement du système (panel Hostinger ou export)
if [[ -f ".env.production" ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env.production
  set +a
  echo "  ✓ .env.production chargé"
else
  echo "  ℹ  Pas de .env.production — variables attendues dans l'environnement système"
fi

for var in NEXTAUTH_URL NEXTAUTH_SECRET DATABASE_URL ENCRYPTION_KEY CRON_SECRET; do
  if [[ -z "${!var:-}" ]]; then
    echo "  ✗ Variable manquante : $var"
    echo "    → Définissez-la dans .env.production ou le panel Hostinger"
    exit 1
  fi
done
echo "  ✓ Variables d'environnement OK"

# ── 2. Installation des dépendances ──────────────────────────────────
echo ""
echo "▶ 2/7 Installation des dépendances…"
npm ci --omit=dev --legacy-peer-deps
echo "  ✓ npm ci terminé"

# ── 3. Génération du client Prisma ───────────────────────────────────
echo ""
echo "▶ 3/7 Génération du client Prisma…"
npx prisma generate
echo "  ✓ Prisma generate terminé"

# ── 4. Migrations DB ─────────────────────────────────────────────────
echo ""
if [[ "$SKIP_MIGRATIONS" == "true" ]]; then
  echo "▶ 4/7 Migrations — IGNORÉES (--skip-migrations)"
else
  echo "▶ 4/7 Migrations base de données…"
  npx prisma migrate deploy
  echo "  ✓ Migrations appliquées"
fi

# ── 5. Build Next.js ─────────────────────────────────────────────────
echo ""
echo "▶ 5/8 Build Next.js (output: standalone)…"
NODE_ENV=production npm run build
echo "  ✓ Build terminé"

# ── 6. Copier les assets statiques dans standalone ───────────────────
# Next.js standalone NE copie PAS .next/static ni public automatiquement.
# Sans cette étape, tous les JS/CSS client retournent 404 → page blanche.
echo ""
echo "▶ 6/8 Copie des assets statiques…"
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
echo "  ✓ .next/static et public/ copiés dans standalone"

# ── 6b. Copier les scripts PM2 (crons, worker) ──────────────────────
cp start.sh start-crons.sh start-worker.sh ecosystem.config.js .next/standalone/ 2>/dev/null || true
cp -r src .next/standalone/src 2>/dev/null || true
echo "  ✓ Scripts PM2 copiés dans standalone"

# ── 7. Redémarrage PM2 ───────────────────────────────────────────────
echo ""
echo "▶ 7/8 Redémarrage PM2…"
if pm2 list | grep -q "surnaturel"; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save
echo "  ✓ PM2 redémarré"

# ── 8. Tests des routes critiques ────────────────────────────────────
echo ""
echo "▶ 8/8 Test des routes critiques…"

BASE_URL="${NEXTAUTH_URL}"
ROUTES=("/api/health" "/" "/connexion" "/boutique")

for route in "${ROUTES[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${route}" || echo "000")
  if [[ "$status" == "200" || "$status" == "302" || "$status" == "301" ]]; then
    echo "  ✓ ${route} → HTTP ${status}"
  else
    echo "  ⚠ ${route} → HTTP ${status} (à vérifier)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Déploiement terminé"
echo "  Site : ${BASE_URL}"
echo "═══════════════════════════════════════════════"
