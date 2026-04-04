import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SITE_URL } from "@/lib/site"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(
      new URL("/connexion?verification=invalid", SITE_URL)
    )
  }

  const user = await prisma.user.findUnique({
    where: { emailVerifToken: token },
    select: { id: true, emailVerifie: true, emailVerifExpiry: true },
  })

  if (!user) {
    return NextResponse.redirect(
      new URL("/connexion?verification=invalid", SITE_URL)
    )
  }

  if (user.emailVerifie) {
    return NextResponse.redirect(
      new URL("/connexion?verification=already", SITE_URL)
    )
  }

  if (user.emailVerifExpiry && user.emailVerifExpiry < new Date()) {
    return NextResponse.redirect(
      new URL("/connexion?verification=expired", SITE_URL)
    )
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifie: true,
      emailVerifToken: null,
      emailVerifExpiry: null,
    },
  })

  return NextResponse.redirect(
    new URL("/connexion?verification=ok", SITE_URL)
  )
}
