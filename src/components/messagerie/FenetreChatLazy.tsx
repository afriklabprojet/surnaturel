"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import type { ComponentProps } from "react"
import type FenetreChatType from "./FenetreChat"

const FenetreChat = dynamic(() => import("./FenetreChat"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
    </div>
  ),
})

export default function FenetreChatLazy(props: ComponentProps<typeof FenetreChatType>) {
  return <FenetreChat {...props} />
}
