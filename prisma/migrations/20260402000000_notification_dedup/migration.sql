-- Migration A9 : déduplication des notifications
-- Ajouter le champ compteur
ALTER TABLE "Notification" ADD COLUMN "compteur" INTEGER NOT NULL DEFAULT 1;

-- Supprimer les doublons existants avant de créer l'index unique
-- Garde la notification la plus récente par groupe (userId, type, sourceId)
DELETE FROM "Notification" n1
USING "Notification" n2
WHERE n1."createdAt" < n2."createdAt"
  AND n1."userId" = n2."userId"
  AND n1."type" = n2."type"
  AND n1."sourceId" = n2."sourceId"
  AND n1."sourceId" IS NOT NULL;

-- Créer l'index unique de déduplication (NULLs distincts en PostgreSQL)
CREATE UNIQUE INDEX "notif_dedup" ON "Notification"("userId", "type", "sourceId");
