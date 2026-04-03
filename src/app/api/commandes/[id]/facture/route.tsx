import { NextResponse } from "next/server"
import { typedLogger as logger } from "@/lib/logger"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderToBuffer } from "@react-pdf/renderer"
import FacturePDF, { FactureData, LigneFacture } from "@/components/pdf/FacturePDF"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    // Récupérer la commande avec ses lignes
    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        user: true,
        lignes: {
          include: {
            produit: true,
          },
        },
      },
    })

    if (!commande) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur a le droit de voir cette facture
    if (commande.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Préparer les données de la facture
    const lignes: LigneFacture[] = commande.lignes.map((ligne) => ({
      description: ligne.produit?.nom || "Article",
      quantite: ligne.quantite,
      prixUnitaire: ligne.prixUnitaire,
      total: ligne.quantite * ligne.prixUnitaire,
    }))

    const sousTotal = lignes.reduce((sum, ligne) => sum + ligne.total, 0)

    const factureData: FactureData = {
      numero: `FAC-${commande.id.slice(0, 8).toUpperCase()}`,
      date: format(commande.createdAt, "dd MMMM yyyy", { locale: fr }),
      client: {
        nom: `${commande.user.prenom} ${commande.user.nom}`,
        email: commande.user.email,
        telephone: commande.user.telephone || undefined,
        adresse: commande.user.adresse || undefined,
        ville: commande.user.ville || undefined,
      },
      lignes,
      sousTotal,
      total: commande.total,
      statut:
        commande.statut === "PAYEE"
          ? "PAYEE"
          : commande.statut === "ANNULEE"
          ? "ANNULEE"
          : "EN_ATTENTE",
    }

    // Générer le PDF
    const pdfBuffer = await renderToBuffer(<FacturePDF data={factureData} />)

    // Retourner le PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${factureData.numero}.pdf"`,
      },
    })
  } catch (error) {
    logger.error("Erreur génération facture:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération de la facture" },
      { status: 500 }
    )
  }
}
