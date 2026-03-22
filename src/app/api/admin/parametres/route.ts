import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { z } from "zod/v4"

const SETTINGS_DIR = join(process.cwd(), "data")
const SETTINGS_FILE = join(SETTINGS_DIR, "centre-settings.json")

const settingsSchema = z.object({
  nomCentre: z.string().max(200).optional(),
  adresse: z.string().max(500).optional(),
  telephone: z.string().max(30).optional(),
  email: z.email().optional(),
  horaires: z.string().max(1000).optional(),
})

async function readSettings() {
  try {
    const data = await readFile(SETTINGS_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return {
      nomCentre: "Le Surnaturel de Dieu",
      adresse: "",
      telephone: "",
      email: "",
      horaires: "",
    }
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const settings = await readSettings()
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = z.safeParse(settingsSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  await mkdir(SETTINGS_DIR, { recursive: true })
  await writeFile(SETTINGS_FILE, JSON.stringify(result.data, null, 2), "utf-8")

  return NextResponse.json(result.data)
}
