-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENT', 'SAGE_FEMME', 'ACCOMPAGNATEUR_MEDICAL');

-- CreateEnum
CREATE TYPE "CategorieSoin" AS ENUM ('HAMMAM', 'GOMMAGE', 'AMINCISSANT', 'VISAGE', 'POST_ACCOUCHEMENT', 'CONSEIL_ESTHETIQUE', 'SAGE_FEMME');

-- CreateEnum
CREATE TYPE "StatutRDV" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE', 'PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soin" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "duree" INTEGER NOT NULL,
    "categorie" "CategorieSoin" NOT NULL,
    "imageUrl" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Soin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "soinId" TEXT NOT NULL,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "statut" "StatutRDV" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "categorie" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "paiementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "expediteurId" TEXT NOT NULL,
    "destinataireId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierMedical" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathologie" TEXT NOT NULL,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierMedical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DossierMedical_userId_key" ON "DossierMedical"("userId");

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_soinId_fkey" FOREIGN KEY ("soinId") REFERENCES "Soin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierMedical" ADD CONSTRAINT "DossierMedical_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
