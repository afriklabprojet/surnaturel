-- AlterTable: add delivery address fields to Commande
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "nomDestinataire" TEXT;
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "adresseLivraison" TEXT;
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "telephoneLivraison" TEXT;
