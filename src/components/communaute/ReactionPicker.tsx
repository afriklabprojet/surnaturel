"use client"

import { useState, useEffect, useRef } from "react"
import { REACTIONS, type ReactionType } from "./types"

export function ReactionPicker({
  userReaction,
  reactionCounts,
  reactionsCount,
  onReact,
}: {
  userReaction: ReactionType | null
  reactionCounts: Record<string, number>
  reactionsCount: number
  onReact: (type: ReactionType) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const currentReaction = REACTIONS.find((r) => r.type === userReaction)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showPicker])

  function handleMouseEnter() {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPicker(true), 300)
  }

  function handleMouseLeave() {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPicker(false), 400)
  }

  const topReactions = Object.entries(reactionCounts ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji)
    .filter(Boolean)

  return (
    <div className="relative flex-1" ref={pickerRef}>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onReact(userReaction ?? "JAIME")}
        className={`flex w-full items-center justify-center gap-2 py-2.5 font-body text-[12px] font-medium transition-colors ${
          userReaction ? "text-gold" : "text-text-muted-brand hover:text-gold"
        }`}
      >
        <span className="text-[15px]">{currentReaction?.emoji ?? "👍"}</span>
        {currentReaction?.label ?? "Réagir"}
      </button>

      {reactionsCount > 0 && (
        <div className="absolute -top-7 left-2 flex items-center gap-1 px-2 py-0.5 bg-white border border-border-brand rounded-full shadow-sm pointer-events-none">
          {topReactions.map((emoji, i) => (
            <span key={i} className="text-[12px]">{emoji}</span>
          ))}
          <span className="font-body text-xs text-text-muted-brand ml-0.5">{reactionsCount}</span>
        </div>
      )}

      {showPicker && (
        <div
          onMouseEnter={() => clearTimeout(timeoutRef.current)}
          onMouseLeave={handleMouseLeave}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-2 py-1.5 bg-white border border-border-brand shadow-lg rounded-full z-20"
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => { onReact(r.type); setShowPicker(false) }}
              title={r.label}
              className={`px-1.5 py-0.5 rounded-full transition-transform hover:scale-125 ${
                userReaction === r.type ? "bg-gold-light" : ""
              }`}
            >
              <span className="text-[20px]">{r.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
