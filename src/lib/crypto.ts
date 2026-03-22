import crypto from "crypto"

const ALGORITHME = "aes-256-gcm"

function getCle(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY manquante dans .env.local")
  return Buffer.from(key, "base64")
}

export function encrypt(texte: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHME, getCle(), iv)
  const chiffre = Buffer.concat([
    cipher.update(texte, "utf8"),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()
  return [
    iv.toString("hex"),
    tag.toString("hex"),
    chiffre.toString("hex")
  ].join(":")
}

export function decrypt(donnee: string): string {
  const [ivHex, tagHex, chiffreHex] = donnee.split(":")
  const iv      = Buffer.from(ivHex,      "hex")
  const tag     = Buffer.from(tagHex,     "hex")
  const chiffre = Buffer.from(chiffreHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHME, getCle(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(chiffre),
    decipher.final()
  ]).toString("utf8")
}
