# 🗺️ Feuille de Route — Version 2 — Le Surnaturel de Dieu

> Ce document liste les améliorations à construire, classées par **impact sur votre activité**.  
> L'ordre est celui qui rapportera le plus vite à votre entreprise.

---

## 📊 État actuel du site (V1)

| Fonctionnalité | État | Verdict |
|----------------|------|---------|
| Page d'accueil | ✅ Complet | Prêt pour la production |
| Catalogue des soins | ✅ Complet | Prêt |
| Boutique en ligne | ✅ Complet | Prêt (produits, panier, checkout) |
| Paiement Jeko Africa | ✅ Complet | Wave, Orange, MTN, Moov, Djamo |
| Page sage-femme | ✅ Complet | Prêt |
| Prise de rendez-vous | ✅ Complet | Réservation fonctionnelle |
| Blog | ✅ Complet | Création et affichage d'articles |
| Page À propos | ✅ Complet | Prêt |
| Page Contact | ✅ Complet | Formulaire fonctionnel |
| Inscription / Connexion | ✅ Complet | NextAuth avec email/mot de passe |
| Emails automatiques | ✅ Complet | Inscription, RDV, commande, rappels |
| Panel admin | 🟡 Partiel | Structure présente, pages à compléter |
| Tableau de bord client | 🟡 Partiel | Pages créées, contenu à développer |
| Programme de fidélité | 🟡 Partiel | API prête, interface à construire |
| Système d'avis | 🟡 Partiel | API prête, page publique manquante |
| Communauté / Réseau social | ❌ Squelette | Schéma DB prêt, aucune interface |
| Suivi médical | ❌ Squelette | Schéma DB prêt, aucune interface |
| Parrainage | ❌ Non construit | API prête, aucune interface |
| Messagerie temps réel | ❌ Non construit | Pusher configuré, pas d'interface |

---

## 🏆 Phase 1 — « Opérationnel » (Impact : CRITIQUE)

> **Objectif** : Pouvoir gérer votre activité au quotidien avec le panel admin.  
> **Sans cette phase, vous ne pouvez pas utiliser le site professionnellement.**

### 1.1 — Panel d'administration complet

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Tableau de bord admin avec vrais chiffres | Voir vos revenus, RDV et commandes d'un coup d'œil |
| Gestion des commandes (voir, changer le statut) | Traiter les commandes clients au quotidien |
| Gestion des rendez-vous (confirmer, annuler) | Organiser votre planning quotidien |
| Gestion du blog (créer, modifier, supprimer) | Publier du contenu pour attirer des clients |
| Gestion des produits (ajouter, modifier stock/prix) | Gérer votre catalogue boutique |
| Gestion des soins (modifier descriptions, prix) | Mettre à jour vos prestations |
| Liste des clients | Connaître vos clients et leur historique |
| Gestion des avis (approuver, rejeter, répondre) | Maîtriser votre e-réputation |

**Impact** : ★★★★★ — Impossible de fonctionner sans.

### 1.2 — Tableau de bord client complet

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Page « Mes rendez-vous » avec historique | Les clients veulent voir et gérer leurs RDV |
| Page « Mes commandes » avec suivi | Les clients veulent suivre leurs achats |
| Page « Mon profil » (modifier infos, photo) | Les clients veulent personnaliser leur compte |
| Page « Mes notifications » | Les clients veulent être informés en temps réel |

**Impact** : ★★★★★ — Les clients quitteront le site sans espace personnel fonctionnel.

### 1.3 — Connexion données réelles

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Remplacer les soins fictifs par la base de données | Les données doivent venir de la DB, pas de fichiers statiques |
| Remplacer les produits fictifs par la base de données | Idem — pouvoir modifier depuis l'admin |
| Outil de gestion des créneaux de RDV | Définir les heures disponibles par jour/semaine |

**Impact** : ★★★★★ — Les données en dur empêchent toute flexibilité.

---

## 💰 Phase 2 — « Revenus » (Impact : ÉLEVÉ)

