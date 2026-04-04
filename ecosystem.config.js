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

      // Lancer le serveur standalone Next.js (output: "standalone" dans next.config.ts)
      // Artifacts attendus (copiés par le script de déploiement) :
      //   .next/standalone/server.js
      //   .next/standalone/.next/static/
      //   .next/standalone/public/
      script: ".next/standalone/server.js",

      // ── Mode fork (1 processus uniquement) ─────────────────────────────
      // IMPORTANT : ne PAS utiliser exec_mode: "cluster" sans Redis partagé.
      // Le rate limiter utilise une Map en mémoire — chaque worker aurait
      // son propre compteur indépendant → les limites ne seraient pas respectées.
      // Si vous avez besoin de plusieurs workers, configurez REDIS_URL et
      // remplacez le backend du rate limiter par ioredis.
      exec_mode: "fork",
      instances: 1,

      // ── Variables d'environnement ───────────────────────────────────────
      // Les secrets sont chargés via : set -a; source .env.production; set +a
      // avant pm2 start (PM2 hérite l'env du shell et le sauvegarde dans dump.pm2).
      // node_args "--env-file" ne fonctionne pas : Next.js standalone remplace
      // son propre processus (exec) et les flags Node sont perdus.
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
    // Gère tous les crons de l'application (remplace vercel.json crons).
    // Lance src/cron.ts via tsx (transpileur TypeScript léger).
    // Démarrage : pm2 start ecosystem.config.js --only crons
    {
      name: "crons",
      script: "node_modules/.bin/tsx",
      args: "src/cron.ts",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 5,
      min_uptime: "10s",
      node_args: "-r dotenv/config",
      env_production: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: ".env.production",
      },
      out_file: "./logs/cron-out.log",
      error_file: "./logs/cron-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },

    // ── Worker BullMQ — notifications & push asynchrones ──────────────────
    // Requis : REDIS_URL configuré (voir A12).
    // Lance src/worker.ts — consomme la queue "notifications".
    // Démarrage : pm2 start ecosystem.config.js --only worker
    {
      name: "worker",
      script: "node_modules/.bin/tsx",
      args: "src/worker.ts",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      env_production: {
        NODE_ENV: "production",
      },
      out_file: "./logs/worker-out.log",
      error_file: "./logs/worker-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
}
