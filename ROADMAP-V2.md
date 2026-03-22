# 🗺️ Feuille de Route — Version 2 — Le Surnaturel de Dieu

> Ce document liste les améliorations à construire, classées par **impact sur
> votre activité**.\
> L'ordre est celui qui rapportera le plus vite à votre entreprise.\
> _Mis à jour le 22 mars 2026 après déploiement des Phases 3-6._

---

## 📊 État actuel du site (après Phases 3-6)

| Fonctionnalité          | État       | Détail                                                             |
| ----------------------- | ---------- | ------------------------------------------------------------------ |
| Page d'accueil          | ✅ Complet | Prêt pour la production                                            |
| Catalogue des soins     | ✅ Complet | 16 soins + 3 forfaits, page détaillée par soin                     |
| Boutique en ligne       | ✅ Complet | Produits, panier, checkout                                         |
| Paiement Jeko Africa    | ✅ Complet | Wave, Orange, MTN, Moov, Djamo                                     |
| Page sage-femme         | ✅ Complet | Prêt                                                               |
| Prise de rendez-vous    | ✅ Complet | Réservation + QR code billet réel                                  |
| Blog                    | ✅ Complet | Création, affichage, OG images dynamiques                          |
| Pages About / Contact   | ✅ Complet | Prêt                                                               |
| Inscription / Connexion | ✅ Complet | NextAuth email/mot de passe                                        |
| Emails automatiques     | ✅ Complet | Inscription, RDV, commande, rappels                                |
| Panel admin             | ✅ Complet | 20 modules (soins, commandes, blog, clients, avis…)                |
| Tableau de bord client  | ✅ Complet | RDV, commandes, profil, notifications, favoris                     |
| Programme de fidélité   | ✅ Complet | API + interface, points automatiques                               |
| Système d'avis          | ✅ Complet | API + page publique                                                |
| Parrainage              | ✅ Complet | API + interface, code BIENVENUE10                                  |
| Suivi médical           | ✅ Complet | Dossier chiffré, mesures, graphiques Recharts, alertes, export PDF |
| Communauté              | ✅ Complet | Feed, groupes, événements, stories, messagerie, signalements       |
| Communauté publique     | ✅ NOUVEAU | Page `/decouvrir-communaute` avec stats et aperçu                  |
| Messagerie temps réel   | ✅ Complet | Pusher, ChatBubble, conversations, recherche                       |
| Admin signalements      | ✅ NOUVEAU | Panel modération : rejeter / supprimer / résolu                    |
| SEO robots.txt          | ✅ NOUVEAU | Indexation Google correcte                                         |
| SEO JSON-LD             | ✅ NOUVEAU | Données structurées HealthAndBeautyBusiness                        |
| SEO OG dynamiques       | ✅ NOUVEAU | Images personnalisées pour soins et blog                           |
| SEO Sitemap             | ✅ NOUVEAU | Étendu avec avis et communauté                                     |
| Monitoring              | ✅ NOUVEAU | `/api/health` vérifie DB et statut                                 |
| PWA                     | ✅ NOUVEAU | Manifest, service worker, cache hors-ligne                         |
| Chat IA soins           | ✅ NOUVEAU | Assistant bien-être 3 questions → recommandations                  |
| QR code réel            | ✅ NOUVEAU | Connecté à l'API, plus de données fictives                         |
| Timezone fix            | ✅ NOUVEAU | Heures RDV affichées en Africa/Abidjan                             |

---

## 🏆 Ce qu'il reste à construire — classé par IMPACT

---

### Phase A — « Revenus immédiats » (Impact : ★★★★★)

> **Objectif** : Augmenter directement votre chiffre d'affaires.\
> **Chaque item est indépendant — vous pouvez les faire dans n'importe quel
> ordre.**

| #  | Amélioration                                         | Pourquoi c'est prioritaire                                                                                                            | Impact |
| -- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| A1 | **Paiement d'acompte à la réservation RDV**          | Les clientes qui ne paient rien ne viennent pas (30% de no-shows estimés). Un acompte de 2 000 F via Jeko élimine ce problème.        | ★★★★★  |
| A2 | **Rappels par SMS** (en complément des emails)       | En Côte d'Ivoire, les emails sont souvent ignorés. Un SMS la veille du RDV est 10× plus efficace. Service : Twilio ou API SMS locale. | ★★★★★  |
| A3 | **Calendrier de disponibilités par praticienne**     | Empêcher les doubles réservations. Définir des plages horaires par jour/semaine.                                                      | ★★★★★  |
| A4 | **Invitations automatiques d'avis après un soin**    | Envoyer un email 24h après un RDV terminé pour demander un avis. Les avis sont le facteur n°1 de conversion.                          | ★★★★☆  |
| A5 | **Code promo par campagne** (newsletter, événements) | Créer des codes promo temporaires pour des campagnes marketing ciblées.                                                               | ★★★★☆  |

