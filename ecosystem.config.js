// PM2 ecosystem config — Hostinger Node.js
// Démarrage : pm2 start ecosystem.config.js
// Status    : pm2 status
// Logs      : pm2 logs surnaturel
// Redémarre : pm2 restart surnaturel
// Stop      : pm2 stop surnaturel
//
// ── A13 — Soketi (Pusher open-source auto-hébergé) ─────────────────────────
// Soketi est un serveur Pusher drop-in (code inchangé, mêmes SDK).
// Pour l'activer :
//   npm install -g @soketi/soketi
//   soketi start --config=soketi.json
// Puis modifier les variables d'environnement :
//   PUSHER_HOST=127.0.0.1
//   PUSHER_PORT=6001
//   PUSHER_SCHEME=http
//   PUSHER_APP_ID=<votre-app-id>
//   PUSHER_APP_KEY=<votre-key>
//   PUSHER_APP_SECRET=<votre-secret>
//   NEXT_PUBLIC_PUSHER_HOST=<votre-domaine>
//   NEXT_PUBLIC_PUSHER_PORT=443
// soketi.json exemple : { "debug": false, "host": "127.0.0.1", "port": 6001,
//   "appManager.array.apps": [{"id":"...","key":"...","secret":"...","enableClientMessages":true}] }
//
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      name: "surnaturel",

      // Lancer le serveur standalone via start.sh (wrapper qui source .env.production).
      // Sans ce wrapper, PM2 daemon perd les variables d'environnement au respawn
      // (la commande `pm2 save` ne sauvegarde pas les vars héritées du shell).
      // start.sh : set -a; source .env.production; set +a; exec node server.js
      script: "./start.sh",
      interpreter: "bash",

      // ── Mode fork (1 processus uniquement) ─────────────────────────────
      // IMPORTANT : ne PAS utiliser exec_mode: "cluster" sans Redis partagé.
      // Le rate limiter utilise une Map en mémoire — chaque worker aurait
      // son propre compteur indépendant → les limites ne seraient pas respectées.
      // Si vous avez besoin de plusieurs workers, configurez REDIS_URL et
      // remplacez le backend du rate limiter par ioredis.
      exec_mode: "fork",
      instances: 1,

      // ── Variables d'environnement ───────────────────────────────────────
      // Secrets chargés par start.sh (source .env.production).
      // Ces vars ici servent uniquement de fallback pour NODE_ENV/PORT/HOSTNAME.
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },

      // ── Comportement ───────────────────────────────────────────────────
      // Redémarrer automatiquement si l'app crashe
      autorestart: true,
      // Ne pas redémarrer en boucle si crash trop fréquent (5 fois en 10 min)
      max_restarts: 5,
      min_uptime: "10s",
      // Redémarrer si la mémoire dépasse 512 Mo (fuite mémoire)
      max_memory_restart: "512M",

      // ── Logs ───────────────────────────────────────────────────────────
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },

    // ── Processus cron dédié ───────────────────────────────────────────
    // DÉSACTIVÉ sur Hostinger (limite de threads trop basse).
    // Les crons sont appelés via /api/cron/* par un service externe (ex: cron-job.org)
    // ou depuis GitHub Actions avec curl.
    // Pour réactiver : retirer le commentaire et redéployer.
    // {
    //   name: "crons",
    //   script: "node_modules/.bin/tsx",
    //   args: "src/cron.ts",
    //   ...
    // },

    // ── Worker BullMQ — notifications & push asynchrones ──────────────────
    // DÉSACTIVÉ sur Hostinger (limite de threads trop basse + REDIS_URL non configuré).
    // Pour réactiver : configurer REDIS_URL et retirer le commentaire.
    // {
    //   name: "worker",
    //   script: "node_modules/.bin/tsx",
    //   args: "src/worker.ts",
    //   ...
    // },
  ],
}
