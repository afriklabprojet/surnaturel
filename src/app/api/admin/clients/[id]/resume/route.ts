import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const client = await prisma.user.findUnique({
    where: { id },
    select: {
      nom: true,
      prenom: true,
      createdAt: true,
      rendezVous: {
        include: { soin: { select: { nom: true, categorie: true, prix: true } } },
        orderBy: { dateHeure: "desc" },
      },
      commandes: {
        where: { statut: { not: "ANNULEE" } },
        select: { total: true, createdAt: true },
      },
      avis: { select: { note: true, commentaire: true, createdAt: true } },
      dossierMedical: {
        select: {
          groupeSanguin: true,
          mesures: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: { type: true, valeur: true, unite: true, createdAt: true },
          },
        },
      },
    },
  })

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  }

  // Build intelligent summary
  const rdvs = client.rendezVous
  const totalRDV = rdvs.length
  const rdvTermines = rdvs.filter((r) => r.statut === "TERMINE").length
  const rdvAnnules = rdvs.filter((r) => r.statut === "ANNULE").length
  const tauxPresence = totalRDV > 0 ? Math.round((rdvTermines / totalRDV) * 100) : 0

  // Soins frequency
  const soinFreq: Record<string, number> = {}
  for (const r of rdvs) {
    soinFreq[r.soin.nom] = (soinFreq[r.soin.nom] || 0) + 1
  }
  const soinsPreferes = Object.entries(soinFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nom, count]) => ({ nom, count }))

  // Categories frequency
  const catFreq: Record<string, number> = {}
  for (const r of rdvs) {
    catFreq[r.soin.categorie] = (catFreq[r.soin.categorie] || 0) + 1
  }

  // Spending
  const totalDepense = client.commandes.reduce((s, c) => s + c.total, 0)
  const panierMoyen = client.commandes.length > 0
    ? Math.round(totalDepense / client.commandes.length)
    : 0

  // Visit frequency
  const now = new Date()
  const inscriptionDate = new Date(client.createdAt)
  const moisDepuisInscription = Math.max(1, Math.round((now.getTime() - inscriptionDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
  const frequenceMensuelle = totalRDV > 0 ? (totalRDV / moisDepuisInscription).toFixed(1) : "0"

  // Last visit
  const dernierRDV = rdvs.find((r) => r.statut === "TERMINE")
  const joursSanVisite = dernierRDV
    ? Math.round((now.getTime() - new Date(dernierRDV.dateHeure).getTime()) / (24 * 60 * 60 * 1000))
    : null

  // Satisfaction
  const notes = client.avis.map((a) => a.note)
  const noteMoyenne = notes.length > 0
    ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)
    : null

  // Health summary (non-encrypted fields only)
  const mesuresRecentes = client.dossierMedical?.mesures || []
  const alertesSante: string[] = []
  for (const m of mesuresRecentes) {
    const val = parseFloat(m.valeur)
    if (isNaN(val)) continue
    if (m.type === "TENSION_ARTERIELLE" && val > 14) alertesSante.push(`Tension élevée: ${m.valeur} ${m.unite}`)
    if (m.type === "TEMPERATURE" && (val > 38 || val < 35.5)) alertesSante.push(`Température anormale: ${m.valeur} ${m.unite}`)
    if (m.type === "GLYCEMIE" && (val > 1.26 || val < 0.7)) alertesSante.push(`Glycémie hors norme: ${m.valeur} ${m.unite}`)
    if (m.type === "FREQUENCE_CARDIAQUE" && (val > 100 || val < 50)) alertesSante.push(`Fréquence cardiaque: ${m.valeur} ${m.unite}`)
  }

  // Generate text paragraphs
  const paragraphes: string[] = []

  paragraphes.push(
    `${client.prenom} ${client.nom} est cliente depuis ${moisDepuisInscription} mois. Elle a effectué ${totalRDV} rendez-vous (${rdvTermines} terminés, ${rdvAnnules} annulés). Taux de présence : ${tauxPresence}%.`
  )

  if (soinsPreferes.length > 0) {
    const soinsStr = soinsPreferes.map((s) => `${s.nom} (${s.count}×)`).join(", ")
    paragraphes.push(`Soins préférés : ${soinsStr}.`)
  }

  paragraphes.push(
    `Fréquence de visite : ${frequenceMensuelle} RDV/mois.${
      joursSanVisite !== null ? ` Dernière visite il y a ${joursSanVisite} jours.` : ""
    }`
  )

  if (client.commandes.length > 0) {
    paragraphes.push(
      `Achats : ${client.commandes.length} commande(s) pour un total de ${totalDepense.toLocaleString("fr-FR")} FCFA (panier moyen : ${panierMoyen.toLocaleString("fr-FR")} FCFA).`
    )
  }

  if (noteMoyenne) {
    paragraphes.push(`Satisfaction : ${noteMoyenne}/5 sur ${notes.length} avis.`)
  }

  if (alertesSante.length > 0) {
    paragraphes.push(`⚠️ Alertes santé récentes : ${alertesSante.join(" | ")}`)
  }

  if (joursSanVisite !== null && joursSanVisite > 60) {
    paragraphes.push(`💡 Suggestion : cette cliente n'est pas venue depuis ${joursSanVisite} jours. Un message de relance serait approprié.`)
  }

  return NextResponse.json({
    resume: paragraphes.join("\n\n"),
    stats: {
      totalRDV,
      rdvTermines,
      rdvAnnules,
      tauxPresence,
      frequenceMensuelle: parseFloat(frequenceMensuelle),
      totalDepense,
      panierMoyen,
      noteMoyenne: noteMoyenne ? parseFloat(noteMoyenne) : null,
      joursSanVisite,
      moisDepuisInscription,
    },
    soinsPreferes,
    alertesSante,
    categoriesVisitees: Object.entries(catFreq).map(([cat, count]) => ({ categorie: cat, count })),
  })
}
