import { typedLogger as logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  envoyerWhatsAppTexte,
  envoyerWhatsAppConfirmationRDV,
  envoyerWhatsAppRappelRDV,
  isWhatsAppConfigured,
} from "@/lib/whatsapp"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SAGE_FEMME")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!isWhatsAppConfigured()) {
      return NextResponse.json(
        { error: "WhatsApp non configuré. Ajoutez WHATSAPP_PHONE_NUMBER_ID et WHATSAPP_ACCESS_TOKEN" },
        { status: 503 }
      )
    }

    const { type, telephone, prenom, soin, date, message } = await request.json()

    if (!telephone) {
      return NextResponse.json({ error: "Téléphone requis" }, { status: 400 })
    }

    let result

    switch (type) {
      case "confirmation_rdv":
        if (!prenom || !soin || !date) {
          return NextResponse.json(
            { error: "prenom, soin et date requis pour confirmation_rdv" },
            { status: 400 }
          )
        }
        result = await envoyerWhatsAppConfirmationRDV(
          telephone,
          prenom,
          soin,
          new Date(date)
        )
        break

      case "rappel_rdv":
        if (!prenom || !soin || !date) {
          return NextResponse.json(
            { error: "prenom, soin et date requis pour rappel_rdv" },
            { status: 400 }
          )
        }
        result = await envoyerWhatsAppRappelRDV(
          telephone,
          prenom,
          soin,
          new Date(date)
        )
        break

      case "texte":
        if (!message) {
          return NextResponse.json(
            { error: "message requis pour type texte" },
            { status: 400 }
          )
        }
        result = await envoyerWhatsAppTexte(telephone, message)
        break

      default:
        return NextResponse.json(
          { error: "Type invalide. Utilisez: confirmation_rdv, rappel_rdv, texte" },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error("Erreur WhatsApp API:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    return NextResponse.json({
      configured: isWhatsAppConfigured(),
      message: isWhatsAppConfigured()
        ? "WhatsApp Business API est configuré"
        : "WhatsApp non configuré. Ajoutez les variables WHATSAPP_PHONE_NUMBER_ID et WHATSAPP_ACCESS_TOKEN",
    })
  } catch (error) {
    logger.error("Erreur WhatsApp status:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
