-- CreateTable
CREATE TABLE "PhotoRencontre" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoRencontre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoRencontre_userId_idx" ON "PhotoRencontre"("userId");

-- AddForeignKey
ALTER TABLE "PhotoRencontre" ADD CONSTRAINT "PhotoRencontre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
