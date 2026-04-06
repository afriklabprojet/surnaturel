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

  await prisma.user.upsert({
    where: { email: "admin@lesurnatureldedieu.com" },
    update: {},
    create: {
      email: "admin@lesurnatureldedieu.com",
      passwordHash: adminHash,
      nom: "Jeanne",
      prenom: "Marie",
      role: "ADMIN",
    },
  })

  await prisma.user.upsert({
    where: { email: "sagefemme@lesurnatureldedieu.com" },
    update: {},
    create: {
      email: "sagefemme@lesurnatureldedieu.com",
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
  await prisma.forfaitSoin.deleteMany({})
  await prisma.forfait.deleteMany({})
  await prisma.avis.deleteMany({})
  await prisma.favori.deleteMany({})
  await prisma.rendezVous.deleteMany({})
  await prisma.soin.deleteMany({})

  const soinsData = [
    {
      nom: "Prise en charge du Diabète",
      slug: "diabete",
      description: "Accompagnement et suivi personnalisé pour les patients diabétiques. Conseils nutritionnels, suivi glycémique et éducation thérapeutique.",
      descriptionLongue: "Notre programme de prise en charge du diabète offre un accompagnement complet et personnalisé. Nous proposons un suivi glycémique régulier, des conseils nutritionnels adaptés, une éducation thérapeutique pour mieux vivre au quotidien avec le diabète, ainsi qu'un soutien psychologique.",
      bienfaits: ["Suivi glycémique personnalisé", "Conseils nutritionnels adaptés", "Éducation thérapeutique", "Prévention des complications", "Amélioration de la qualité de vie", "Soutien psychologique"],
      etapes: [
        { titre: "Bilan initial", description: "Évaluation complète de votre état de santé, antécédents et habitudes de vie." },
        { titre: "Plan de suivi personnalisé", description: "Élaboration d'un programme adapté à votre profil et vos objectifs de santé." },
        { titre: "Conseils nutritionnels", description: "Recommandations alimentaires spécifiques pour le contrôle glycémique." },
        { titre: "Suivi régulier", description: "Consultations de suivi pour ajuster le traitement et évaluer les progrès." },
      ],
      prix: 15000, duree: 60, categorie: "PATHOLOGIE" as const, icon: "Activity", ordre: 1, actif: true,
    },
    {
      nom: "Prise en charge du Cholestérol",
      slug: "cholesterol",
      description: "Programme de suivi et de gestion du cholestérol. Bilan lipidique, conseils diététiques et accompagnement pour réduire les risques cardiovasculaires.",
      descriptionLongue: "Le cholestérol élevé est un facteur de risque majeur pour les maladies cardiovasculaires. Notre programme propose un bilan lipidique complet, des conseils diététiques personnalisés, un accompagnement pour adopter une hygiène de vie saine et un suivi régulier de vos marqueurs sanguins.",
      bienfaits: ["Bilan lipidique complet", "Conseils diététiques personnalisés", "Réduction des risques cardiovasculaires", "Suivi des marqueurs sanguins", "Accompagnement hygiène de vie", "Prévention des complications"],
      etapes: [
        { titre: "Bilan lipidique", description: "Analyse complète de votre profil lipidique et identification des facteurs de risque." },
        { titre: "Conseils alimentaires", description: "Plan alimentaire adapté pour réduire le mauvais cholestérol." },
        { titre: "Programme d'activité", description: "Recommandations d'activité physique adaptée à votre condition." },
        { titre: "Suivi et ajustement", description: "Contrôles réguliers et ajustement du programme selon les résultats." },
      ],
      prix: 15000, duree: 60, categorie: "PATHOLOGIE" as const, icon: "Heart", ordre: 2, actif: true,
    },
    {
      nom: "Prise en charge de la Drépanocytose",
      slug: "drepanocytose",
      description: "Accompagnement spécialisé pour les patients drépanocytaires. Gestion des crises, suivi médical et soutien au quotidien.",
      descriptionLongue: "La drépanocytose nécessite un suivi médical rigoureux et un accompagnement adapté. Notre programme propose une prise en charge globale : gestion et prévention des crises vaso-occlusives, suivi hématologique, conseils pour la vie quotidienne et éducation thérapeutique.",
      bienfaits: ["Gestion des crises vaso-occlusives", "Suivi hématologique régulier", "Prévention des complications", "Éducation thérapeutique", "Soutien psychologique", "Accompagnement familial"],
      etapes: [
        { titre: "Évaluation initiale", description: "Bilan complet de votre état de santé et historique des crises." },
        { titre: "Plan de prévention", description: "Mise en place de mesures préventives pour réduire la fréquence des crises." },
        { titre: "Éducation thérapeutique", description: "Apprentissage des signes d'alerte et des gestes à adopter au quotidien." },
        { titre: "Suivi régulier", description: "Consultations de suivi avec ajustement du programme de soins." },
      ],
      prix: 15000, duree: 60, categorie: "PATHOLOGIE" as const, icon: "Droplets", ordre: 3, actif: true,
    },
    {
      nom: "Prise en charge de l'Obésité",
      slug: "obesite",
      description: "Programme complet de gestion du poids. Bilan nutritionnel, accompagnement diététique et suivi pour une perte de poids durable et saine.",
      descriptionLongue: "L'obésité est une pathologie complexe qui nécessite une approche globale. Notre programme combine un bilan nutritionnel approfondi, un accompagnement diététique personnalisé, des recommandations d'activité physique adaptée et un soutien psychologique.",
      bienfaits: ["Bilan nutritionnel complet", "Programme alimentaire personnalisé", "Activité physique adaptée", "Perte de poids durable", "Soutien psychologique", "Prévention des comorbidités"],
      etapes: [
        { titre: "Bilan complet", description: "Évaluation de votre indice de masse corporelle, habitudes alimentaires et mode de vie." },
        { titre: "Programme nutritionnel", description: "Élaboration d'un plan alimentaire équilibré et adapté à vos goûts." },
        { titre: "Activité physique", description: "Programme d'exercices progressif et adapté à votre condition physique." },
        { titre: "Suivi et motivation", description: "Consultations régulières pour suivre les progrès et maintenir la motivation." },
      ],
      prix: 15000, duree: 60, categorie: "PATHOLOGIE" as const, icon: "Scale", ordre: 4, actif: true,
    },
    {
      nom: "Prise en charge de l'Insuffisance",
      slug: "insuffisance",
      description: "Accompagnement et suivi pour les patients souffrant d'insuffisance (rénale, cardiaque, respiratoire). Suivi médical et conseils adaptés.",
      descriptionLongue: "L'insuffisance organique demande un suivi médical attentif et un mode de vie adapté. Notre programme propose un bilan fonctionnel complet, un suivi régulier des marqueurs de santé, des conseils nutritionnels et d'hygiène de vie spécifiques.",
      bienfaits: ["Bilan fonctionnel complet", "Suivi des marqueurs de santé", "Conseils nutritionnels spécifiques", "Accompagnement quotidien", "Prévention de l'aggravation", "Soutien psychologique"],
      etapes: [
        { titre: "Bilan fonctionnel", description: "Évaluation de la fonction organique et identification du stade de l'insuffisance." },
        { titre: "Plan thérapeutique", description: "Mise en place d'un programme de suivi adapté à votre type d'insuffisance." },
        { titre: "Conseils de vie", description: "Recommandations alimentaires, hydratation et activité physique adaptées." },
        { titre: "Suivi rapproché", description: "Consultations régulières pour surveiller l'évolution et ajuster la prise en charge." },
      ],
      prix: 15000, duree: 60, categorie: "PATHOLOGIE" as const, icon: "Stethoscope", ordre: 5, actif: true,
    },
  ]

  const soins = []
  for (const data of soinsData) {
    const soin = await prisma.soin.create({ data })
    soins.push(soin)
  }
  console.log("✅ 5 soins (pathologies) créés")

  // ─── Produits ──────────────────────────────────────────────
  await prisma.ligneCommande.deleteMany({})
  await prisma.commande.deleteMany({})
  await prisma.produit.deleteMany({})

  const produitsData = [
    { nom: "Beurre de karité pur", description: "Beurre de karité 100% naturel, récolté artisanalement. Hydrate, nourrit et protège la peau en profondeur.", descriptionLongue: "Notre beurre de karité pur est issu d'une récolte artisanale en Côte d'Ivoire. Riche en vitamines A, D, E et F, il nourrit intensément la peau. Convient à toutes les peaux, y compris les plus sensibles.", prix: 5000, stock: 25, categorie: "Corps", imageUrl: "/images/produits/beurre-karite.jpg" },
    { nom: "Huile de coco vierge", description: "Huile de coco pressée à froid, multi-usage pour le corps et les cheveux.", descriptionLongue: "Huile de coco vierge pressée à froid, préservant toutes ses propriétés nutritives. Idéale comme soin capillaire, huile corporelle ou démaquillant naturel. Format 250ml.", prix: 8000, stock: 18, categorie: "Corps", imageUrl: "/images/produits/huile-coco.jpg" },
    { nom: "Savon noir africain", description: "Savon noir traditionnel à base de cendres végétales et de beurre de karité. Purifiant et exfoliant.", descriptionLongue: "Le savon noir africain est fabriqué selon une recette ancestrale à base de cendres de plantes locales et de beurre de karité. Il nettoie en profondeur, exfolie délicatement et aide à unifier le teint. Format 200g.", prix: 3500, stock: 40, categorie: "Corps", imageUrl: "/images/produits/savon-noir.jpg" },
    { nom: "Sérum éclat au curcuma", description: "Sérum visage à base de curcuma et vitamine C. Illumine le teint et réduit les taches pigmentaires.", descriptionLongue: "Ce sérum éclat combine les propriétés anti-oxydantes du curcuma et de la vitamine C pour un teint lumineux et unifié. Texture légère et non grasse. Format 30ml.", prix: 12000, stock: 3, categorie: "Visage", imageUrl: "/images/produits/serum-curcuma.jpg" },
    { nom: "Crème hydratante à l'aloe vera", description: "Crème visage à l'aloe vera bio. Hydrate, apaise et régénère la peau au quotidien.", descriptionLongue: "Notre crème hydratante combine le pouvoir apaisant de l'aloe vera bio avec des huiles végétales nourrissantes. Convient à tous les types de peau. Format 50ml.", prix: 9500, stock: 12, categorie: "Visage", imageUrl: "/images/produits/creme-aloe.jpg" },
    { nom: "Masque purifiant à l'argile", description: "Masque à l'argile verte et au charbon actif. Purifie les pores et matifie la peau.", descriptionLongue: "Ce masque purifiant associe l'argile verte au charbon actif qui capte les impuretés en profondeur. Appliqué 1 à 2 fois par semaine. Format 100ml.", prix: 7000, stock: 2, categorie: "Visage", imageUrl: "/images/produits/masque-argile.jpg" },
    { nom: "Infusion détox bien-être", description: "Mélange de plantes africaines : kinkeliba, bissap et gingembre. Favorise la digestion.", descriptionLongue: "Notre infusion détox est composée d'un mélange de kinkeliba, de fleurs de bissap et de gingembre frais séché. 20 sachets par boîte.", prix: 6500, stock: 30, categorie: "Bien-être & Santé", imageUrl: "/images/produits/infusion-detox.jpg" },
    { nom: "Huile essentielle de citronnelle", description: "Huile essentielle de citronnelle bio. Assainit l'air et favorise la relaxation.", descriptionLongue: "Huile essentielle de citronnelle 100% pure et bio, obtenue par distillation à la vapeur d'eau. Multi-usage. Format flacon 15ml.", prix: 4500, stock: 22, categorie: "Bien-être & Santé", imageUrl: "/images/produits/he-citronnelle.jpg" },
    { nom: "Kit post-accouchement naturel", description: "Coffret de soins naturels pour les jeunes mamans : beurre de karité, huile de massage et infusion.", descriptionLongue: "Ce kit a été spécialement conçu pour les jeunes mamans en période de post-partum. Tous les produits sont 100% naturels et sans danger pour l'allaitement.", prix: 18000, stock: 8, categorie: "Bien-être & Santé", imageUrl: "/images/produits/kit-post-accouchement.jpg" },
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
    {
      titre: "Le beurre de karité : trésor de beauté africain",
      slug: "beurre-karite-tresor-beaute-africain",
      categorie: "Beauté",
      tempsLecture: 4,
      contenu: `## Un ingrédient millénaire

Le beurre de karité est utilisé depuis des siècles en Afrique de l'Ouest pour ses vertus nourrissantes et protectrices. Issu des noix de l'arbre de karité (*Vitellaria paradoxa*), il est un pilier des rituels de beauté ivoiriens.

## Composition exceptionnelle

Riche en vitamines A, D, E et F, le beurre de karité contient des acides gras essentiels qui pénètrent la peau en profondeur. Ses propriétés anti-inflammatoires et antioxydantes en font un soin complet pour tout le corps.

## 5 utilisations au quotidien

1. **Hydratant corps** : appliquez une noisette sur la peau humide après la douche pour un effet nourrissant longue durée.
2. **Soin des mains** : massez vos mains avant le coucher pour réparer les peaux sèches et abîmées.
3. **Masque capillaire** : appliquez sur les longueurs et pointes, laissez poser 30 minutes avant le shampooing.
4. **Baume à lèvres** : une pointe de beurre de karité remplace tous les baumes du commerce.
5. **Anti-vergetures** : massez les zones concernées quotidiennement pendant la grossesse et après l'accouchement.

## Comment le choisir ?

Privilégiez toujours un beurre de karité pur, non raffiné, de couleur crème à jaune pâle. Il doit avoir une odeur caractéristique de noix. Les versions blanchies et désodorisées ont perdu une partie de leurs bienfaits.

---

*Découvrez notre Beurre de Karité Pur 100% artisanal dans notre boutique en ligne.*`,
      publie: true,
    },
    {
      titre: "Routine bien-être : 7 gestes pour commencer la journée",
      slug: "routine-bien-etre-7-gestes-matin",
      categorie: "Bien-être",
      tempsLecture: 3,
      contenu: `## Commencez chaque journée du bon pied

Une routine matinale bien pensée pose les bases d'une journée sereine et productive. Voici 7 gestes simples à intégrer dans votre quotidien.

## 1. Buvez un verre d'eau tiède au réveil

Avant le café, hydratez votre corps qui vient de passer 7 à 8 heures sans eau. Ajoutez-y un filet de citron pour stimuler la digestion.

## 2. Étirez-vous 5 minutes

Des étirements légers réveillent vos muscles et stimulent la circulation sanguine. Concentrez-vous sur le dos, les épaules et les jambes.

## 3. Respirez profondément

3 grandes inspirations par le nez, 3 expirations par la bouche. Ce simple exercice oxygène le cerveau et réduit le cortisol (hormone du stress).

## 4. Nettoyez votre visage à l'eau fraîche

Un nettoyant doux suivi d'eau fraîche resserre les pores et donne un teint frais. Appliquez ensuite votre sérum et crème hydratante.

## 5. Prenez un petit-déjeuner équilibré

Fruits frais, céréales complètes, protéines. Un bon petit-déjeuner régule votre glycémie et votre énergie pour la matinée entière.

## 6. Offrez-vous un auto-massage du visage

2 minutes de mouvements circulaires du menton vers les tempes. Cela stimule la microcirculation et prévient les rides.

## 7. Posez une intention positive

Avant de quitter la maison, choisissez un mot ou une phrase qui guidera votre journée : « calme », « présence », « gratitude ».

---

*Au Surnaturel de Dieu, nous croyons que le bien-être commence par de petits gestes quotidiens. Venez découvrir nos soins pour compléter votre routine.*`,
      publie: true,
    },
  ]

  for (const data of articlesData) {
    await prisma.article.create({ data })
  }
  console.log("✅ 5 articles créés")

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

  // ─── Forfaits ──────────────────────────────────────────────
  await prisma.forfaitSoin.deleteMany({})
  await prisma.forfait.deleteMany({})

  const soinsBySlug = Object.fromEntries(soins.map(s => [s.slug, s]))

  const forfaitsData = [
    { slug: "rituel-purete", nom: "Rituel Pureté", description: "L'alliance parfaite du hammam et du gommage pour une peau entièrement renouvelée.", prixTotal: 20000, prixForfait: 17000, economie: 3000, badge: "Le + populaire", ordre: 1, soinSlugs: ["hammam-royal", "gommage-corps-luxe"] },
    { slug: "parcours-eclat-total", nom: "Parcours Éclat Total", description: "Du visage au corps, retrouvez une peau éclatante et lumineuse de la tête aux pieds.", prixTotal: 35000, prixForfait: 29000, economie: 6000, ordre: 2, soinSlugs: ["gommage-visage-eclat", "soin-visage-eclat", "gommage-corps-luxe"] },
    { slug: "renaissance-maman", nom: "Renaissance Maman", description: "Un programme complet pour les jeunes mamans : accompagnement sage-femme et programme post-accouchement.", prixTotal: 40000, prixForfait: 34000, economie: 6000, badge: "Idéal mamans", ordre: 3, soinSlugs: ["consultation-sage-femme", "programme-post-accouchement"] },
  ]

  for (const { soinSlugs, ...data } of forfaitsData) {
    const forfait = await prisma.forfait.create({ data })
    for (const slug of soinSlugs) {
      if (soinsBySlug[slug]) {
        await prisma.forfaitSoin.create({ data: { forfaitId: forfait.id, soinId: soinsBySlug[slug].id } })
      }
    }
  }
  console.log("✅ 3 forfaits créés")

  // ─── Équipe ────────────────────────────────────────────────
  await prisma.membreEquipe.deleteMany({})

  const equipeData = [
    { nom: "Marie Jeanne", role: "Fondatrice & Directrice", description: "Passionnée par le bien-être holistique, Marie Jeanne a fondé Le Surnaturel de Dieu avec la vision d'offrir des soins d'exception accessibles à toutes.", ordre: 1 },
    { nom: "Ama Kouassi", role: "Sage-femme diplômée d'État", description: "Forte de plus de 18 ans d'expérience, Ama accompagne les femmes à chaque étape de leur vie avec professionnalisme et bienveillance.", ordre: 2 },
    { nom: "Awa Diallo", role: "Esthéticienne spécialisée", description: "Experte en soins du corps et du visage, Awa maîtrise les techniques traditionnelles et modernes pour sublimer chaque cliente.", ordre: 3 },
    { nom: "Fatou Bamba", role: "Accompagnatrice médicale", description: "Formée en accompagnement médical, elle apporte un suivi personnalisé et confidentiel aux clientes ayant des besoins spécifiques.", ordre: 4 },
  ]

  for (const data of equipeData) {
    await prisma.membreEquipe.create({ data })
  }
  console.log("✅ 4 membres d'équipe créés")

  // ─── FAQ ───────────────────────────────────────────────────
  await prisma.faq.deleteMany({})

  const faqData = [
    { question: "Comment se déroule un premier rendez-vous ?", reponse: "Lors de votre premier rendez-vous, nous prenons le temps d'un échange approfondi pour comprendre vos besoins. Un diagnostic de peau est réalisé, puis nous vous proposons le soin le mieux adapté. Prévoyez 10 minutes supplémentaires pour cet accueil.", categorie: "soins", ordre: 1 },
    { question: "Puis-je offrir un soin en cadeau ?", reponse: "Absolument ! Chaque soin peut être offert sous forme de carte cadeau. Cliquez sur « Offrir ce soin » sur la page du soin de votre choix. La carte cadeau est envoyée par email au destinataire avec un message personnalisé.", categorie: "soins", ordre: 2 },
    { question: "Quels sont les modes de paiement acceptés ?", reponse: "Nous acceptons les paiements par mobile money (Orange Money, MTN Money) via Jeko Africa, ainsi que le paiement sur place. Le paiement en ligne est sécurisé et un reçu vous est envoyé par email.", categorie: "soins", ordre: 3 },
    { question: "Est-ce que les soins conviennent aux femmes enceintes ?", reponse: "Certains soins sont adaptés aux femmes enceintes, comme la consultation sage-femme et le conseil esthétique. Pour les autres soins, nous adaptons nos protocoles selon le stade de la grossesse.", categorie: "soins", ordre: 4 },
    { question: "Combien de séances faut-il pour voir des résultats ?", reponse: "Les résultats varient selon le type de soin. Un hammam ou gommage offre des résultats immédiats. Pour les soins amincissants, nous recommandons un programme de 5 à 8 séances.", categorie: "soins", ordre: 5 },
    { question: "Quelle est votre politique d'annulation ?", reponse: "Vous pouvez annuler ou reporter votre rendez-vous sans frais jusqu'à 24h avant. Au-delà, des frais d'annulation de 50% peuvent s'appliquer.", categorie: "soins", ordre: 6 },
    { question: "À partir de quand dois-je consulter une sage-femme ?", reponse: "Idéalement dès le début de votre grossesse, à partir de 6-8 semaines d'aménorrhée. Un suivi précoce permet d'assurer le bon déroulement de votre grossesse.", categorie: "sage-femme", ordre: 1 },
    { question: "La consultation sage-femme est-elle confidentielle ?", reponse: "Absolument. Toutes les informations partagées lors de la consultation sont protégées par le secret médical et chiffrées dans notre système.", categorie: "sage-femme", ordre: 2 },
    { question: "Proposez-vous un suivi post-partum ?", reponse: "Oui, notre sage-femme Ama Kouassi propose un suivi post-partum complet : rééducation périnéale, conseils d'allaitement, et accompagnement émotionnel.", categorie: "sage-femme", ordre: 3 },
    { question: "Peut-on venir avec son bébé ?", reponse: "Bien sûr ! Nos locaux sont adaptés pour accueillir les jeunes mamans avec leurs bébés. Un espace change et allaitement est mis à votre disposition.", categorie: "sage-femme", ordre: 4 },
    { question: "La sage-femme se déplace-t-elle à domicile ?", reponse: "Pour certains soins post-nataux, des visites à domicile peuvent être organisées. Contactez-nous pour en discuter et vérifier la disponibilité.", categorie: "sage-femme", ordre: 5 },
    // Abonnements
    { question: "Comment fonctionne l'abonnement ?", reponse: "Chaque mois, vous bénéficiez d'un nombre de soins inclus dans votre formule. Prenez rendez-vous comme d'habitude, vos soins seront automatiquement déduits de votre quota mensuel.", categorie: "abonnements", ordre: 1 },
    { question: "Puis-je changer de formule ?", reponse: "Oui, vous pouvez changer de formule à tout moment. Le changement prendra effet à partir du mois suivant.", categorie: "abonnements", ordre: 2 },
    { question: "Que se passe-t-il si je n'utilise pas tous mes soins ?", reponse: "Les soins non utilisés ne sont pas reportés au mois suivant. Nous vous encourageons à profiter pleinement de votre abonnement !", categorie: "abonnements", ordre: 3 },
    { question: "Comment annuler mon abonnement ?", reponse: "Vous pouvez annuler votre abonnement à tout moment depuis cette page. L'annulation prendra effet immédiatement et vous ne serez plus prélevé(e).", categorie: "abonnements", ordre: 4 },
  ]

  for (const data of faqData) {
    await prisma.faq.create({ data })
  }
  console.log("✅ 11 FAQ créées")

  // ─── Configuration ─────────────────────────────────────────
  await prisma.appConfig.deleteMany({})

  const configData = [
    { cle: "methodes_paiement", valeur: JSON.stringify([
      { id: "wave", label: "Wave", color: "#1A9BF4" },
      { id: "orange", label: "Orange Money", color: "#FF6600" },
      { id: "mtn", label: "MTN MoMo", color: "#FFC000" },
      { id: "moov", label: "Moov Money", color: "#0066CC" },
      { id: "djamo", label: "Djamo", color: "#6C47FF" },
    ]) },
    { cle: "categories_produit", valeur: JSON.stringify([
      { value: "all", label: "Tous les produits" },
      { value: "Phytothérapie", label: "🌿 Phytothérapie" },
      { value: "Soins & Beauté", label: "💆‍♀️ Soins & Beauté" },
      { value: "Bien-être", label: "🌱 Bien-être" },
    ]) },
    { cle: "valeurs", valeur: JSON.stringify([
      { icon: "Heart", titre: "Bienveillance", description: "Chaque cliente est accueillie avec chaleur et respect. Nous croyons que le bien-être commence par une écoute attentive." },
      { icon: "Lock", titre: "Confidentialité", description: "Vos données personnelles et médicales sont protégées par un chiffrement de niveau bancaire. Votre intimité est notre priorité." },
      { icon: "Award", titre: "Excellence", description: "Nous utilisons des produits naturels de qualité et des techniques éprouvées. Nos professionnelles sont formées aux standards les plus exigeants." },
      { icon: "Users", titre: "Inclusivité", description: "Notre centre est ouvert à toutes, sans distinction. Nous adaptons nos soins aux besoins spécifiques de chaque femme." },
    ]) },
    { cle: "avantages", valeur: JSON.stringify([
      { icon: "Shield", titre: "Produits naturels certifiés", description: "Nous utilisons exclusivement des produits naturels et certifiés, respectueux de votre peau et de l'environnement." },
      { icon: "Award", titre: "Expertise reconnue", description: "Marie Jeanne et son équipe cumulent plus de 18 ans d'expérience dans les soins esthétiques et le bien-être." },
      { icon: "Clock", titre: "Horaires flexibles", description: "Du lundi au samedi, avec des créneaux en soirée pour s'adapter à votre emploi du temps chargé." },
      { icon: "Users", titre: "Approche personnalisée", description: "Chaque soin est adapté à vos besoins spécifiques. Aucun protocole générique, que du sur-mesure." },
      { icon: "Star", titre: "Programme fidélité", description: "Cumulez des points à chaque visite et bénéficiez de soins gratuits grâce à notre programme de fidélité." },
      { icon: "Heart", titre: "Cadre luxueux & apaisant", description: "Un institut pensé comme un cocon de sérénité, où chaque détail est conçu pour votre confort." },
    ]) },
    { cle: "specialites_sage_femme", valeur: JSON.stringify([
      "Consultations prénatales",
      "Consultations postnatales",
      "Suivi de grossesse",
      "Conseils en allaitement",
      "Planification familiale",
      "Éducation à la santé féminine",
      "Consultations personnalisées",
    ]) },
    { cle: "prestations_sage_femme", valeur: JSON.stringify([
      { icon: "Baby", titre: "Consultations prénatales", description: "Suivi de la grossesse, conseils et accompagnement avant l'accouchement.", prix: 15000, duree: 45 },
      { icon: "Heart", titre: "Consultations postnatales", description: "Suivi après l'accouchement pour la maman et le bébé.", prix: 15000, duree: 45 },
      { icon: "Stethoscope", titre: "Suivi de grossesse", description: "Contrôle de l'évolution de la grossesse et surveillance de la santé de la mère et de l'enfant.", prix: 15000, duree: 45 },
      { icon: "Shield", titre: "Conseils en allaitement", description: "Accompagnement et aide pour un allaitement réussi.", prix: 10000, duree: 30 },
      { icon: "Users", titre: "Planification familiale", description: "Conseils sur les méthodes de contraception et le bien-être reproductif.", prix: 10000, duree: 30 },
      { icon: "BookOpen", titre: "Éducation à la santé féminine", description: "Informations et sensibilisation sur la santé de la femme.", prix: 10000, duree: 30 },
      { icon: "HeartHandshake", titre: "Consultations personnalisées", description: "Écoute, orientation et accompagnement selon les besoins spécifiques de chaque patiente.", prix: 10000, duree: 30 },
    ]) },
    { cle: "bandeau_promo", valeur: JSON.stringify({
      actif: true,
      texte: "−10% sur votre 1er soin",
      code: "BIENVENUE10",
      detail: "Offre valable sur tous les soins",
    }) },
    { cle: "telephone_contact", valeur: JSON.stringify("+225 05 75 97 51 22") },
    { cle: "whatsapp_contact", valeur: JSON.stringify("+225 07 79 19 04 61") },
    { cle: "whatsapp_number", valeur: JSON.stringify("2250779190461") },
    { cle: "whatsapp_message", valeur: JSON.stringify("Bonjour, j'aimerais avoir des informations sur vos soins et services.") },
    { cle: "adresse_institut", valeur: JSON.stringify("Cocody, Riviera Palmeraie") },
    { cle: "nom_centre", valeur: JSON.stringify("Le Surnaturel de Dieu") },
    { cle: "fondatrice", valeur: JSON.stringify("Marie Jeanne") },
    { cle: "annee_fondation", valeur: JSON.stringify(2015) },
    { cle: "email_contact", valeur: JSON.stringify("infos@lesurnatureldedieu.com") },
    { cle: "email_rdv", valeur: JSON.stringify("infos@lesurnatureldedieu.com") },
    { cle: "horaires", valeur: JSON.stringify("Lun — Ven : 08h00 — 18h00\nSam : 09h00 — 16h00\nDim : Fermé") },
    { cle: "facebook_url", valeur: JSON.stringify("https://www.facebook.com/surnatureldedieu") },
    { cle: "instagram_url", valeur: JSON.stringify("https://www.instagram.com/surnatureldedieu") },
    { cle: "bio_sage_femme", valeur: JSON.stringify({
      nom: "Ama Kouassi",
      titre: "Sage-femme diplômée d'État",
      experience: "18 ans",
      paragraphes: [
        "Avec plus de 18 ans d'expérience dans l'accompagnement des femmes, Ama Kouassi est la sage-femme de confiance du Surnaturel de Dieu. Diplômée d'État, elle met son expertise au service du bien-être maternel avec douceur et professionnalisme.",
        "Nous proposons un accompagnement complet pour les femmes à chaque étape de leur vie : consultations prénatales et postnatales, suivi de grossesse, conseils en allaitement, planification familiale et éducation à la santé féminine.",
        "Notre objectif est d'offrir un suivi de qualité, rassurant et adapté à chaque femme, dans un cadre humain et bienveillant.",
      ],
    }) },
    { cle: "categories_soins", valeur: JSON.stringify([
      { label: "Tous", value: "TOUS" },
      { label: "Hammam", value: "HAMMAM" },
      { label: "Gommage", value: "GOMMAGE" },
      { label: "Amincissant", value: "AMINCISSANT" },
      { label: "Visage", value: "VISAGE" },
      { label: "Post-accouchement", value: "POST_ACCOUCHEMENT" },
      { label: "Sage-femme", value: "SAGE_FEMME" },
      { label: "Conseil", value: "CONSEIL_ESTHETIQUE" },
    ]) },
    { cle: "hero_soins_icones", valeur: JSON.stringify([
      { emoji: "🧖", label: "Hammam" },
      { emoji: "✨", label: "Gommage" },
      { emoji: "💆", label: "Visage" },
    ]) },
    { cle: "categories_faq", valeur: JSON.stringify([
      { label: "Soins", value: "soins" },
      { label: "Sage-femme", value: "sage-femme" },
      { label: "Général", value: "general" },
      { label: "Boutique", value: "boutique" },
      { label: "Rendez-vous", value: "rdv" },
      { label: "Abonnements", value: "abonnements" },
    ]) },
    // ── Homepage & À propos content ──────────────────────────────
    { cle: "homepage_hero", valeur: JSON.stringify({
      tag: "Institut de bien-être",
      titre: "Votre bien-être est notre vocation",
      sousTitre: "Depuis 2015, Marie Jeanne accueille les femmes d'Abidjan dans un espace de sérénité unique, dédié à la beauté naturelle et au bien-être holistique.",
      cta1: "Découvrir nos soins",
      cta2: "Prendre rendez-vous",
      badge: "Depuis 2015 à Abidjan",
    }) },
    { cle: "homepage_services", valeur: JSON.stringify({
      tag: "Nos soins",
      titre: "Soins & Services",
      sousTitre: "Des soins sur mesure pour votre beauté, votre santé et votre sérénité",
    }) },
    { cle: "homepage_chiffres", valeur: JSON.stringify({
      label1: "Clientes satisfaites",
      label2: "Soins disponibles",
      label3: "D'expérience",
    }) },
    { cle: "homepage_temoignages", valeur: JSON.stringify({
      tag: "Témoignages",
      titre: "Ce que disent nos clientes",
    }) },
    { cle: "homepage_videos", valeur: JSON.stringify({
      tag: "Témoignages vidéo",
      titre: "Elles partagent leur expérience",
      sousTitre: "Découvrez les témoignages authentiques de nos clientes satisfaites",
    }) },
    { cle: "homepage_cta", valeur: JSON.stringify({
      titre: "Prête à prendre soin de vous ?",
      sousTitre: "Réservez votre créneau en quelques clics et offrez-vous un moment de bien-être sur mesure.",
      bouton: "Réserver maintenant",
    }) },
    { cle: "bio_fondatrice", valeur: JSON.stringify({
      nom: "Marie Jeanne",
      tag: "Fondatrice",
      paragraphes: [
        "C'est en 2015 que Marie Jeanne a donné vie au Surnaturel de Dieu, au cœur d'Abidjan. Formée entre la France et la Côte d'Ivoire, elle a acquis une double expertise en esthétique et en bien-être holistique, qu'elle met aujourd'hui au service des femmes ivoiriennes.",
        "Sa conviction : chaque femme mérite un espace où elle peut se ressourcer, prendre soin de sa santé et révéler sa beauté naturelle, dans un cadre bienveillant et professionnel. De la cabine de hammam traditionnel à la consultation sage-femme, en passant par les soins esthétiques et la boutique de produits naturels, l'institut propose une approche complète du bien-être féminin.",
        "Entourée d'une équipe de professionnelles passionnées, Marie Jeanne continue de faire évoluer l'institut pour offrir des soins d'exception accessibles à toutes les femmes d'Abidjan, parce que prendre soin de soi n'est pas un luxe, c'est une nécessité.",
      ],
    }) },
  ]

  for (const data of configData) {
    await prisma.appConfig.create({ data })
  }
  console.log("✅ Configuration créée (15 fonctionnelle + 10 métier)")

  console.log("\n🎉 Seed terminé avec succès !")
  console.log("─────────────────────────────────────")
  console.log("Admin:      admin@lesurnatureldedieu.com / Admin@2025")
  console.log("Sage-femme: sagefemme@lesurnatureldedieu.com / SageFemme@2025")
  console.log("Client:     client@test.com / Client@2025")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
