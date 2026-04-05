/**
 * Script de test pour vérifier l'envoi d'email via Resend
 * Usage: npx tsx scripts/test-resend.ts [email@destinataire.com]
 */

import { Resend } from "resend"

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY || "re_MoSu6UFm_KLuFPQ39wGPVzKs3uz9eh5Mh"
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@lesurnatureldedieu.com"
  const toEmail = process.argv[2] || "delivered@resend.dev" // Adresse test Resend par défaut
  
  console.log("╔════════════════════════════════════════════════════════╗")
  console.log("║     🧪 TEST RESEND - Le Surnaturel de Dieu             ║")
  console.log("╠════════════════════════════════════════════════════════╣")
  console.log(`║ API Key: ${apiKey.slice(0, 15)}...`)
  console.log(`║ From: ${fromEmail}`)
  console.log(`║ To: ${toEmail}`)
  console.log("╚════════════════════════════════════════════════════════╝")
  console.log("")

  const resend = new Resend(apiKey)

  try {
    console.log("📧 Envoi de l'email de test...")
    
    const { data, error } = await resend.emails.send({
      from: `Le Surnaturel de Dieu <${fromEmail}>`,
      to: [toEmail],
      subject: "🧪 Test Email Resend - Le Surnaturel de Dieu",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1B5E14 0%, #2D7A1F 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">🌿</div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Test Resend Réussi!</h1>
          </div>
          <div style="background: white; border: 1px solid #E5E7EB; border-top: none; padding: 32px; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #1F2937; line-height: 1.6;">
              Cet email confirme que <strong>Resend</strong> est correctement configuré pour 
              <strong style="color: #2D7A1F;">Le Surnaturel de Dieu</strong>.
            </p>
            <div style="background: #E8F5E3; padding: 16px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #1B5E14;">
                ✅ API Key valide<br>
                ✅ Domaine vérifié<br>
                ✅ Email envoyé avec succès
              </p>
            </div>
            <p style="font-size: 14px; color: #6B7280;">
              Date du test: ${new Date().toLocaleString("fr-FR", { 
                dateStyle: "full", 
                timeStyle: "medium" 
              })}
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("")
      console.error("❌ ERREUR RESEND:")
      console.error(JSON.stringify(error, null, 2))
      process.exit(1)
    }

    console.log("")
    console.log("╔════════════════════════════════════════════════════════╗")
    console.log("║              ✅ EMAIL ENVOYÉ AVEC SUCCÈS!              ║")
    console.log("╠════════════════════════════════════════════════════════╣")
    console.log(`║ ID: ${data?.id}`)
    console.log("╚════════════════════════════════════════════════════════╝")
    
  } catch (err) {
    console.error("")
    console.error("❌ EXCEPTION:", err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

testResend()
