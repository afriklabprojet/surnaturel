# 🔧 Guide de Maintenance & Modifications — Le Surnaturel de Dieu

> Ce document explique comment maintenir le site, faire des modifications, et
> résoudre les problèmes.\
> Il est conçu pour quelqu'un qui n'a jamais programmé mais veut être autonome,
> ou pour un développeur qui reprend le projet.

---

## Table des matières

1. [Architecture du projet (vue d'ensemble)](#1--architecture-du-projet)
2. [Comment modifier le site en local](#2--travailler-en-local)
3. [Modifier les contenus (sans coder)](#3--modifier-les-contenus-sans-coder)
4. [Modifier le code (pour un développeur)](#4--modifier-le-code-pour-un-développeur)
5. [Mettre à jour le site en production](#5--mettre-à-jour-le-site-en-production)
6. [Base de données](#6--base-de-données)
7. [Sauvegardes et sécurité](#7--sauvegardes-et-sécurité)
8. [Mettre à jour les dépendances](#8--mettre-à-jour-les-dépendances)
9. [Résolution de problèmes](#9--résolution-de-problèmes)

---

## 1 — Architecture du projet

### Vue d'ensemble simplifiée

```
Votre site fonctionne comme un restaurant :

🏪 Vercel        = Le bâtiment (héberge le site)
🗄️ Neon          = Le garde-manger (stocke les données)
📧 Resend        = Le facteur (envoie les emails)
💬 Pusher        = Le téléphone (messagerie en temps réel)
🖼️ Cloudinary    = L'album photo (stocke les images)
💳 Jeko Africa   = La caisse (gère les paiements)
```

### Structure des fichiers (simplifié)

```
surnaturel-de-dieu/
│
├── src/app/              ← Les pages du site
│   ├── (public)/         ← Pages visibles par tout le monde
│   │   ├── page.tsx      ← Page d'accueil
│   │   ├── soins/        ← Page des soins (+ OG images dynamiques)
│   │   ├── boutique/     ← La boutique
│   │   ├── blog/         ← Le blog (+ OG images dynamiques)
│   │   └── decouvrir-communaute/  ← Page publique communauté
│   ├── (auth)/           ← Connexion et inscription
│   ├── (dashboard)/      ← Espace client connecté
│   ├── (admin)/          ← Panel d'administration (21 pages)
│   │   └── admin/
│   │       ├── page.tsx         ← Tableau de bord
│   │       ├── rdv/             ← Gestion des rendez-vous
│   │       ├── commandes/       ← Gestion des commandes
│   │       ├── soins/           ← Catalogue des soins
│   │       ├── blog/            ← Gestion du blog
│   │       ├── clients/         ← Gestion des clients + Résumé IA
│   │       ├── avis/            ← Modération des avis
│   │       ├── rapports/        ← Graphiques et statistiques
│   │       ├── fidelite/        ← Points de fidélité
│   │       ├── parrainages/     ← Gestion des parrainages
│   │       ├── communaute/      ← Stats communauté + signalements
│   │       ├── evenements/      ← Gestion des événements
│   │       ├── groupes/         ← Gestion des groupes
│   │       ├── signalements/    ← Modération des signalements
│   │       ├── messages/        ← Messagerie admin
│   │       ├── professionnels/  ← Profils des praticiens
│   │       ├── verification/    ← Vérification des comptes
│   │       ├── blocages/        ← Gestion des blocages
│   │       ├── parametres/      ← Infos centre + personnel + logs
│   │       └── login/           ← Connexion admin
│   └── api/              ← Les "coulisses" (logique serveur)
│       └── health/       ← Vérification santé du site
│
├── src/components/       ← Les morceaux réutilisables
│   ├── medical/          ← Mesures santé (graphiques + alertes)
│   └── soins/ChatIA.tsx   ← Assistant IA recommandations
│
├── src/lib/              ← Les outils techniques
│   ├── auth.ts           ← Système de connexion
│   ├── prisma.ts         ← Connexion à la base de données
│   ├── email.ts          ← Envoi d'emails
│   ├── jeko.ts           ← Paiement mobile
│   ├── soins-data.ts     ← Liste des soins (modifiable)
│   ├── produits-data.ts  ← Liste des produits (modifiable)
│   └── i18n/             ← Traductions FR/EN
│
├── public/
│   ├── manifest.json     ← Configuration PWA (installation mobile)
│   ├── robots.txt        ← SEO — indique à Google quoi indexer
│   └── sw.js             ← Service Worker (cache hors-ligne)
│
├── prisma/
│   ├── schema.prisma     ← Structure de la base de données
│   ├── create-admins.ts  ← Script création comptes admin
│   └── seed.ts           ← Données de test (⚠️ ne pas lancer en production)
│
├── __tests__/            ← 22 tests automatisés
│
├── DEPLOIEMENT.md        ← Comment mettre le site en ligne
├── GUIDE-UTILISATION.md  ← Comment utiliser le site au quotidien
├── MAINTENANCE.md        ← Ce document
├── ROADMAP-V2.md         ← Ce qu'il reste à construire
├── MES-IDENTIFIANTS.md   ← Vos identifiants (⚠️ confidentiel, pas sur GitHub)
└── INSTRUCTIONS.md       ← Les règles du projet
```

---

## 2 — Travailler en local

### Prérequis à installer (une seule fois)

1. **Node.js** (version 18 ou plus) :
   - Allez sur [nodejs.org](https://nodejs.org)
   - Téléchargez la version **LTS** (recommandée)
   - Installez en suivant les instructions

2. **Git** :
   - macOS : déjà installé (tapez `git --version` dans le Terminal)
   - Windows : [git-scm.com](https://git-scm.com)

3. **Visual Studio Code** (éditeur de code recommandé) :
   - [code.visualstudio.com](https://code.visualstudio.com)

### Lancer le site en local

```bash
# 1. Ouvrir le Terminal et aller dans le dossier du projet
cd surnaturel-de-dieu

# 2. Installer les dépendances (première fois seulement, ou après un changement de package.json)
npm install

# 3. S'assurer que le fichier .env.local existe avec vos variables
# (voir .env.example pour la liste des variables)

# 4. Générer le client Prisma
npx prisma generate

# 5. Lancer le site
npm run dev
```

Le site est accessible sur **http://localhost:3000**

### Arrêter le site local

Appuyez sur `Ctrl + C` dans le Terminal.

---

## 3 — Modifier les contenus (sans coder)

### Modifier la liste des soins

Fichier : `src/lib/soins-data.ts`

Chaque soin est défini comme ceci :

```typescript
{
  id: "hammam",
  nom: "Hammam Traditionnel",
  description: "Description du soin...",
  prix: 15000,        // Prix en FCFA
  duree: 60,           // Durée en minutes
  categorie: "HAMMAM",
  imageUrl: "https://res.cloudinary.com/votre-cloud/image.jpg"
}
```

**Pour changer un prix** : modifiez le nombre après `prix:`\
**Pour changer une description** : modifiez le texte entre guillemets\
**Pour ajouter un soin** : copiez un bloc existant et modifiez les valeurs

### Modifier la liste des produits boutique

Fichier : `src/lib/produits-data.ts`

Même principe que les soins. Chaque produit a : nom, description, prix,
catégorie, image.

### Modifier les textes de la page d'accueil

Fichier : `src/app/(public)/page.tsx`

Les textes sont directement dans le fichier. Cherchez les guillemets pour
trouver les textes à modifier.

### Modifier une image

1. Uploadez la nouvelle image sur **Cloudinary** :
   - Connectez-vous sur [cloudinary.com](https://cloudinary.com)
   - **Media Library > Upload**
   - Copiez l'URL de l'image
2. Remplacez l'ancienne URL dans le code par la nouvelle

### Modifier les informations de contact

Cherchez dans `src/components/layout/Footer.tsx` et `src/app/(public)/contact/`
les informations à modifier (adresse, téléphone, email).

Cherchez aussi dans `src/app/layout.tsx` le bloc JSON-LD (données structurées
Google) pour y mettre le bon numéro de téléphone et l'adresse exacte :

```json
"telephone": "+22507XXXXXXXX",
"address": {
  "streetAddress": "Cocody, Riviera Palmeraie",
  ...
}
```

### Modifier les horaires d'ouverture

Cherchez dans les fichiers du footer et de la page de prise de RDV les créneaux
horaires.

### Modifier les recommandations du Chat IA

Fichier : `src/components/soins/ChatIA.tsx`

Le chat IA utilise un système de questions/réponses pour recommander des soins.

**Pour modifier les questions posées** : trouvez le tableau `QUESTIONS` dans le
fichier.

**Pour modifier les soins recommandés** : trouvez le tableau `SOINS_DB` et
ajustez les catégories (`categories`) associées à chaque soin.

**Pour modifier les seuils de budget** : trouvez la fonction `recommend` et
ajustez les montants.

### Modifier les seuils d'alertes médicales

Fichier : `src/components/medical/MesuresSante.tsx`

Les alertes sont définies dans le tableau `TYPES`, chaque type a un champ
`seuils` avec `min` et `max`. Par exemple :

```typescript
{ value: "TENSION_ARTERIELLE", seuils: { min: 9, max: 14 } }
```

Modifiez les valeurs `min` et `max` pour ajuster les seuils d'alerte.

### Modifier le fichier robots.txt

Fichier : `public/robots.txt`

Ce fichier indique à Google quelles pages indexer. Il est déjà configuré pour :

- ✅ Autoriser les pages publiques (accueil, soins, boutique, blog)
- ❌ Bloquer les pages privées (admin, dashboard, API)

Vous n'avez normalement pas besoin de le modifier.

---

## 4 — Modifier le code (pour un développeur)

### Stack technique

| Technologie                 | Usage                 | Documentation                                          |
| --------------------------- | --------------------- | ------------------------------------------------------ |
| **Next.js 16** (App Router) | Framework principal   | [nextjs.org/docs](https://nextjs.org/docs)             |
| **TypeScript**              | Langage               | [typescriptlang.org](https://typescriptlang.org)       |
| **Tailwind CSS v4**         | Styles                | [tailwindcss.com](https://tailwindcss.com)             |
| **shadcn/ui**               | Composants UI         | [ui.shadcn.com](https://ui.shadcn.com)                 |
| **Prisma**                  | ORM base de données   | [prisma.io/docs](https://prisma.io/docs)               |
| **NextAuth.js v5**          | Authentification      | [authjs.dev](https://authjs.dev)                       |
| **Pusher**                  | Temps réel            | [pusher.com/docs](https://pusher.com/docs)             |
| **Resend**                  | Emails                | [resend.com/docs](https://resend.com/docs)             |
| **Jeko Africa**             | Paiement Mobile Money | [developer.jeko.africa](https://developer.jeko.africa) |
| **Zod**                     | Validation            | [zod.dev](https://zod.dev)                             |

### Conventions de code

- **TypeScript strict** : pas de `any`, tout est typé
- **Composants fonctionnels** avec hooks uniquement
- **Imports absolus** : `@/components/...`, `@/lib/...`
- **Nommage** : fichiers en kebab-case, composants en PascalCase
- **Icônes** : uniquement `lucide-react`
- **Polices** : Cormorant Garamond (titres) + Jost (corps)
- **Couleurs** : uniquement celles de la charte (voir `INSTRUCTIONS.md`)
- **Validation** : toute entrée utilisateur validée avec Zod
- **Sécurité** : données médicales toujours chiffrées (AES-256-GCM)

### Ajouter une nouvelle page

1. Créez un dossier dans `src/app/(public)/votre-page/`
2. Créez `page.tsx` dedans :

```typescript
export default function VotrePage() {
  return (
    <main>
      <h1>Titre de la page</h1>
    </main>
  );
}
```

### Ajouter une route API

1. Créez un dossier dans `src/app/api/votre-route/`
2. Créez `route.ts` dedans :

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  // Votre logique ici
  return NextResponse.json({ data: "..." });
}
```

### Modifier la base de données

Si vous devez ajouter un champ ou une table :

```bash
# 1. Modifiez prisma/schema.prisma

# 2. Créez une migration
npx prisma migrate dev --name description-du-changement

# 3. Le client Prisma se régénère automatiquement

# 4. Appliquez en production
npx prisma migrate deploy
```

---

## 5 — Mettre à jour le site en production

### Déploiement automatique (recommandé)

Chaque fois que vous envoyez du code sur GitHub, Vercel redéploie
automatiquement :

```bash
# 1. Vérifiez que le code fonctionne en local
npm run dev

# 2. Ajoutez vos modifications
git add .

# 3. Décrivez ce que vous avez changé
git commit -m "Description de la modification"

# 4. Envoyez sur GitHub
git push
```

Vercel détecte le changement et redéploie en 2-5 minutes.

### Vérifier que le déploiement a réussi

1. Allez sur [vercel.com](https://vercel.com) > votre projet
2. Onglet **"Deployments"**
3. Le dernier déploiement doit être vert ✅

### Si le déploiement échoue 🔴

1. Cliquez sur le déploiement échoué
2. Cliquez **"View Build Logs"**
3. L'erreur est en rouge — lisez le message
4. Corrigez localement, testez, puis re-poussez

### Rollback (revenir en arrière)

Si une mise à jour casse le site :

1. Vercel Dashboard > **Deployments**
2. Trouvez le dernier déploiement qui fonctionnait
3. Cliquez les **"..."** > **"Promote to Production"**
4. Le site revient instantanément à la version précédente

---

## 6 — Base de données

### Voir les données

```bash
# Ouvrir l'interface graphique Prisma (en local)
npx prisma studio
```

Cela ouvre un navigateur sur `http://localhost:5555` où vous pouvez voir et
modifier toutes les données.

### Sauvegarder la base de données

Neon fait des sauvegardes automatiques. Mais pour une sauvegarde manuelle :

1. Connectez-vous sur [console.neon.tech](https://console.neon.tech)
2. Votre projet > **Branches**
3. Cliquez **"Create Branch"** — cela crée un snapshot de votre base

### Appliquer les migrations en production

```bash
# Assurez-vous que .env.local contient la DATABASE_URL de production
npx prisma migrate deploy
```

---

## 7 — Sauvegardes et sécurité

### Ce qui est sauvegardé automatiquement

| Élément         | Sauvegarde | Fréquence             |
| --------------- | ---------- | --------------------- |
| Code source     | GitHub     | À chaque `git push`   |
| Base de données | Neon       | Automatique (7 jours) |
| Images          | Cloudinary | Permanent             |
| Déploiements    | Vercel     | Historique complet    |

### Ce que VOUS devez sauvegarder

- **Le fichier `.env.local`** : il contient tous vos secrets. Gardez-en une
  copie dans un endroit sûr (pas sur GitHub !)
- **Les accès aux services** : gardez une liste de vos identifiants Vercel,
  Neon, Resend, Pusher, Jeko, Cloudinary

### Bonnes pratiques de sécurité

| Règle                                                   | Pourquoi                                               |
| ------------------------------------------------------- | ------------------------------------------------------ |
| Ne partagez JAMAIS le fichier `.env.local`              | Il contient les clés d'accès à tout                    |
| Changez les mots de passe admin régulièrement           | Prévention des accès non autorisés                     |
| Gardez le dépôt GitHub en **Private**                   | Votre code source est confidentiel                     |
| Ne donnez le rôle ADMIN qu'à des personnes de confiance | Un admin a accès à tout sauf les données médicales     |
| Les données médicales sont chiffrées                    | Même en cas de fuite de la base, elles sont illisibles |

---

## 8 — Mettre à jour les dépendances

### Quand mettre à jour ?

- **Tous les 3 mois** au minimum pour la sécurité
- **Immédiatement** si vous recevez une alerte de sécurité GitHub (Dependabot)

### Comment mettre à jour

```bash
# 1. Vérifier les mises à jour disponibles
npm outdated

# 2. Mettre à jour les dépendances mineures (sûr)
npm update

# 3. Pour les mises à jour majeures (une par une, tester entre chaque)
npm install nom-du-package@latest

# 4. Tester que tout fonctionne
npm run dev

# 5. Si tout va bien, envoyer sur GitHub
git add . && git commit -m "Mise à jour des dépendances" && git push
```

### Mises à jour critiques

| Package     | Comment mettre à jour                             | Attention                                         |
| ----------- | ------------------------------------------------- | ------------------------------------------------- |
| `next`      | `npm install next@latest`                         | Lire les [release notes](https://nextjs.org/blog) |
| `prisma`    | `npm install prisma@latest @prisma/client@latest` | puis `npx prisma generate`                        |
| `next-auth` | `npm install next-auth@latest`                    | Peut nécessiter des changements de config         |

---

## 9 — Résolution de problèmes

### Le site est lent

1. Vérifiez [status.vercel.com](https://status.vercel.com) — est-ce un problème
   Vercel ?
2. Vérifiez [console.neon.tech](https://console.neon.tech) — la base de données
   est-elle surchargée ?
3. Les images sont-elles optimisées sur Cloudinary ?

### Erreur 500 (Internal Server Error)

1. Allez sur Vercel > votre projet > **Logs** (temps réel)
2. Reproduisez l'erreur
3. Le log indique quel fichier et quelle ligne posent problème

### Erreur "Module not found"

```bash
# Réinstallez les dépendances
rm -rf node_modules
npm install
npx prisma generate
```

### "PrismaClientInitializationError"

La base de données n'est pas accessible :

- Vérifiez que `DATABASE_URL` est correct dans `.env.local`
- Vérifiez que Neon n'a pas suspendu votre projet (plan gratuit : auto-suspend
  après 5 min d'inactivité, redémarre en ~1 seconde)

### Les emails ne partent pas

1. Vérifiez votre quota sur [resend.com](https://resend.com) (100/jour en
   gratuit)
2. Vérifiez que `RESEND_API_KEY` est correct
3. En mode gratuit, vous ne pouvez envoyer qu'à l'email du propriétaire du
   compte, sauf si vous avez vérifié un domaine

### Les tâches planifiées (cron) ne s'exécutent pas

Les crons sont configurés dans `vercel.json` :

- Rappels RDV : tous les jours à 8h (`0 8 * * *`)

> **Note** : Le plan Hobby de Vercel ne supporte qu'1 cron job. Les deux autres
> tâches planifiées (nettoyage stories et publications planifiées) sont définies
> dans le code mais nécessitent le plan Pro de Vercel pour fonctionner
> automatiquement. En plan Hobby, seul le rappel RDV quotidien fonctionne.
>
> **Alternative gratuite** : Vous pouvez utiliser un service comme
> [cron-job.org](https://cron-job.org) (gratuit) pour appeler manuellement les
> URLs suivantes avec le header `Authorization: Bearer VOTRE_CRON_SECRET` :
> - `https://votre-site.com/api/cron/nettoyage-stories` (toutes les heures)
> - `https://votre-site.com/api/cron/publication-planifiee` (toutes les minutes)

### Comment contacter le support technique

| Service | Support                                                           |
| ------- | ----------------------------------------------------------------- |
| Vercel  | [vercel.com/help](https://vercel.com/help)                        |
| Neon    | [neon.tech/docs](https://neon.tech/docs)                          |
| Resend  | [resend.com/docs](https://resend.com/docs)                        |
| Pusher  | [pusher.com/support](https://pusher.com/support)                  |
| Jeko    | [cockpit.jeko.africa](https://cockpit.jeko.africa) — section Aide |

---

## 📋 Checklist de maintenance mensuelle

- [ ] Vérifier le tableau de bord Vercel (erreurs récentes ?)
- [ ] Vérifier les quotas Neon (stockage)
- [ ] Vérifier les quotas Resend (emails envoyés)
- [ ] Vérifier les logs d'erreur (Vercel > Logs)
- [ ] Mettre à jour les dépendances si des alertes de sécurité existent
- [ ] Tester une commande complète (panier → paiement → suivi)
- [ ] Tester un RDV complet (réservation → confirmation → rappel)
- [ ] Vérifier que les crons fonctionnent (rappels RDV, nettoyage stories)
- [ ] Vérifier que `/api/health` répond `{"status":"ok"}` (santé du système)
- [ ] Vérifier que le Chat IA s'affiche bien sur les pages publiques
- [ ] Vérifier que le mode sombre fonctionne (cliquer 🌙)
- [ ] Vérifier que la bascule FR/EN fonctionne
- [ ] Lancer les tests : `npm run test` (22 tests doivent passer)
- [ ] Consulter Vercel Analytics (onglet Analytics dans Vercel Dashboard)
- [ ] Vérifier les profils professionnels (`/admin/professionnels`)
- [ ] Vérifier les paramètres du centre (`/admin/parametres`)

---

## 🆕 Fichiers ajoutés lors des Phases 3-6 (référence)

| Fichier                                             | Rôle                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| `src/components/soins/ChatIA.tsx`                   | Assistant IA de recommandation soins           |
| `src/app/(admin)/admin/signalements/page.tsx`       | Panel admin modération signalements            |
| `src/app/(public)/decouvrir-communaute/page.tsx`    | Page publique communauté                       |
| `src/app/(public)/soins/[slug]/opengraph-image.tsx` | Image OG dynamique par soin                    |
| `src/app/(public)/blog/[slug]/opengraph-image.tsx`  | Image OG dynamique par article                 |
| `src/app/api/health/route.ts`                       | Endpoint de monitoring                         |
| `public/manifest.json`                              | Configuration PWA (installation mobile)        |
| `public/robots.txt`                                 | Instructions SEO pour les moteurs de recherche |
| `public/sw.js`                                      | Service Worker (cache hors-ligne)              |

| Fichier modifié                                    | Ce qui a changé                             |
| -------------------------------------------------- | ------------------------------------------- |
| `src/components/medical/MesuresSante.tsx`          | + Graphiques Recharts + alertes seuils      |
| `src/components/medical/DossierMedical.tsx`        | + Bouton export PDF                         |
| `src/app/(dashboard)/mes-rdv/page.tsx`             | Fix timezone Africa/Abidjan + lien QR code  |
| `src/app/(dashboard)/mes-rdv/[id]/qrcode/page.tsx` | Données réelles via API (plus de mock)      |
| `src/app/layout.tsx`                               | + JSON-LD, + manifest PWA, + service worker |
| `src/app/sitemap.ts`                               | + URLs avis et communauté                   |
| `src/app/(public)/layout.tsx`                      | + Chat IA intégré                           |

---

## 🆕 Fichiers ajoutés lors des Phases C-D (référence)

| Fichier                                              | Rôle                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `src/app/api/admin/clients/[id]/resume/route.ts`    | API résumé IA d'un client (GET, rôle ADMIN/SAGE_FEMME)        |
| `src/app/api/admin/rapports/route.ts`                | API rapports avancés (revenus, RDV, soins populaires)         |
| `src/app/api/admin/export/route.ts`                  | API export CSV (clients, commandes, RDV, avis)                |
| `src/app/api/soins/preferences/route.ts`             | API préférences client pour Chat IA personnalisé              |
| `src/app/api/avis/aggregate/route.ts`                | API données agrégées avis (pour Google My Business)           |
| `src/lib/i18n/fr.json`                              | Traductions françaises                                         |
| `src/lib/i18n/en.json`                              | Traductions anglaises                                          |
| `src/lib/i18n/index.tsx`                             | Provider i18n + hook `useI18n()`                               |
| `src/components/layout/LangSwitch.tsx`               | Bouton bascule langue FR/EN                                    |
| `src/components/layout/ThemeToggle.tsx`               | Bouton bascule mode sombre (lune/soleil)                       |
| `vitest.config.ts`                                    | Configuration des tests automatisés                            |
| `__tests__/core.test.ts`                              | 12 tests unitaires (utilitaires, crypto, etc.)                |
| `__tests__/api.test.ts`                               | 10 tests d'intégration (APIs critiques)                        |

| Fichier modifié (Phases C-D)                        | Ce qui a changé                                                 |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `src/app/(admin)/admin/clients/[id]/page.tsx`       | + Section résumé IA avec stats, soins préférés, alertes         |
| `src/app/(admin)/admin/rapports/page.tsx`            | + Graphiques Recharts (CA, RDV, soins populaires, statuts)      |
| `src/app/(admin)/admin/clients/page.tsx`             | + Bouton export CSV                                              |
| `src/app/(admin)/admin/commandes/page.tsx`           | + Bouton export CSV                                              |
| `src/app/(admin)/admin/rdv/page.tsx`                 | + Bouton export CSV                                              |
| `src/app/(admin)/admin/avis/page.tsx`                | + Bouton export CSV                                              |
| `src/components/soins/ChatIA.tsx`                    | + Préférences client, recommandations personnalisées             |
| `src/components/layout/Navbar.tsx`                   | + ThemeToggle + LangSwitch + traductions boutons                 |
| `src/components/layout/Footer.tsx`                   | + Client component + traductions i18n                            |
| `src/app/layout.tsx`                                 | + @vercel/analytics + @vercel/speed-insights + i18n + JSON-LD+  |
| `src/app/globals.css`                                | + Variables CSS mode sombre (`.dark`)                            |

### Modifier les traductions

Fichier : `src/lib/i18n/fr.json` (français) ou `src/lib/i18n/en.json` (anglais)

> **Attention au fichier `prisma/seed.ts`** : Ce fichier crée des données de
> test (utilisateurs, soins, produits, articles de blog, RDV). **Ne le lancez
> jamais en production** (`npx prisma db seed`) car il écraserait vos vraies
> données. Il sert uniquement à un développeur qui travaille en local.

### Réinitialiser les données après un test (local uniquement)

Si un développeur veut repartir de zéro en local :

```bash
# Supprimer toutes les données et recréer les tables
npx prisma migrate reset

# Recréer les comptes admin
npx tsx prisma/create-admins.ts
```

> **Ne faites JAMAIS `prisma migrate reset` sur la base de production.** Cela
> supprimerait toutes les données clients.

Le format est simple — clé : valeur :

```json
{
  "nav": {
    "connexion": "Connexion",
    "rdv": "Prendre RDV",
    "espace": "Mon espace"
  }
}
```

Pour ajouter une traduction : ajoutez la même clé dans les deux fichiers.

### Modifier le mode sombre

Fichier : `src/app/globals.css` — section `.dark`

Les couleurs du mode sombre sont définies avec des variables CSS. Pour ajuster :

```css
.dark {
  --color-bg-page: #1a1a1a;       /* Fond principal */
  --color-text-dark: #f0f0f0;      /* Texte principal */
  --color-primary-brand: #3a9f2a;  /* Vert plus clair pour contraste */
}
```

### Lancer les tests automatisés

```bash
# Lancer tous les tests (22 tests)
npm run test

# Lancer les tests en mode surveillance (relance à chaque modification)
npm run test:watch
```

Les tests vérifient :
- Les utilitaires (`utils.ts`, `crypto.ts`)
- La validation des données
- Les réponses des APIs critiques (auth, santé, avis, commandes…)

> **Quand lancer les tests ?** Après chaque modification de code, avant de
> pousser sur GitHub. Si un test échoue, ne poussez pas — corrigez d'abord.

---

_Guide mis à jour le 23 mars 2026 — Le Surnaturel de Dieu — Version complète
(toutes les pages admin documentées)_
