// ── Seed produits — Insère les produits dans la base de données ─
// Usage: npx tsx prisma/seed-produits.ts

import { config } from "dotenv"
config({ path: ".env.local" })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

const PRODUITS = [
  // ═══════════════════════════════════════════════════════════════════
  // PHYTOTHÉRAPIE - Solutions naturelles à base de plantes
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "Traitement naturel Diabète",
    description: "Formule à base de plantes médicinales africaines pour accompagner la régulation de la glycémie.",
    descriptionLongue: "Ce traitement phytothérapeutique associe des plantes médicinales reconnues pour leur action sur la glycémie : feuilles de corossol, gymnema sylvestre, fenugrec et moringa. Il accompagne une alimentation équilibrée et un suivi médical régulier. Les principes actifs naturels aident à maintenir un taux de sucre sanguin stable. Cure de 30 jours recommandée. Ne remplace pas un traitement médical prescrit. Consultez votre médecin avant utilisation.",
    prix: 25000,
    stock: 15,
    imageUrl: "/images/produits/phyto-diabete.jpg",
    categorie: "Phytothérapie",
  },
  {
    nom: "Traitement naturel Cholestérol",
    description: "Complexe de plantes pour favoriser l'équilibre lipidique et la santé cardiovasculaire.",
    descriptionLongue: "Cette formule naturelle combine l'ail noir fermenté, l'artichaut, le guggul et les graines de lin pour soutenir un taux de cholestérol équilibré. Ces plantes traditionnelles favorisent l'élimination des graisses et protègent le système cardiovasculaire. Complément idéal d'une hygiène de vie saine. Cure de 2 à 3 mois conseillée. À prendre avec un grand verre d'eau avant les repas.",
    prix: 22000,
    stock: 20,
    imageUrl: "/images/produits/phyto-cholesterol.jpg",
    categorie: "Phytothérapie",
  },
  {
    nom: "Traitement naturel Obésité",
    description: "Programme minceur à base de plantes brûle-graisses et drainantes pour accompagner la perte de poids.",
    descriptionLongue: "Ce programme phytothérapeutique réunit des plantes aux vertus amincissantes : thé vert, guarana, queue de cerise, orthosiphon et konjac. Ces extraits naturels favorisent la combustion des graisses, drainent les toxines et procurent un effet coupe-faim naturel. À associer à une alimentation équilibrée et une activité physique régulière. Programme de 60 jours pour des résultats visibles et durables.",
    prix: 28000,
    stock: 12,
    imageUrl: "/images/produits/phyto-obesite.jpg",
    categorie: "Phytothérapie",
  },
  {
    nom: "Traitement naturel Drépanocytose",
    description: "Formule traditionnelle africaine pour accompagner les personnes atteintes de drépanocytose.",
    descriptionLongue: "Cette préparation ancestrale combine les vertus du fadogia agrestis, des feuilles de papaye, du moringa et de la racine de gingembre. Ces plantes, utilisées depuis des générations en médecine traditionnelle africaine, soutiennent le bien-être général des personnes drépanocytaires. Aide à réduire la fréquence des crises et améliore la vitalité. Traitement complémentaire qui ne remplace pas le suivi médical. Consultez votre hématologue.",
    prix: 35000,
    stock: 10,
    imageUrl: "/images/produits/phyto-drepanocytose.jpg",
    categorie: "Phytothérapie",
  },
  {
    nom: "Traitement naturel Hypertension",
    description: "Complexe de plantes hypotensives pour soutenir une tension artérielle équilibrée.",
    descriptionLongue: "Cette formule associe l'aubépine, l'olivier, l'ail et l'hibiscus (bissap), plantes reconnues pour leurs propriétés régulatrices de la tension. Ces actifs naturels favorisent la dilatation des vaisseaux sanguins et une circulation saine. Complément d'une hygiène de vie adaptée : alimentation peu salée, activité physique, gestion du stress. Cure de 2 à 3 mois. Ne pas interrompre un traitement médical sans avis.",
    prix: 20000,
    stock: 18,
    imageUrl: "/images/produits/phyto-hypertension.jpg",
    categorie: "Phytothérapie",
  },
  {
    nom: "Traitement naturel Fertilité Femme",
    description: "Formule traditionnelle pour favoriser la fertilité féminine et l'équilibre hormonal.",
    descriptionLongue: "Cette préparation allie le gattilier, le trèfle rouge, la maca et le gingembre pour soutenir la fertilité féminine naturellement. Ces plantes favorisent l'équilibre hormonal, régulent le cycle menstruel et préparent le corps à la conception. Cure de 3 mois recommandée en période de désir d'enfant. À éviter pendant la grossesse et l'allaitement. Consultez votre gynécologue pour un suivi adapté.",
    prix: 30000,
    stock: 8,
    imageUrl: "/images/produits/phyto-fertilite-femme.jpg",
    categorie: "Phytothérapie",
  },
  {
    nom: "Traitement naturel Fertilité Homme",
    description: "Complexe de plantes pour améliorer la vitalité masculine et la qualité du sperme.",
    descriptionLongue: "Cette formule masculine combine le tribulus, la maca, le zinc naturel et le ginseng pour soutenir la fertilité de l'homme. Ces actifs naturels améliorent la qualité et la mobilité des spermatozoïdes, stimulent la libido et renforcent la vitalité générale. Cure de 3 mois conseillée. Complément d'un mode de vie sain : pas de tabac, alimentation équilibrée, activité physique.",
    prix: 30000,
    stock: 10,
    imageUrl: "/images/produits/phyto-fertilite-homme.jpg",
    categorie: "Phytothérapie",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SOINS & BEAUTÉ - Peau (visage et corps), cheveux, huiles
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "Beurre de karité pur",
    description: "Beurre de karité 100% naturel, récolté artisanalement. Hydrate, nourrit et protège la peau.",
    descriptionLongue: "Notre beurre de karité pur est issu d'une récolte artisanale en Côte d'Ivoire. Riche en vitamines A, D, E et F, il nourrit intensément la peau, répare les zones sèches et protège contre les agressions extérieures. Convient à toutes les peaux, y compris les plus sensibles. Utilisez-le sur le corps, les mains, les pieds ou les cheveux. Texture onctueuse qui pénètre sans effet gras. Format 200g.",
    prix: 5000,
    stock: 30,
    imageUrl: "/images/produits/beurre-karite.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Huile de coco vierge",
    description: "Huile de coco pressée à froid, multi-usage pour le corps et les cheveux.",
    descriptionLongue: "Huile de coco vierge pressée à froid, préservant toutes ses propriétés nutritives. Idéale comme soin capillaire, huile corporelle ou démaquillant naturel. Ses acides gras nourrissent la peau et les cheveux en profondeur. Peut aussi être utilisée pour les massages ou en cuisine. Texture légère qui fond au contact de la peau. Format 250ml.",
    prix: 8000,
    stock: 25,
    imageUrl: "/images/produits/huile-coco.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Huile de ricin fortifiante",
    description: "Huile de ricin pure pour fortifier cheveux, cils et ongles. Stimule la pousse.",
    descriptionLongue: "L'huile de ricin est reconnue pour ses vertus fortifiantes et stimulantes de la pousse. Appliquez-la sur le cuir chevelu pour des cheveux plus forts et plus épais, sur les cils et sourcils pour les densifier, ou sur les ongles cassants pour les renforcer. Riche en acide ricinoléique, elle nourrit en profondeur. Application 2 à 3 fois par semaine. Format 100ml avec applicateur.",
    prix: 6000,
    stock: 20,
    imageUrl: "/images/produits/huile-ricin.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Huile d'argan bio",
    description: "Huile d'argan pure du Maroc. Soin précieux anti-âge pour le visage et les cheveux.",
    descriptionLongue: "Notre huile d'argan bio est pressée à froid au Maroc selon les méthodes traditionnelles berbères. Trésor de beauté riche en vitamine E et omégas, elle combat les signes du vieillissement, nourrit les peaux sèches et redonne brillance aux cheveux. Quelques gouttes suffisent pour le visage ou les pointes des cheveux. Format 50ml.",
    prix: 12000,
    stock: 15,
    imageUrl: "/images/produits/huile-argan.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Savon noir africain",
    description: "Savon noir traditionnel à base de cendres végétales et beurre de karité. Purifiant et exfoliant.",
    descriptionLongue: "Le savon noir africain est fabriqué selon une recette ancestrale à base de cendres de plantes locales et de beurre de karité. Il nettoie en profondeur, exfolie délicatement et aide à unifier le teint. Recommandé pour les peaux mixtes à grasses, il régule l'excès de sébum tout en préservant l'hydratation naturelle. Pour le visage et le corps. Format 200g.",
    prix: 3500,
    stock: 40,
    imageUrl: "/images/produits/savon-noir.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Crème éclaircissante naturelle",
    description: "Crème unificatrice au curcuma et vitamine C. Illumine le teint sans danger.",
    descriptionLongue: "Cette crème éclaircissante 100% naturelle combine le curcuma, la vitamine C, l'acide kojique naturel et l'extrait de réglisse pour unifier le teint progressivement. Elle atténue les taches pigmentaires, l'hyperpigmentation et les marques d'acné. Sans hydroquinone ni produits chimiques nocifs. Résultats visibles en 4 à 6 semaines. Application matin et soir. Format 100ml.",
    prix: 15000,
    stock: 12,
    imageUrl: "/images/produits/creme-eclaircissante.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Lotion corporelle au moringa",
    description: "Lotion hydratante au moringa et karité. Nourrit et adoucit la peau au quotidien.",
    descriptionLongue: "Cette lotion corporelle onctueuse associe l'huile de moringa, le beurre de karité et l'aloe vera pour une hydratation intense et durable. Elle nourrit les peaux sèches, apaise les tiraillements et laisse un voile soyeux non gras. Son parfum délicat procure une sensation de fraîcheur. Application quotidienne après la douche. Format 300ml.",
    prix: 8500,
    stock: 22,
    imageUrl: "/images/produits/lotion-moringa.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Sérum visage anti-taches",
    description: "Sérum concentré aux AHA naturels pour atténuer les taches et unifier le teint.",
    descriptionLongue: "Ce sérum haute performance combine les AHA naturels (acide citrique, acide lactique), la vitamine C stabilisée et le niacinamide pour cibler efficacement les taches pigmentaires. Il accélère le renouvellement cellulaire, éclaircit progressivement les marques et révèle un teint lumineux et uniforme. Application le soir sur peau propre, suivie d'une crème hydratante. Format 30ml.",
    prix: 18000,
    stock: 10,
    imageUrl: "/images/produits/serum-anti-taches.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Masque capillaire protéiné",
    description: "Masque nourrissant à la kératine végétale pour cheveux abîmés et cassants.",
    descriptionLongue: "Ce masque réparateur est enrichi en kératine végétale, huile d'avocat et protéines de soie pour reconstruire la fibre capillaire. Il redonne force, brillance et souplesse aux cheveux abîmés par les défrisages, colorations ou la chaleur. Appliquer sur cheveux lavés, laisser poser 15 à 30 minutes sous une serviette chaude, puis rincer. Usage hebdomadaire. Format 250ml.",
    prix: 10000,
    stock: 15,
    imageUrl: "/images/produits/masque-capillaire.jpg",
    categorie: "Soins & Beauté",
  },
  {
    nom: "Huile de croissance capillaire",
    description: "Complexe d'huiles végétales pour stimuler la pousse et fortifier les cheveux.",
    descriptionLongue: "Cette huile de croissance réunit l'huile de ricin, l'huile de moutarde, l'huile de coco et des huiles essentielles de romarin et menthe poivrée. Elle stimule la microcirculation du cuir chevelu, fortifie les racines et accélère la pousse des cheveux. Masser le cuir chevelu 2 à 3 fois par semaine, laisser poser au moins 1 heure avant le shampoing. Format 100ml.",
    prix: 9000,
    stock: 18,
    imageUrl: "/images/produits/huile-croissance.jpg",
    categorie: "Soins & Beauté",
  },

  // ═══════════════════════════════════════════════════════════════════
  // BIEN-ÊTRE - Tisanes, compléments, relaxation
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "Tisane Kinkeliba détox",
    description: "Infusion traditionnelle de kinkeliba pour favoriser la digestion et l'élimination.",
    descriptionLongue: "Le kinkeliba est la plante emblématique de l'Afrique de l'Ouest, surnommée « tisane de longue vie ». Cette infusion pure favorise la digestion, stimule le foie, aide à l'élimination des toxines et soutient le système immunitaire. Goût doux et légèrement sucré, à boire chaude ou froide. 2 à 3 tasses par jour. Boîte de 25 sachets.",
    prix: 5000,
    stock: 35,
    imageUrl: "/images/produits/tisane-kinkeliba.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Tisane Bissap (Hibiscus)",
    description: "Fleurs d'hibiscus séchées pour une infusion rafraîchissante et bienfaisante.",
    descriptionLongue: "Le bissap, ou hibiscus, est une boisson traditionnelle africaine aux multiples vertus. Riche en vitamine C et antioxydants, il aide à réguler la tension artérielle, favorise la digestion et procure une sensation de fraîcheur. À consommer chaud ou glacé, nature ou sucré au miel. Idéal en toute saison. Sachet de 100g de fleurs séchées.",
    prix: 4000,
    stock: 40,
    imageUrl: "/images/produits/tisane-bissap.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Infusion Sommeil & Détente",
    description: "Mélange apaisant de camomille, verveine et passiflore pour un sommeil réparateur.",
    descriptionLongue: "Cette infusion relaxante associe la camomille, la verveine, la passiflore et la mélisse pour favoriser l'endormissement et améliorer la qualité du sommeil. Ces plantes apaisent le système nerveux, réduisent le stress et procurent une détente profonde. À boire 30 minutes avant le coucher. Sans accoutumance. Boîte de 20 sachets.",
    prix: 6000,
    stock: 25,
    imageUrl: "/images/produits/tisane-sommeil.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Poudre de Moringa bio",
    description: "Superaliment africain riche en nutriments. Booste l'énergie et renforce l'immunité.",
    descriptionLongue: "Le moringa, « arbre de vie », est l'un des superaliments les plus complets : protéines, vitamines, minéraux, antioxydants. Cette poudre de feuilles de moringa bio renforce le système immunitaire, combat la fatigue, soutient la digestion et améliore la concentration. 1 cuillère à café par jour dans un smoothie, jus ou yaourt. Format 100g.",
    prix: 8000,
    stock: 20,
    imageUrl: "/images/produits/poudre-moringa.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Gélules de Spiruline",
    description: "Complément en spiruline pure pour booster l'énergie et combler les carences.",
    descriptionLongue: "La spiruline est une micro-algue exceptionnellement riche en protéines, fer, vitamines B et antioxydants. Ces gélules de spiruline pure combattent la fatigue, renforcent les défenses immunitaires, améliorent la récupération sportive et comblent les carences nutritionnelles. 2 à 4 gélules par jour avec un grand verre d'eau. Pot de 60 gélules.",
    prix: 10000,
    stock: 18,
    imageUrl: "/images/produits/gelules-spiruline.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Huile essentielle de citronnelle",
    description: "Huile essentielle de citronnelle bio. Assainit l'air et favorise la relaxation.",
    descriptionLongue: "Huile essentielle de citronnelle 100% pure et bio, obtenue par distillation à la vapeur d'eau. Multi-usage : en diffusion pour purifier l'air ambiant et éloigner les moustiques, en application locale (diluée) pour apaiser les tensions musculaires, ou ajoutée au bain pour un moment de détente. Format flacon 15ml.",
    prix: 4500,
    stock: 22,
    imageUrl: "/images/produits/he-citronnelle.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Huile essentielle de lavande",
    description: "Huile essentielle de lavande vraie. Apaisante, relaxante, favorise le sommeil.",
    descriptionLongue: "Cette huile essentielle de lavande vraie (Lavandula angustifolia) est réputée pour ses vertus calmantes et relaxantes. En diffusion, elle crée une atmosphère apaisante ; en massage (diluée), elle soulage les tensions musculaires ; quelques gouttes sur l'oreiller favorisent l'endormissement. Indispensable en aromathérapie. Format flacon 15ml.",
    prix: 5500,
    stock: 20,
    imageUrl: "/images/produits/he-lavande.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Kit post-accouchement naturel",
    description: "Coffret de soins naturels pour les jeunes mamans : beurre de karité, huile de massage et tisane.",
    descriptionLongue: "Ce kit a été spécialement conçu pour les jeunes mamans en période de post-partum. Il comprend un beurre de karité pur (50g) pour nourrir la peau et atténuer les vergetures, une huile de massage relaxante aux plantes pour soulager les tensions, et une boîte de tisane bien-être pour favoriser la récupération. Tous les produits sont 100% naturels et compatibles avec l'allaitement. Idéal en cadeau de naissance.",
    prix: 18000,
    stock: 8,
    imageUrl: "/images/produits/kit-post-accouchement.jpg",
    categorie: "Bien-être",
  },
  {
    nom: "Baume relaxant aux plantes",
    description: "Baume de massage aux huiles essentielles pour soulager les tensions musculaires.",
    descriptionLongue: "Ce baume relaxant combine le beurre de karité, l'huile de coco et un mélange d'huiles essentielles (eucalyptus, menthe poivrée, romarin, lavande) pour soulager les tensions musculaires et articulaires. Idéal après une journée fatigante ou une séance de sport. Masser les zones tendues jusqu'à absorption complète. Sensation de chaleur apaisante. Format 50ml.",
    prix: 7500,
    stock: 15,
    imageUrl: "/images/produits/baume-relaxant.jpg",
    categorie: "Bien-être",
  },
]

async function main() {
  console.log("Seeding produits...")

  for (const p of PRODUITS) {
    const existing = await prisma.produit.findFirst({ where: { nom: p.nom } })
    if (existing) {
      await prisma.produit.update({
        where: { id: existing.id },
        data: p,
      })
      console.log(`  ↻ Mis à jour: ${p.nom}`)
    } else {
      await prisma.produit.create({ data: p })
      console.log(`  + Créé: ${p.nom}`)
    }
  }

  console.log(`\n✅ ${PRODUITS.length} produits seedés.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
