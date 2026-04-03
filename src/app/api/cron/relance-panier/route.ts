import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { envoyerSms } from "@/lib/sms"
import { Resend } from "resend"
import { getConfig } from "@/lib/config"

const resend = new Resend(process.env.RESEND_API_KEY)

// Relance les utilisateurs avec un panier abandonné depuis > 2h et < 48h
// Exécuté toutes les 2h via Vercel CRON
// Ne relance qu'une fois par cycle d'abandon (flag panier_notified_{userId})

const DEUX_HEURES = 2 * 60 * 60 * 1000
const QUARANTE_HUIT_HEURES = 48 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const now = Date.now()
  let relances = 0

  // Récupérer tous les paniers serveur
  const paniers = await prisma.appConfig.findMany({
    where: { cle: { startsWith: "panier_" } },
  })

  for (const entry of paniers) {
    // Ignorer les flags de notification
    if (entry.cle.startsWith("panier_notified_")) continue

    const userId = entry.cle.replace("panier_", "")

    let items: unknown[]
    let updatedAt: string | null = null
    try {
      const raw = JSON.parse(entry.valeur)
      items = Array.isArray(raw) ? raw : (raw.items ?? [])
      updatedAt = Array.isArray(raw) ? null : (raw.updatedAt ?? null)
    } catch {
      continue
    }

    // Panier vide → ignorer
    if (!items.length) continue

    // Pas de timestamp → ignorer (ancien format, sera mis à jour au prochain save)
    if (!updatedAt) continue

    const age = now - new Date(updatedAt).getTime()

    // Trop récent (< 2h) ou trop ancien (> 48h)
    if (age < DEUX_HEURES || age > QUARANTE_HUIT_HEURES) continue

    // Vérifier si déjà notifié pour ce cycle
    const notifKey = `panier_notified_${userId}`
    const alreadyNotified = await prisma.appConfig.findUnique({
      where: { cle: notifKey },
    })
    if (alreadyNotified) {
      // Vérifier si la notification date du même cycle d'abandon
      try {
        const notifTime = new Date(alreadyNotified.valeur).getTime()
        if (notifTime > new Date(updatedAt).getTime()) continue
      } catch {
        continue
      }
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, telephone: true, prenom: true },
    })
    if (!user) continue

    const nbArticles = items.length

    // Envoyer email de relance
    try {
      const config = await getConfig()
      await resend.emails.send({
        from: `${config.nomCentre} <${config.emailRdv}>`,
        to: user.email,
        subject: "Votre panier vous attend — Le Surnaturel de Dieu",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
            <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:20px;">
                Votre panier vous attend
              </h1>
            </div>
            <div style="background:#fff;border:1px solid #E5E7EB;padding:24px;border-radius:0 0 8px 8px;">
              <p>Bonjour ${user.prenom},</p>
              <p>Vous avez laissé <strong>${nbArticles} article${nbArticles > 1 ? "s" : ""}</strong> dans votre panier.</p>
              <p>Finalisez votre commande avant qu'il n'expire :</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/boutique"
                 style="display:inline-block;background:#2D7A1F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
                Voir mon panier
              </a>
              <p style="color:#6B7280;font-size:13px;margin-top:16px;">
                Votre panier sera automatiquement vidé après 72h d'inactivité.
              </p>
            </div>
          </div>
        `,
      })
    } catch {
      // Email non envoyé, on continue
    }

    // Envoyer SMS si téléphone disponible
    if (user.telephone) {
      try {
        await envoyerSms(
          user.telephone,
          `Bonjour ${user.prenom}, votre panier (${nbArticles} article${nbArticles > 1 ? "s" : ""}) vous attend sur Le Surnaturel de Dieu. Finalisez votre commande : ${process.env.NEXT_PUBLIC_APP_URL}/boutique`
        )
      } catch {
        // SMS non envoyé, on continue
      }
    }

    // Marquer comme notifié
    await prisma.appConfig.upsert({
      where: { cle: notifKey },
      update: { valeur: new Date().toISOString() },
      create: { cle: notifKey, valeur: new Date().toISOString() },
    })

    relances++
  }

  return NextResponse.json({
    success: true,
    relances,
    timestamp: new Date().toISOString(),
  })
}
