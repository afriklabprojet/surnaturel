# 📖 Guide d'Utilisation Quotidienne — Le Surnaturel de Dieu

> Ce guide est destiné à Marie Jeanne et à toute personne qui gère le site au
> quotidien.\
> Pas besoin de connaissances techniques. Suivez simplement les instructions.

---

## Table des matières

1. [Accéder à l'administration](#1--accéder-à-ladministration)
2. [Gérer les rendez-vous](#2--gérer-les-rendez-vous)
3. [Gérer la boutique et les commandes](#3--gérer-la-boutique-et-les-commandes)
4. [Gérer le blog](#4--gérer-le-blog)
5. [Gérer les clients](#5--gérer-les-clients)
6. [Gérer les avis clients](#6--gérer-les-avis-clients)
7. [Consulter les notifications](#7--consulter-les-notifications)
8. [Espace médical (confidentiel)](#8--espace-médical-confidentiel)
9. [Programme de fidélité et parrainage](#9--programme-de-fidélité-et-parrainage)
10. [Communauté](#10--communauté)

---

## 1 — Accéder à l'administration

### Comment se connecter

1. Ouvrez votre navigateur (Chrome, Safari, Firefox)
2. Allez à l'adresse : `https://votre-site.com/admin/login`
3. Entrez votre **email** et **mot de passe** administrateur
4. Vous arrivez sur le **tableau de bord admin**

### Ce que vous voyez sur le tableau de bord

- **Résumé du jour** : nombre de RDV, commandes en attente, nouveaux clients
- **Menu latéral** : accès à toutes les sections (RDV, commandes, blog, etc.)
- **Notifications** : alertes importantes (nouvelles commandes, avis à modérer)

---

## 2 — Gérer les rendez-vous

### Voir les rendez-vous du jour

1. Dans le menu admin, cliquez **"Rendez-vous"**
2. Le calendrier affiche les RDV par jour/semaine/mois
3. Chaque RDV montre : le nom du client, le soin choisi, l'heure

### Confirmer un rendez-vous

1. Cliquez sur un RDV avec le statut **"En attente"**
2. Cliquez **"Confirmer"**
3. Le client reçoit automatiquement un email de confirmation

### Annuler un rendez-vous

1. Cliquez sur le RDV
2. Cliquez **"Annuler"**
3. Ajoutez un motif (optionnel)
4. Le client est notifié automatiquement

### Rappels automatiques

- Chaque matin à 8h, le système envoie automatiquement un email de rappel aux
  clients qui ont un RDV le lendemain
- Vous n'avez rien à faire, c'est automatique

---

## 3 — Gérer la boutique et les commandes

### Voir les commandes

1. Menu admin > **"Commandes"**
2. Vous voyez la liste de toutes les commandes avec leur statut :
   - 🟡 **En attente** — commande passée, paiement en cours
   - 🟢 **Payée** — paiement reçu via Jeko
   - 🔵 **En préparation** — vous préparez le colis
   - 🟣 **Expédiée** — le colis est parti
   - ✅ **Livrée** — le client a reçu sa commande
   - 🔴 **Annulée** — commande annulée

### Traiter une commande

1. Quand une commande passe en **"Payée"** :
   - Préparez les produits
   - Changez le statut en **"En préparation"**
2. Quand le colis est prêt et envoyé :
   - Changez le statut en **"Expédiée"**
3. Quand le client confirme la réception :
   - Changez en **"Livrée"**

### Les produits

- Les produits sont définis dans le code source (fichier `produits-data.ts`)
- Pour ajouter/modifier des produits, voir le
  [Guide de Maintenance](MAINTENANCE.md)

---

## 4 — Gérer le blog

### Publier un article

1. Menu admin > **"Blog"**
2. Cliquez **"Nouvel article"**
3. Remplissez :
   - **Titre** : le titre de l'article
   - **Contenu** : le texte (supporte le format Markdown)
   - **Image** : uploadez une photo d'illustration
4. **"Publié"** : cochez la case pour rendre l'article visible sur le site
5. Cliquez **"Enregistrer"**

### Modifier un article existant

1. Dans la liste des articles, cliquez sur celui à modifier
2. Faites vos changements
3. Cliquez **"Enregistrer"**

### Supprimer un article

1. Cliquez sur l'article
2. Cliquez **"Supprimer"** (en bas de la page)
3. Confirmez la suppression

---

## 5 — Gérer les clients

### Voir la liste des clients

1. Menu admin > **"Utilisateurs"**
2. Vous voyez : nom, prénom, email, date d'inscription, rôle

### Les rôles

| Rôle                       | Description              | Accès                                       |
| -------------------------- | ------------------------ | ------------------------------------------- |
| **CLIENT**                 | Client normal            | Tableau de bord, commandes, RDV, communauté |
| **SAGE_FEMME**             | Professionnelle de santé | Espace médical, consultations               |
| **ACCOMPAGNATEUR_MEDICAL** | Accompagnant médical     | Suivi médical des patients                  |
| **ADMIN**                  | Administrateur (vous)    | Tout le site + panel admin                  |

### Modifier le rôle d'un utilisateur

1. Cliquez sur l'utilisateur
2. Changez le rôle dans le menu déroulant
3. Sauvegardez

> **Attention** : Ne donnez le rôle ADMIN qu'à des personnes de confiance.

---

## 6 — Gérer les avis clients

### Voir les avis

1. Menu admin > **"Avis"**
2. Les avis sont classés par date, avec la note (étoiles) et le commentaire

### Modérer un avis

- **Approuver** : l'avis apparaît sur le site
- **Rejeter** : l'avis est masqué
- Vous pouvez répondre à un avis (votre réponse apparaît sous le commentaire du
  client)

---

## 7 — Consulter les notifications

### Sur le site

- L'icône 🔔 dans la barre de navigation affiche les nouvelles notifications
- Types de notifications :
  - Nouveau RDV réservé
  - Nouvelle commande
  - Nouveau message dans la messagerie
  - Nouvel avis client

### Par email

Le système envoie automatiquement des emails pour :

- Chaque nouvelle inscription
- Chaque RDV confirmé
- Chaque commande payée
- Les rappels de RDV (24h avant)

---

## 8 — Espace médical (confidentiel)

> **Important** : Cet espace est strictement confidentiel. Seuls les clients et
> les accompagnateurs médicaux y ont accès. Les administrateurs N'ONT PAS accès
> aux dossiers médicaux — c'est une mesure de protection des données de santé.

### Pour la sage-femme / accompagnateur médical

1. Se connecter avec un compte ayant le rôle SAGE_FEMME ou
   ACCOMPAGNATEUR_MEDICAL
2. Accéder à `/suivi-medical`
3. Fonctionnalités disponibles :
   - Consulter les dossiers médicaux des patients
   - Ajouter des notes médicales (chiffrées automatiquement)
   - Envoyer des messages médicaux confidentiels
   - Uploader des documents médicaux

### Sécurité des données médicales

- Toutes les données médicales sont **chiffrées** (AES-256-GCM)
- Les messages médicaux sont chiffrés de bout en bout
- Les accès sont **journalisés** (qui a consulté quoi, à quelle heure)
- Même l'administrateur ne peut pas lire les données médicales

---

## 9 — Programme de fidélité et parrainage

### Programme de fidélité

- Les clients accumulent des **points** à chaque achat et réservation
- Les points peuvent être échangés contre des réductions
- Le suivi est automatique

### Parrainage

- Chaque client a un **code de parrainage** unique
- Quand un nouveau client s'inscrit avec ce code :
  - Le parrain reçoit des points bonus
  - Le filleul bénéficie d'une réduction de bienvenue
- Code promo d'accueil par défaut : **BIENVENUE10** (10% de réduction)

---

## 10 — Communauté

### Fonctionnalités

- Les clients connectés peuvent accéder à la **communauté** (`/communaute`)
- Ils peuvent :
  - Publier des posts (texte + images)
  - Commenter et réagir aux publications
  - Suivre d'autres membres
  - Créer et rejoindre des groupes
  - Créer des événements
  - Partager des stories (visibles 24h)
  - Sauvegarder des publications

### Modération

- Les membres peuvent **signaler** du contenu inapproprié
- Les signalements remontent dans le panel admin
- Vous pouvez supprimer du contenu ou bloquer des utilisateurs si nécessaire

---

## 🗓️ Routine quotidienne recommandée

| Moment             | Action                               | Temps estimé |
| ------------------ | ------------------------------------ | ------------ |
| **Matin (9h)**     | Consulter le tableau de bord admin   | 5 min        |
| **Matin**          | Confirmer les RDV du jour            | 5 min        |
| **Mi-journée**     | Traiter les commandes payées         | 10 min       |
| **Après-midi**     | Répondre aux messages et avis        | 15 min       |
| **Fin de journée** | Vérifier les notifications restantes | 5 min        |
| **1x par semaine** | Publier un article de blog           | 30 min       |

**Temps total : environ 40 minutes par jour + 30 min par semaine pour le blog**

---

## 📞 En cas de problème

| Problème                                  | Quoi faire                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Le site ne s'affiche pas                  | Vérifiez sur [status.vercel.com](https://status.vercel.com) si Vercel fonctionne |
| Un client ne peut pas se connecter        | Vérifiez son compte dans l'admin > Utilisateurs                                  |
| Les emails ne partent pas                 | Vérifiez sur [resend.com](https://resend.com) votre quota d'envoi                |
| Le paiement échoue                        | Vérifiez sur [cockpit.jeko.africa](https://cockpit.jeko.africa) le statut        |
| Vous avez oublié votre mot de passe admin | Utilisez la page `/mot-de-passe-oublie`                                          |

---

_Guide rédigé le 22 mars 2026 — Le Surnaturel de Dieu_
