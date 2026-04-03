"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Camera,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  ShoppingBag,
  MessageCircle,
  ImagePlus,
  MapPin,
  AtSign,
  Hash,
  X,
  Globe,
  Bell,
  Briefcase,
  Languages,
  Clock,
} from "lucide-react"
import BadgeVerification from "@/components/ui/BadgeVerification"
import { SkeletonProfilModifier } from "@/components/ui/skeletons"

function getPasswordStrength(p: string): number {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[a-z]/.test(p)) s++
  return s
}

export default function PageModifierProfil() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [telephone, setTelephone] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [profilLoading, setProfilLoading] = useState(false)
  const [profilMessage, setProfilMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [initialized, setInitialized] = useState(false)

  const [motDePasseActuel, setMotDePasseActuel] = useState("")
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [notifRdv, setNotifRdv] = useState(true)
  const [notifCommandes, setNotifCommandes] = useState(true)
  const [notifNewsletter, setNotifNewsletter] = useState(false)

  // Social profile fields
  const [bio, setBio] = useState("")
  const [pseudo, setPseudo] = useState("")
  const [localisation, setLocalisation] = useState("")
  const [couvertureUrl, setCouvertureUrl] = useState("")
  const [centresInteret, setCentresInteret] = useState<string[]>([])
  const [newInteret, setNewInteret] = useState("")
  const [profilPublic, setProfilPublic] = useState(true)
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialMessage, setSocialMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Community notification prefs
  const [notifLikes, setNotifLikes] = useState(true)
  const [notifCommentaires, setNotifCommentaires] = useState(true)
  const [notifConnexions, setNotifConnexions] = useState(true)
  const [notifMessagesComm, setNotifMessagesComm] = useState(true)
  const [notifEvenements, setNotifEvenements] = useState(true)
  const [notifGroupes, setNotifGroupes] = useState(true)
  const [commPrefsLoading, setCommPrefsLoading] = useState(false)
  const [commPrefsMessage, setCommPrefsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // ProfilDetail — À propos
  const [verificationStatus, setVerificationStatus] = useState("")
  const [detailVille, setDetailVille] = useState("")
  const [languesParlees, setLanguesParlees] = useState<string[]>([])
  const [newLangue, setNewLangue] = useState("")
  const [specialite, setSpecialite] = useState("")
  const [numeroOrdre, setNumeroOrdre] = useState("")
  const [joursDisponibilite, setJoursDisponibilite] = useState<string[]>([])
  const [horairesDisponibilite, setHorairesDisponibilite] = useState("")
  const [languesConsultation, setLanguesConsultation] = useState<string[]>([])
  const [newLangueConsult, setNewLangueConsult] = useState("")
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailMessage, setDetailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const strength = getPasswordStrength(nouveauMotDePasse)
  const strengthColor = strength <= 1 ? "bg-danger" : strength <= 2 ? "bg-gold" : "bg-primary-brand"

  if (session?.user && !initialized) {
    setNom(session.user.nom ?? "")
    setPrenom(session.user.prenom ?? "")
    setPhotoUrl(session.user.photoUrl ?? "")
    setInitialized(true)
  }

  // Load social profile & notif prefs
  useEffect(() => {
    async function loadSocial() {
      try {
        const [profilRes, prefsRes, detailRes] = await Promise.all([
          fetch("/api/communaute/profil"),
          fetch("/api/communaute/notifications-prefs"),
          fetch("/api/profil/detail"),
        ])
        if (profilRes.ok) {
          const p = await profilRes.json()
          setBio(p.bio || "")
          setPseudo(p.pseudo || "")
          setLocalisation(p.localisation || "")
          setCouvertureUrl(p.couvertureUrl || "")
          setCentresInteret(p.centresInteret || [])
          setProfilPublic(p.profilPublic ?? true)
          setVerificationStatus(p.verificationStatus || "AUCUNE")
        }
        if (prefsRes.ok) {
          const n = await prefsRes.json()
          setNotifLikes(n.notifLikes ?? true)
          setNotifCommentaires(n.notifCommentaires ?? true)
          setNotifConnexions(n.notifConnexions ?? true)
          setNotifMessagesComm(n.notifMessages ?? true)
          setNotifEvenements(n.notifEvenements ?? true)
          setNotifGroupes(n.notifGroupes ?? true)
        }
        if (detailRes.ok) {
          const d = await detailRes.json()
          setDetailVille(d.ville || "")
          setLanguesParlees(d.languesParlees || [])
          setSpecialite(d.specialite || "")
          setNumeroOrdre(d.numeroOrdre || "")
          setJoursDisponibilite(d.joursDisponibilite || [])
          setHorairesDisponibilite(d.horairesDisponibilite || "")
          setLanguesConsultation(d.languesConsultation || [])
        }
      } catch {}
    }
    loadSocial()
  }, [])

  if (status === "loading") {
    return <SkeletonProfilModifier />
  }
  if (status === "unauthenticated") {
    router.push("/connexion?callbackUrl=/profil/modifier")
    return null
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
        toast.success("Photo de profil mise à jour")
      }
    } catch {
      setProfilMessage({ type: "error", text: "Erreur lors de l'upload" })
      toast.error("Erreur lors de l'upload de la photo")
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveProfil(e: React.FormEvent) {
    e.preventDefault()
    setProfilLoading(true)
    setProfilMessage(null)
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, telephone: telephone || undefined }),
      })
      if (res.ok) {
        await update()
        setProfilMessage({ type: "success", text: "Profil mis à jour" })
        toast.success("Profil mis à jour avec succès")
      } else {
        const d = await res.json()
        setProfilMessage({ type: "error", text: d.error ?? "Erreur" })
        toast.error(d.error ?? "Erreur lors de la mise à jour")
      }
    } catch {
      setProfilMessage({ type: "error", text: "Erreur réseau" })
      toast.error("Erreur réseau")
    } finally {
      setProfilLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (nouveauMotDePasse !== confirmation) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" })
      toast.error("Les mots de passe ne correspondent pas")
      return
    }
    setPasswordLoading(true)
    setPasswordMessage(null)
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse, confirmation }),
      })
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Mot de passe mis à jour" })
        toast.success("Mot de passe mis à jour avec succès")
        setMotDePasseActuel("")
        setNouveauMotDePasse("")
        setConfirmation("")
      } else {
        const d = await res.json()
        setPasswordMessage({ type: "error", text: d.error ?? "Erreur" })
        toast.error(d.error ?? "Erreur lors du changement de mot de passe")
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Erreur réseau" })
      toast.error("Erreur réseau")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* ── Section gauche — Avatar & infos ── */}
        <div className="space-y-6">
          <div className="bg-white border border-border-brand p-6 text-center space-y-4">
            {/* Avatar */}
            <div className="relative inline-block">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Photo"
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-brand flex items-center justify-center text-white font-display text-[28px] mx-auto">
                  {initiales}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border border-border-brand flex items-center justify-center hover:border-gold transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted-brand" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-text-muted-brand" />
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

            <div>
              <p className="font-display text-[24px] text-text-main">
                {prenom} {nom}
                <BadgeVerification status={verificationStatus} size={16} className="ml-1.5 align-middle" />
              </p>
              <p className="font-body text-[13px] text-text-muted-brand">
                {session?.user?.email}
              </p>
              <p className="font-body text-xs text-gold mt-1">
                Membre depuis {new Date(Date.now()).getFullYear()}
              </p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-border-brand p-3 text-center">
              <Calendar className="h-4 w-4 text-primary-brand mx-auto mb-1" />
              <p className="font-body text-xs uppercase tracking-widest text-text-muted-brand">RDV</p>
            </div>
            <div className="bg-white border border-border-brand p-3 text-center">
              <ShoppingBag className="h-4 w-4 text-primary-brand mx-auto mb-1" />
              <p className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Cmd</p>
            </div>
            <div className="bg-white border border-border-brand p-3 text-center">
              <MessageCircle className="h-4 w-4 text-primary-brand mx-auto mb-1" />
              <p className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Msg</p>
            </div>
          </div>
        </div>

        {/* ── Section droite — Formulaires ── */}
        <div className="space-y-8">
          {/* Tag */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
              Mes informations
            </span>
            <div className="h-px flex-1 bg-gold" />
          </div>

          {/* Formulaire 1 — Infos personnelles */}
          <form onSubmit={handleSaveProfil} className="bg-white border border-border-brand p-6 space-y-4">
            <h3 className="font-display text-[18px] font-light text-text-main">
              Informations <em className="text-primary-brand">personnelles</em>
            </h3>

            {profilMessage && (
              <div className={`flex items-center gap-2 p-3 ${profilMessage.type === "success" ? "bg-primary-light" : "bg-red-50"}`}>
                {profilMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-primary-brand" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-danger" />
                )}
                <span className="font-body text-[12px]">{profilMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                  Prénom
                </label>
                <input
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                  Nom
                </label>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={session?.user?.email ?? ""}
                  readOnly
                  className="flex-1 px-3 py-2.5 font-body text-[14px] bg-bg-page border border-border-brand text-text-muted-brand"
                />
                <span className="px-2 py-1 bg-primary-light text-primary-dark font-body text-xs uppercase tracking-widest">
                  Vérifié
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Téléphone
              </label>
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+225 07 00 00 00"
                className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            <button
              type="submit"
              disabled={profilLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-brand text-white font-body text-xs uppercase tracking-[0.15em] hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {profilLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>

          {/* Formulaire 2 — Sécurité */}
          <form onSubmit={handleChangePassword} className="bg-white border border-border-brand p-6 space-y-4">
            <h3 className="font-display text-[18px] font-light text-text-main">
              Sécurité
            </h3>

            {passwordMessage && (
              <div className={`flex items-center gap-2 p-3 ${passwordMessage.type === "success" ? "bg-primary-light" : "bg-red-50"}`}>
                {passwordMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-primary-brand" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-danger" />
                )}
                <span className="font-body text-[12px]">{passwordMessage.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Ancien mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={motDePasseActuel}
                  onChange={(e) => setMotDePasseActuel(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-brand"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Nouveau mot de passe
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
              />
              {nouveauMotDePasse && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-border-brand">
                    <div
                      className={`h-full ${strengthColor} transition-all`}
                      style={{ width: `${(strength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="font-body text-xs text-text-muted-brand">
                    {strength <= 1 ? "Faible" : strength <= 2 ? "Moyen" : "Fort"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !motDePasseActuel || !nouveauMotDePasse || !confirmation}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-brand text-white font-body text-xs uppercase tracking-[0.15em] hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {passwordLoading ? "Mise à jour..." : "Mettre à jour"}
            </button>
          </form>

          {/* Formulaire 3 — Profil communautaire */}
          <div className="bg-white border border-border-brand p-6 space-y-4">
            <h3 className="font-display text-[18px] font-light text-text-main">
              Profil <em className="text-primary-brand">communautaire</em>
            </h3>

            {socialMessage && (
              <div className={`flex items-center gap-2 p-3 ${socialMessage.type === "success" ? "bg-primary-light" : "bg-red-50"}`}>
                {socialMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-primary-brand" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-danger" />
                )}
                <span className="font-body text-[12px]">{socialMessage.text}</span>
              </div>
            )}

            {/* Couverture */}
            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Photo de couverture
              </label>
              <div className="relative h-32 bg-bg-page border border-border-brand overflow-hidden">
                {couvertureUrl ? (
                  <img src={couvertureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted-brand">
                    <ImagePlus size={24} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="absolute bottom-2 right-2 px-2.5 py-1.5 bg-white/90 border border-border-brand font-body text-xs uppercase tracking-wider hover:bg-white transition-colors"
                >
                  {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : "Modifier"}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadingCover(true)
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("folder", "surnaturel-de-dieu/couvertures")
                    try {
                      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
                      const data = await res.json()
                      if (res.ok && data.url) setCouvertureUrl(data.url)
                    } catch {}
                    setUploadingCover(false)
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                  <AtSign size={10} /> Pseudo
                </label>
                <input
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  maxLength={30}
                  placeholder="mon_pseudo"
                  className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                  <MapPin size={10} /> Localisation
                </label>
                <input
                  value={localisation}
                  onChange={(e) => setLocalisation(e.target.value)}
                  maxLength={100}
                  placeholder="Abidjan, Côte d'Ivoire"
                  className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Quelques mots sur vous..."
                className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors resize-none"
              />
              <p className="font-body text-xs text-text-muted-brand text-right">{bio.length}/500</p>
            </div>

            {/* Centres d'intérêt */}
            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                <Hash size={10} /> Centres d'intérêt
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {centresInteret.map((ci) => (
                  <span key={ci} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-light text-primary-brand font-body text-xs">
                    {ci}
                    <button type="button" onClick={() => setCentresInteret(centresInteret.filter((c) => c !== ci))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              {centresInteret.length < 10 && (
                <div className="flex gap-2">
                  <input
                    value={newInteret}
                    onChange={(e) => setNewInteret(e.target.value)}
                    maxLength={50}
                    placeholder="Ajouter un centre d'intérêt"
                    className="flex-1 px-3 py-2 font-body text-[13px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const v = newInteret.trim()
                        if (v && !centresInteret.includes(v)) {
                          setCentresInteret([...centresInteret, v])
                          setNewInteret("")
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = newInteret.trim()
                      if (v && !centresInteret.includes(v)) {
                        setCentresInteret([...centresInteret, v])
                        setNewInteret("")
                      }
                    }}
                    className="px-3 py-2 bg-primary-brand text-white font-body text-xs uppercase tracking-wider hover:bg-primary-dark transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              )}
            </div>

            {/* Profil public */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-[13px] text-text-mid flex items-center gap-1.5">
                <Globe size={14} /> Profil public
              </span>
              <button
                type="button"
                onClick={() => setProfilPublic(!profilPublic)}
                className={`relative w-10 h-5 transition-colors ${profilPublic ? "bg-primary-brand" : "bg-border-brand"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${profilPublic ? "left-5.5" : "left-0.5"}`} />
              </button>
            </label>

            <button
              type="button"
              onClick={async () => {
                setSocialLoading(true)
                setSocialMessage(null)
                try {
                  const res = await fetch("/api/communaute/profil", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bio, pseudo: pseudo || undefined, localisation: localisation || undefined, couvertureUrl: couvertureUrl || undefined, centresInteret, profilPublic }),
                  })
                  if (res.ok) {
                    setSocialMessage({ type: "success", text: "Profil communautaire mis à jour" })
                  } else {
                    const d = await res.json()
                    setSocialMessage({ type: "error", text: d.error ?? "Erreur" })
                  }
                } catch {
                  setSocialMessage({ type: "error", text: "Erreur réseau" })
                } finally {
                  setSocialLoading(false)
                }
              }}
              disabled={socialLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-brand text-white font-body text-xs uppercase tracking-[0.15em] hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {socialLoading ? "Enregistrement..." : "Enregistrer le profil social"}
            </button>
          </div>

          {/* Formulaire 3b — À propos (ProfilDetail) */}
          <div className="bg-white border border-border-brand p-6 space-y-4">
            <h3 className="font-display text-[18px] font-light text-text-main">
              À <em className="text-primary-brand">propos</em>
            </h3>

            {detailMessage && (
              <div className={`flex items-center gap-2 p-3 ${detailMessage.type === "success" ? "bg-primary-light" : "bg-red-50"}`}>
                {detailMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-primary-brand" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-danger" />
                )}
                <span className="font-body text-[12px]">{detailMessage.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                <MapPin size={10} /> Ville de résidence
              </label>
              <input
                value={detailVille}
                onChange={(e) => setDetailVille(e.target.value)}
                maxLength={100}
                placeholder="Abidjan"
                className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Langues parlées */}
            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                <Languages size={10} /> Langues parlées
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {languesParlees.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-light text-primary-brand font-body text-xs">
                    {l}
                    <button type="button" onClick={() => setLanguesParlees(languesParlees.filter((x) => x !== l))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              {languesParlees.length < 10 && (
                <div className="flex gap-2">
                  <input
                    value={newLangue}
                    onChange={(e) => setNewLangue(e.target.value)}
                    maxLength={50}
                    placeholder="Français, Anglais…"
                    className="flex-1 px-3 py-2 font-body text-[13px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const v = newLangue.trim()
                        if (v && !languesParlees.includes(v)) {
                          setLanguesParlees([...languesParlees, v])
                          setNewLangue("")
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = newLangue.trim()
                      if (v && !languesParlees.includes(v)) {
                        setLanguesParlees([...languesParlees, v])
                        setNewLangue("")
                      }
                    }}
                    className="px-3 py-2 bg-primary-brand text-white font-body text-xs uppercase tracking-wider hover:bg-primary-dark transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              )}
            </div>

            {/* Champs professionnels — visibles uniquement si PROFESSIONNEL_SANTE */}
            {verificationStatus === "PROFESSIONNEL_SANTE" && (
              <>
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-px flex-1 bg-gold" />
                  <span className="font-body text-xs uppercase tracking-[0.15em] text-gold flex items-center gap-1">
                    <Briefcase size={10} /> Informations professionnelles
                  </span>
                  <div className="h-px flex-1 bg-gold" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                      Spécialité médicale
                    </label>
                    <input
                      value={specialite}
                      onChange={(e) => setSpecialite(e.target.value)}
                      maxLength={200}
                      placeholder="Sage-femme, Gynécologue…"
                      className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                      N° d&apos;ordre professionnel
                    </label>
                    <input
                      value={numeroOrdre}
                      onChange={(e) => setNumeroOrdre(e.target.value)}
                      maxLength={100}
                      placeholder="Visible uniquement par l'administratrice"
                      className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                    />
                    <p className="font-body text-[9px] text-text-muted-brand">Non affiché publiquement</p>
                  </div>
                </div>

                {/* Jours de disponibilité */}
                <div className="space-y-1.5">
                  <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                    <Calendar size={10} /> Jours de disponibilité
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((jour) => (
                      <button
                        key={jour}
                        type="button"
                        onClick={() => {
                          setJoursDisponibilite((prev) =>
                            prev.includes(jour) ? prev.filter((j) => j !== jour) : [...prev, jour]
                          )
                        }}
                        className={`px-2.5 py-1 font-body text-xs border transition-colors ${
                          joursDisponibilite.includes(jour)
                            ? "border-primary-brand bg-primary-light text-primary-brand font-medium"
                            : "border-border-brand text-text-muted-brand hover:border-gold"
                        }`}
                      >
                        {jour}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                    <Clock size={10} /> Horaires de consultation
                  </label>
                  <input
                    value={horairesDisponibilite}
                    onChange={(e) => setHorairesDisponibilite(e.target.value)}
                    maxLength={100}
                    placeholder="09:00 - 17:00"
                    className="w-full px-3 py-2.5 font-body text-[14px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Langues de consultation */}
                <div className="space-y-1.5">
                  <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand flex items-center gap-1">
                    <Languages size={10} /> Langues de consultation
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {languesConsultation.map((l) => (
                      <span key={l} className="inline-flex items-center gap-1 px-2 py-1 bg-gold-light text-gold font-body text-xs">
                        {l}
                        <button type="button" onClick={() => setLanguesConsultation(languesConsultation.filter((x) => x !== l))}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  {languesConsultation.length < 10 && (
                    <div className="flex gap-2">
                      <input
                        value={newLangueConsult}
                        onChange={(e) => setNewLangueConsult(e.target.value)}
                        maxLength={50}
                        placeholder="Français, Dioula…"
                        className="flex-1 px-3 py-2 font-body text-[13px] border border-border-brand focus:outline-none focus:border-gold transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const v = newLangueConsult.trim()
                            if (v && !languesConsultation.includes(v)) {
                              setLanguesConsultation([...languesConsultation, v])
                              setNewLangueConsult("")
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = newLangueConsult.trim()
                          if (v && !languesConsultation.includes(v)) {
                            setLanguesConsultation([...languesConsultation, v])
                            setNewLangueConsult("")
                          }
                        }}
                        className="px-3 py-2 bg-gold text-white font-body text-xs uppercase tracking-wider hover:bg-gold-dark transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={async () => {
                setDetailLoading(true)
                setDetailMessage(null)
                try {
                  const body: Record<string, unknown> = {
                    ville: detailVille || undefined,
                    languesParlees,
                  }
                  if (verificationStatus === "PROFESSIONNEL_SANTE") {
                    body.specialite = specialite || undefined
                    body.numeroOrdre = numeroOrdre || undefined
                    body.joursDisponibilite = joursDisponibilite
                    body.horairesDisponibilite = horairesDisponibilite || undefined
                    body.languesConsultation = languesConsultation
                  }
                  const res = await fetch("/api/profil/detail", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  })
                  if (res.ok) {
                    setDetailMessage({ type: "success", text: "Informations mises à jour" })
                  } else {
                    const d = await res.json()
                    setDetailMessage({ type: "error", text: d.error ?? "Erreur" })
                  }
                } catch {
                  setDetailMessage({ type: "error", text: "Erreur réseau" })
                } finally {
                  setDetailLoading(false)
                }
              }}
              disabled={detailLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-brand text-white font-body text-xs uppercase tracking-[0.15em] hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {detailLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          {/* Formulaire 4 — Préférences générales */}
          <div className="bg-white border border-border-brand p-6 space-y-4">
            <h3 className="font-display text-[18px] font-light text-text-main">
              Préférences
            </h3>

            {[
              { label: "Notifications email rendez-vous", value: notifRdv, set: setNotifRdv },
              { label: "Notifications email commandes", value: notifCommandes, set: setNotifCommandes },
              { label: "Newsletter", value: notifNewsletter, set: setNotifNewsletter },
            ].map((pref) => (
              <label key={pref.label} className="flex items-center justify-between cursor-pointer">
                <span className="font-body text-[13px] text-text-mid">{pref.label}</span>
                <button
                  type="button"
                  onClick={() => pref.set(!pref.value)}
                  className={`relative w-10 h-5 transition-colors ${
                    pref.value ? "bg-primary-brand" : "bg-border-brand"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${
                      pref.value ? "left-5.5" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
            ))}

            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-brand text-white font-body text-xs uppercase tracking-[0.15em] hover:bg-primary-dark transition-colors">
              Enregistrer préférences
            </button>
          </div>

          {/* Formulaire 5 — Notifications communauté */}
          <div className="bg-white border border-border-brand p-6 space-y-4">
            <h3 className="font-display text-[18px] font-light text-text-main">
              Notifications <em className="text-primary-brand">communauté</em>
            </h3>

            {commPrefsMessage && (
              <div className={`flex items-center gap-2 p-3 ${commPrefsMessage.type === "success" ? "bg-primary-light" : "bg-red-50"}`}>
                {commPrefsMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-primary-brand" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-danger" />
                )}
                <span className="font-body text-[12px]">{commPrefsMessage.text}</span>
              </div>
            )}

            {[
              { label: "Réactions sur mes publications", value: notifLikes, set: setNotifLikes, key: "notifLikes" },
              { label: "Commentaires sur mes publications", value: notifCommentaires, set: setNotifCommentaires, key: "notifCommentaires" },
              { label: "Demandes de connexion", value: notifConnexions, set: setNotifConnexions, key: "notifConnexions" },
              { label: "Messages privés", value: notifMessagesComm, set: setNotifMessagesComm, key: "notifMessages" },
              { label: "Événements communautaires", value: notifEvenements, set: setNotifEvenements, key: "notifEvenements" },
              { label: "Activité des groupes", value: notifGroupes, set: setNotifGroupes, key: "notifGroupes" },
            ].map((pref) => (
              <label key={pref.key} className="flex items-center justify-between cursor-pointer">
                <span className="font-body text-[13px] text-text-mid">{pref.label}</span>
                <button
                  type="button"
                  onClick={() => pref.set(!pref.value)}
                  className={`relative w-10 h-5 transition-colors ${pref.value ? "bg-primary-brand" : "bg-border-brand"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${pref.value ? "left-5.5" : "left-0.5"}`} />
                </button>
              </label>
            ))}

            <button
              type="button"
              onClick={async () => {
                setCommPrefsLoading(true)
                setCommPrefsMessage(null)
                try {
                  const res = await fetch("/api/communaute/notifications-prefs", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      notifLikes, notifCommentaires, notifConnexions,
                      notifMessages: notifMessagesComm, notifEvenements, notifGroupes,
                    }),
                  })
                  if (res.ok) {
                    setCommPrefsMessage({ type: "success", text: "Préférences communauté mises à jour" })
                  } else {
                    const d = await res.json()
                    setCommPrefsMessage({ type: "error", text: d.error ?? "Erreur" })
                  }
                } catch {
                  setCommPrefsMessage({ type: "error", text: "Erreur réseau" })
                } finally {
                  setCommPrefsLoading(false)
                }
              }}
              disabled={commPrefsLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-brand text-white font-body text-xs uppercase tracking-[0.15em] hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Bell className="h-3.5 w-3.5" />
              {commPrefsLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
