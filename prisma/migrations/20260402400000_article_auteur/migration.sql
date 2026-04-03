-- Ajout des champs auteur et auteurRole sur le modèle Article
-- Valeurs par défaut appliquées à tous les articles existants.

ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "auteur" TEXT NOT NULL DEFAULT 'Équipe éditoriale';
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "auteurRole" TEXT NOT NULL DEFAULT 'Équipe du Surnaturel de Dieu';
