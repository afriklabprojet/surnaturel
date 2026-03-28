-- AlterTable : ajout champs acompte et SMS sur RendezVous
ALTER TABLE "RendezVous" ADD COLUMN "montantAcompte" DOUBLE PRECISION;
ALTER TABLE "RendezVous" ADD COLUMN "paiementId" TEXT;
ALTER TABLE "RendezVous" ADD COLUMN "acomptePaye" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RendezVous" ADD COLUMN "telephoneSms" TEXT;
ALTER TABLE "RendezVous" ADD COLUMN "smsRappelEnvoye" BOOLEAN NOT NULL DEFAULT false;
