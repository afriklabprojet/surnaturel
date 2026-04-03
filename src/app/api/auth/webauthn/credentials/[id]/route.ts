import { typedLogger as logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/auth/webauthn/credentials/[id] — Remove a passkey
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { id } = await params

    // Verify the credential belongs to the user
    const credential = await prisma.webAuthnCredential.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!credential) {
      return NextResponse.json({ error: "Passkey introuvable" }, { status: 404 })
    }

    // Delete the credential
    await prisma.webAuthnCredential.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("WebAuthn credential delete error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}
