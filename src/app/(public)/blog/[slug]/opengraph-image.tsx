import { ImageResponse } from "next/og"

export const alt = "Article — Le Surnaturel de Dieu"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const titre = decodeURIComponent(slug).replace(/-/g, " ")

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
            fontSize: 18,
            fontWeight: 400,
            color: "#C8972A",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Blog — Le Surnaturel de Dieu
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 300,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          {titre}
        </div>
        <div style={{ width: 80, height: 3, background: "#C8972A", marginTop: 32 }} />
      </div>
    ),
    size,
  )
}
