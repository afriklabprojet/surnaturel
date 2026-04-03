-- Migration A10 : unification Like → Reaction
-- Migrer les likes existants en tant que Reaction de type '👍'
-- ON CONFLICT : si un utilisateur a déjà une Reaction sur ce post, on ignore
INSERT INTO "Reaction" (id, "postId", "userId", "type", "createdAt")
SELECT id, "postId", "userId", '👍', "createdAt"
FROM "Like"
ON CONFLICT ("postId", "userId") DO NOTHING;

-- Supprimer la table Like (les FK son portées par Like, donc pas de contrainte orpheline)
DROP TABLE "Like";
