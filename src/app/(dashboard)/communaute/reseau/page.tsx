"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Users,
  Sparkles,
  Check,
  X,
  MapPin,
} from "lucide-react"

interface UserCard {
  id: string
  nom: string
  prenom: string
  pseudo?: string | null
  photoUrl?: string | null
  bio?: string | null
  statutProfil?: string | null
  centresInteret?: string[]
  localisation?: string | null
  score?: number
  postsCount?: number
}

interface PendingRequest {
  id: string
  demandeur: UserCard
  createdAt: string
}

function Avatar({ user, size = 44 }: { user: UserCard; size?: number }) {
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
  if (user.photoUrl) {
    return <img src={user.photoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-primary-brand text-white font-body font-medium" style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {initials}
    </div>
  )
}

/* ━━━━━━━━━━ Carte Utilisateur ━━━━━━━━━━ */

function UserCardItem({
  user,
  actionButton,
}: {
  user: UserCard
  actionButton: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 bg-white border border-border-brand p-4">
      <Link href={`/communaute/profil/${user.id}`}>
        <Avatar user={user} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/communaute/profil/${user.id}`} className="font-body text-[13px] font-medium text-text-main hover:text-gold transition-colors">
          {user.prenom} {user.nom}
          {user.pseudo && <span className="text-text-muted-brand font-normal ml-1">@{user.pseudo}</span>}
        </Link>
        {user.bio && <p className="font-body text-[11px] text-text-mid mt-0.5 line-clamp-2">{user.bio}</p>}
        {user.localisation && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={10} className="text-text-muted-brand" />
            <span className="font-body text-[10px] text-text-muted-brand">{user.localisation}</span>
          </div>
        )}
        {user.centresInteret && user.centresInteret.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {user.centresInteret.slice(0, 3).map((i) => (
              <span key={i} className="px-2 py-0.5 bg-primary-light font-body text-[9px] text-primary-brand rounded-full">{i}</span>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0">{actionButton}</div>
    </div>
  )
}

/* ━━━━━━━━━━ Page Réseau ━━━━━━━━━━ */

const TABS = [
  { key: "connexions", label: "Mes connexions", icon: Users },
  { key: "demandes", label: "Demandes", icon: Clock },
  { key: "envoyees", label: "Envoyées", icon: UserPlus },
  { key: "suggestions", label: "Suggestions", icon: Sparkles },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default function PageReseau() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>}>
      <PageReseauContent />
    </Suspense>
  )
}

function PageReseauContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as TabKey) || "connexions"

  const [tab, setTab] = useState<TabKey>(initialTab)
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<UserCard[]>([])
  const [demandes, setDemandes] = useState<PendingRequest[]>([])
  const [envoyees, setEnvoyees] = useState<UserCard[]>([])
  const [suggestions, setSuggestions] = useState<UserCard[]>([])
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/communaute/reseau")
  }, [status, router])

  const fetchData = useCallback(async (t: TabKey) => {
    setLoading(true)
    try {
      if (t === "connexions") {
        const res = await fetch("/api/communaute/connexions?type=all")
        if (res.ok) {
          const data = await res.json()
          setContacts(data.contacts || [])
        }
      } else if (t === "demandes") {
        const res = await fetch("/api/communaute/connexions?type=pending")
        if (res.ok) {
          const data = await res.json()
          setDemandes(data.demandes || [])
        }
      } else if (t === "envoyees") {
        const res = await fetch("/api/communaute/connexions?type=sent")
        if (res.ok) {
          const data = await res.json()
          setEnvoyees((data.envoyees || []).map((e: { destinataire: UserCard }) => e.destinataire))
        }
      } else if (t === "suggestions") {
        const res = await fetch("/api/communaute/suggestions")
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.suggestions || [])
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") fetchData(tab)
  }, [status, tab, fetchData])

  async function handleAccept(connexionId: string) {
    setActionLoading((prev) => ({ ...prev, [connexionId]: true }))
    await fetch("/api/communaute/connexions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connexionId, action: "accepter" }),
    })
    setDemandes((prev) => prev.filter((d) => d.id !== connexionId))
    setActionLoading((prev) => ({ ...prev, [connexionId]: false }))
  }

  async function handleRefuse(connexionId: string) {
    setActionLoading((prev) => ({ ...prev, [connexionId]: true }))
    await fetch("/api/communaute/connexions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connexionId, action: "refuser" }),
    })
    setDemandes((prev) => prev.filter((d) => d.id !== connexionId))
    setActionLoading((prev) => ({ ...prev, [connexionId]: false }))
  }

  async function handleRemove(userId: string) {
    setActionLoading((prev) => ({ ...prev, [userId]: true }))
    await fetch(`/api/communaute/connexions?userId=${userId}`, { method: "DELETE" })
    setContacts((prev) => prev.filter((c) => c.id !== userId))
    setActionLoading((prev) => ({ ...prev, [userId]: false }))
  }

  async function handleConnect(userId: string) {
    setActionLoading((prev) => ({ ...prev, [userId]: true }))
    await fetch("/api/communaute/connexions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: userId }),
    })
    setSuggestions((prev) => prev.filter((s) => s.id !== userId))
    setActionLoading((prev) => ({ ...prev, [userId]: false }))
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      {/* Onglets */}
      <div className="flex gap-1 bg-white border border-border-brand p-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-body text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${
                active ? "bg-primary-brand text-white" : "text-text-muted-brand hover:text-text-mid hover:bg-bg-page"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Onglet Connexions */}
          {tab === "connexions" && (
            contacts.length === 0 ? (
              <EmptyState icon={Users} title="Aucune connexion" description="Envoyez des demandes pour développer votre réseau" />
            ) : (
              contacts.map((c) => (
                <UserCardItem
                  key={c.id}
                  user={c}
                  actionButton={
                    <div className="flex items-center gap-1">
                      <Link href={`/communaute/profil/${c.id}`} className="px-3 py-1.5 border border-border-brand font-body text-[10px] font-medium uppercase tracking-wider text-text-mid hover:border-gold hover:text-gold transition-colors">
                        Profil
                      </Link>
                      <button
                        onClick={() => handleRemove(c.id)}
                        disabled={actionLoading[c.id]}
                        className="p-1.5 text-text-muted-brand hover:text-danger transition-colors"
                        title="Retirer"
                      >
                        {actionLoading[c.id] ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                      </button>
                    </div>
                  }
                />
              ))
            )
          )}

          {/* Onglet Demandes */}
          {tab === "demandes" && (
            demandes.length === 0 ? (
              <EmptyState icon={Clock} title="Aucune demande" description="Vous n'avez pas de demande de connexion en attente" />
            ) : (
              demandes.map((d) => (
                <UserCardItem
                  key={d.id}
                  user={d.demandeur}
                  actionButton={
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAccept(d.id)}
                        disabled={actionLoading[d.id]}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-brand text-white font-body text-[10px] font-medium uppercase tracking-wider hover:bg-primary-dark transition-colors disabled:opacity-40"
                      >
                        {actionLoading[d.id] ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Accepter
                      </button>
                      <button
                        onClick={() => handleRefuse(d.id)}
                        disabled={actionLoading[d.id]}
                        className="p-1.5 text-text-muted-brand hover:text-danger transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  }
                />
              ))
            )
          )}

          {/* Onglet Envoyées */}
          {tab === "envoyees" && (
            envoyees.length === 0 ? (
              <EmptyState icon={UserPlus} title="Aucune demande envoyée" description="Envoyez des demandes de connexion depuis les suggestions" />
            ) : (
              envoyees.map((u) => (
                <UserCardItem
                  key={u.id}
                  user={u}
                  actionButton={
                    <span className="flex items-center gap-1 px-3 py-1.5 border border-gold-light bg-gold-light font-body text-[10px] font-medium uppercase tracking-wider text-gold">
                      <Clock size={12} />
                      En attente
                    </span>
                  }
                />
              ))
            )
          )}

          {/* Onglet Suggestions */}
          {tab === "suggestions" && (
            suggestions.length === 0 ? (
              <EmptyState icon={Sparkles} title="Aucune suggestion" description="Complétez votre profil pour recevoir des suggestions personnalisées" />
            ) : (
              suggestions.map((s) => (
                <UserCardItem
                  key={s.id}
                  user={s}
                  actionButton={
                    <button
                      onClick={() => handleConnect(s.id)}
                      disabled={actionLoading[s.id]}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-brand text-white font-body text-[10px] font-medium uppercase tracking-wider hover:bg-primary-dark transition-colors disabled:opacity-40"
                    >
                      {actionLoading[s.id] ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                      Connecter
                    </button>
                  }
                />
              ))
            )
          )}
        </div>
      )}
    </section>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center bg-primary-light rounded-full mb-3">
        <Icon size={24} className="text-primary-brand" />
      </div>
      <p className="font-display text-[16px] font-light text-text-main">{title}</p>
      <p className="font-body text-[11px] text-text-muted-brand mt-1">{description}</p>
    </div>
  )
}
