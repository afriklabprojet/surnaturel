-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('RDV_CONFIRME', 'RDV_ANNULE', 'COMMANDE_PAYEE', 'COMMANDE_EXPEDIEE', 'NOUVEAU_MESSAGE', 'FIDELITE_POINTS', 'FIDELITE_RECOMPENSE', 'PARRAINAGE');

-- CreateEnum
CREATE TYPE "TypeFidelite" AS ENUM ('GAIN_RDV', 'GAIN_COMMANDE', 'GAIN_PARRAINAGE', 'GAIN_AVIS', 'DEPOT_RECOMPENSE');

-- CreateEnum
CREATE TYPE "StatutParrainage" AS ENUM ('EN_ATTENTE', 'ACTIF', 'RECOMPENSE_ACCORDEE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ville" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotifType" NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "lien" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsFidelite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PointsFidelite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueFidelite" (
    "id" TEXT NOT NULL,
    "pointsId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "raison" TEXT NOT NULL,
    "type" "TypeFidelite" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueFidelite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favori" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "soinId" TEXT,
    "produitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parrainage" (
    "id" TEXT NOT NULL,
    "parrainId" TEXT NOT NULL,
    "filleulId" TEXT,
    "code" TEXT NOT NULL,
    "statut" "StatutParrainage" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parrainage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rdvId" TEXT NOT NULL,
    "soinId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PointsFidelite_userId_key" ON "PointsFidelite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favori_userId_soinId_key" ON "Favori"("userId", "soinId");

-- CreateIndex
CREATE UNIQUE INDEX "Favori_userId_produitId_key" ON "Favori"("userId", "produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Parrainage_code_key" ON "Parrainage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Avis_rdvId_key" ON "Avis"("rdvId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsFidelite" ADD CONSTRAINT "PointsFidelite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueFidelite" ADD CONSTRAINT "HistoriqueFidelite_pointsId_fkey" FOREIGN KEY ("pointsId") REFERENCES "PointsFidelite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_soinId_fkey" FOREIGN KEY ("soinId") REFERENCES "Soin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parrainage" ADD CONSTRAINT "Parrainage_parrainId_fkey" FOREIGN KEY ("parrainId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parrainage" ADD CONSTRAINT "Parrainage_filleulId_fkey" FOREIGN KEY ("filleulId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_rdvId_fkey" FOREIGN KEY ("rdvId") REFERENCES "RendezVous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_soinId_fkey" FOREIGN KEY ("soinId") REFERENCES "Soin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
