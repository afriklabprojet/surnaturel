import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

/**
 * GET /api/admin/sage-femme/patients/[id]
 * Fiche complète d'un patient : infos, historique RDV, notes, suivi spécialisé.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        image: true,
        createdAt: true,
        dateNaissance: true,
        rendezVous: {
          orderBy: { dateHeure: "desc" },
          take: 20,
          include: {
            soin: { select: { nom: true, duree: true, prix: true } },
          },
        },
        notesRecues: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            auteur: { select: { prenom: true, nom: true } },
          },
        },
        dossierMedical: {
          select: {
            id: true,
            groupeSanguin: true,
            pathologie: true,
            allergies: true,
            antecedents: true,
            medicaments: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Patient introuvable" }, { status: 404 })
    }

    // Suivi spécialisé
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let suiviSpecialises: any[] = []
    if (user.dossierMedical) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suiviSpecialises = await (prisma as any).suiviSpecialise.findMany({
        where: { dossierId: user.dossierMedical.id },
        orderBy: [{ actif: "desc" }, { updatedAt: "desc" }],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suiviSpecialises = suiviSpecialises.map((s: any) => ({
        ...s,
        notes: s.notes ? decrypt(s.notes) : null,
        examensRealises: s.examensRealises ? JSON.parse(s.examensRealises) : [],
      }))
    }

    // Questionnaires
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questionnaires = await (prisma as any).questionnairePreConsultation.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questionnairesDecrypted = questionnaires.map((q: any) => ({
      id: q.id,
      typeSoin: q.typeSoin,
      motif: decrypt(q.motif),
      antecedents: q.antecedents ? decrypt(q.antecedents) : null,
      medicaments: q.medicaments ? decrypt(q.medicaments) : null,
      allergies: q.allergies ? decrypt(q.allergies) : null,
      ddr: q.ddr ? decrypt(q.ddr) : null,
      parite: q.parite,
      autresInfos: q.autresInfos ? decrypt(q.autresInfos) : null,
      traite: q.traite,
      createdAt: q.createdAt,
    }))

    // Marquer questionnaires non traités comme traités
    await (prisma as any).questionnairePreConsultation.updateMany({
      where: { userId: id, traite: false },
      data: { traite: true },
    })

    // Décrypter dossier médical
    const dossier = user.dossierMedical
      ? {
          ...user.dossierMedical,
          pathologie: user.dossierMedical.pathologie ? decrypt(user.dossierMedical.pathologie) : null,
          allergies: user.dossierMedical.allergies ? decrypt(user.dossierMedical.allergies) : null,
          antecedents: user.dossierMedical.antecedents ? decrypt(user.dossierMedical.antecedents) : null,
          medicaments: user.dossierMedical.medicaments ? decrypt(user.dossierMedical.medicaments) : null,
        }
      : null

    return NextResponse.json({
      patient: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        image: user.image,
        createdAt: user.createdAt,
        dateNaissance: user.dateNaissance,
      },
      dossier,
      suiviSpecialises,
      questionnaires: questionnairesDecrypted,
      rdvs: user.rendezVous.map((rdv) => ({
        id: rdv.id,
        dateHeure: rdv.dateHeure,
        statut: rdv.statut,
        notes: rdv.notes,
        soin: rdv.soin,
      })),
      notes: user.notesRecues.map((n) => ({
        id: n.id,
        contenu: n.contenu,
        type: n.type,
        partagePatient: n.partagePatient,
        auteur: `${n.auteur.prenom} ${n.auteur.nom}`,
        createdAt: n.createdAt,
      })),
    })
  } catch (error) {
    logger.error("Erreur GET patient fiche:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
