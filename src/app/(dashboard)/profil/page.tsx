"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Camera,
  Calendar,
  ShoppingBag,
  Star,
  CheckCircle,
  Loader2,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { SkeletonProfile } from "@/components/ui/skeletons"
import { BtnArrow } from "@/components/ui/buttons"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { SecuritySection } from "@/components/compte/SecuritySection"

function getPasswordStrength(p: string): number {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[a-z]/.test(p)) s++
  return s
}

export default function PageProfil() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // États profil
  const [initialized, setInitialized] = useState(false)
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [telephone, setTelephone] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [profilLoading, setProfilLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profilMessage, setProfilMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // États mot de passe
  const [motDePasseActuel, setMotDePasseActuel] = useState("")
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // États notifications
  const [notifRdv, setNotifRdv] = useState(true)
  const [notifCommandes, setNotifCommandes] = useState(true)
  const [notifNewsletter, setNotifNewsletter] = useState(false)
  const [prefsLoading, setPrefsLoading] = useState(false)

  // États suppression de compte
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState({ rdvs: 0, commandes: 0, points: 0 })
  const [memberSince, setMemberSince] = useState<Date | null>(null)

  const strength = getPasswordStrength(nouveauMotDePasse)
  const strengthColor = strength <= 1 ? "bg-danger" : strength <= 2 ? "bg-gold" : "bg-primary-brand"

  // Calcul progression profil
  let profileProgress = 0
  if (prenom) profileProgress += 25
  if (nom) profileProgress += 25
  if (photoUrl) profileProgress += 25
  if (telephone) profileProgress += 25

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/connexion?callbackUrl=/profil")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && !initialized) {
      setNom(session.user.nom ?? "")
      setPrenom(session.user.prenom ?? "")
      setPhotoUrl(session.user.photoUrl ?? "")
      setInitialized(true)
    }
  }, [session, initialized])

  useEffect(() => {
    async function fetchStats() {
      try {
        const [rdvRes, cmdRes, fideliteRes] = await Promise.all([
          fetch("/api/rdv"),
          fetch("/api/commandes"),
          fetch("/api/fidelite"),
        ])
        const rdvData = rdvRes.ok ? (await rdvRes.json()).rdvs || [] : []
        const cmdData = cmdRes.ok ? (await cmdRes.json()).commandes || [] : []
        const fideliteData = fideliteRes.ok ? await fideliteRes.json() : { points: 0 }
        
        setStats({
          rdvs: rdvData.length,
          commandes: cmdData.length,
          points: fideliteData.points || 0,
        })

        // Récupérer la date d'inscription
        const profilRes = await fetch("/api/profil")
        if (profilRes.ok) {
          const profilData = await profilRes.json()
          if (profilData.createdAt) setMemberSince(new Date(profilData.createdAt))
          if (profilData.telephone && !telephone) setTelephone(profilData.telephone)
        }
      } catch {}
    }
    fetchStats()
  }, [])

  if (status === "loading") {
    return <SkeletonProfile />
  }

  const initiales = `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase()

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "surnaturel-de-dieu/profils")
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur upload")
      if (data.url) {
        setPhotoUrl(data.url)
        await fetch("/api/profil/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: data.url }),
        })
        await update()
      }
    } catch {
      setProfilMessage({ type: "error", text: "Erreur lors de l'upload" })
    } finally {
      setUploading(false)
    }
  }

  async function handleProfilSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfilLoading(true)
    setProfilMessage(null)
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, telephone }),
      })
      if (res.ok) {
        await update()
        setProfilMessage({ type: "success", text: "Profil mis à jour avec succès" })
      } else {
        const data = await res.json()
        setProfilMessage({ type: "error", text: data.error || "Erreur" })
      }
    } catch {
      setProfilMessage({ type: "error", text: "Erreur réseau" })
    } finally {
      setProfilLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nouveauMotDePasse !== confirmation) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" })
      return
    }
    setPasswordLoading(true)
    setPasswordMessage(null)
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motDePasseActuel,
          nouveauMotDePasse,
          confirmation,
        }),
      })
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Mot de passe mis à jour" })
        setMotDePasseActuel("")
        setNouveauMotDePasse("")
        setConfirmation("")
      } else {
        const data = await res.json()
        setPasswordMessage({ type: "error", text: data.error || "Erreur" })
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Erreur réseau" })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid gap-8 lg:grid-cols-[280px_1fr]"
    >
      {/* Colonne gauche - Carte profil */}
      <motion.div variants={staggerItem} className="space-y-6">
        <div className="border border-border-brand bg-white p-6 text-center">
          {/* Avatar */}
          <div className="relative mx-auto w-20 h-20 mb-4">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-brand flex items-center justify-center text-white font-display text-[24px]">
                {initiales}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold text-white flex items-center justify-center hover:bg-gold/80 transition-colors"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Nom */}
          <h2 className="font-display text-[24px] font-light text-text-main">
            {prenom} {nom}
          </h2>

          {/* Email vérifié */}
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="font-body text-[12px] text-text-muted-brand">
              {session?.user?.email}
            </span>
            <CheckCircle size={12} className="text-primary-brand" />
          </div>

          {/* Membre depuis */}
          <p className="mt-2 font-body text-xs text-gold">
            {memberSince
              ? `Membre depuis ${memberSince.toLocaleDateString("fr", { month: "long", year: "numeric" })}`
              : ""}
          </p>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border-brand pt-4">
            <div className="text-center">
              <p className="font-display text-[20px] text-text-main">{stats.rdvs}</p>
              <p className="font-body text-[9px] uppercase tracking-wider text-text-muted-brand">RDV</p>
            </div>
            <div className="text-center border-x border-border-brand">
              <p className="font-display text-[20px] text-text-main">{stats.commandes}</p>
              <p className="font-body text-[9px] uppercase tracking-wider text-text-muted-brand">Commandes</p>
            </div>
            <div className="text-center">
              <p className="font-display text-[20px] text-gold">{stats.points}</p>
              <p className="font-body text-[9px] uppercase tracking-wider text-text-muted-brand">Points</p>
            </div>
          </div>

          {/* Barre progression */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-xs text-text-muted-brand">Profil complété</span>
              <span className="font-body text-xs font-medium text-gold">{profileProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-border-brand overflow-hidden">
              <motion.div
                className="h-full bg-gold"
                initial={{ width: 0 }}
                animate={{ width: `${profileProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Colonne droite - Formulaires */}
      <div className="space-y-8">
        {/* Formulaire Infos */}
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
              Mes informations
            </span>
            <div className="h-px flex-1 bg-gold/30" />
          </div>

          <form onSubmit={handleProfilSubmit} className="border border-border-brand bg-white p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full border border-border-brand px-4 py-2.5 font-body text-[14px] text-text-main focus:border-gold focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full border border-border-brand px-4 py-2.5 font-body text-[14px] text-text-main focus:border-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">
                Email
              </label>
              <input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full border border-border-brand px-4 py-2.5 font-body text-[14px] text-text-muted-brand bg-bg-page cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                className="w-full border border-border-brand px-4 py-2.5 font-body text-[14px] text-text-main focus:border-gold focus:outline-none transition-colors"
              />
            </div>

            {profilMessage && (
              <div
                className={`flex items-center gap-2 p-3 ${
                  profilMessage.type === "success" ? "bg-primary-light text-primary-brand" : "bg-danger/10 text-danger"
                }`}
              >
                {profilMessage.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span className="font-body text-[13px]">{profilMessage.text}</span>
              </div>
            )}

            <BtnArrow type="submit" disabled={profilLoading}>
              {profilLoading ? <Loader2 size={14} className="animate-spin" /> : "Enregistrer"}
            </BtnArrow>
          </form>
        </motion.section>

        {/* Formulaire Mot de passe */}
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
              Mot de passe
            </span>
            <div className="h-px flex-1 bg-gold/30" />
          </div>

          <form onSubmit={handlePasswordSubmit} className="border border-border-brand bg-white p-6 space-y-4">
            <div className="relative">
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">
                Mot de passe actuel
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={motDePasseActuel}
                onChange={(e) => setMotDePasseActuel(e.target.value)}
                className="w-full border border-border-brand px-4 py-2.5 pr-10 font-body text-[14px] text-text-main focus:border-gold focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-8 text-text-muted-brand"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">
                Nouveau mot de passe
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                className="w-full border border-border-brand px-4 py-2.5 font-body text-[14px] text-text-main focus:border-gold focus:outline-none transition-colors"
              />
              {nouveauMotDePasse && (
                <div className="mt-2 h-1 w-full bg-border-brand overflow-hidden">
                  <div className={`h-full ${strengthColor}`} style={{ width: `${strength * 25}%` }} />
                </div>
              )}
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full border border-border-brand px-4 py-2.5 font-body text-[14px] text-text-main focus:border-gold focus:outline-none transition-colors"
              />
            </div>

            {passwordMessage && (
              <div
                className={`flex items-center gap-2 p-3 ${
                  passwordMessage.type === "success" ? "bg-primary-light text-primary-brand" : "bg-danger/10 text-danger"
                }`}
              >
                {passwordMessage.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span className="font-body text-[13px]">{passwordMessage.text}</span>
              </div>
            )}

            <BtnArrow type="submit" disabled={passwordLoading}>
              {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : "Mettre à jour"}
            </BtnArrow>
          </form>
        </motion.section>

        {/* Section 2FA et Sessions */}
        <SecuritySection />

        {/* Préférences notifications */}
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
              Notifications
            </span>
            <div className="h-px flex-1 bg-gold/30" />
          </div>

          <div className="border border-border-brand bg-white p-6 space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-[14px] text-text-main">
                Rappels de rendez-vous
              </span>
              <button
                type="button"
                onClick={() => setNotifRdv(!notifRdv)}
                className={`w-10 h-5 transition-colors ${notifRdv ? "bg-primary-brand" : "bg-border-brand"}`}
              >
                <span
                  className={`block w-4 h-4 bg-white transform transition-transform ${
                    notifRdv ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-[14px] text-text-main">
                Mises à jour commandes
              </span>
              <button
                type="button"
                onClick={() => setNotifCommandes(!notifCommandes)}
                className={`w-10 h-5 transition-colors ${notifCommandes ? "bg-primary-brand" : "bg-border-brand"}`}
              >
                <span
                  className={`block w-4 h-4 bg-white transform transition-transform ${
                    notifCommandes ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-[14px] text-text-main">
                Newsletter et offres
              </span>
              <button
                type="button"
                onClick={() => setNotifNewsletter(!notifNewsletter)}
                className={`w-10 h-5 transition-colors ${notifNewsletter ? "bg-primary-brand" : "bg-border-brand"}`}
              >
                <span
                  className={`block w-4 h-4 bg-white transform transition-transform ${
                    notifNewsletter ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <BtnArrow disabled={prefsLoading}>
              {prefsLoading ? <Loader2 size={14} className="animate-spin" /> : "Enregistrer"}
            </BtnArrow>
          </div>
        </motion.section>

        {/* ─── Suppression de compte ─── */}
        <motion.section
          variants={staggerItem}
          className="border border-danger/30 bg-white p-6"
        >
          <h2 className="mb-2 font-display text-[20px] font-light text-danger">
            Supprimer mon compte
          </h2>
          <p className="mb-4 font-body text-[13px] text-text-mid">
            Cette action est irréversible. Vos données personnelles seront anonymisées et votre compte désactivé.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="border border-danger px-4 py-2 font-body text-[13px] text-danger transition-colors hover:bg-danger hover:text-white"
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="flex flex-col gap-3 border-t border-danger/20 pt-4">
              <p className="font-body text-[13px] font-medium text-danger">
                Êtes-vous sûr(e) ? Cette action ne peut pas être annulée.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true)
                    try {
                      const res = await fetch("/api/profil/supprimer", { method: "DELETE" })
                      if (res.ok) {
                        await signOut({ callbackUrl: "/" })
                      } else {
                        setDeleteLoading(false)
                      }
                    } catch {
                      setDeleteLoading(false)
                    }
                  }}
                  className="bg-danger px-4 py-2 font-body text-[13px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : "Oui, supprimer définitivement"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="border border-border-brand px-4 py-2 font-body text-[13px] text-text-mid transition-colors hover:bg-bg-page"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  )
}
