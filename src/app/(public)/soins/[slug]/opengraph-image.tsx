import { ImageResponse } from "next/og"
import { SOINS_DATA } from "@/lib/soins-data"

export const runtime = "edge"
export const alt = "Soin — Le Surnaturel de Dieu"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const soin = SOINS_DATA.find((s) => s.slug === slug)
  const titre = soin?.nom ?? "Soin"
  const desc = soin?.description?.slice(0, 120) ?? "Institut de Bien-Être à Abidjan"

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
          {titre}
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
        <div style={{ width: 80, height: 3, background: "#C8972A", marginTop: 32 }} />
      </div>
    ),
    size,
  )
}
