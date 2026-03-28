"use client"

import { useState } from "react"
import { Search, Plus, X, Loader2, MessageSquare } from "lucide-react"

interface Interlocuteur {
  id: string
  nom: string
  prenom: string
  photoUrl: string | null
}

interface Conversation {
  interlocuteur: Interlocuteur
  dernierMessage: {
    contenu: string
    createdAt: string
    expediteurId: string
  }
  nonLus: number
}

interface ListeConversationsProps {
  conversations: Conversation[]
  activeUserId: string | null
  currentUserId: string
  onSelect: (interlocuteur: Interlocuteur) => void
  onNewConversation: (interlocuteur: Interlocuteur) => void
}

// ─── Couleurs avatar stables par nom ─────────────────────────────

const AVATAR_COLORS = [
  { bg: "var(--color-primary-light)", text: "var(--color-primary-brand)" }, // vert clair
  { bg: "var(--color-gold-light)", text: "var(--color-gold)" }, // or clair
  { bg: "#E0F2FE", text: "#0E7490" }, // bleu clair
  { bg: "#FDE8EF", text: "#DB2777" }, // rose clair
  { bg: "#EDE9FE", text: "#7C3AED" }, // violet clair
  { bg: "#FEF3C7", text: "#D97706" }, // ambre clair
  { bg: "#ECFDF5", text: "#059669" }, // emeraude clair
  { bg: "#F0FDF4", text: "var(--color-primary-dark)" }, // vert foncé clair
]

function getAvatarStyle(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function Avatar({
  nom,
  prenom,
  size = 36,
  enLigne,
}: {
  nom: string
  prenom: string
  size?: number
  enLigne?: boolean
}) {
  const initiales = `${(prenom?.[0] ?? "").toUpperCase()}${(nom?.[0] ?? "").toUpperCase()}`
  const style = getAvatarStyle(prenom + nom)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        <span
          className="font-body font-medium"
          style={{ fontSize: size * 0.33 }}
        >
          {initiales}
        </span>
      </div>
      {enLigne && (
        <span
          className="absolute bottom-0 right-0 block rounded-full bg-primary-brand ring-2 ring-white"
          style={{ width: 9, height: 9 }}
        />
      )}
    </div>
  )
}

// ─── Formatage heure relative ────────────────────────────────────

