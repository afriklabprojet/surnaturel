import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Le Surnaturel de Dieu — Institut de Bien-Être à Abidjan"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
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
        {/* Decorative top accent */}
        <div
          style={{
            width: "80px",
            height: "3px",
            background: "#C8972A",
            marginBottom: "32px",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "300",
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "0.02em",
            lineHeight: 1.15,
            marginBottom: "16px",
          }}
        >
          Le Surnaturel de Dieu
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "26px",
            fontWeight: "300",
            color: "#C8972A",
            textAlign: "center",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          Institut de Bien-Être · Abidjan
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          Hammam · Soins du visage · Gommage · Post-accouchement · Sage-femme
        </div>

        {/* Bottom accent */}
        <div
          style={{
            width: "80px",
            height: "3px",
            background: "#C8972A",
            marginTop: "32px",
          }}
        />
      </div>
    ),
    size
  )
}
