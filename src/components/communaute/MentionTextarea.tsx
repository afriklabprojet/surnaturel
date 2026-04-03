"use client"

import { useState, useRef } from "react"
import type { MentionUser } from "./types"
import { Avatar } from "./AvatarCommunaute"

export function MentionTextarea({
  value,
  onChange,
  onMentionSelect,
  placeholder,
  maxLength,
  rows,
  className,
}: {
  value: string
  onChange: (val: string) => void
  onMentionSelect?: (user: MentionUser) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  className?: string
}) {
  const [suggestions, setSuggestions] = useState<MentionUser[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPos, setCursorPos] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const fetchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  function detectMention(text: string, cursor: number) {
    const before = text.slice(0, cursor)
    const match = before.match(/@([a-zA-ZÀ-ÿ0-9_]*)$/)
    return match ? match[1] : null
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value
    const cursor = e.target.selectionStart || 0
    onChange(newValue)
    setCursorPos(cursor)

    const query = detectMention(newValue, cursor)
    if (query !== null && query.length >= 1) {
      setSelectedIdx(0)
      clearTimeout(fetchTimeout.current)
      fetchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/communaute/mentions?q=${encodeURIComponent(query)}`)
          if (res.ok) {
            const data = await res.json()
            setSuggestions(data.users || [])
            setShowSuggestions((data.users || []).length > 0)
          }
        } catch {
          setShowSuggestions(false)
        }
      }, 200)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  function insertMention(user: MentionUser) {
    const before = value.slice(0, cursorPos)
    const after = value.slice(cursorPos)
    const mentionStart = before.lastIndexOf("@")
    const pseudo = user.pseudo || `${user.prenom}${user.nom}`.replace(/\s/g, "")
    const newText = before.slice(0, mentionStart) + `@${pseudo} ` + after
    onChange(newText)
    setShowSuggestions(false)
    setSuggestions([])
    onMentionSelect?.(user)
    setTimeout(() => {
      const newPos = mentionStart + pseudo.length + 2
      textareaRef.current?.setSelectionRange(newPos, newPos)
      textareaRef.current?.focus()
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && showSuggestions) {
      e.preventDefault()
      insertMention(suggestions[selectedIdx])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto border border-border-brand bg-white shadow-lg"
        >
          {suggestions.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(user) }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                i === selectedIdx ? "bg-bg-page" : "hover:bg-bg-page"
              }`}
            >
              <Avatar user={user} size={28} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[12px] font-medium text-text-main truncate">
                  {user.prenom} {user.nom}
                </p>
                {user.pseudo && (
                  <p className="font-body text-xs text-text-muted-brand">@{user.pseudo}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
