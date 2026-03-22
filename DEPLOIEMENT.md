# 🚀 Guide de Déploiement — Le Surnaturel de Dieu

> Ce guide vous accompagne pas à pas pour mettre votre site en ligne.\
> Aucune connaissance technique préalable n'est requise.\
> Suivez chaque étape dans l'ordre, sans en sauter aucune.

---

## 📋 Avant de commencer — Ce dont vous avez besoin

| Élément                           | Où le créer                                        | Coût                         |
| --------------------------------- | -------------------------------------------------- | ---------------------------- |
| Compte **GitHub**                 | [github.com](https://github.com)                   | Gratuit                      |
| Compte **Vercel**                 | [vercel.com](https://vercel.com)                   | Gratuit (plan Hobby)         |
| Base de données **Neon**          | [neon.tech](https://neon.tech)                     | Gratuit (plan Free)          |
| Compte **Resend** (emails)        | [resend.com](https://resend.com)                   | Gratuit (100 emails/jour)    |
| Compte **Pusher** (temps réel)    | [pusher.com](https://pusher.com)                   | Gratuit (200K messages/jour) |
| Compte **Cloudinary** (images)    | [cloudinary.com](https://cloudinary.com)           | Gratuit (25 Go)              |
| Compte **Jeko Africa** (paiement) | [cockpit.jeko.africa](https://cockpit.jeko.africa) | Commission par transaction   |
| Nom de domaine (optionnel)        | N'importe quel registrar                           | ~5 000 FCFA/an               |

---

## Étape 1 — Mettre le code sur GitHub

### 1.1 Créer un dépôt GitHub

1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez le bouton vert **"New"** (en haut à gauche)
3. Remplissez :
   - **Repository name** : `surnaturel-de-dieu`
   - **Description** : `Site institut Le Surnaturel de Dieu`
   - **Visibility** : **Private** (important — votre code est privé)
4. Cliquez **"Create repository"**

### 1.2 Envoyer votre code

Ouvrez un terminal dans le dossier `surnaturel-de-dieu` et tapez ces commandes
**une par une** :

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Version initiale — Le Surnaturel de Dieu"

# Connecter à GitHub (remplacez VOTRE_NOM par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/VOTRE_NOM/surnaturel-de-dieu.git

# Envoyer le code
git branch -M main
git push -u origin main
```

> **Vérification** : Retournez sur GitHub. Vous devez voir tous vos fichiers.

---

## Étape 2 — Créer la base de données (Neon)

1. Allez sur [console.neon.tech](https://console.neon.tech) et créez un compte
2. Cliquez **"New Project"**
3. Remplissez :
   - **Name** : `surnaturel-de-dieu`
   - **Region** : choisissez **AWS EU (Frankfurt)** (le plus proche de l'Afrique
     de l'Ouest)
   - **Compute size** : laissez par défaut
4. Cliquez **"Create Project"**
5. **IMPORTANT** — Neon vous affiche une **Connection string**. Elle ressemble à
   :
   ```
   postgresql://neondb_owner:xxxxxxx@ep-xxx-xxx-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
6. **Copiez cette URL** et gardez-la précieusement. C'est votre `DATABASE_URL`.

> **Astuce** : Pour retrouver cette URL plus tard : Dashboard > votre projet >
> Connection Details

---

## Étape 3 — Configurer les services externes

### 3.1 Resend (envoi d'emails)

1. Créez un compte sur [resend.com](https://resend.com)
2. Dans le Dashboard, section **API Keys**, cliquez "Create API Key"
3. Copiez la clé (commence par `re_...`)
4. Si vous avez un domaine personnalisé : ajoutez-le dans **Domains** et suivez
   les instructions DNS

### 3.2 Pusher (messagerie temps réel)

1. Créez un compte sur [pusher.com](https://pusher.com)
2. Cliquez **"Create app"**
3. Nommez l'app `surnaturel-de-dieu`
4. **Cluster** : choisissez `eu` (Europe)
5. Dans **App Keys**, notez :
   - `app_id`
   - `key`
   - `secret`
   - `cluster`

### 3.3 Cloudinary (images)

1. Créez un compte sur [cloudinary.com](https://cloudinary.com)
2. Dans le Dashboard, notez votre **Cloud Name**
3. Allez dans **Settings > Upload**, créez un **Upload Preset** :
   - Mode : **Unsigned**
   - Folder : `surnaturel`
4. Notez le nom du preset

### 3.4 Jeko Africa (paiement mobile)

1. Créez un compte sur [cockpit.jeko.africa](https://cockpit.jeko.africa)
2. Créez une boutique (Store)
3. Allez dans **Paramètres > API & Webhooks**
4. Notez : `API_KEY`, `API_KEY_ID`, `STORE_ID`
5. Configurez l'URL webhook :
   ```
   https://votre-domaine.com/api/paiement/webhook
   ```

---

## Étape 4 — Déployer sur Vercel

### 4.1 Connecter le projet

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous avec votre
   compte GitHub
2. Cliquez **"Add New..." > "Project"**
3. Vercel affiche vos dépôts GitHub. Cliquez **"Import"** à côté de
   `surnaturel-de-dieu`
4. Vercel détecte automatiquement que c'est un projet Next.js

### 4.2 Configurer les variables d'environnement

C'est l'étape la plus importante. Dans la section **"Environment Variables"** :

Ajoutez chaque variable **une par une** (cliquez "Add" entre chaque) :

| Variable                               | Valeur                            | Où la trouver                       |
| -------------------------------------- | --------------------------------- | ----------------------------------- |
| `DATABASE_URL`                         | `postgresql://...`                | Neon Dashboard > Connection Details |
| `DIRECT_URL`                           | Même URL que DATABASE_URL         | Neon Dashboard                      |
| `NEXTAUTH_SECRET`                      | Générer (voir ci-dessous)         | Terminal                            |
| `NEXTAUTH_URL`                         | `https://votre-projet.vercel.app` | Sera connu après 1er déploiement    |
| `RESEND_API_KEY`                       | `re_...`                          | Resend Dashboard > API Keys         |
| `PUSHER_APP_ID`                        | Numéro                            | Pusher Dashboard > App Keys         |
| `PUSHER_KEY`                           | Texte                             | Pusher Dashboard > App Keys         |
| `PUSHER_SECRET`                        | Texte                             | Pusher Dashboard > App Keys         |
| `PUSHER_CLUSTER`                       | `eu`                              | Pusher Dashboard > App Keys         |
| `NEXT_PUBLIC_PUSHER_KEY`               | Même que PUSHER_KEY               | Pusher Dashboard                    |
| `NEXT_PUBLIC_PUSHER_CLUSTER`           | `eu`                              | Pusher Dashboard                    |
| `JEKO_API_KEY`                         | Texte                             | Cockpit Jeko > API                  |
| `JEKO_API_KEY_ID`                      | Texte                             | Cockpit Jeko > API                  |
| `JEKO_STORE_ID`                        | Texte                             | Cockpit Jeko > Boutique             |
| `JEKO_WEBHOOK_SECRET`                  | Texte                             | Cockpit Jeko > Webhooks             |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | Texte                             | Cloudinary Dashboard                |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Texte                             | Cloudinary > Upload                 |
| `CLOUDINARY_API_KEY`                   | Numéro                            | Cloudinary Dashboard                |
| `CLOUDINARY_API_SECRET`                | Texte                             | Cloudinary Dashboard                |
| `ENCRYPTION_KEY`                       | Générer (voir ci-dessous)         | Terminal                            |
| `CRON_SECRET`                          | Générer (voir ci-dessous)         | Terminal                            |
| `NEXT_PUBLIC_APP_URL`                  | `https://votre-projet.vercel.app` | Vercel Dashboard                    |
| `NEXT_PUBLIC_SITE_URL`                 | `https://votre-projet.vercel.app` | Vercel Dashboard                    |
| `NEXT_PUBLIC_CODE_PROMO_BIENVENUE`     | `BIENVENUE10`                     | Votre choix                         |
| `NEXT_PUBLIC_PROMO_POURCENTAGE`        | `10%`                             | Votre choix                         |

**Pour générer les secrets** (dans votre Terminal) :

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY (32 caractères hexadécimaux)
openssl rand -hex 32

# CRON_SECRET
openssl rand -base64 32
```

### 4.3 Lancer le déploiement

1. Cliquez **"Deploy"**
2. Vercel va :
   - Installer les dépendances (`npm install`)
   - Générer le client Prisma (`prisma generate`)
   - Construire le site (`next build`)
3. Attendez 2-5 minutes
4. Si tout est vert ✅ : votre site est en ligne !

> **Votre URL** : Vercel vous donne une adresse comme
> `surnaturel-de-dieu.vercel.app`

### 4.4 Initialiser la base de données

Après le premier déploiement, vous devez créer les tables. Dans votre terminal
local :

```bash
# Assurez-vous d'être dans le dossier du projet
cd surnaturel-de-dieu

# Créer un fichier .env.local avec votre DATABASE_URL de production
# (copiez l'URL depuis Neon)
echo 'DATABASE_URL="votre-url-neon-ici"' > .env.local
echo 'DIRECT_URL="votre-url-neon-ici"' >> .env.local

# Appliquer les migrations (créer les tables)
npx prisma migrate deploy

# Créer les comptes administrateurs
npx tsx prisma/create-admins.ts
```

### 4.5 Mettre à jour NEXTAUTH_URL

1. Retournez sur Vercel > votre projet > **Settings > Environment Variables**
2. Modifiez `NEXTAUTH_URL` avec votre URL réelle :
   `https://surnaturel-de-dieu.vercel.app`
3. Modifiez `NEXT_PUBLIC_APP_URL` et `NEXT_PUBLIC_SITE_URL` de la même façon
4. Cliquez **"Redeploy"** dans l'onglet Deployments

---

## Étape 5 — Configurer un nom de domaine personnalisé (optionnel)

Si vous avez acheté un domaine (exemple : `lesurnatureldedieu.ci`) :

1. Sur Vercel : **Settings > Domains**
2. Tapez votre domaine : `lesurnatureldedieu.ci`
3. Cliquez **"Add"**
4. Vercel vous donne des **enregistrements DNS** à configurer :
   - Typiquement : un enregistrement `CNAME` pointant vers
     `cname.vercel-dns.com`
5. Allez chez votre registrar de domaine et ajoutez ces enregistrements DNS
6. Attendez 15-60 minutes pour la propagation
7. Vercel génère automatiquement un **certificat SSL** (https://) gratuit

**N'oubliez pas** de mettre à jour ces variables sur Vercel :

- `NEXTAUTH_URL` → `https://lesurnatureldedieu.ci`
- `NEXT_PUBLIC_APP_URL` → `https://lesurnatureldedieu.ci`
- `NEXT_PUBLIC_SITE_URL` → `https://lesurnatureldedieu.ci`

Puis redéployez.

---

## Étape 6 — Configurer le webhook Jeko

Une fois votre URL finale connue :

1. Allez sur [cockpit.jeko.africa](https://cockpit.jeko.africa)
2. **Paramètres > API & Webhooks**
3. URL du webhook :
   ```
   https://votre-domaine.com/api/paiement/webhook
   ```
4. Sauvegardez

---

## Étape 7 — Vérifications finales

Après le déploiement, vérifiez que tout fonctionne :

| Vérification   | Comment tester               | ✅ OK si...                        |
| -------------- | ---------------------------- | ---------------------------------- |
| Page d'accueil | Visitez votre URL            | La page s'affiche avec les soins   |
| Inscription    | Créez un compte test         | Vous recevez l'email de bienvenue  |
| Connexion      | Connectez-vous               | Vous avez accès au tableau de bord |
| Boutique       | Ajoutez un produit au panier | Le panier se met à jour            |
| Admin          | Allez sur `/admin`           | Le tableau de bord admin s'affiche |
| Prise de RDV   | Réservez un créneau test     | Le RDV apparaît dans l'historique  |

---

## 🆘 Problèmes courants

### "Build failed" sur Vercel

- Vérifiez que toutes les variables d'environnement sont renseignées
- Allez dans **Deployments**, cliquez sur le déploiement échoué, puis **"View
  Build Logs"**
- L'erreur exacte sera indiquée en rouge

### "PrismaClientInitializationError"

- Votre `DATABASE_URL` est incorrecte ou manquante
- Vérifiez-la dans Vercel > Settings > Environment Variables

### Les emails ne partent pas

- Vérifiez votre `RESEND_API_KEY`
- En mode gratuit Resend, vous ne pouvez envoyer qu'à votre propre email sauf si
  vous avez vérifié un domaine

### Le paiement ne fonctionne pas

- Vérifiez les 3 variables Jeko (`JEKO_API_KEY`, `JEKO_API_KEY_ID`,
  `JEKO_STORE_ID`)
- Assurez-vous que le webhook est bien configuré sur le cockpit Jeko

### Les images ne s'affichent pas

- Vérifiez `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- Les images doivent être uploadées sur Cloudinary, pas dans le dossier
  `public/`

---

## 📊 Tableau récapitulatif des coûts mensuels

| Service        | Plan  | Coût            | Limites                 |
| -------------- | ----- | --------------- | ----------------------- |
| Vercel         | Hobby | **Gratuit**     | 100 Go bande passante   |
| Neon           | Free  | **Gratuit**     | 512 Mo stockage         |
| Resend         | Free  | **Gratuit**     | 100 emails/jour         |
| Pusher         | Free  | **Gratuit**     | 200K messages/jour      |
| Cloudinary     | Free  | **Gratuit**     | 25 Go stockage          |
| Jeko           | —     | **Commission**  | ~1-2% par transaction   |
| **Total fixe** |       | **0 FCFA/mois** | Suffisant pour démarrer |

> Quand votre activité grandira, les plans payants coûtent environ 10 000–30 000
> FCFA/mois au total.

---

_Document rédigé le 22 mars 2026 — Le Surnaturel de Dieu_
