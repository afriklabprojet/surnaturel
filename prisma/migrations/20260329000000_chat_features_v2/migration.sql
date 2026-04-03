-- AddChatFeaturesV2: modifier message, présence, vu à HH:MM, transférer, épingler, éphémères

ALTER TABLE "Message" ADD COLUMN "modifie" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN "modifieLeAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "luLe" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "epingle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN "expiresAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN "derniereVueAt" TIMESTAMP(3);