> **Objectif** : Augmenter vos revenus grâce aux fonctionnalités marketing.  
> **Cette phase transforme le site en machine à revenus.**

### 2.1 — Page d'avis publics

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Page `/avis` avec tous les avis clients | Les avis sont le facteur n°1 de décision d'achat |
| Afficher les avis sur les pages soins/produits | Rassurer sur chaque prestation/produit |
| Invitation automatique après un soin/achat | Augmenter le nombre d'avis sans effort |

**Impact** : ★★★★☆ — Les avis positifs convertissent les visiteurs en clients.

### 2.2 — Programme de fidélité (interface)

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Page fidélité dans le tableau de bord | Les clients veulent voir leurs points |
| Historique des points gagnés/dépensés | Transparence et engagement |
| Catalogue de récompenses | Inciter les clients à revenir |

**Impact** : ★★★★☆ — Un client fidèle coûte 5× moins qu'un nouveau client.

### 2.3 — Programme de parrainage (interface)

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Page parrainage avec code unique | Chaque client peut vous amener de nouveaux clients |
| Suivi des parrainages (qui a parrainé qui) | Motiver les ambassadeurs |
| Récompense automatique (points bonus) | Rendre le système autonome |

**Impact** : ★★★★☆ — Le bouche-à-oreille digital à coût zéro.

### 2.4 — Page favoris

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Page « Mes favoris » dans le tableau de bord | Les clients veulent sauvegarder soins et produits |
| Bouton favori sur chaque soin et produit | Faciliter la découverte et le retour |

**Impact** : ★★★☆☆ — Augmente le taux de retour sur le site.

---

## 🩺 Phase 3 — « Soins spécialisés » (Impact : MOYEN-ÉLEVÉ)

> **Objectif** : Proposer un suivi médical professionnel unique qui vous différencie de la concurrence.

### 3.1 — Espace suivi médical

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Dossier médical chiffré pour chaque patiente | Service professionnel de suivi |
| Mesures de santé (poids, tension, etc.) | Suivi post-accouchement personnalisé |
| Upload de documents médicaux | Centraliser les examens et ordonnances |
| Messagerie médicale chiffrée | Communication confidentielle sage-femme/patiente |

**Impact** : ★★★★☆ — Différenciateur majeur — aucun concurrent n'offre cela.

### 3.2 — Améliorer le système de RDV

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Calendrier de disponibilités par praticienne | Éviter les doubles réservations |
| Rappels par SMS (en plus des emails) | Les emails sont parfois ignorés en Côte d'Ivoire |
| Paiement d'acompte à la réservation | Réduire les désistements |

**Impact** : ★★★★☆ — Vos RDV sont votre revenu principal.

---

## 👥 Phase 4 — « Communauté » (Impact : MOYEN)

> **Objectif** : Créer un espace social qui fidélise vos clientes et attire de nouvelles.

### 4.1 — Fil d'actualité communautaire

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Publier des posts (texte + photos) | Créer du lien entre les clientes |
| Commenter et réagir aux posts | Engagement communautaire |
| Stories éphémères (24h) | Contenu fun qui engage |
| Système de suivi (followers) | Réseau social intégré |

**Impact** : ★★★☆☆ — Crée de l'attachement émotionnel à votre marque.

### 4.2 — Groupes et événements

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Créer des groupes (ex: « Post-accouchement ») | Auto-organisation des clientes |
| Organiser des événements (ateliers, journées portes ouvertes) | Générer du trafic physique |
| Système de participation aux événements | Gérer les inscriptions |

**Impact** : ★★★☆☆ — Avantage concurrentiel, mais pas urgent.

### 4.3 — Messagerie temps réel

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Chat en temps réel entre membres | Communication instantanée |
| Notifications push (navigateur) | Engagement en temps réel |
| Indicateur « en ligne » / « en train d'écrire » | UX de qualité |

**Impact** : ★★☆☆☆ — Fonctionnalité « nice to have », pas critique.

---

## 🔧 Phase 5 — « Optimisation » (Impact : CONTINU)

> **Objectif** : Polir le site, améliorer les performances et le référencement.

