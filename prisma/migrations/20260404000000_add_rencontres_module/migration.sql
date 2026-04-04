-- Migration: add_rencontres_module
-- Adds the dating/matchmaking module: RencontrePreference, RencontreLike, RencontreMatch

-- Enums
CREATE TYPE "IntentionRencontre" AS ENUM ('AMITIE', 'RELATION_SERIEUSE', 'MARIAGE');
CREATE TYPE "TypeLike" AS ENUM ('LIKE', 'SUPER_LIKE', 'PASS');

-- Add dateNaissance to User
ALTER TABLE "User" ADD COLUMN "dateNaissance" TIMESTAMP(3);

-- RencontrePreference
CREATE TABLE "RencontrePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intention" "IntentionRencontre" NOT NULL DEFAULT 'RELATION_SERIEUSE',
    "ageMin" INTEGER NOT NULL DEFAULT 18,
    "ageMax" INTEGER NOT NULL DEFAULT 50,
    "distanceKm" INTEGER NOT NULL DEFAULT 50,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RencontrePreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RencontrePreference_userId_key" ON "RencontrePreference"("userId");
ALTER TABLE "RencontrePreference" ADD CONSTRAINT "RencontrePreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RencontreLike
CREATE TABLE "RencontreLike" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "type" "TypeLike" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RencontreLike_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RencontreLike_fromUserId_toUserId_key" ON "RencontreLike"("fromUserId", "toUserId");
CREATE INDEX "RencontreLike_toUserId_idx" ON "RencontreLike"("toUserId");
ALTER TABLE "RencontreLike" ADD CONSTRAINT "RencontreLike_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RencontreLike" ADD CONSTRAINT "RencontreLike_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RencontreMatch
CREATE TABLE "RencontreMatch" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "conversationId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RencontreMatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RencontreMatch_conversationId_key" ON "RencontreMatch"("conversationId");
CREATE UNIQUE INDEX "RencontreMatch_userAId_userBId_key" ON "RencontreMatch"("userAId", "userBId");
CREATE INDEX "RencontreMatch_userAId_idx" ON "RencontreMatch"("userAId");
CREATE INDEX "RencontreMatch_userBId_idx" ON "RencontreMatch"("userBId");
ALTER TABLE "RencontreMatch" ADD CONSTRAINT "RencontreMatch_userAId_fkey"
  FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RencontreMatch" ADD CONSTRAINT "RencontreMatch_userBId_fkey"
  FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RencontreMatch" ADD CONSTRAINT "RencontreMatch_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
