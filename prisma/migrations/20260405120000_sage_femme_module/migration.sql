-- Migration: sage_femme_module
-- Ajoute: TypeSuivi enum, SuiviSpecialise, QuestionnairePreConsultation
--         partagePatient sur NotePro, suiviSpecialises sur DossierMedical
--         questionnaires sur User

-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "TypeSuivi" AS ENUM ('GROSSESSE', 'POST_PARTUM', 'NOURRISSON', 'PEDIATRIQUE', 'GYNECOLOGIQUE', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable NotePro (idempotent)
DO $$ BEGIN
  ALTER TABLE "NotePro" ADD COLUMN "partagePatient" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "NotePro" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- CreateTable SuiviSpecialise (idempotent)
CREATE TABLE IF NOT EXISTS "SuiviSpecialise" (
    "id"                      TEXT NOT NULL,
    "dossierId"               TEXT NOT NULL,
    "type"                    "TypeSuivi" NOT NULL,
    "actif"                   BOOLEAN NOT NULL DEFAULT true,
    "dateDebutGrossesse"      TIMESTAMP(3),
    "semainesAmenorhee"       INTEGER,
    "datePrevueAccouchement"  TIMESTAMP(3),
    "parite"                  TEXT,
    "dateNaissancePatient"    TIMESTAMP(3),
    "prenomPatient"           TEXT,
    "poidsKg"                 DOUBLE PRECISION,
    "tailleCm"                DOUBLE PRECISION,
    "perimCranienCm"          DOUBLE PRECISION,
    "notes"                   TEXT,
    "examensRealises"         TEXT,
    "prochainControle"        TIMESTAMP(3),
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuiviSpecialise_pkey" PRIMARY KEY ("id")
);

-- CreateTable QuestionnairePreConsultation (idempotent)
CREATE TABLE IF NOT EXISTS "QuestionnairePreConsultation" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "typeSoin"     TEXT,
    "motif"        TEXT NOT NULL,
    "antecedents"  TEXT,
    "medicaments"  TEXT,
    "allergies"    TEXT,
    "ddr"          TEXT,
    "parite"       TEXT,
    "autresInfos"  TEXT,
    "traite"       BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnairePreConsultation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey SuiviSpecialise → DossierMedical (idempotent)
DO $$ BEGIN
  ALTER TABLE "SuiviSpecialise" ADD CONSTRAINT "SuiviSpecialise_dossierId_fkey"
    FOREIGN KEY ("dossierId") REFERENCES "DossierMedical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey QuestionnairePreConsultation → User (idempotent)
DO $$ BEGIN
  ALTER TABLE "QuestionnairePreConsultation" ADD CONSTRAINT "QuestionnairePreConsultation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "SuiviSpecialise_dossierId_type_idx" ON "SuiviSpecialise"("dossierId", "type");
CREATE INDEX IF NOT EXISTS "SuiviSpecialise_dossierId_actif_idx" ON "SuiviSpecialise"("dossierId", "actif");
CREATE INDEX IF NOT EXISTS "QuestionnairePreConsultation_userId_idx" ON "QuestionnairePreConsultation"("userId");
CREATE INDEX IF NOT EXISTS "QuestionnairePreConsultation_traite_createdAt_idx" ON "QuestionnairePreConsultation"("traite", "createdAt");
CREATE INDEX IF NOT EXISTS "NotePro_clientId_partagePatient_idx" ON "NotePro"("clientId", "partagePatient");
