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
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
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

  function handleReact(type: ReactionType) {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 400)
    onReact(type)
    setShowPicker(false)
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
        onClick={() => {
          handleReact(userReaction ?? "JAIME")
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-full py-2.5 font-body text-[13px] font-medium transition-all duration-150 hover:bg-bg-page ${
          userReaction ? "text-primary-brand" : "text-text-muted-brand hover:text-primary-brand"
        } ${isAnimating ? "scale-125" : "scale-100"}`}
      >
        <span
          className={`text-[18px] transition-transform duration-200 ${isAnimating ? "animate-bounce" : ""}`}
          style={{ animationDuration: "0.3s", animationIterationCount: 1 }}
        >
          {currentReaction?.emoji ?? "👍"}
        </span>
        <span>{currentReaction?.label ?? "J'aime"}</span>
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
          className="absolute bottom-full left-0 mb-2 flex items-end gap-1.5 px-3 py-2.5 bg-white border border-border-brand shadow-xl rounded-2xl z-20"
          style={{ animation: "fadeScaleIn 0.15s ease-out" }}
        >
          <style>{`
            @keyframes fadeScaleIn {
              from { opacity: 0; transform: scale(0.85); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => handleReact(r.type)}
              onMouseEnter={() => setHoveredReaction(r.type)}
              onMouseLeave={() => setHoveredReaction(null)}
              title={r.label}
              className={`flex flex-col items-center gap-0.5 px-1 py-0.5 rounded-xl transition-all duration-150 ${
                userReaction === r.type ? "bg-primary-light" : "hover:bg-bg-page"
              } ${hoveredReaction === r.type ? "-translate-y-2 scale-125" : "scale-100"}`}
            >
              <span className="text-[24px] leading-none">{r.emoji}</span>
              {hoveredReaction === r.type && (
                <span className="font-body text-[10px] font-semibold whitespace-nowrap absolute -bottom-5 left-1/2 -translate-x-1/2 bg-text-main text-white rounded-full px-1.5 py-0.5 shadow-sm z-30">
                  {r.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
