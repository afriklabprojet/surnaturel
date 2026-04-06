import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const alt = "Produit — Le Surnaturel de Dieu"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let nom = "Produit"
  let desc = "Boutique — Le Surnaturel de Dieu"
  let prix = ""

  try {
    const produit = await prisma.produit.findUnique({ where: { id } })
    if (produit) {
      nom = produit.nom
      desc = produit.description?.slice(0, 120) ?? desc
      prix = `${produit.prix.toLocaleString("fr-FR")} FCFA`
    }
  } catch {
    // Fallback to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a3a12 0%, #2D7A1F 60%, #3d9929 100%)",
          fontFamily: "serif",
          padding: "60px",
        }}
      >
        <div style={{ width: 80, height: 3, background: "#C8972A", marginBottom: 24 }} />
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: "#C8972A",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Le Surnaturel de Dieu
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 300,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: 20,
            maxWidth: 900,
          }}
        >
          {nom}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </div>
        {prix && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#C8972A",
              marginTop: 20,
            }}
          >
            {prix}
          </div>
        )}
        <div style={{ width: 80, height: 3, background: "#C8972A", marginTop: 32 }} />
      </div>
    ),
    { ...size }
  )
}
