"use client"

import dynamic from "next/dynamic"

const ChatIA = dynamic(() => import("./ChatIA"), { ssr: false })

export default function ChatIALazy() {
  return <ChatIA />
}
