# ✅ TODO — Corrections Audit + Migration Hostinger

> Stack conservé. Hébergement : **Hostinger Node.js** (process persistant, pas
> serverless). Cocher chaque item une fois terminé.

---

## 🔴 URGENT — Corrections critiques (avant mise en prod)

- [x] **1. Corriger IDOR sur `/api/paiement/statut/[id]`**
  - Ajouter `auth()` + vérifier que le `paiementId` appartient à
    `session.user.id`
  - Fichier : `src/app/api/paiement/statut/[id]/route.ts`

- [x] **2. Uploads Cloudinary non signés côté client**
  - 4 fichiers font des uploads directs depuis le navigateur avec
    `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
  - Créer une route API `/api/upload/signe` qui génère une signature HMAC-SHA256
    côté serveur
  - Fichiers : `profil/modifier/page.tsx`, `profil/page.tsx`,
    `communaute/groupes/page.tsx`, `communaute/groupes/[slug]/page.tsx`

- [x] **3. Validation MIME type — magic bytes au lieu du header client**
  - `file.type` est fourni par le client → falsifiable
  - Lire les premiers octets du buffer pour détecter le vrai type
  - Fichiers : `api/messages/fichier/route.ts`, `api/messages/image/route.ts`

- [x] **4. Rate limiter — adapter pour Hostinger (PM2 cluster)**
  - Sur Hostinger avec PM2 en mode cluster (plusieurs workers), la Map mémoire
    ne se partage pas
  - Option A (simple) : forcer PM2 en mode `fork` (1 seul process) — Map mémoire
    fonctionnelle
  - Option B (robuste) : utiliser Upstash Redis ou `ioredis` avec Redis local
    Hostinger
  - Fichier : `src/lib/rate-limit.ts`

---

## 🟠 HAUTE PRIORITÉ — Semaine 1 après prod

- [x] **5. Webhook Jeko — ajouter vérification HMAC sur le body**
  - Si Jeko supporte les signatures, vérifier `X-Jeko-Signature` avec
    HMAC-SHA256
  - Sinon, re-vérifier le montant via l'API Jeko avant de marquer `PAYEE`
  - Fichier : `src/app/api/paiement/webhook/route.ts`

- [x] **6. Chiffrer `groupeSanguin` dans le dossier médical**
  - Champ médical stocké en clair alors que les autres champs sont AES-256-GCM
  - Fichier : `src/app/api/medical/dossier/route.ts` + migration Prisma

- [x] **7. Rate limit sur routes manquantes**
  - Ajouter dans le middleware : `/api/rdv` POST (anti-spam réservations)
  - Ajouter : `/api/auth/inscription` (anti mass-account creation)
  - Ajouter : `/api/communaute/posts` POST
  - Fichier : `src/middleware.ts`

- [x] **8. SELECT FOR UPDATE sur le stock produit**
  - La transaction Prisma en READ COMMITTED ne protège pas contre 2 achats
    simultanés du dernier article
  - Ajouter `tx.$executeRaw\`SELECT id FROM "Produit" WHERE id = ANY(...) FOR
    UPDATE\``avant le`findMany`
  - Fichier : `src/app/api/boutique/commandes/route.ts`

- [x] **9. JWT — ajouter `jti` pour révocation de session**
  - Un JWT compromis dure 30 jours sans possibilité de révocation
  - Stocker le `jti` dans `AuthSession`, le vérifier sur les routes sensibles
    (paiement, données médicales)
  - Fichiers : `src/lib/auth.ts` + middleware

---

## 🟡 MOYEN TERME — Mois 1

- [x] **10. Remplacer les 109 `console.*` par un logger structuré**
  - Installé `pino` + créé `src/lib/logger.ts` avec redaction des champs
    sensibles
  - Remplacé tous les `console.error/warn/log` dans les 67 fichiers API
  - Évite la fuite d'info sensible dans les logs Hostinger

- [x] **11. Corriger le N+1 dans le rapport mensuel**
  - 12 requêtes DB séquentielles pour afficher 6 mois de données
  - Remplacé par 2 requêtes `GROUP BY date_trunc('month', ...)` en parallèle
  - Fichier : `src/app/api/admin/rapports/route.ts`

- [x] **12. Lazy-load agressif des composants lourds**
  - `FenetreChat` (1305 lignes), `recharts` (graphiques), `framer-motion`
  - Créé `FenetreChatLazy.tsx` avec `dynamic(() => import(...), { ssr: false })`
  - Améliore le TTI sur réseau 3G africain

- [x] **13. Ajouter PostHog pour les analytics produit**
  - Installé `posthog-js` + créé `PostHogProvider.tsx` (Suspense-compatible)
  - Page views automatiques à chaque navigation App Router
  - Désactivé si `NEXT_PUBLIC_POSTHOG_KEY` est absent (opt-in)

---

## 🏗️ MIGRATION HOSTINGER

