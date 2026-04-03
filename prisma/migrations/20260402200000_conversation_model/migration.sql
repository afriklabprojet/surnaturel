-- Migration A11 : table Conversation
-- Crée la table Conversation et lie les Message existants à leur conversation

CREATE TABLE "Conversation" (
  "id"             TEXT        NOT NULL,
  "participantAId" TEXT        NOT NULL,  -- plus petit des deux IDs (tri lex)
  "participantBId" TEXT        NOT NULL,  -- plus grand des deux IDs
  "lastMessageId"  TEXT,
  "lastMessageAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nonLusA"        INTEGER     NOT NULL DEFAULT 0,
  "nonLusB"        INTEGER     NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Conversation_participants_key" UNIQUE ("participantAId", "participantBId")
);

CREATE INDEX "Conversation_participantAId_lastMessageAt_idx"
  ON "Conversation"("participantAId", "lastMessageAt");
CREATE INDEX "Conversation_participantBId_lastMessageAt_idx"
  ON "Conversation"("participantBId", "lastMessageAt");

ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_participantAId_fkey"
    FOREIGN KEY ("participantAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Conversation_participantBId_fkey"
    FOREIGN KEY ("participantBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ajouter conversationId sur Message (nullable — rempli progressivement)
ALTER TABLE "Message" ADD COLUMN "conversationId" TEXT;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Peupler la table Conversation à partir des messages existants
-- Pour chaque paire unique d'utilisateurs, créer une conversation
WITH paires AS (
  SELECT DISTINCT
    LEAST("expediteurId", "destinataireId")    AS pia,
    GREATEST("expediteurId", "destinataireId") AS pib
  FROM "Message"
),
inserts AS (
  INSERT INTO "Conversation" ("id", "participantAId", "participantBId", "lastMessageAt", "updatedAt")
  SELECT
    gen_random_uuid()::text,
    pia,
    pib,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM paires
  RETURNING "id", "participantAId", "participantBId"
)
-- Lier les messages à leur conversation
UPDATE "Message" m
SET "conversationId" = i.id
FROM inserts i
WHERE LEAST(m."expediteurId", m."destinataireId")    = i."participantAId"
  AND GREATEST(m."expediteurId", m."destinataireId") = i."participantBId";

-- Mettre à jour lastMessageId et lastMessageAt sur chaque conversation
UPDATE "Conversation" c
SET
  "lastMessageAt" = latest."createdAt",
  "lastMessageId" = latest."id"
FROM (
  SELECT DISTINCT ON ("conversationId") "conversationId", "id", "createdAt"
  FROM "Message"
  WHERE "conversationId" IS NOT NULL
  ORDER BY "conversationId", "createdAt" DESC
) latest
WHERE c."id" = latest."conversationId";

-- Mettre à jour les compteurs nonLus
UPDATE "Conversation" c
SET
  "nonLusA" = COALESCE(nl_a.cnt, 0),
  "nonLusB" = COALESCE(nl_b.cnt, 0)
FROM (
  SELECT "conversationId", COUNT(*) AS cnt
  FROM "Message"
  WHERE lu = false
  GROUP BY "conversationId", "destinataireId"
) AS nl_a
JOIN (
  SELECT "conversationId", COUNT(*) AS cnt
  FROM "Message"
  WHERE lu = false
  GROUP BY "conversationId", "destinataireId"
) AS nl_b ON nl_a."conversationId" = nl_b."conversationId";
