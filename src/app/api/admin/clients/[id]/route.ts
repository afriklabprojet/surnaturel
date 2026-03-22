import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const client = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      photoUrl: true,
      adresse: true,
      ville: true,
      role: true,
      createdAt: true,
      rendezVous: {
        include: { soin: { select: { nom: true, prix: true } } },
        orderBy: { createdAt: "desc" },
      },
      commandes: {
        orderBy: { createdAt: "desc" },
      },
      pointsFidelite: { select: { total: true } },
    },
  })

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  }

  const caGenere = client.commandes
    .filter((c) => c.statut !== "ANNULEE")
    .reduce((sum, c) => sum + c.total, 0)

  return NextResponse.json({
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    email: client.email,
    telephone: client.telephone,
    photoUrl: client.photoUrl,
    adresse: client.adresse,
    ville: client.ville,
    role: client.role,
    createdAt: client.createdAt.toISOString(),
    stats: {
      nbRDV: client.rendezVous.length,
      nbCommandes: client.commandes.length,
      caGenere,
      points: client.pointsFidelite?.total || 0,
    },
    rendezVous: client.rendezVous.map((r) => ({
      id: r.id,
      soin: r.soin.nom,
      prix: r.soin.prix,
      dateHeure: r.dateHeure.toISOString(),
      statut: r.statut,
    })),
    commandes: client.commandes.map((c) => ({
      id: c.id,
      total: c.total,
      statut: c.statut,
      createdAt: c.createdAt.toISOString(),
    })),
  })
}

const patchSchema = z.object({
  role: z.enum(["CLIENT", "ADMIN", "SAGE_FEMME", "ACCOMPAGNATEUR_MEDICAL"]).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const result = z.safeParse(patchSchema, body)

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: result.data,
    select: { id: true, role: true },
  })

  return NextResponse.json(updated)
}
