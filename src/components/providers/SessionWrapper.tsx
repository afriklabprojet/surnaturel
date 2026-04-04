"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

export default function SessionWrapper({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider
      session={session}
      // Ne pas re-fetch la session au focus (évite des re-renders en production)
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}
