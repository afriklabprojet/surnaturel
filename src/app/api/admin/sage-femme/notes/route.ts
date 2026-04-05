import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const notes = await prisma.notePro.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    })

    const formatted = notes.map((note) => ({
      id: note.id,
      clientId: note.clientId,
      clientNom: `${note.client.prenom} ${note.client.nom}`,
      contenu: note.contenu,
      type: note.type,
      auteur: `${note.auteur.prenom} ${note.auteur.nom}`,
      createdAt: note.createdAt,
    }))

    return NextResponse.json({ notes: formatted })
  } catch (error) {
    logger.error("Erreur notes sage-femme:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { clientId, contenu, type = "GENERALE" } = await request.json()

    if (!clientId || !contenu) {
      return NextResponse.json(
        { error: "Client et contenu requis" },
        { status: 400 }
      )
    }

    // Vérifier que le client existe
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      )
    }

    const note = await prisma.notePro.create({
      data: {
        clientId,
        auteurId: session.user.id,
        contenu,
        type,
      },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: note.id,
      clientId: note.clientId,
      clientNom: `${note.client.prenom} ${note.client.nom}`,
      contenu: note.contenu,
      type: note.type,
      createdAt: note.createdAt,
    })
  } catch (error) {
    logger.error("Erreur création note:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id, partagePatient, type } = await request.json()
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (partagePatient !== undefined) updateData.partagePatient = partagePatient
    if (type !== undefined) updateData.type = type

    await (prisma.notePro.update as any)({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Erreur PATCH note:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    await prisma.notePro.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Erreur suppression note:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
