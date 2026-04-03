-- Migration : index GIN pour la recherche plein-texte en français
-- Remplace les ILIKE lents sur Produit, Soin et Article par une recherche
-- vectorielle O(log N) via to_tsvector('french', ...).
-- Ces index sont utilisés par /api/search — ajout d'un rate limit en parallèle.

-- Index GIN sur Produit (nom + description)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Produit_fts_idx"
  ON "Produit"
  USING gin (to_tsvector('french', "nom" || ' ' || "description"));

-- Index GIN sur Soin (nom + description)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Soin_fts_idx"
  ON "Soin"
  USING gin (to_tsvector('french', "nom" || ' ' || "description"));

-- Index GIN sur Article (titre + extrait)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Article_fts_idx"
  ON "Article"
  USING gin (to_tsvector('french', "titre" || ' ' || COALESCE("extrait", '') || ' ' || COALESCE("contenu", '')));
