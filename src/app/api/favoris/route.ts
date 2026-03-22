import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les favoris de l'utilisateur
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const favoris = await prisma.favori.findMany({
      where: { userId: session.user.id },
      include: {
        soin: true,
        produit: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Séparer soins et produits
    const soins = favoris
      .filter((f) => f.soin)
      .map((f) => ({
        favoriId: f.id,
        ...f.soin,
      }))

    const produits = favoris
      .filter((f) => f.produit)
      .map((f) => ({
        favoriId: f.id,
        ...f.produit,
      }))

    return NextResponse.json({ soins, produits })
  } catch (error) {
    console.error("Erreur récupération favoris:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des favoris" },
      { status: 500 }
    )
  }
}

// POST - Ajouter un favori
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { soinId, produitId } = await request.json()

    if (!soinId && !produitId) {
      return NextResponse.json(
        { error: "Soin ou produit requis" },
        { status: 400 }
      )
    }

    // Vérifier si le favori existe déjà
    const existant = await prisma.favori.findFirst({
      where: {
        userId: session.user.id,
        ...(soinId ? { soinId } : { produitId }),
      },
    })

    if (existant) {
      return NextResponse.json(
        { error: "Déjà en favoris" },
        { status: 400 }
      )
    }

    const favori = await prisma.favori.create({
      data: {
        userId: session.user.id,
        ...(soinId ? { soinId } : { produitId }),
      },
      include: {
        soin: true,
        produit: true,
      },
    })

    return NextResponse.json(favori, { status: 201 })
  } catch (error) {
    console.error("Erreur ajout favori:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du favori" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un favori
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const soinId = searchParams.get("soinId")
    const produitId = searchParams.get("produitId")
    const favoriId = searchParams.get("id")

    let favori

    if (favoriId) {
      favori = await prisma.favori.findUnique({
        where: { id: favoriId },
      })
    } else if (soinId || produitId) {
      favori = await prisma.favori.findFirst({
        where: {
          userId: session.user.id,
          ...(soinId ? { soinId } : { produitId }),
        },
      })
    }

    if (!favori) {
      return NextResponse.json(
        { error: "Favori non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que le favori appartient à l'utilisateur
    if (favori.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.favori.delete({
      where: { id: favori.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression favori:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du favori" },
      { status: 500 }
    )
  }
}
