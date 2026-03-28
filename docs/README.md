# 🌿 Le Surnaturel de Dieu — Institut de Bien-Être

> Site web de l'Institut de Bien-Être « Le Surnaturel de Dieu » à Abidjan, Côte
> d'Ivoire.\
> Fondé par Marie Jeanne — Depuis 2015.

## Présentation

Site vitrine + e-commerce + portail de services pour un institut de bien-être
proposant :

- Soins du corps (hammam, gommage, amincissant, visage)
- Soins post-accouchement
- Consultation sage-femme
- Boutique de produits naturels
- Programme de fidélité et parrainage
- Communauté de clientes

## Stack technique

| Technologie              | Usage                 |
| ------------------------ | --------------------- |
| Next.js 16 (App Router)  | Framework             |
| TypeScript               | Langage               |
| Tailwind CSS v4          | Styles                |
| shadcn/ui                | Composants UI         |
| Prisma + Neon PostgreSQL | Base de données       |
| NextAuth.js v5           | Authentification      |
| Pusher                   | Temps réel            |
| Resend                   | Emails                |
| Jeko Africa              | Paiement Mobile Money |
| Cloudinary               | Images                |
| Vercel                   | Hébergement           |

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et remplir les variables d'environnement
cp .env.example .env.local

# 3. Générer le client Prisma
npx prisma generate

# 4. Lancer le serveur de développement
npm run dev
```

Le site est accessible sur **http://localhost:3000**

## Documentation

| Document                                     | Description                           |
| -------------------------------------------- | ------------------------------------- |
| [DEPLOIEMENT.md](DEPLOIEMENT.md)             | Guide pas-à-pas pour mettre en ligne  |
| [GUIDE-UTILISATION.md](GUIDE-UTILISATION.md) | Guide d'utilisation quotidienne       |
| [MAINTENANCE.md](MAINTENANCE.md)             | Comment maintenir et modifier le site |
| [ROADMAP-V2.md](ROADMAP-V2.md)               | Améliorations prévues pour la V2      |
| [INSTRUCTIONS.md](../INSTRUCTIONS.md)        | Règles et conventions du projet       |

## Scripts disponibles

```bash
npm run dev          # Lancer en développement
npm run build        # Construire pour la production
npm run start        # Lancer en production
npm run lint         # Vérifier le code
npx prisma studio    # Interface base de données
npx prisma migrate dev  # Appliquer les migrations
```

## Structure du projet

```
src/
├── app/
│   ├── (public)/      # Pages publiques (accueil, soins, boutique...)
│   ├── (auth)/        # Connexion, inscription
│   ├── (dashboard)/   # Espace client connecté
│   ├── (admin)/       # Panel d'administration
│   └── api/           # Routes API
├── components/        # Composants réutilisables
├── lib/               # Utilitaires (auth, prisma, email, paiement...)
└── types/             # Types TypeScript
```

---

_Institut de Bien-Être Le Surnaturel de Dieu — Marie Jeanne — Abidjan, Côte
d'Ivoire_

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.
