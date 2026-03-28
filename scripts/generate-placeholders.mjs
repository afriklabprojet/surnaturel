// Generate professional SVG placeholder images for the site
import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, "..", "public")

function svg(width, height, bgFrom, bgTo, icon, label, sublabel = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgFrom}"/>
      <stop offset="100%" style="stop-color:${bgTo}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <text x="50%" y="${sublabel ? '42%' : '48%'}" text-anchor="middle" font-family="Georgia,serif" font-size="${Math.round(width * 0.06)}" fill="#B8972A" opacity="0.6">${icon}</text>
  <text x="50%" y="${sublabel ? '58%' : '60%'}" text-anchor="middle" font-family="Georgia,serif" font-size="${Math.round(width * 0.035)}" font-weight="300" fill="#2D7A1F" opacity="0.5">${label}</text>
  ${sublabel ? `<text x="50%" y="70%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(width * 0.022)}" fill="#8A8A8A" opacity="0.6">${sublabel}</text>` : ""}
</svg>`
}

// Hero image
mkdirSync(join(PUBLIC, "images"), { recursive: true })
writeFileSync(
  join(PUBLIC, "images", "hero.svg"),
  svg(1200, 960, "#E8F5E3", "#FAFAF7", "✿", "Le Surnaturel de Dieu", "Institut de bien-être — Abidjan")
)

// Fondatrice image
writeFileSync(
  join(PUBLIC, "images", "fondatrice.svg"),
  svg(600, 750, "#E8F5E3", "#F5EDD6", "♀", "Marie Jeanne", "Fondatrice")
)

// Placeholder produit generique
writeFileSync(
  join(PUBLIC, "images", "placeholder-produit.svg"),
  svg(600, 600, "#FAFAF7", "#E8E4DC", "✦", "Produit", "Le Surnaturel de Dieu")
)

// Product images
const produits = [
  { file: "beurre-karite", icon: "◉", label: "Beurre de Karite" },
  { file: "huile-coco", icon: "◉", label: "Huile de Coco" },
  { file: "savon-noir", icon: "◉", label: "Savon Noir" },
  { file: "serum-curcuma", icon: "✧", label: "Serum Curcuma" },
  { file: "creme-aloe", icon: "✧", label: "Creme Aloe Vera" },
  { file: "masque-argile", icon: "✧", label: "Masque Argile" },
  { file: "infusion-detox", icon: "❋", label: "Infusion Detox" },
  { file: "he-citronnelle", icon: "❋", label: "HE Citronnelle" },
  { file: "kit-post-accouchement", icon: "❋", label: "Kit Post-Accouchement" },
]

mkdirSync(join(PUBLIC, "images", "produits"), { recursive: true })
for (const p of produits) {
  writeFileSync(
    join(PUBLIC, "images", "produits", `${p.file}.svg`),
    svg(600, 600, "#FAFAF7", "#F5EDD6", p.icon, p.label)
  )
}

// Payment logos
const logos = [
  { file: "wave", label: "Wave", color: "#1DC3E0" },
  { file: "orange-money", label: "Orange Money", color: "#FF6600" },
  { file: "mtn", label: "MTN MoMo", color: "#FFCC00" },
  { file: "moov", label: "Moov Money", color: "#0066CC" },
  { file: "djamo", label: "Djamo", color: "#000000" },
]

for (const l of logos) {
  writeFileSync(
    join(PUBLIC, "logos", `${l.file}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
  <rect width="120" height="60" rx="8" fill="white" stroke="#E8E4DC" stroke-width="1"/>
  <text x="50%" y="55%" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="600" fill="${l.color}">${l.label}</text>
</svg>`
  )
}

console.log("All placeholder SVGs generated in public/")
