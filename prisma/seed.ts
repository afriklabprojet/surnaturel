import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import bcrypt from "bcryptjs"

// Enable WebSocket in Node.js CLI environment
neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

async function main() {
  console.log("🌱 Seeding database...")

  // ─── Utilisateurs ──────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@2025", 12)
  const sageFemmeHash = await bcrypt.hash("SageFemme@2025", 12)
  const clientHash = await bcrypt.hash("Client@2025", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@surnatureldedieu.com" },
    update: {},
    create: {
      email: "admin@surnatureldedieu.com",
      passwordHash: adminHash,
      nom: "Jeanne",
      prenom: "Marie",
      role: "ADMIN",
    },
  })

  const sageFemme = await prisma.user.upsert({
    where: { email: "sagefemme@surnatureldedieu.com" },
    update: {},
    create: {
      email: "sagefemme@surnatureldedieu.com",
      passwordHash: sageFemmeHash,
      nom: "Kouassi",
      prenom: "Ama",
      role: "SAGE_FEMME",
      telephone: "+225 07 00 00 01",
    },
  })

  const client = await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: {},
    create: {
      email: "client@test.com",
      passwordHash: clientHash,
      nom: "Diallo",
      prenom: "Fatou",
      role: "CLIENT",
      telephone: "+225 05 00 00 01",
      ville: "Plateau",
    },
  })

  console.log("✅ Utilisateurs créés")

  // ─── Soins ─────────────────────────────────────────────────

  // Supprimer les soins existants pour re-seed proprement
  await prisma.avis.deleteMany({})
  await prisma.favori.deleteMany({})
  await prisma.rendezVous.deleteMany({})
  await prisma.soin.deleteMany({})

  const soinsData = [
    {
      nom: "Hammam Royal",
      slug: "hammam-royal",
      description: "Plongez dans une expérience de purification ancestrale. Notre hammam vous enveloppe dans une vapeur douce et parfumée, ouvrant les pores pour éliminer les impuretés en profondeur.",
      deroulement: "1. Accueil et préparation (10 min)\n2. Séance hammam vapeur (30 min)\n3. Gommage doux au gant kessa (15 min)\n4. Rinçage et relaxation (5 min)",
      bienfaits: [
        "Élimination des toxines",
        "Peau purifiée et éclatante",
        "Détente musculaire profonde",
        "Amélioration de la circulation",
        "Préparation idéale aux soins",
      ],
      prix: 8000,
      duree: 60,
      categorie: "HAMMAM" as const,
      actif: true,
    },
    {
      nom: "Gommage Corps Luxe",
      slug: "gommage-corps-luxe",
      description: "Un rituel d'exfoliation luxueux qui révèle la peau douce et lumineuse qui sommeille en vous. Notre mélange exclusif d'huiles précieuses et de sucres naturels transforme votre peau en soie.",
      bienfaits: [
        "Exfoliation en profondeur",
        "Peau satinée et lumineuse",
        "Stimulation de la régénération",
        "Hydratation intense",
        "Relaxation totale",
      ],
      prix: 12000,
      duree: 45,
      categorie: "GOMMAGE" as const,
      actif: true,
    },
    {
      nom: "Soin Amincissant Expert",
      slug: "soin-amincissant-expert",
      description: "Notre protocole amincissant combine des techniques de pointe pour sculpter votre silhouette et retrouver confiance en votre corps.",
      bienfaits: [
        "Réduction des zones rebelles",
        "Drainage lymphatique",
        "Raffermissement de la peau",
        "Réduction de la cellulite",
        "Silhouette affinée",
      ],
      prix: 20000,
      duree: 90,
      categorie: "AMINCISSANT" as const,
      actif: true,
    },
    {
      nom: "Soin Visage Éclat",
      slug: "soin-visage-eclat",
      description: "Révélez l'éclat naturel de votre peau grâce à notre soin visage personnalisé. Adapté à tous les types de peau, ce soin combine nettoyage profond, hydratation et luminosité.",
      bienfaits: [
        "Nettoyage en profondeur",
        "Hydratation intense",
        "Éclat du teint retrouvé",
        "Réduction des imperfections",
        "Peau revitalisée",
      ],
      prix: 15000,
      duree: 60,
      categorie: "VISAGE" as const,
      actif: true,
    },
    {
      nom: "Programme Post-Accouchement",
      slug: "programme-post-accouchement",
      description: "Retrouvez votre vitalité après l'accouchement grâce à notre programme complet. Conçu par Marie Jeanne, ce programme accompagne les jeunes mamans dans leur renaissance physique et émotionnelle.",
      bienfaits: [
        "Récupération post-partum",
        "Raffermissement abdominal",
        "Réduction des tensions",
        "Moment de détente pour les mamans",
        "Reconnexion avec son corps",
      ],
      prix: 25000,
      duree: 90,
      categorie: "POST_ACCOUCHEMENT" as const,
      actif: true,
    },
    {
      nom: "Conseil Esthétique Personnalisé",
      slug: "conseil-esthetique",
      description: "Un accompagnement sur-mesure pour révéler votre beauté naturelle au quotidien. Marie Jeanne partage son expertise pour créer votre routine beauté idéale.",
      bienfaits: [
        "Diagnostic personnalisé",
        "Routine sur mesure",
        "Conseils d'experts",
        "Recommandations produits adaptées",
        "Suivi personnalisé",
      ],
      prix: 10000,
      duree: 45,
      categorie: "CONSEIL_ESTHETIQUE" as const,
      actif: true,
    },
  ]

  const soins = []
  for (const data of soinsData) {
    const soin = await prisma.soin.create({ data })
    soins.push(soin)
  }
  console.log("✅ 6 soins créés")

  // ─── Produits ──────────────────────────────────────────────
  await prisma.ligneCommande.deleteMany({})
  await prisma.commande.deleteMany({})
  await prisma.produit.deleteMany({})

  const produitsData = [
    { nom: "Savon Noir du Maroc", description: "Savon noir authentique pour gommage, riche en vitamine E.", prix: 3500, stock: 50, categorie: "Gommage" },
    { nom: "Huile d'Argan Bio", description: "Huile d'argan pure pressée à froid pour cheveux et peau.", prix: 8000, stock: 30, categorie: "Huiles" },
    { nom: "Beurre de Karité Brut", description: "Beurre de karité non raffiné du Burkina Faso, 100% naturel.", prix: 5000, stock: 45, categorie: "Soins corps" },
    { nom: "Gant de Crin", description: "Gant exfoliant traditionnel pour hammam et gommage.", prix: 2000, stock: 100, categorie: "Accessoires" },
    { nom: "Crème Hydratante Aloé Vera", description: "Crème hydratante légère à l'aloé vera pour tous types de peau.", prix: 6500, stock: 25, categorie: "Soins visage" },
    { nom: "Huile de Coco Vierge", description: "Huile de coco extra vierge pour cheveux, corps et cuisine.", prix: 4500, stock: 40, categorie: "Huiles" },
    { nom: "Masque à l'Argile Verte", description: "Masque purifiant à l'argile verte pour peau grasse et mixte.", prix: 3000, stock: 35, categorie: "Soins visage" },
    { nom: "Sérum Anti-Taches", description: "Sérum concentré aux acides de fruits pour estomper les taches.", prix: 12000, stock: 20, categorie: "Soins visage" },
    { nom: "Gel Douche Monoï", description: "Gel douche parfumé au monoï de Tahiti pour une peau satinée.", prix: 4000, stock: 60, categorie: "Soins corps" },
    { nom: "Coffret Bien-Être", description: "Coffret cadeau : savon noir, huile d'argan, beurre de karité et gant.", prix: 18000, stock: 15, categorie: "Coffrets" },
  ]

  for (const data of produitsData) {
    await prisma.produit.create({ data })
  }
  console.log("✅ 10 produits créés")

  // ─── Articles ──────────────────────────────────────────────
  await prisma.article.deleteMany({})

  const articlesData = [
    {
      titre: "5 bienfaits du hammam pour votre santé",
      slug: "bienfaits-hammam-sante",
      categorie: "Santé",
      tempsLecture: 4,
      contenu: `## Le hammam, un rituel ancestral

Le hammam est une pratique millénaire originaire du Moyen-Orient et d'Afrique du Nord. Bien plus qu'un simple bain de vapeur, il constitue un véritable rituel de purification du corps et de l'esprit.

## 1. Purification en profondeur

La vapeur chaude du hammam ouvre les pores de la peau, permettant l'élimination des impuretés, des toxines et des cellules mortes. C'est un nettoyage naturel en profondeur qui laisse la peau douce et éclatante.

## 2. Détoxification naturelle

La transpiration provoquée par la chaleur humide aide votre corps à se débarrasser des toxines accumulées. Ce processus naturel soutient le fonctionnement du foie et des reins dans leur rôle d'élimination.

## 3. Relaxation musculaire

La chaleur humide pénètre les muscles en profondeur, soulageant les tensions et les courbatures. C'est particulièrement bénéfique après une journée de travail ou une séance de sport.

## 4. Amélioration de la circulation

L'alternance chaud-froid stimule la circulation sanguine et lymphatique. Ce phénomène de vasodilatation puis vasoconstriction renforce le système cardiovasculaire et améliore l'oxygénation des tissus.

## 5. Bien-être mental

Le moment de calme et de sérénité que procure le hammam est un antidote naturel contre le stress. La chaleur favorise la production d'endorphines, ces hormones du bonheur qui procurent une sensation de bien-être durable.

---

*Chez Le Surnaturel de Dieu, notre Hammam Royal vous offre cette expérience ancestrale dans un cadre moderne et raffiné. Réservez votre séance dès aujourd'hui.*`,
      publie: true,
    },
    {
      titre: "Prendre soin de sa peau en saison sèche",
      slug: "soin-peau-saison-seche",
      categorie: "Beauté",
      tempsLecture: 3,
      contenu: `## La peau en saison sèche à Abidjan

Avec la chaleur et le vent harmattan, la saison sèche en Côte d'Ivoire met la peau à rude épreuve. L'air chaud et sec déshydrate l'épiderme, provoquant tiraillements, desquamation et teint terne.

## Hydratez de l'intérieur

Buvez au minimum 2 litres d'eau par jour. L'hydratation commence de l'intérieur : tisanes, eaux aromatisées aux fruits, jus frais sont vos alliés.

## Adoptez une routine adaptée

- **Matin** : nettoyant doux + sérum hydratant + crème protectrice
- **Soir** : démaquillage + huile nourrissante (argan, coco)
- **2 fois par semaine** : masque hydratant à l'aloé vera ou au beurre de karité

## Les bons gestes

Évitez les produits décapants contenant du savon classique. Préférez les nettoyants sans sulfate qui respectent le film protecteur de votre peau. Appliquez votre crème hydratante sur peau légèrement humide pour emprisonner l'hydratation.

## Le gommage, votre allié

Un gommage doux hebdomadaire élimine les cellules mortes et permet aux soins de mieux pénétrer. Notre Gommage Corps Luxe utilise des sucres naturels et des huiles précieuses pour nourrir tout en exfoliant.

---

*Venez découvrir nos soins hydratants au centre Le Surnaturel de Dieu. Votre peau vous remerciera.*`,
      publie: true,
    },
    {
      titre: "La remise en forme après accouchement",
      slug: "remise-forme-post-accouchement",
      categorie: "Maternité",
      tempsLecture: 5,
      contenu: `## Votre corps après l'accouchement

La maternité transforme le corps de façon extraordinaire. Après neuf mois de grossesse et l'épreuve de l'accouchement, il est naturel de vouloir retrouver sa forme et sa confiance.

## Quand commencer ?

Il est recommandé d'attendre la visite post-natale (6 à 8 semaines après l'accouchement) avant de reprendre une activité physique. Pour les soins corporels doux comme le massage, vous pouvez commencer dès les premières semaines.

## Le massage post-natal

Le massage post-accouchement est un allié précieux pour la récupération. Il aide à :
- Réduire les tensions musculaires accumulées
- Améliorer la circulation et réduire la rétention d'eau
- Favoriser la relaxation et combattre le baby blues
- Accompagner le retour de la tonicité abdominale

## L'importance de prendre du temps pour soi

Devenir maman ne signifie pas s'oublier. Prendre soin de soi est essentiel pour être une maman épanouie. Un moment de détente au hammam, un soin du visage, un massage — chaque geste compte.

## Notre programme dédié

Chez Le Surnaturel de Dieu, notre Programme Post-Accouchement est conçu par Marie Jeanne pour accompagner les jeunes mamans. En 90 minutes, nous combinons massage relaxant, soins raffermissants et moment de sérénité.

---

*Parce que chaque maman mérite de se sentir belle et bien dans son corps. Réservez votre séance.*`,
      publie: true,
    },
  ]

  for (const data of articlesData) {
    await prisma.article.create({ data })
  }
  console.log("✅ 3 articles créés")

  // ─── Rendez-vous ───────────────────────────────────────────
  const now = new Date()
  const rdvData = [
    { userId: client.id, soinId: soins[0].id, dateHeure: new Date(now.getTime() + 86400000), statut: "CONFIRME" as const },
    { userId: client.id, soinId: soins[1].id, dateHeure: new Date(now.getTime() + 172800000), statut: "EN_ATTENTE" as const },
    { userId: client.id, soinId: soins[3].id, dateHeure: new Date(now.getTime() - 86400000), statut: "TERMINE" as const },
    { userId: client.id, soinId: soins[4].id, dateHeure: new Date(now.getTime() + 259200000), statut: "EN_ATTENTE" as const },
    { userId: client.id, soinId: soins[5].id, dateHeure: new Date(now.getTime() - 172800000), statut: "ANNULE" as const },
  ]

  for (const data of rdvData) {
    await prisma.rendezVous.create({ data })
  }
  console.log("✅ 5 rendez-vous créés")

  // ─── Clientes fictives + Avis ──────────────────────────────
  const clientesData = [
    { email: "adjoua.kone@test.com", nom: "Koné", prenom: "Adjoua", ville: "Cocody" },
    { email: "fatou.diallo@test.com", nom: "Diallo", prenom: "Fatou", ville: "Plateau" },
    { email: "mariam.traore@test.com", nom: "Traoré", prenom: "Mariam", ville: "Yopougon" },
    { email: "awa.coulibaly@test.com", nom: "Coulibaly", prenom: "Awa", ville: "Marcory" },
    { email: "aminata.bamba@test.com", nom: "Bamba", prenom: "Aminata", ville: "Treichville" },
    { email: "marie.yao@test.com", nom: "Yao", prenom: "Marie-Claire", ville: "Riviera" },
    { email: "grace.kouame@test.com", nom: "Kouamé", prenom: "Grâce", ville: "Angré" },
    { email: "sarah.ouattara@test.com", nom: "Ouattara", prenom: "Sarah", ville: "Abobo" },
    { email: "rose.koffi@test.com", nom: "Koffi", prenom: "Rose", ville: "Bingerville" },
    { email: "celine.aka@test.com", nom: "Aka", prenom: "Céline", ville: "Cocody" },
    { email: "ruth.dje@test.com", nom: "Djé", prenom: "Ruth", ville: "Marcory" },
    { email: "laure.gnagne@test.com", nom: "Gnagné", prenom: "Laure", ville: "Plateau" },
  ]

  const clientes = []
  for (const c of clientesData) {
    const cl = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash: clientHash,
        nom: c.nom,
        prenom: c.prenom,
        role: "CLIENT",
        ville: c.ville,
      },
    })
    clientes.push(cl)
  }

  // Créer un RDV terminé + avis pour chaque cliente
  const avisTextes = [
    { note: 5, commentaire: "Depuis que je fais le hammam royal chez Le Surnaturel de Dieu, ma peau a complètement changé. L'accueil est chaleureux, le cadre est apaisant, et Marie Jeanne prend le temps de comprendre vos besoins. C'est mon rituel mensuel !" },
    { note: 5, commentaire: "J'ai découvert l'institut après mon deuxième accouchement, sur les conseils d'une amie. Le programme post-accouchement m'a vraiment aidée à retrouver confiance en moi. L'équipe est bienveillante et très professionnelle." },
    { note: 5, commentaire: "Le soin visage éclat est tout simplement extraordinaire ! Ma peau n'a jamais été aussi lumineuse. Je recommande vivement cet institut à toutes les femmes d'Abidjan qui veulent prendre soin d'elles." },
    { note: 5, commentaire: "Le gommage corps luxe est un vrai moment de bonheur. Ma peau est devenue incroyablement douce et soyeuse. Les produits utilisés sont naturels et sentent divinement bon. J'y retourne chaque mois !" },
    { note: 4, commentaire: "Très bon soin amincissant, j'ai vu des résultats dès la troisième séance. Le protocole est sérieux et bien expliqué. Juste un petit bémol sur le temps d'attente à l'accueil, mais sinon c'est top." },
    { note: 5, commentaire: "Marie Jeanne est une vraie professionnelle. Son conseil esthétique m'a permis de trouver la routine parfaite pour ma peau. Je ne jure plus que par ses recommandations. Merci infiniment !" },
    { note: 5, commentaire: "J'ai offert une carte cadeau hammam + gommage à ma mère pour la fête des mères. Elle est revenue transformée et rayonnante. Depuis, on y va ensemble une fois par mois. Un vrai rituel mère-fille !" },
    { note: 4, commentaire: "Le soin visage a fait des merveilles sur mon teint. En une seule séance, mes taches se sont atténuées. L'ambiance zen du centre aide vraiment à se détendre. Je recommande les yeux fermés." },
    { note: 5, commentaire: "Après 3 grossesses, je pensais ne jamais retrouver mon corps d'avant. Le programme post-accouchement m'a prouvé le contraire. En 6 séances, j'ai retrouvé ma confiance et mon énergie." },
    { note: 5, commentaire: "Le hammam suivi du gommage, c'est le combo parfait. Ma peau est purifiée, douce, et je me sens légère. Le cadre est propre et soigné. C'est vraiment un endroit où on se sent bien." },
    { note: 4, commentaire: "Très satisfaite du soin amincissant. Les résultats sont visibles et durables si on suit les conseils de l'équipe. Le seul petit moins : j'aimerais des créneaux en soirée, mais sinon rien à redire." },
    { note: 5, commentaire: "Le Surnaturel de Dieu porte bien son nom ! Chaque visite est une expérience divine. L'accueil, les soins, l'ambiance... tout est parfait. C'est devenu mon endroit préféré à Abidjan." },
  ]

  for (let i = 0; i < clientes.length; i++) {
    const soin = soins[i % soins.length]
    const daysAgo = (i + 1) * 5 // RDVs étalés dans le passé
    const rdv = await prisma.rendezVous.create({
      data: {
        userId: clientes[i].id,
        soinId: soin.id,
        dateHeure: new Date(now.getTime() - daysAgo * 86400000),
        statut: "TERMINE",
      },
    })
    await prisma.avis.create({
      data: {
        userId: clientes[i].id,
        rdvId: rdv.id,
        soinId: soin.id,
        note: avisTextes[i].note,
        commentaire: avisTextes[i].commentaire,
        publie: true,
        createdAt: new Date(now.getTime() - (daysAgo - 1) * 86400000),
      },
    })
  }
  console.log("✅ 12 clientes + 12 avis publiés créés")

  console.log("\n🎉 Seed terminé avec succès !")
  console.log("─────────────────────────────────────")
  console.log("Admin:      admin@surnatureldedieu.com / Admin@2025")
  console.log("Sage-femme: sagefemme@surnatureldedieu.com / SageFemme@2025")
  console.log("Client:     client@test.com / Client@2025")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