### 5.1 — SEO et référencement

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Ajouter `robots.txt` | Permettre à Google d'indexer le site |
| Données structurées JSON-LD (soins, produits) | Apparaître dans les résultats enrichis Google |
| Optimiser les temps de chargement | Google favorise les sites rapides |
| Pages AMP pour le blog (optionnel) | Meilleur référencement mobile |

**Impact** : ★★★☆☆ — Le SEO génère du trafic gratuit sur le long terme.

### 5.2 — Corrections techniques

| Tâche | Détail |
|-------|--------|
| Corriger 9 warnings Tailwind CSS | `tracking-[0.1em]` → `tracking-widest`, etc. |
| Migrer les données fictives vers la DB | soins-data.ts et produits-data.ts → Prisma |
| Seed de base de données de test | Préremplir la DB pour les démos |

**Impact** : ★★☆☆☆ — Qualité du code, pas visible pour les utilisateurs.

### 5.3 — Performance et monitoring

| Tâche | Pourquoi c'est prioritaire |
|-------|---------------------------|
| Ajouter Vercel Analytics | Comprendre le trafic et les conversions |
| Ajouter un système de logs structurés | Détecter les erreurs avant les clients |
| Tests automatisés (au moins les APIs critiques) | Éviter les régressions lors des mises à jour |

**Impact** : ★★☆☆☆ — Prévention des problèmes futurs.

---

## 🌟 Phase 6 — « Innovation » (Impact : FUTUR)

> **Objectif** : Se différencier et préparer la croissance.

### 6.1 — Application mobile (PWA)

| Tâche | Pourquoi |
|-------|---------|
| Transformer le site en Progressive Web App | Les clientes d'Abidjan utilisent surtout le téléphone |
| Notifications push mobiles | Rappels de RDV sur le téléphone |
| Mode hors-ligne pour le contenu clé | Fonctionner même avec un réseau instable |

**Impact** : ★★★★☆ — En Côte d'Ivoire, 80%+ du trafic web est mobile.

### 6.2 — Multi-langue

| Tâche | Pourquoi |
|-------|---------|
| Ajouter l'anglais | Attirer la clientèle expatriée d'Abidjan |
| Système i18n avec Next.js | Infrastructure pour d'autres langues |

**Impact** : ★★☆☆☆ — Marché secondaire mais en croissance.

### 6.3 — Intelligence artificielle

| Tâche | Pourquoi |
|-------|---------|
| Chatbot IA pour les questions fréquentes | Répondre automatiquement aux questions clients 24/7 |
| Recommandation de soins personnalisée | Proposer le bon soin selon l'historique du client |
| Résumé automatique des rendez-vous (pour la sage-femme) | Gain de temps pour le personnel médical |

**Impact** : ★★☆☆☆ — Innovant, mais nécessite un investissement en temps.

---

## 📅 Planning suggéré

| Phase | Durée estimée | Résultat |
|-------|---------------|---------|
| **Phase 1** — Opérationnel | 3-4 semaines | Admin + Dashboard fonctionnels → site utilisable au quotidien |
| **Phase 2** — Revenus | 2-3 semaines | Avis, fidélité, parrainage → plus de clients et de ventes |
| **Phase 3** — Soins spécialisés | 2-3 semaines | Suivi médical → avantage concurrentiel unique |
| **Phase 4** — Communauté | 3-4 semaines | Réseau social → fidélisation à long terme |
| **Phase 5** — Optimisation | Continu | SEO, performance → croissance organique |
| **Phase 6** — Innovation | Selon budget | Mobile, IA → différenciation sur le marché |

---

## 💡 Conseil final

> **Commencez par la Phase 1**. Sans un admin fonctionnel et un tableau de bord client complet, le site est une vitrine qui ne permet pas de gérer votre activité. Une fois la Phase 1 terminée, vous pouvez ouvrir le site au public et commencer à générer des revenus pendant que les phases suivantes sont en développement.

---

*Feuille de route rédigée le 22 mars 2026 — Le Surnaturel de Dieu*