function formatHeure(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const oneDay = 86400000

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("fr", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  if (diff < 2 * oneDay) return "Hier"
  return date.toLocaleDateString("fr", { day: "2-digit", month: "2-digit" })
}

// ─── Component ───────────────────────────────────────────────────

export default function ListeConversations({
  conversations,
  activeUserId,
  currentUserId,
  onSelect,
  onNewConversation,
}: ListeConversationsProps) {
  const [recherche, setRecherche] = useState("")
  const [showNewModal, setShowNewModal] = useState(false)

  const filtered = conversations.filter((c) => {
    const fullName =
      `${c.interlocuteur.prenom} ${c.interlocuteur.nom}`.toLowerCase()
    return fullName.includes(recherche.toLowerCase())
  })

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ─── En-tête sidebar ─── */}
      <div className="border-b border-border-brand px-4 py-4">
        <h2 className="font-display text-[20px] font-normal text-text-main">
          Communauté
        </h2>

        {/* Recherche */}
        <div className="relative mt-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand"
          />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une conversation..."
            className="w-full border border-border-brand bg-bg-page py-2 pl-8 pr-3 font-body text-[12px] font-light text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold transition-colors duration-200"
          />
        </div>

        {/* Nouvelle conversation */}
        <button
          onClick={() => setShowNewModal(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-primary-brand px-4 py-2 font-body text-[11px] uppercase tracking-widest text-primary-brand transition-colors duration-200 hover:bg-primary-brand hover:text-white"
        >
          <Plus size={14} />
          Nouvelle conversation
        </button>
      </div>

      {/* ─── Liste conversations ─── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <MessageSquare size={32} className="text-border-brand" />
            <p className="mt-3 font-body text-[12px] font-light text-text-muted-brand">
              {recherche ? "Aucun résultat" : "Aucune conversation"}
            </p>
          </div>
        ) : (
          <>
            {/* Label section */}
            <div className="px-4 pt-4 pb-2">
              <span className="font-body text-[9px] uppercase tracking-[0.2em] text-text-muted-brand">
                Récentes
              </span>
            </div>

            {filtered.map((conv) => {
              const isActive = activeUserId === conv.interlocuteur.id
              const isMine =
                conv.dernierMessage.expediteurId === currentUserId
              const apercu =
                conv.dernierMessage.contenu.slice(0, 40) +
                (conv.dernierMessage.contenu.length > 40 ? "…" : "")

              return (
                <button
                  key={conv.interlocuteur.id}
                  onClick={() => onSelect(conv.interlocuteur)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 border-l-2 ${
                    isActive
                      ? "border-l-gold bg-bg-page"
                      : "border-l-transparent hover:bg-bg-page"
                  }`}
                >
                  <Avatar
                    nom={conv.interlocuteur.nom}
                    prenom={conv.interlocuteur.prenom}
                    size={36}
                    enLigne
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-display text-[14px] font-normal text-text-main">
                        {conv.interlocuteur.prenom} {conv.interlocuteur.nom}
                      </span>
                      <span className="shrink-0 font-body text-[10px] text-text-muted-brand">
                        {formatHeure(conv.dernierMessage.createdAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span
                        className={`truncate font-body text-[11px] leading-relaxed ${
                          conv.nonLus > 0
                            ? "font-normal text-text-main"
                            : "font-light text-text-muted-brand"
                        }`}
                      >
                        {isMine ? "Vous : " : ""}
                        {apercu}
                      </span>
                      {conv.nonLus > 0 && (
                        <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-brand px-1.5 font-body text-[10px] font-medium text-white">
                          {conv.nonLus > 99 ? "99+" : conv.nonLus}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </>
        )}
      </div>

      {/* ─── Modale nouvelle conversation ─── */}
      {showNewModal && (
        <NouvelleConversationModal
          onClose={() => setShowNewModal(false)}
          onSelect={(user) => {
            onNewConversation(user)
            setShowNewModal(false)
          }}
          excludeIds={[
            currentUserId,
            ...conversations.map((c) => c.interlocuteur.id),
          ]}
        />
      )}
    </div>
  )
}

// ─── Modale nouvelle conversation ────────────────────────────────

function NouvelleConversationModal({
  onClose,
  onSelect,
  excludeIds,
}: {
  onClose: () => void
  onSelect: (user: Interlocuteur) => void
  excludeIds: string[]
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Interlocuteur[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(q: string) {
    setQuery(q)
    if (debounceRef[0]) clearTimeout(debounceRef[0])
    if (q.length < 2) {
      setResults([])
      return
    }
    debounceRef[0] = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/messages/recherche-utilisateurs?q=${encodeURIComponent(q)}`
        )
        if (res.ok) {
          const data: { utilisateurs: Interlocuteur[] } = await res.json()
          setResults(
            data.utilisateurs.filter((u) => !excludeIds.includes(u.id))
          )
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-120 border border-border-brand bg-white shadow-xl">
        {/* Header modale */}
        <div className="flex items-center justify-between border-b border-border-brand px-6 py-4">
          <h3 className="font-display text-[22px] font-normal text-text-main">
            Nouvelle conversation
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-border-brand text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold"
          >
            <X size={16} />
          </button>
        </div>

        {/* Recherche */}
        <div className="p-6">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-brand"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              autoFocus
              className="w-full border border-border-brand bg-bg-page py-2.5 pl-8 pr-3 font-body text-[12px] font-light text-text-main outline-none placeholder:text-text-muted-brand/60 focus:border-gold transition-colors duration-200"
            />
          </div>

          {/* Résultats */}
          <div className="mt-4 max-h-60 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-gold" />
              </div>
            )}
            {!loading && results.length === 0 && query.length >= 2 && (
              <p className="py-6 text-center font-body text-[12px] font-light text-text-muted-brand">
                Aucun utilisateur trouvé
              </p>
            )}
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-200 hover:bg-bg-page"
              >
                <Avatar nom={u.nom} prenom={u.prenom} size={36} />
                <div>
                  <span className="font-display text-[14px] font-normal text-text-main">
                    {u.prenom} {u.nom}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
