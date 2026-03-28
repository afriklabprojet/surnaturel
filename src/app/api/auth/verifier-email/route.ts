import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(
      new URL("/connexion?verification=invalid", req.url)
    )
  }

  const user = await prisma.user.findUnique({
    where: { emailVerifToken: token },
    select: { id: true, emailVerifie: true, emailVerifExpiry: true },
  })

  if (!user) {
    return NextResponse.redirect(
      new URL("/connexion?verification=invalid", req.url)
    )
  }

  if (user.emailVerifie) {
    return NextResponse.redirect(
      new URL("/connexion?verification=already", req.url)
    )
  }

  if (user.emailVerifExpiry && user.emailVerifExpiry < new Date()) {
    return NextResponse.redirect(
      new URL("/connexion?verification=expired", req.url)
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
    new URL("/connexion?verification=ok", req.url)
  )
}