- [x] **14. Supprimer la config Vercel des crons et adapter pour Hostinger**
  - Créé `src/cron.ts` — processus node-cron avec les 13 crons de `vercel.json`
  - Ajouté l'entrée `crons` dans `ecosystem.config.js` (PM2 fork dédié)
  - `vercel.json` conservé pour traces — le processus cron le remplace

- [x] **15. Configurer PM2 pour Next.js sur Hostinger**
  - Créer `ecosystem.config.js` à la racine
  - `pm2 start ecosystem.config.js` pour démarrer l'app
  - Configurer le mode `fork` (1 worker) OU `cluster` avec Redis partagé (selon
    choix item #4)

- [x] **16. Adapter `next.config.ts` pour Hostinger**
  - Supprimer les configs spécifiques Vercel si présentes
  - Vérifier que `output: 'standalone'` est configuré pour un déploiement
    Node.js autonome
  - Supprimer l'import `@sentry/nextjs` du tunnel si non utilisé (ou configurer
    le tunnel vers votre domaine)

- [x] **17. Variables d'environnement sur Hostinger**
  - Créé `.env.production.example` — template avec toutes les variables requises
  - Instructions de génération pour chaque secret (openssl rand)
  - `.env.production` (vrai fichier) couvert par `.gitignore` via `.env*`

- [x] **18. Configurer le reverse proxy (Apache/Nginx) sur Hostinger**
  - Créé `public/.htaccess` — proxy Apache vers `localhost:3000`
  - Force HTTPS, headers sécurité, gzip, cache assets Next.js

- [x] **19. Configurer Prisma pour Neon sur Hostinger**
  - Neon PostgreSQL reste inchangé (hébergé séparément)
  - Vérifier que `@prisma/adapter-neon` est correctement configuré
  - Tester la connexion depuis Hostinger vers Neon (firewall, IP whitelist si
    nécessaire)

- [x] **20. Build et déploiement initial**
  - Créé `scripts/deploy.sh` — script complet (vérif env, npm ci, prisma, build,
    PM2, tests)
  - Vérifier que le build passe sans erreurs
  - Tester toutes les routes critiques (paiement, RDV, auth, médical)

---

## 📊 SUIVI

| Priorité     | Items  | Complétés |
| ------------ | ------ | --------- |
| 🔴 Critique  | 4      | 4         |
| 🟠 Haute     | 5      | 5         |
| 🟡 Moyen     | 4      | 4         |
| 🏗️ Migration | 7      | 7         |
| **Total**    | **20** | **20** ✅ |

---

---

# 🔍 TODO — Audit Messagerie & Communauté

> Issu de l'audit architecture temps réel (niveau CTO). Objectif : tenir à 10
> 000 utilisateurs sans casse.

---

## 🔴 URGENT — Avant mise en production (cette semaine)

- [x] **A1. Pusher — Passer tous les canaux en `private-` + créer
      `/api/pusher/auth`**
  - Faille critique : canaux publics accessibles sans auth par n'importe quel
    navigateur
  - Préfixer : `conversation-` → `private-conversation-`, `notification-` →
    `private-notification-`, `medical-` → `private-medical-`
  - Créer `src/app/api/pusher/auth/route.ts` — vérifie que l'utilisateur a le
    droit d'accéder au canal
  - Configurer `channelAuthorization` dans `initPusherClient()`
  - Fichiers : `src/lib/pusher.ts` + nouveau fichier
    `src/app/api/pusher/auth/route.ts`

