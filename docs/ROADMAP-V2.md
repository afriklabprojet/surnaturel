# 🗺️ Feuille de Route — Version 2 — Le Surnaturel de Dieu

> Ce document liste les améliorations à construire, classées par **impact sur
> votre activité**.\
> L'ordre est celui qui rapportera le plus vite à votre entreprise.\
> _Mis à jour le 22 mars 2026 après déploiement des Phases 3-6 + C + D._

---

## 📊 État actuel du site (22 mars 2026)

### Tout ce qui est en ligne et opérationnel

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
| Panel admin             | ✅ Complet | 20+ modules (soins, commandes, blog, clients, avis…)               |
| Tableau de bord client  | ✅ Complet | RDV, commandes, profil, notifications, favoris                     |
| Programme de fidélité   | ✅ Complet | API + interface, points automatiques                               |
| Système d'avis          | ✅ Complet | API + page publique                                                |
| Parrainage              | ✅ Complet | API + interface, code BIENVENUE10                                  |
| Suivi médical           | ✅ Complet | Dossier chiffré, mesures, graphiques Recharts, alertes, export PDF |
| Communauté              | ✅ Complet | Feed, groupes, événements, stories, messagerie, signalements       |
| Communauté publique     | ✅ Complet | Page `/decouvrir-communaute` avec stats et aperçu                  |
| Messagerie temps réel   | ✅ Complet | Pusher, ChatBubble, conversations, recherche                       |
| Admin signalements      | ✅ Complet | Panel modération : rejeter / supprimer / résolu                    |
| SEO complet             | ✅ Complet | robots.txt, JSON-LD, OG dynamiques, Sitemap étendu                 |
| Monitoring              | ✅ Complet | `/api/health` vérifie DB et statut                                 |
| PWA                     | ✅ Complet | Manifest, service worker, cache hors-ligne                         |
| Recommandations soins   | ✅ Complet | Assistant bien-être — recommandations personnalisées               |
| QR code réel            | ✅ Complet | Connecté à l'API, données réelles                                  |
| Timezone fix            | ✅ Complet | Heures RDV affichées en Africa/Abidjan                             |
| Synthèse consultations | ✅ Complet | Synthèse d'un client (stats, préférences, alertes)              |
| Rapports avancés        | ✅ Complet | Graphiques CA, RDV, soins populaires, taux de conversion           |
| Export CSV admin        | ✅ Complet | Export clients, commandes, RDV, avis en fichier Excel              |
| Recommandations perso   | ✅ Complet | Recommandations basées sur l'historique du client connecté         |
| Multi-langue FR/EN      | ✅ Complet | Bascule dans la navbar, traductions des éléments de navigation     |
| Google My Business      | ✅ Complet | JSON-LD enrichi + API agrégation avis                              |
| Mode sombre             | ✅ Complet | Toggle dans la navbar, mémorisé en localStorage                    |
| Tests automatisés       | ✅ Complet | 22 tests Vitest (utilitaires + APIs)                               |
| PostHog Analytics      | ✅ Complet | Suivi du trafic et analytics                                       |

> **Résultat** : 35+ fonctionnalités livrées. Le site est complet et
> opérationnel pour accueillir des clientes dès maintenant.

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

**Impact estimé** : Réduction de 30% des absences RDV, augmentation de 20% des
avis, meilleure gestion du planning.

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

**Impact estimé** : Augmentation de 40% du taux de retour des clientes,
meilleure fidélisation.

---

### Phase C — « Expérience professionnelle » (Impact : ★★★☆☆) ✅ LIVRÉ

> Déployé le 22 mars 2026 (commit `2c2a26e`).

| #  | Amélioration                              | Statut |
| -- | ----------------------------------------- | ------ |
| C1 | Synthèse des consultations              | ✅     |
| C2 | Historique des visites client             | ✅     |
| C3 | Tableau de bord rapports avancés          | ✅     |
| C4 | Recommandations améliorées (avec historique client) | ✅     |
| C5 | Export CSV des données admin              | ✅     |