---

### Phase B — « Engagement client » (Impact : ★★★★☆)

> **Objectif** : Faire revenir les clientes plus souvent et créer de
> l'attachement.

| #  | Amélioration                            | Pourquoi c'est prioritaire                                                                             | Impact |
| -- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| B1 | **Notifications push navigateur**       | Alerter les clientes en temps réel (nouveau message, rappel RDV, promo) sans qu'elles ouvrent le site. | ★★★★☆  |
| B2 | **Programme de récompenses visible**    | Catalogue de récompenses échangeables contre des points fidélité (soin gratuit à X points).            | ★★★★☆  |
| B3 | **Galerie avant/après soins**           | Montrer les résultats réels (avec consentement). Puissant pour la conversion.                          | ★★★☆☆  |
| B4 | **Témoignages vidéo**                   | Intégrer des vidéos de clientes satisfaites sur la page d'accueil.                                     | ★★★☆☆  |
| B5 | **Newsletter automatique hebdomadaire** | Résumé des nouveaux articles, soins populaires, événements. Envoi automatique.                         | ★★★☆☆  |

---

### Phase C — « Expérience professionnelle » (Impact : ★★★☆☆) ✅ LIVRÉ

> **Objectif** : Améliorer la qualité du service médical et la gestion
> quotidienne. **Déployé le 2025-07 (commit 2c2a26e).**

| #  | Amélioration                                         | Pourquoi c'est prioritaire                                                                              | Impact | Statut |
| -- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ | ------ |
| C1 | **Résumé IA des consultations** (pour la sage-femme) | Après une consultation, l'IA résume les notes pour gagner du temps.                                     | ★★★☆☆  | ✅      |
| C2 | **Historique des visites client** (visible en admin) | Voir combien de fois une cliente est venue, quels soins elle a pris, son panier moyen.                  | ★★★☆☆  | ✅      |
| C3 | **Tableau de bord rapports avancés**                 | Graphiques revenus/mois, soins les plus populaires, taux de conversion RDV.                             | ★★★☆☆  | ✅      |
| C4 | **Chat IA amélioré** (avec historique client)        | L'assistant se souvient des préférences de la cliente connectée pour des recommandations plus précises. | ★★☆☆☆  | ✅      |
| C5 | **Export CSV des données admin**                     | Exporter la liste des clients, commandes, RDV en fichier Excel.                                         | ★★☆☆☆  | ✅      |

---

### Phase D — « Croissance long terme » (Impact : ★★☆☆☆) ✅ LIVRÉ

> **Objectif** : Élargir la clientèle et se différencier durablement.
> **Déployé le 2025-07 (commit 2c2a26e).**

| #  | Amélioration                              | Pourquoi c'est prioritaire                                                   | Impact | Statut |
| -- | ----------------------------------------- | ---------------------------------------------------------------------------- | ------ | ------ |
| D1 | **Multi-langue (anglais + français)**     | Attirer la clientèle expatriée d'Abidjan (communauté anglophone importante). | ★★☆☆☆  | ✅      |
| D2 | **Google My Business automatisé**         | Synchroniser les avis et infos avec la fiche Google Maps.                    | ★★☆☆☆  | ✅      |
| D3 | **Mode sombre**                           | Confort visuel pour les utilisatrices le soir.                               | ★☆☆☆☆  | ✅      |
| D4 | **Tests automatisés** (APIs critiques)    | Prévenir les régressions lors des mises à jour.                              | ★☆☆☆☆  | ✅      |
| D5 | **Analytics avancées** (Vercel Analytics) | Comprendre le parcours des visiteuses et optimiser la conversion.            | ★★☆☆☆  | ✅      |

---

## 📅 Planning suggéré

| Phase                    | Durée estimée | Résultat attendu                                                    |
| ------------------------ | ------------- | ------------------------------------------------------------------- |
| **Phase A** — Revenus    | 2-3 semaines  | Acompte RDV + SMS + calendrier → moins de no-shows, plus de revenus |
| **Phase B** — Engagement | 2-3 semaines  | Push + récompenses + galerie → clientes qui reviennent              |
| **Phase C** — Pro        | 2-3 semaines  | IA sage-femme + rapports → gestion plus efficace                    | ✅ Livré |
| **Phase D** — Croissance | Continu       | Multi-langue + analytics → nouvelle clientèle                       | ✅ Livré |

---

## 💡 Conseil final

> **Votre site est opérationnel et complet.** Vous pouvez l'ouvrir au public dès
> maintenant.\
> La Phase A (acompte + SMS + calendrier) est la seule qui impacte directement
> vos revenus — commencez par là.\
> Tout le reste peut attendre que l'institut tourne et génère des revenus.

---

_Feuille de route mise à jour le 22 mars 2026 — Le Surnaturel de Dieu — V2_
