import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  nom: z.string().min(2).max(100),
  email: z.email(),
  telephone: z.string().max(20).optional(),
  sujet: z.string().min(1).max(200),
  message: z.string().min(10).max(3000),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const result = contactSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: z.prettifyError(result.error) },
      { status: 400 }
    )
  }

  const { nom, email, telephone, sujet, message } = result.data

  try {
    await resend.emails.send({
      from: "Le Surnaturel de Dieu <contact@surnatureldedieu.com>",
      to: "contact@surnatureldedieu.com",
      replyTo: email,
      subject: `[Contact] ${sujet}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1F2937;">
          <div style="background:#2D7A1F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;">
              Nouveau message de contact
            </h1>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;
            border-top:none;padding:24px;border-radius:0 0 8px 8px;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <tr style="background:#E8F5E3;">
                <td style="padding:10px;font-weight:600;">Nom</td>
                <td style="padding:10px;">${nom}</td>
              </tr>
              <tr>
                <td style="padding:10px;font-weight:600;">Email</td>
                <td style="padding:10px;">${email}</td>
              </tr>
              ${telephone ? `<tr style="background:#E8F5E3;"><td style="padding:10px;font-weight:600;">Téléphone</td><td style="padding:10px;">${telephone}</td></tr>` : ""}
              <tr${telephone ? "" : ' style="background:#E8F5E3;"'}>
                <td style="padding:10px;font-weight:600;">Sujet</td>
                <td style="padding:10px;">${sujet}</td>
              </tr>
            </table>
            <div style="padding:16px;background:#FAFAFA;border-radius:8px;">
              <p style="font-weight:600;margin:0 0 8px;">Message :</p>
              <p style="margin:0;white-space:pre-wrap;">${message}</p>
            </div>
          </div>
        </div>
      `,
    })
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, message: "Message envoyé" })
}