- [x] **A2. Rate-limiter la route `/api/presence`**
  - Aucun rate limit actuellement : heartbeat toutes les 30s × 3000 users = 100
    writes DB/sec
  - 3 requêtes/min max par utilisateur (silent 429 — pas d'erreur côté client)
  - Fichier : `src/app/api/presence/route.ts`

- [x] **A3. Remplacer SHA1 par SHA256 sur les uploads messages**
  - `messages/image/route.ts` utilise SHA1 pour la signature Cloudinary (cassé
    depuis 2017)
  - Vérifier et corriger aussi `messages/fichier/route.ts` et
    `messages/vocal/route.ts`
  - Utiliser HMAC-SHA256 comme dans `/api/upload/signe`
  - Fichiers : `src/app/api/messages/image/route.ts`, `fichier/route.ts`,
    `vocal/route.ts`

- [x] **A4. Validation Zod sur le PATCH signalements admin**
  - Le PATCH `/api/communaute/signalements` n'a aucun schéma Zod
  - `action` non validée → suppression arbitraire de posts possible si session
    compromise
  - Ajouter
    `z.enum(["supprimer_post", "supprimer_commentaire", "bannir_user", null])`
    pour `action`
  - Fichier : `src/app/api/communaute/signalements/route.ts`

---

## 🟠 COURT TERME — Mois 1 (performance & scalabilité)

- [x] **A5. Conversations — remplacer le scan 5000 messages par `DISTINCT ON`**
  - Scan de 5000 lignes en RAM + groupement JS à chaque ouverture de la
    messagerie
  - Remplacer par une requête `$queryRaw` avec
    `DISTINCT ON (LEAST(...), GREATEST(...))`
  - Gain : x50 sur la latence, 0 impact mémoire
  - Fichier : `src/app/api/messages/conversations/route.ts`

- [x] **A6. Historique messages — pagination cursor-based**
  - `OFFSET (page-1) * limit` force Postgres à scanner et ignorer N lignes →
    lent sur longues conversations
  - Remplacer par `id: { lt: cursor }` (cursor = ID du dernier message reçu)
  - Fichier : `src/app/api/messages/[userId]/route.ts`

- [x] **A7. Feed communauté — ne plus charger les réactions complètes**
  - `reactions: { select: { userId, type } }` charge TOUTES les réactions (posts
    viraux = milliers de lignes)
  - Remplacer par `_count.reactions` +
    `userReactions: { where: { userId }, take: 1 }`
  - Fichier : `src/app/api/communaute/posts/route.ts`

- [x] **A8. Supprimer la requête `membreGroupe` en doublon**
  - POST `/api/communaute/posts` appelle `membreGroupe.findUnique` deux fois
    avec les mêmes paramètres
  - Réutiliser le résultat de la première requête (variable `membre` déjà en
    mémoire)
  - Fichier : `src/app/api/communaute/posts/route.ts`

- [x] **A9. Déduplication des notifications (upsert + compteur)**
  - 100 likes en 1 min = 100 notifications `NOUVEAU_LIKE` séparées
    (non-agrégeables)
  - Passer à `upsert` avec un compteur : "X, Y et 98 autres ont aimé votre post"
  - Ajouter `compteur Int @default(1)` + index composite
    `@@unique([userId, type, sourceId])` sur `Notification`
  - Fichiers : `src/lib/notifications.ts` + migration Prisma

- [x] **A10. Unifier `Like` et `Reaction` (un seul modèle)**
  - `Post` a deux modèles distincts : `Like` (simple) et `Reaction` (avec type
    emoji) — confusion + double charge
  - Décider : garder `Reaction` avec `type` obligatoire, migrer les `Like`
    existants en `Reaction` type `"👍"`
  - Supprimer le modèle `Like`, mettre à jour toutes les routes qui l'utilisent
  - Fichiers : `prisma/schema.prisma` + routes communauté

---

## 🟢 LONG TERME — Trimestre 1 (architecture)

- [x] **A11. Introduire le modèle `Conversation` en base**
  - Absence de table Conversation = la cause racine de tous les problèmes de
    scalabilité messagerie
  - Modèle : `id`, `participantIds String[]`, `lastMessageId`, `lastMessageAt`
  - Migration + mise à jour de toutes les routes messages
  - Fichier : `prisma/schema.prisma` + migration

- [x] **A12. Redis pour la présence en ligne (TTL 60s)**
  - Remplacer `prisma.user.update({ derniereVueAt })` par
    `redis.set("presence:{id}", 1, { ex: 60 })`
  - Lecture : `redis.exists("presence:{id}")` → pas de DB write permanent
  - Fichier : `src/app/api/presence/route.ts`

- [x] **A13. Remplacer Pusher par Soketi (auto-hébergé sur Hostinger)**
  - Soketi = serveur Pusher open-source, drop-in replacement (le code ne change
    pas)
  - Économie : ~25€/mois à 1000 users, contrôle total, pas de limite connexions
  - Déployer Soketi sur Hostinger VPS, changer
    `PUSHER_APP_ID/KEY/SECRET/CLUSTER`

- [x] **A14. BullMQ pour les notifications et push asynchrones**
  - Actuellement : `void (async () => { push + notification })()` — perte
    silencieuse si crash
  - Remplacer par une job queue BullMQ : retry automatique, dead letter,
    monitoring
  - Installer `bullmq`, créer `src/lib/queue.ts`, ajouter un worker PM2 dans
    `ecosystem.config.js`

- [x] **A15. Compression images côté serveur avant upload (Sharp)**
  - Images envoyées telles quelles → consommation data inutile sur réseau
    africain
  - Redimensionner à max 1200px, convertir en WebP (Sharp) avant upload
    Cloudinary
  - Fichiers : routes `messages/image`, `upload/signe`

- [x] **A16. Service Worker + cache offline pour la messagerie**
  - Réseau africain instable : perte de connexion = interface blanche
  - Implémenter une stratégie stale-while-revalidate + queue d'envoi offline
    (IndexedDB)
  - Fichier : `public/sw.js` (déjà présent — à implémenter)

---

## 📊 SUIVI AUDIT

| Priorité       | Items  | Complétés |
| -------------- | ------ | --------- |
| 🔴 Urgent      | 4      | 4         |
| 🟠 Court terme | 6      | 6         |
| 🟢 Long terme  | 6      | 6         |
| **Total**      | **16** | **16** ✅ |
