-- AlterEnum: Ajout du rôle MODERATEUR
ALTER TYPE "Role" ADD VALUE 'MODERATEUR';

-- Avis (soins) : champs modération
ALTER TABLE "Avis" ADD COLUMN "signale" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Avis" ADD COLUMN "raisonRejet" TEXT;
ALTER TABLE "Avis" ADD COLUMN "moderePar" TEXT;
ALTER TABLE "Avis" ADD COLUMN "modereAt" TIMESTAMP(3);

-- AvisProduit : champs modération
ALTER TABLE "AvisProduit" ADD COLUMN "signale" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AvisProduit" ADD COLUMN "raisonRejet" TEXT;
ALTER TABLE "AvisProduit" ADD COLUMN "moderePar" TEXT;
ALTER TABLE "AvisProduit" ADD COLUMN "modereAt" TIMESTAMP(3);

-- Index pour filtrage rapide
CREATE INDEX "Avis_publie_idx" ON "Avis"("publie");
CREATE INDEX "Avis_signale_idx" ON "Avis"("signale");
CREATE INDEX "AvisProduit_signale_idx" ON "AvisProduit"("signale");
