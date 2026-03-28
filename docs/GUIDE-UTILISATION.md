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
11. [Nouveautés — Assistant Bien-Être IA](#11--assistant-bien-être-ia)
12. [Nouveautés — Application mobile (PWA)](#12--application-mobile-pwa)
13. [Nouveautés — Modération des signalements](#13--modération-des-signalements)
14. [Rapports et statistiques avancés](#14--rapports-et-statistiques-avancés-nouveau--phase-c)
15. [Résumé IA des clients](#15--résumé-ia-des-clients-nouveau--phase-c)
16. [Export CSV des données](#16--export-csv-des-données-nouveau--phase-c)
17. [Mode sombre](#17--mode-sombre-nouveau--phase-d)
18. [Multi-langue FR/EN](#18--multi-langue-français--anglais-nouveau--phase-d)
19. [Analytics et performances](#19--analytics-et-performances-nouveau--phase-d)
20. [Gérer le catalogue des soins (admin)](#20--gérer-le-catalogue-des-soins-admin)
21. [Paramètres du centre](#21--paramètres-du-centre)
22. [Gérer les professionnels de santé](#22--gérer-les-professionnels-de-santé)
23. [Vérification des utilisateurs](#23--vérification-des-utilisateurs)
24. [Messagerie administrateur](#24--messagerie-administrateur)
25. [Communauté — Tableau de bord complet](#25--communauté--tableau-de-bord-complet)
26. [Gérer les événements](#26--gérer-les-événements)
27. [Gérer les groupes](#27--gérer-les-groupes)
28. [Gérer les blocages](#28--gérer-les-blocages)
29. [Carte complète de l'administration](#29--carte-complète-de-ladministration)

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

### Graphiques d'évolution (NOUVEAU)

1. Allez dans l'espace **Suivi médical > Mesures de santé**
2. Sélectionnez un type de mesure (Poids, Tension, Glycémie…)
3. Cliquez le bouton **"Graphique"** pour voir la courbe d'évolution
4. Le graphique montre l'historique de toutes vos mesures dans le temps

### Alertes de santé automatiques (NOUVEAU)

Le système détecte automatiquement les valeurs anormales :

| Mesure              | Alerte si…          | Ce qui se passe                     |
| ------------------- | ------------------- | ----------------------------------- |
| Tension artérielle  | > 14 ou < 9 mmHg    | Bandeau orange + lien "Prendre RDV" |
| Glycémie            | > 1.26 ou < 0.7 g/L | Bandeau orange + lien "Prendre RDV" |
| Température         | > 38°C ou < 35.5°C  | Bandeau orange + lien "Prendre RDV" |
| Fréquence cardiaque | > 100 ou < 50 bpm   | Bandeau orange + lien "Prendre RDV" |

> **Les alertes ne remplacent pas un avis médical.** Elles servent d'indicateur
> pour inciter à consulter.

### Exporter le dossier médical en PDF (NOUVEAU)

1. Ouvrez votre **Dossier médical**
2. Cliquez le bouton **"Exporter PDF"** (en bas à droite)
3. Une fenêtre de votre navigateur s'ouvre pour imprimer
4. Choisissez **"Enregistrer en PDF"** comme imprimante
5. Vous obtenez un PDF de votre dossier complet

### QR Code de rendez-vous (NOUVEAU)

Pour les RDV confirmés :

1. Sur la page **Mes rendez-vous**, cliquez **"Voir le billet QR"** sur un RDV
   confirmé
2. Le billet affiche vos vraies informations de RDV (soin, date, heure)
3. Cliquez **"Télécharger le billet"** pour le sauvegarder en image
4. Présentez ce QR code à votre arrivée à l'institut

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

### Gérer la fidélité (admin)

1. Menu admin > **"Fidélité"** (`/admin/fidelite`)
2. Vous voyez la liste de tous les clients avec leurs **points totaux** et les 3
   derniers mouvements
3. **Ajuster les points** : cliquez "Ajuster" sur un client
   - Entrez un nombre positif pour **ajouter** des points
   - Entrez un nombre négatif pour **retirer** des points
   - Choisissez le type : RDV, Commande, Parrainage, Avis ou Récompense
   - Ajoutez une raison (ex: "Geste commercial")
4. **Historique** : cliquez "Historique" pour voir tous les mouvements d'un
   client

### Parrainage

- Chaque client a un **code de parrainage** unique
- Quand un nouveau client s'inscrit avec ce code :
  - Le parrain reçoit des points bonus
  - Le filleul bénéficie d'une réduction de bienvenue
- Code promo d'accueil par défaut : **BIENVENUE10** (10% de réduction)

### Gérer les parrainages (admin)

1. Menu admin > **"Parrainages"** (`/admin/parrainages`)
2. Vous voyez la liste de toutes les relations parrain-filleul avec :
   - Le **code** de parrainage utilisé
   - Le **statut** : En attente (gris), Actif (bleu), Récompensé (or)
3. **Filtrer** par statut pour retrouver rapidement un parrainage
4. Actions possibles :
   - **Activer** : passe un parrainage en attente à actif (quand le filleul est
     inscrit)
   - **Récompenser** : accorde la récompense au parrain
   - **Supprimer** : supprime le parrainage

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

## 11 — Assistant Bien-Être IA

### C'est quoi ?

Un petit bouton doré ✨ apparaît en bas à droite de toutes les pages publiques
du site. C'est un **assistant intelligent** qui aide les visiteurs à trouver le
soin idéal.

### Comment ça marche ?

1. Le visiteur clique sur le bouton ✨
2. L'assistant pose **3 questions simples** :
   - Quel est votre objectif ? (Détente, Beauté du visage, Minceur,
     Post-accouchement…)
   - Quel est votre budget ?
   - Combien de temps avez-vous ?
3. Il recommande automatiquement les **2-3 soins les plus adaptés**
4. Le visiteur peut cliquer pour voir le détail du soin ou prendre RDV

### Avantage

Les visiteurs hésitants trouvent le bon soin sans avoir à parcourir tout le
catalogue. Cela augmente les réservations.

> **Vous n'avez rien à configurer.** L'assistant fonctionne automatiquement à
> partir de votre catalogue de soins.

---

## 12 — Application mobile (PWA)

### C'est quoi ?

Votre site peut maintenant être **installé comme une application** sur le
téléphone de vos clientes, sans passer par l'App Store.

### Comment vos clientes l'installent ?

**Sur iPhone (Safari) :**

1. Ouvrir votre site dans Safari
2. Appuyer sur le bouton **Partager** (carré avec flèche)
3. Appuyer sur **"Sur l'écran d'accueil"**
4. L'icône de votre site apparaît comme une vraie application

**Sur Android (Chrome) :**

1. Ouvrir votre site dans Chrome
2. Chrome propose automatiquement **"Ajouter à l'écran d'accueil"**
3. Accepter → l'icône apparaît

### Avantages

- L'application fonctionne **même hors connexion** (pages principales en cache)
- Ouverture plus rapide qu'un site web classique
- L'icône reste sur l'écran d'accueil du téléphone

> **Vous n'avez rien à configurer.** C'est automatique.

---

## 13 — Modération des signalements

### Où ?

Menu admin > **"Signalements"** (nouvelle page : `/admin/signalements`)

### Comment ça marche ?

1. Quand un membre de la communauté signale un contenu inapproprié, il apparaît
   ici
2. Vous voyez : qui a signalé, pourquoi, et le contenu concerné (post ou
   commentaire)
3. Vous avez 3 choix :
   - **"Rejeter"** — le signalement est infondé, le contenu reste en place
   - **"Supprimer le post/commentaire"** — le contenu est effacé et le
     signalement marqué résolu
   - **"Résolu"** — marquer comme traité sans supprimer le contenu
4. Vous pouvez filtrer par statut (En attente, En cours, Résolus, Rejetés)

### Routine

Vérifiez les signalements en attente **1 fois par jour** lors de votre routine
admin du matin.

---

## 🗓️ Routine quotidienne recommandée

| Moment             | Action                               | Temps estimé |
| ------------------ | ------------------------------------ | ------------ |
| **Matin (9h)**     | Consulter le tableau de bord admin   | 5 min        |
| **Matin**          | Confirmer les RDV du jour            | 5 min        |
| **Mi-journée**     | Traiter les commandes payées         | 10 min       |
| **Après-midi**     | Répondre aux messages et avis        | 15 min       |
| **Fin de journée** | Vérifier les notifications restantes | 5 min        |
| **Fin de journée** | Vérifier les signalements communauté | 5 min        |
| **1x par semaine** | Publier un article de blog           | 30 min       |

**Temps total : environ 45 minutes par jour + 30 min par semaine pour le blog**

---

## 14 — Rapports et statistiques avancés (NOUVEAU — Phase C)

### Où ?

Menu admin > **"Rapports"**

### Ce que vous voyez

1. **Graphique du chiffre d'affaires** : courbe des revenus sur les 6 derniers
   mois
2. **Graphique des rendez-vous** : barres montrant le nombre de RDV par mois
3. **Soins populaires** : classement des soins les plus réservés
4. **Taux de conversion** : pourcentage de RDV confirmés sur le total

> Les graphiques se mettent à jour automatiquement. Vous n'avez rien à
> configurer.

---

## 15 — Résumé IA des clients (NOUVEAU — Phase C)

### Où ?

Menu admin > **"Utilisateurs"** > cliquez sur un client > **"Résumé IA"**

### Ce que ça fait

L'intelligence artificielle analyse automatiquement l'historique d'un client :

- Nombre total de visites et montant total dépensé
- Ses soins préférés (affichés en étiquettes colorées)
- Alertes de santé éventuelles (si le client a un dossier médical)
- Un paragraphe de synthèse en langage naturel

### Quand l'utiliser

Avant un rendez-vous, consultez ce résumé pour personnaliser l'accueil.

---

## 16 — Export CSV des données (NOUVEAU — Phase C)

### Où ?

Dans les pages admin suivantes, un bouton **📥 CSV** apparaît en haut à droite :

- **Utilisateurs** → exporte la liste de tous les clients
- **Commandes** → exporte toutes les commandes
- **Rendez-vous** → exporte tous les RDV
- **Avis** → exporte tous les avis clients

### Comment ça marche

1. Cliquez le bouton **📥 CSV**
2. Un fichier se télécharge automatiquement sur votre ordinateur
3. Ouvrez-le avec **Excel**, **Google Sheets** ou **Numbers**

> Le fichier contient toutes les colonnes importantes (nom, email, date, statut,
> montant, etc.). Parfait pour faire des bilans mensuels ou annuels.

---

## 17 — Mode sombre (NOUVEAU — Phase D)

### Comment l'activer

1. Dans la barre de navigation, cliquez l'icône **🌙** (lune)
2. Le site passe en mode sombre (fond foncé, textes clairs)
3. Cliquez **☀️** (soleil) pour revenir au mode clair

### Vos clientes l'utilisent aussi

Le mode sombre est disponible pour tout le monde. Certaines clientes préfèrent
naviguer le soir avec un écran moins lumineux.

> Le choix est mémorisé : si une personne choisit le mode sombre, il reste
> activé lors de sa prochaine visite.

---

## 18 — Multi-langue français / anglais (NOUVEAU — Phase D)

### Comment changer de langue

1. Dans la barre de navigation, cliquez le bouton **FR** ou **EN**
2. Les textes principaux du site passent en anglais (ou en français)

### Ce qui change

Les boutons, le menu, les titres principaux sont traduits. Le contenu des soins,
des articles de blog et des produits reste en français (ce sont vos contenus
personnalisés).

> C'est utile pour la clientèle expatriée anglophone d'Abidjan.

---

## 19 — Analytics et performances (NOUVEAU — Phase D)

### Ce que c'est

Le site mesure automatiquement :

- **Combien de personnes visitent votre site** (nombre de visiteurs par
  jour/semaine/mois)
- **Quelles pages sont les plus populaires**
- **D'où viennent vos visiteurs** (Google, Instagram, lien direct…)
- **La vitesse de chargement du site**

### Où consulter les statistiques

1. Connectez-vous sur [vercel.com](https://vercel.com) > votre projet
2. Onglet **"Analytics"** (pour le trafic)
3. Onglet **"Speed Insights"** (pour les performances)

> Vous n'avez rien à configurer. Les données se collectent automatiquement.

---

## 📞 En cas de problème

| Problème                                  | Quoi faire                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Le site ne s'affiche pas                  | Vérifiez sur [status.vercel.com](https://status.vercel.com) si Vercel fonctionne  |
| Un client ne peut pas se connecter        | Vérifiez son compte dans l'admin > Utilisateurs                                   |
| Les emails ne partent pas                 | Vérifiez sur [resend.com](https://resend.com) votre quota d'envoi                 |
| Le paiement échoue                        | Vérifiez sur [cockpit.jeko.africa](https://cockpit.jeko.africa) le statut         |
| Vous avez oublié votre mot de passe admin | Utilisez la page `/mot-de-passe-oublie`                                           |
| Le site est-il en panne ?                 | Vérifiez `/api/health` — si vous voyez `{"status":"ok"}`, tout fonctionne         |
| L'assistant IA ne s'affiche pas           | Le bouton ✨ n'apparaît que sur les pages publiques (pas l'admin ni le dashboard) |
| Le mode sombre ne s'active pas            | Cliquez l'icône 🌙 dans la barre de navigation (en haut à droite)                 |
| Le CSV ne se télécharge pas               | Essayez un autre navigateur ou désactivez les bloqueurs de popups                 |

---

## 20 — Gérer le catalogue des soins (admin)

### Où ?

Menu admin > **"Soins"** (adresse : `/admin/soins`)

### Ce que vous voyez

Une grille de cartes montrant tous vos soins, chacun avec :

- Le **nom** du soin et son **image**
- Un badge de **catégorie** coloré (Hammam, Gommage, Visage, etc.)
- Le **prix** en FCFA et la **durée** en minutes
- Le statut : **Actif** (visible sur le site) ou **Inactif** (masqué)

### Ajouter un nouveau soin

1. Cliquez **"Nouveau soin"**
2. Remplissez :
   - **Nom** : le nom du soin
   - **Description** : ce que fait le soin
   - **Prix** : en FCFA (ex: 15000)
   - **Durée** : en minutes (ex: 60)
   - **Catégorie** : choisissez parmi Hammam, Gommage, Amincissant, Visage,
     Post-accouchement, Conseil esthétique, Sage-femme
   - **Image** : uploadez une photo ou collez une URL Cloudinary
3. Cliquez **"Enregistrer"**

### Modifier un soin

1. Cliquez l'icône **crayon** sur la carte du soin
2. Modifiez les champs souhaités
3. Cliquez **"Enregistrer"**

### Désactiver un soin (sans le supprimer)

1. Cliquez le bouton **"Actif"** sur la carte du soin
2. Le statut passe à **"Inactif"** — le soin disparaît du site public
3. Pour le réactiver, cliquez à nouveau sur **"Inactif"**

### Supprimer un soin

1. Cliquez l'icône **poubelle** rouge
2. Confirmez la suppression

> **Attention** : La suppression est définitive. Préférez désactiver un soin
> plutôt que le supprimer.

---

## 21 — Paramètres du centre

### Où ?

Menu admin > **"Paramètres"** (adresse : `/admin/parametres`)

### 3 onglets disponibles

#### Onglet 1 — Centre

Modifiez les informations de votre institut :

- **Nom du centre** : Le Surnaturel de Dieu
- **Adresse** : votre adresse physique
- **Téléphone** : votre numéro
- **Email** : votre email de contact
- **Horaires d'ouverture** : vos horaires

Cliquez **"Enregistrer"** après chaque modification.

#### Onglet 2 — Personnel

Gérez les comptes de votre équipe :

- Voir la liste du personnel existant (nom, email, rôle)
- **Créer un nouveau compte** :
  1. Remplissez Prénom, Nom, Email
  2. Définissez un mot de passe (minimum 8 caractères)
  3. Choisissez le rôle : **Sage-femme** ou **Accompagnateur médical**
  4. Cliquez **"Créer le compte"**
- **Supprimer un compte** : cliquez l'icône poubelle (avec confirmation)

> **Conseil** : Changez le mot de passe initial dès la première connexion du
> nouvel employé.

#### Onglet 3 — Logs d'accès

Consultez qui a accédé aux données médicales, quand et quelle action a été
effectuée. C'est un journal de sécurité automatique.

---

## 22 — Gérer les professionnels de santé

### Où ?

Menu admin > **"Professionnels"** (adresse : `/admin/professionnels`)

### Ce que vous voyez

Une grille de cartes pour chaque professionnel de santé (sage-femmes,
naturopathes, etc.) avec :

- Nom et rôle
- Spécialité
- Jours de disponibilité (en badges)
- Horaires et langues de consultation

### Modifier le profil d'un professionnel

1. Cliquez l'icône **crayon** sur la carte
2. Modifiez :
   - **Spécialité** : ex. Obstétrique, Naturopathie
   - **N° d'ordre** : numéro professionnel
   - **Jours de disponibilité** : cliquez sur les jours pour les
     activer/désactiver (Lundi à Dimanche)
   - **Horaires** : ex. 9h00 - 17h00
   - **Langues** : tapez une langue puis appuyez Entrée pour l'ajouter, cliquez
     × pour la retirer
3. Cliquez **"Enregistrer"**

> Ces informations aident les clientes à choisir le bon créneau lors de la prise
> de RDV.

---

## 23 — Vérification des utilisateurs

### Où ?

Menu admin > **"Vérification"** (adresse : `/admin/verification`)

### À quoi ça sert ?

Vérifier les comptes utilisateurs pour instaurer la confiance dans la
communauté. Un utilisateur vérifié a un badge visible par les autres membres.

### Les 3 statuts

| Statut                  | Badge    | Signification                   |
| ----------------------- | -------- | ------------------------------- |
| **Non vérifié**         | ❌ Rouge | Compte standard, non vérifié    |
| **Membre vérifié**      | ✅ Bleu  | Identité confirmée par l'admin  |
| **Professionnel santé** | 🛡️ Or    | Professionnel de santé certifié |

### Comment vérifier un utilisateur

1. Utilisez la **barre de recherche** ou les **filtres** (Tous, Non vérifié,
   Vérifié, Professionnel)
2. Consultez l'activité de chaque utilisateur : nombre de RDV, commandes et
   posts
3. Cliquez **"Vérifier"** pour donner le statut Membre vérifié
4. Cliquez **"Pro santé"** pour les professionnels de santé
5. Cliquez **"Retirer"** pour revenir au statut non vérifié

---

## 24 — Messagerie administrateur

### Où ?

Menu admin > **"Messages"** (adresse : `/admin/messages`)

### Ce que vous voyez

Une interface de messagerie en deux colonnes :

- **À gauche** : la liste de toutes vos conversations avec les utilisateurs
- **À droite** : le chat avec l'utilisateur sélectionné

### Fonctionnement

1. Cliquez sur une conversation à gauche pour l'ouvrir
2. Les messages **non lus** sont signalés par un **badge rouge** avec un chiffre
3. Tapez votre message dans la zone de texte en bas
4. Appuyez **Entrée** pour envoyer (ou Maj+Entrée pour un retour à la ligne)
5. Les conversations se rafraîchissent automatiquement toutes les 5 secondes
6. Les messages se marquent comme lus quand vous ouvrez la conversation

> Utilisez cette messagerie pour répondre aux questions des clientes ou
> coordonner avec votre équipe.

---

## 25 — Communauté — Tableau de bord complet

### Où ?

Menu admin > **"Communauté"** (adresse : `/admin/communaute`)

### Onglet Statistiques

Vue d'ensemble de la communauté avec des chiffres clés :

- **Membres** : total et actifs (7 jours / 30 jours)
- **Publications** : nombre total de posts
- **Groupes** et **Événements** : combien il y en a
- **Réactions** et **Commentaires** : indicateurs d'engagement
- **Taux d'engagement sur 7 jours**
- **Top contributeurs** : classement des membres les plus actifs

### Onglet Signalements

Gérez les contenus signalés par les membres :

1. Filtrez par statut : **En attente**, **En cours**, **Résolu**, **Rejeté**
2. Pour chaque signalement, vous voyez : qui a signalé, pourquoi, et le contenu
   concerné
3. Vos 3 options :
   - ✅ **Résolu** — le signalement est traité
   - ❌ **Rejeter** — le signalement est infondé
   - 🗑️ **Supprimer** — supprime le post ou commentaire signalé

---

## 26 — Gérer les événements

### Où ?

Menu admin > **"Événements"** (adresse : `/admin/evenements`)

### Ce que vous voyez

La liste de tous les événements de la communauté, avec un filtre pour voir les
événements **à venir** ou **passés**.

Chaque carte d'événement montre :

- La **date** (en badge coloré)
- Le **titre** et la **description**
- Le **lieu** et le nombre de **participants**
- Le **groupe** organisateur (s'il y en a un)

### Créer un événement

1. Cliquez **"+ Nouvel événement"**
2. Remplissez :
   - **Titre** : nom de l'événement
   - **Description** : détails
   - **Date début** et **Date fin**
   - **Lieu** (optionnel) : adresse ou nom du lieu
   - **Max participants** (optionnel) : nombre maximum de places
3. Cliquez **"Enregistrer"**

### Modifier ou supprimer

- Cliquez le **crayon** pour modifier
- Cliquez la **poubelle** pour supprimer (avec confirmation)

> Les événements passés apparaissent en grisé.

---

## 27 — Gérer les groupes

### Où ?

Menu admin > **"Groupes"** (adresse : `/admin/groupes`)

### Ce que vous voyez

Une grille de cartes avec tous les groupes de la communauté. Chaque carte montre
:

- L'**image** du groupe (ou une icône par défaut)
- Un badge de **visibilité** : Public (bleu), Privé (or), Secret (rouge)
- Le **nom** et la **description**
- Le nombre de **membres**, **posts** et **événements**

### Les types de visibilité

| Type       | Qui peut voir      | Qui peut rejoindre                   |
| ---------- | ------------------ | ------------------------------------ |
| **Public** | Tout le monde      | Tout le monde                        |
| **Privé**  | Tout le monde      | Sur demande (approbation nécessaire) |
| **Secret** | Membres uniquement | Sur invitation uniquement            |

### Créer un groupe

1. Cliquez **"+ Créer un groupe"**
2. Remplissez :
   - **Nom** : nom du groupe
   - **Description** : de quoi parle le groupe
   - **Visibilité** : Public, Privé ou Secret
   - **Règles** : règles de conduite du groupe
3. Cliquez **"Créer"**

### Voir les détails d'un groupe

Cliquez **"Détails"** pour voir :

- La description complète et les règles
- La liste des **membres** avec leurs rôles (Admin, Modérateur, Membre)
- Les **questions d'adhésion** (pour les groupes privés)
- Les membres **en attente** d'approbation

### Supprimer un groupe

Cliquez la **poubelle** rouge puis confirmez. La suppression est définitive.

---

## 28 — Gérer les blocages

### Où ?

Menu admin > **"Blocages"** (adresse : `/admin/blocages`)

### À quoi ça sert ?

Quand un membre de la communauté bloque un autre membre, la relation apparaît
ici. Vous pouvez intervenir si un blocage est abusif.

### Ce que vous voyez

Une table montrant toutes les relations de blocage :

- **Bloqueur** : la personne qui a bloqué (avec avatar et email)
- **Bloqué** : la personne bloquée
- **Date** : quand le blocage a eu lieu

### Débloquer une relation

1. Utilisez la **barre de recherche** pour trouver un utilisateur
2. Cliquez **"Débloquer"** sur la relation concernée
3. Confirmez la suppression du blocage

> Vous ne devriez intervenir que si un blocage semble abusif ou s'il y a une
> demande explicite.

---

## 29 — Carte complète de l'administration

Voici **toutes les pages** de votre panel admin avec ce qu'elles font :

| Page                | Adresse                 | Ce que vous y faites                                        |
| ------------------- | ----------------------- | ----------------------------------------------------------- |
| **Tableau de bord** | `/admin`                | Vue d'ensemble : RDV du jour, commandes, nouveaux clients   |
| **Rendez-vous**     | `/admin/rdv`            | Confirmer, annuler, gérer les RDV + export CSV              |
| **Commandes**       | `/admin/commandes`      | Traiter les commandes (statuts) + export CSV                |
| **Soins**           | `/admin/soins`          | Ajouter, modifier, activer/désactiver les soins             |
| **Blog**            | `/admin/blog`           | Publier, modifier, supprimer des articles                   |
| **Clients**         | `/admin/clients`        | Voir les clients, changer les rôles, résumé IA + export CSV |
| **Avis**            | `/admin/avis`           | Approuver, rejeter, répondre aux avis + export CSV          |
| **Rapports**        | `/admin/rapports`       | Graphiques CA, RDV, soins populaires, conversion            |
| **Fidélité**        | `/admin/fidelite`       | Voir/ajuster les points, consulter les historiques          |
| **Parrainages**     | `/admin/parrainages`    | Activer, récompenser, supprimer les parrainages             |
| **Communauté**      | `/admin/communaute`     | Statistiques + modération des signalements                  |
| **Événements**      | `/admin/evenements`     | Créer, modifier, supprimer les événements                   |
| **Groupes**         | `/admin/groupes`        | Créer, gérer, supprimer les groupes                         |
| **Signalements**    | `/admin/signalements`   | Traiter les contenus signalés                               |
| **Messages**        | `/admin/messages`       | Messagerie avec les utilisateurs                            |
| **Professionnels**  | `/admin/professionnels` | Gérer les profils des sage-femmes et praticiens             |
| **Vérification**    | `/admin/verification`   | Vérifier les comptes (badge confiance)                      |
| **Blocages**        | `/admin/blocages`       | Gérer les relations de blocage entre membres                |
| **Paramètres**      | `/admin/parametres`     | Infos du centre, gestion du personnel, logs d'accès         |

---

## 🌍 Pages publiques disponibles

| Page             | Adresse                 | Contenu                                                           |
| ---------------- | ----------------------- | ----------------------------------------------------------------- |
| Page d'accueil   | `/`                     | Présentation de l'institut                                        |
| Soins & Services | `/soins`                | Catalogue complet des soins                                       |
| Boutique         | `/boutique`             | Produits naturels en vente                                        |
| Blog             | `/blog`                 | Articles et conseils                                              |
| Sage-femme       | `/sage-femme`           | Services de la sage-femme                                         |
| Avis             | `/avis`                 | Avis clients                                                      |
| Contact          | `/contact`              | Formulaire de contact                                             |
| À propos         | `/a-propos`             | L'histoire de l'institut                                          |
| Communauté       | `/decouvrir-communaute` | Aperçu public : stats, posts récents, événements, CTA inscription |
| Prise de RDV     | `/prise-rdv`            | Réserver un créneau                                               |

---

## 🗓️ Routine quotidienne mise à jour

| Moment             | Action                               | Temps estimé |
| ------------------ | ------------------------------------ | ------------ |
| **Matin (9h)**     | Consulter le tableau de bord admin   | 5 min        |
| **Matin**          | Confirmer les RDV du jour            | 5 min        |
| **Mi-journée**     | Traiter les commandes payées         | 10 min       |
| **Après-midi**     | Répondre aux messages et avis        | 15 min       |
| **Fin de journée** | Vérifier les notifications restantes | 5 min        |
| **Fin de journée** | Vérifier les signalements communauté | 5 min        |
| **1x par semaine** | Publier un article de blog           | 30 min       |
| **1x par semaine** | Consulter les rapports avancés       | 10 min       |
| **1x par mois**    | Exporter les CSV pour bilan mensuel  | 10 min       |
| **1x par mois**    | Consulter Vercel Analytics           | 10 min       |
| **1x par mois**    | Vérifier les profils professionnels  | 5 min        |
| **Si besoin**      | Vérifier des comptes utilisateurs    | 5 min        |
| **Si besoin**      | Gérer les blocages signalés          | 5 min        |

**Temps total : environ 45 minutes par jour + 40 min par semaine + 30 min par
mois**

---

_Guide mis à jour le 23 mars 2026 — Le Surnaturel de Dieu — Version complète
(toutes fonctionnalités documentées)_
