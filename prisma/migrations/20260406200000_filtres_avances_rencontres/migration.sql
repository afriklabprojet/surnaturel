-- AlterTable
ALTER TABLE "RencontrePreference" ADD COLUMN "filtreVerifie" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RencontrePreference" ADD COLUMN "filtreIntention" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RencontrePreference" ADD COLUMN "filtreInterets" BOOLEAN NOT NULL DEFAULT false;
