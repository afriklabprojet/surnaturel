-- CreateTable
CREATE TABLE "EntreeCarnet" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "humeur" INTEGER,
    "energie" INTEGER,
    "sommeil" DOUBLE PRECISION,
    "hydratation" INTEGER,
    "symptomes" TEXT,
    "cycleMenstruel" BOOLEAN NOT NULL DEFAULT false,
    "jourCycle" INTEGER,
    "fluxCycle" TEXT,
    "notes" TEXT,
    "partageAvecPraticien" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntreeCarnet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntreeCarnet_dossierId_date_key" ON "EntreeCarnet"("dossierId", "date");

-- CreateIndex
CREATE INDEX "EntreeCarnet_dossierId_date_idx" ON "EntreeCarnet"("dossierId", "date");

-- AddForeignKey
ALTER TABLE "EntreeCarnet" ADD CONSTRAINT "EntreeCarnet_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierMedical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
