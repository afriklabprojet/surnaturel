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
│   │   ├── soins/        ← Page des soins
│   │   ├── boutique/     ← La boutique
│   │   └── blog/         ← Le blog
│   ├── (auth)/           ← Connexion et inscription
│   ├── (dashboard)/      ← Espace client connecté
│   ├── (admin)/          ← Panel d'administration
│   └── api/              ← Les "coulisses" (logique serveur)
│
├── src/components/       ← Les morceaux réutilisables (boutons, cartes...)
│
├── src/lib/              ← Les outils techniques
│   ├── auth.ts           ← Système de connexion
│   ├── prisma.ts         ← Connexion à la base de données
│   ├── email.ts          ← Envoi d'emails
│   ├── jeko.ts           ← Paiement mobile
│   ├── soins-data.ts     ← Liste des soins (modifiable)
│   └── produits-data.ts  ← Liste des produits (modifiable)
│
├── prisma/
│   └── schema.prisma     ← Structure de la base de données
│
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

### Modifier les horaires d'ouverture

Cherchez dans les fichiers du footer et de la page de prise de RDV les créneaux
horaires.

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
- Nettoyage stories : toutes les heures
- Publications planifiées : toutes les minutes

En plan Hobby Vercel, les crons sont limités. Vérifiez dans Vercel > Settings >
Cron Jobs.

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

---

_Guide rédigé le 22 mars 2026 — Le Surnaturel de Dieu_
