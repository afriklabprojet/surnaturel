"use client"

import dynamic from "next/dynamic"

const ChatBubble = dynamic(() => import("./ChatBubble"), { ssr: false })

export default function ChatBubbleLazy() {
  return <ChatBubble />
}
