-- Chat features v3 : réactions emoji libres, pièces jointes, messages programmés

-- 1. Changer Reaction.type de TypeReaction (enum) → TEXT
ALTER TABLE "Reaction" ALTER COLUMN "type" TYPE TEXT USING "type"::text;

-- 2. Supprimer l'ancien enum TypeReaction (plus utilisé)
DROP TYPE IF EXISTS "TypeReaction";

-- 3. Ajouter FICHIER au MessageType enum
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'FICHIER';

-- 4. Ajouter les champs de messages programmés
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "programmeA" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "programmeEnvoye" BOOLEAN NOT NULL DEFAULT false;
