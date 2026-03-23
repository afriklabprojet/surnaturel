"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  UserPlus,
  UserCheck,
  UserMinus,
  Eye,
  MapPin,
  Calendar,
  MessageCircle,
  ArrowLeft,
  Shield,
  Flag,
  Ban,
  Languages,
  Briefcase,
  Clock,
  CalendarPlus,
} from "lucide-react"
import BadgeVerification from "@/components/ui/BadgeVerification"

interface ProfilDetailData {
  ville: string | null
  languesParlees: string[]
  specialite: string | null
  numeroOrdre: string | null
  joursDisponibilite: string[]
  horairesDisponibilite: string | null
  languesConsultation: string[]
}

interface ProfilData {
  id: string
  nom: string
  prenom: string
  pseudo: string | null
  photoUrl: string | null
  couvertureUrl: string | null
  bio: string | null
  centresInteret: string[]
  localisation: string | null
  profilPublic: boolean
  statutProfil: string
  role: string
  verificationStatus: string
  profilDetail: ProfilDetailData | null
  createdAt: string
  totalConnexions: number
  totalAbonnes: number
  totalPosts: number
  isOwn: boolean
  isConnected: boolean
  isFollowing: boolean
  connectionStatus: string | null
}

interface PostData {
  id: string
  contenu: string
  createdAt: string
  _count: { reactions: number; commentaires: number }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}j`
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export default function PageProfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profil, setProfil] = useState<ProfilData | null>(null)
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion")
  }, [status, router])

  const fetchProfil = useCallback(async () => {
    setLoading(true)
    try {
      const [profilRes, postsRes] = await Promise.all([
        fetch(`/api/communaute/profil?userId=${id}`),
        fetch(`/api/communaute/posts?userId=${id}&limit=10`),
      ])
      if (profilRes.ok) {
        const data = await profilRes.json()
        setProfil(data)
      }
      if (postsRes.ok) {
        const data = await postsRes.json()
        setPosts(data.posts || [])
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (status === "authenticated") fetchProfil()
  }, [status, fetchProfil])

  async function handleConnect() {
    if (!profil || actionLoading) return
    setActionLoading(true)
    try {
      if (profil.isConnected) {
        await fetch(`/api/communaute/connexions?userId=${id}`, { method: "DELETE" })
        setProfil((p) => p ? { ...p, isConnected: false, connectionStatus: null, totalConnexions: p.totalConnexions - 1 } : p)
      } else if (profil.connectionStatus === "EN_ATTENTE") {
        // Cancel not implemented yet, just note it
      } else {
        await fetch("/api/communaute/connexions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinataireId: id }),
        })
        setProfil((p) => p ? { ...p, connectionStatus: "EN_ATTENTE" } : p)
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handleFollow() {
    if (!profil || actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/communaute/abonnements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiviId: id }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfil((p) => p ? { ...p, isFollowing: data.following, totalAbonnes: p.totalAbonnes + (data.following ? 1 : -1) } : p)
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handleBlock() {
    if (!profil) return
    await fetch("/api/communaute/blocages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bloqueId: id }),
    })
    router.push("/communaute")
  }

  async function handleReport() {
    await fetch("/api/communaute/signalements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "MEMBRE", cibleId: id, raison: "Comportement inapproprié" }),
    })
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-gold" /></div>
  }

  if (!profil) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-[18px] font-light text-text-main">Profil introuvable</p>
        <Link href="/communaute" className="font-body text-[12px] text-gold hover:text-gold-dark mt-2 inline-block">Retour à la communauté</Link>
      </div>
    )
  }

  const initials = `${profil.prenom?.[0] ?? ""}${profil.nom?.[0] ?? ""}`.toUpperCase()

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <Link href="/communaute" className="inline-flex items-center gap-1.5 font-body text-[11px] text-text-muted-brand hover:text-text-mid transition-colors">
        <ArrowLeft size={14} />
        Retour
      </Link>

      {/* Carte profil */}
      <div className="bg-white border border-border-brand overflow-hidden">
        {/* Couverture */}
        {profil.couvertureUrl ? (
          <img src={profil.couvertureUrl} alt="" className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-linear-to-r from-primary-light to-gold-light" />
        )}

        <div className="px-5 pb-5">
          {/* Avatar + infos */}
          <div className="flex items-end gap-4 -mt-10">
            {profil.photoUrl ? (
              <img src={profil.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow" />
            ) : (
              <div className="flex w-20 h-20 items-center justify-center rounded-full bg-primary-brand text-white border-4 border-white shadow font-display text-[24px] font-light">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="font-display text-[22px] font-light text-text-main truncate">
                {profil.prenom} {profil.nom}
                <BadgeVerification status={profil.verificationStatus} size={16} className="ml-1.5 align-middle" />
              </h1>
              {profil.pseudo && <p className="font-body text-[12px] text-text-muted-brand">@{profil.pseudo}</p>}
            </div>
          </div>

          {/* Bio */}
          {profil.bio && <p className="font-body text-[13px] text-text-mid leading-relaxed mt-3">{profil.bio}</p>}

          {/* Infos */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {profil.localisation && (
              <span className="font-body text-[11px] text-text-muted-brand flex items-center gap-1"><MapPin size={12} />{profil.localisation}</span>
            )}
            <span className="font-body text-[11px] text-text-muted-brand flex items-center gap-1">
              <Calendar size={12} />
              Membre depuis {new Date(profil.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
            {profil.statutProfil === "PRO_SANTE" && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-light font-body text-[9px] font-medium text-primary-brand uppercase tracking-wider rounded-full">
                <Shield size={10} />
                Professionnel de santé
              </span>
            )}
          </div>

          {/* Centres d'intérêt */}
          {profil.centresInteret.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profil.centresInteret.map((i) => (
                <span key={i} className="px-2.5 py-0.5 bg-bg-page border border-border-brand font-body text-[10px] text-text-mid rounded-full">{i}</span>
              ))}
            </div>
          )}

          {/* Statistiques */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border-brand">
            <div className="text-center">
              <p className="font-display text-[20px] font-light text-text-main">{profil.totalPosts}</p>
              <p className="font-body text-[10px] uppercase tracking-wider text-text-muted-brand">Publications</p>
            </div>
            <div className="text-center">
              <p className="font-display text-[20px] font-light text-text-main">{profil.totalConnexions}</p>
              <p className="font-body text-[10px] uppercase tracking-wider text-text-muted-brand">Connexions</p>
            </div>
            <div className="text-center">
              <p className="font-display text-[20px] font-light text-text-main">{profil.totalAbonnes}</p>
              <p className="font-body text-[10px] uppercase tracking-wider text-text-muted-brand">Abonnés</p>
            </div>
          </div>

          {/* Actions */}
          {!profil.isOwn && (
            <div className="flex items-center gap-2 mt-4">
              {/* Bouton RDV pour professionnels vérifiés */}
              {profil.verificationStatus === "PROFESSIONNEL_SANTE" && (
                <Link
                  href="/prise-rdv"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white font-body text-[11px] font-medium uppercase tracking-widest hover:bg-gold-dark transition-colors"
                >
                  <CalendarPlus size={13} />
                  Prendre RDV
                </Link>
              )}
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-widest transition-colors ${
                  profil.isConnected
                    ? "border border-danger text-danger hover:bg-danger hover:text-white"
                    : profil.connectionStatus === "EN_ATTENTE"
                    ? "border border-gold text-gold"
                    : "bg-primary-brand text-white hover:bg-primary-dark"
                }`}
              >
                {actionLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : profil.isConnected ? (
                  <><UserMinus size={13} />Déconnecter</>
                ) : profil.connectionStatus === "EN_ATTENTE" ? (
                  <><UserCheck size={13} />En attente</>
                ) : (
                  <><UserPlus size={13} />Se connecter</>
                )}
              </button>
              <button
                onClick={handleFollow}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-widest border transition-colors ${
                  profil.isFollowing
                    ? "border-gold bg-gold-light text-gold"
                    : "border-border-brand text-text-mid hover:border-gold hover:text-gold"
                }`}
              >
                <Eye size={13} />
                {profil.isFollowing ? "Abonné" : "Suivre"}
              </button>
              <div className="ml-auto flex items-center gap-1">
                <Link
                  href={`/communaute/messages?to=${id}`}
                  className="p-2 text-text-muted-brand hover:text-gold transition-colors"
                  title="Envoyer un message"
                >
                  <MessageCircle size={14} />
                </Link>
                <button onClick={handleReport} className="p-2 text-text-muted-brand hover:text-gold transition-colors" title="Signaler">
                  <Flag size={14} />
                </button>
                <button onClick={handleBlock} className="p-2 text-text-muted-brand hover:text-danger transition-colors" title="Bloquer">
                  <Ban size={14} />
                </button>
              </div>
            </div>
          )}
          {profil.isOwn && (
            <div className="mt-4">
              <Link href="/profil" className="inline-flex items-center gap-1.5 px-4 py-2 border border-border-brand font-body text-[11px] font-medium uppercase tracking-widest text-text-mid hover:border-gold hover:text-gold transition-colors">
                Modifier mon profil
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Section À propos */}
      {(() => {
        const d = profil.profilDetail
        const hasCommon = d?.ville || (d?.languesParlees && d.languesParlees.length > 0)
        const isPro = profil.verificationStatus === "PROFESSIONNEL_SANTE"
        const hasPro = isPro && (d?.specialite || (d?.joursDisponibilite && d.joursDisponibilite.length > 0) || d?.horairesDisponibilite || (d?.languesConsultation && d.languesConsultation.length > 0))

        if (!hasCommon && !hasPro) return null

        return (
          <div className="bg-white border border-border-brand p-5">
            <h2 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-3">À propos</h2>
            <div className="space-y-2.5">
              {d?.ville && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-text-muted-brand shrink-0" />
                  <span className="font-body text-[12px] text-text-muted-brand">Ville</span>
                  <span className="font-body text-[13px] text-text-main ml-auto">{d.ville}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-text-muted-brand shrink-0" />
                <span className="font-body text-[12px] text-text-muted-brand">Membre depuis</span>
                <span className="font-body text-[13px] text-text-main ml-auto">
                  {new Date(profil.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
              </div>
              {d?.languesParlees && d.languesParlees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Languages size={13} className="text-text-muted-brand shrink-0" />
                  <span className="font-body text-[12px] text-text-muted-brand">Langues</span>
                  <span className="font-body text-[13px] text-text-main ml-auto">{d.languesParlees.join(", ")}</span>
                </div>
              )}
              {hasPro && (
                <>
                  <div className="border-t border-border-brand my-2" />
                  {d?.specialite && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={13} className="text-primary-brand shrink-0" />
                      <span className="font-body text-[12px] text-text-muted-brand">Spécialité</span>
                      <span className="font-body text-[13px] text-text-main ml-auto">{d.specialite}</span>
                    </div>
                  )}
                  {d?.joursDisponibilite && d.joursDisponibilite.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-primary-brand shrink-0" />
                      <span className="font-body text-[12px] text-text-muted-brand">Disponibilité</span>
                      <span className="font-body text-[13px] text-text-main ml-auto">{d.joursDisponibilite.join(", ")}</span>
                    </div>
                  )}
                  {d?.horairesDisponibilite && (
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-primary-brand shrink-0" />
                      <span className="font-body text-[12px] text-text-muted-brand">Horaires</span>
                      <span className="font-body text-[13px] text-text-main ml-auto">{d.horairesDisponibilite}</span>
                    </div>
                  )}
                  {d?.languesConsultation && d.languesConsultation.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Languages size={13} className="text-primary-brand shrink-0" />
                      <span className="font-body text-[12px] text-text-muted-brand">Langues de consultation</span>
                      <span className="font-body text-[13px] text-text-main ml-auto">{d.languesConsultation.join(", ")}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* Publications */}
      <div>
        <h2 className="font-body text-[11px] font-medium uppercase tracking-wider text-text-muted-brand mb-3">Publications</h2>
        {posts.length === 0 ? (
          <div className="text-center py-8 bg-white border border-border-brand">
            <p className="font-body text-[12px] text-text-muted-brand">Aucune publication</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-border-brand p-4">
                <p className="font-body text-[13px] text-text-main leading-relaxed whitespace-pre-wrap line-clamp-4">{post.contenu}</p>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-brand">
                  <span className="font-body text-[10px] text-text-muted-brand">{timeAgo(post.createdAt)}</span>
                  <span className="font-body text-[10px] text-text-muted-brand">{post._count?.reactions || 0} réactions</span>
                  <span className="font-body text-[10px] text-text-muted-brand">{post._count?.commentaires || 0} commentaires</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