---

### Phase D — « Croissance long terme » (Impact : ★★☆☆☆) ✅ LIVRÉ

> Déployé le 22 mars 2026 (commit `2c2a26e`).

| #  | Amélioration                                           | Statut |
| -- | ------------------------------------------------------ | ------ |
| D1 | Multi-langue (anglais + français)                      | ✅     |
| D2 | Google My Business automatisé                          | ✅     |
| D3 | Mode sombre                                            | ✅     |
| D4 | Tests automatisés (22 tests API + utilitaires)         | ✅     |
| D5 | Analytics avancées (Vercel Analytics + Speed Insights) | ✅     |

---

### Phase E — « Améliorations futures » (Impact : ★★☆☆☆)

> **Objectif** : Optimiser l'existant et ajouter des fonctionnalités de confort.

| #  | Amélioration                                      | Pourquoi                                                                                   | Impact |
| -- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| E1 | **Paiement en ligne boutique** (panier complet)   | Permettre le paiement direct du panier via Jeko sans passage par WhatsApp.                 | ★★★☆☆  |
| E2 | **Système de coupons avancé** (admin)             | Interface admin pour créer/gérer des coupons avec date d'expiration, limites.              | ★★★☆☆  |
| E3 | **Espace sage-femme dédié** (tableau de bord pro) | Interface dédiée pour la sage-femme : ses RDV du jour, ses patients, ses notes.            | ★★☆☆☆  |
| E4 | **Application mobile native** (React Native)      | Une vraie app sur l'App Store/Google Play pour celles qui ne savent pas installer une PWA. | ★★☆☆☆  |
| E5 | **Intégration WhatsApp Business API**             | Notifications RDV par WhatsApp au lieu d'email/SMS.                                        | ★★☆☆☆  |
| E6 | **Système d'abonnements mensuels**                | Forfaits mensuels payés automatiquement (ex : 2 soins/mois pour X FCFA).                   | ★★☆☆☆  |

---

## 📅 Ordre de construction recommandé

| Priorité | Phase                               | Ce que ça apporte                                    |
| -------- | ----------------------------------- | ---------------------------------------------------- |
| 🔴 1     | **A1** — Acompte RDV                | Élimine les absences, sécurise vos revenus           |
| 🔴 2     | **A3** — Calendrier disponibilités  | Évite les doubles réservations, organise le planning |
| 🟠 3     | **A2** — SMS de rappel              | Les clientes ne ratent plus jamais un RDV            |
| 🟠 4     | **A4** — Demande d'avis automatique | Plus d'avis = plus de nouvelles clientes             |
| 🟡 5     | **B1** — Notifications push         | Restez en contact sans effort                        |
| 🟡 6     | **B2** — Récompenses fidélité       | Motivez les clientes à revenir                       |
| 🟢 7     | **A5** — Codes promo campagne       | Boostez les promotions ponctuelles                   |
| 🟢 8     | **B3+B4** — Galerie + témoignages   | Social proof pour convertir les hésitantes           |
| 🔵 9     | **B5** — Newsletter auto            | Gardez le contact toutes les semaines                |
| 🔵 10    | **E1-E6** — Améliorations futures   | Quand l'institut tourne bien et génère des revenus   |

---

## 💡 Conseil final

> **Votre site est complet et prêt à recevoir des clientes dès maintenant.**\
> 35+ fonctionnalités sont en ligne. Vous pouvez l'ouvrir au public
> immédiatement.\
> \
> La **Phase A** (acompte + calendrier + SMS) est la seule qui impacte
> directement vos revenus — commencez par là quand vous serez prête.\
> \
> Tout le reste peut attendre que l'institut tourne et génère des revenus.

---

_Feuille de route mise à jour le 23 mars 2026 — Le Surnaturel de Dieu — V2_
