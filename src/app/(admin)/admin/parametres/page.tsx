"use client"

import { useEffect, useState } from "react"
import { UserPlus, Save, Building2, Shield, Trash2, MessageCircle, Share2, Baby, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  SAGE_FEMME: "Sage-femme",
  ACCOMPAGNATEUR_MEDICAL: "Accompagnateur médical",
}

interface StaffMember {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  createdAt: string
}

export default function AdminParametresPage() {
  const [activeTab, setActiveTab] = useState<"centre" | "contact" | "rdv" | "sagefemme" | "staff" | "logs">("centre")

  // Centre info
  const [centreForm, setCentreForm] = useState({
    nomCentre: "",
    fondatrice: "",
    adresse: "",
    horaires: "",
  })
  const [centreSaving, setCentreSaving] = useState(false)
  const [centreMessage, setCentreMessage] = useState("")

  // Contact info
  const [contactForm, setContactForm] = useState({
    telephone: "",
    whatsappNumber: "",
    whatsappDisplay: "",
    whatsappMessage: "",
    email: "",
    emailRdv: "",
    facebook: "",
    instagram: "",
    googlePlaceId: "",
  })
  const [contactSaving, setContactSaving] = useState(false)
  const [contactMessage, setContactMessage] = useState("")

  // Créneaux RDV
  const [rdvForm, setRdvForm] = useState({
    creneauxMatin: [8, 9, 10, 11] as number[],
    creneauxApresMidi: [14, 15, 16, 17] as number[],
  })
  const [rdvSaving, setRdvSaving] = useState(false)
  const [rdvMessage, setRdvMessage] = useState("")

  // Sage-femme bio
  const [bioForm, setBioForm] = useState({
    sageFemmeNom: "",
    sageFemmeTitre: "",
    sageFemmeExperience: "",
    sageFemmePara1: "",
    sageFemmePara2: "",
    sageFemmePara3: "",
  })
  const [bioSaving, setBioSaving] = useState(false)
  const [bioMessage, setBioMessage] = useState("")

  // Staff
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffForm, setStaffForm] = useState({
    email: "",
    nom: "",
    prenom: "",
    role: "SAGE_FEMME",
    password: "",
  })
  const [staffSaving, setStaffSaving] = useState(false)
  const [staffMessage, setStaffMessage] = useState({ type: "", text: "" })

  // Logs
  const [logs, setLogs] = useState<{ id: string; action: string; user: string; date: string }[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchStaff = async () => {
    setStaffLoading(true)
    const res = await fetch("/api/admin/utilisateurs")
    if (res.ok) {
      const data = await res.json()
      setStaffList(data.utilisateurs || [])
    }
    setStaffLoading(false)
  }

  const fetchLogs = async () => {
    setLogsLoading(true)
    const res = await fetch("/api/admin/logs")
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs || [])
    }
    setLogsLoading(false)
  }

  const fetchCentre = async () => {
    try {
      const res = await fetch("/api/admin/parametres")
      if (res.ok) {
        const data = await res.json()
        setCentreForm({
          nomCentre: data.nomCentre ?? "",
          fondatrice: data.fondatrice ?? "",
          adresse: data.adresse ?? "",
          horaires: data.horaires ?? "",
        })
        setContactForm({
          telephone: data.telephone ?? "",
          whatsappNumber: data.whatsappNumber ?? "",
          whatsappDisplay: data.whatsappDisplay ?? "",
          whatsappMessage: data.whatsappMessage ?? "",
          email: data.email ?? "",
          emailRdv: data.emailRdv ?? "",
          facebook: data.facebook ?? "",
          instagram: data.instagram ?? "",
          googlePlaceId: data.googlePlaceId ?? "",
        })
        setBioForm({
          sageFemmeNom: data.sageFemmeNom ?? "",
          sageFemmeTitre: data.sageFemmeTitre ?? "",
          sageFemmeExperience: data.sageFemmeExperience ?? "",
          sageFemmePara1: data.sageFemmePara1 ?? "",
          sageFemmePara2: data.sageFemmePara2 ?? "",
          sageFemmePara3: data.sageFemmePara3 ?? "",
        })
        setRdvForm({
          creneauxMatin: data.creneauxMatin ?? [8, 9, 10, 11],
          creneauxApresMidi: data.creneauxApresMidi ?? [14, 15, 16, 17],
        })
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (activeTab === "centre" || activeTab === "contact" || activeTab === "sagefemme" || activeTab === "rdv") fetchCentre()
    if (activeTab === "staff") fetchStaff()
    if (activeTab === "logs") fetchLogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleSaveCentre = async (e: React.FormEvent) => {
    e.preventDefault()
    setCentreSaving(true)
    setCentreMessage("")
    try {
      const res = await fetch("/api/admin/parametres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(centreForm),
      })
      if (res.ok) {
        setCentreMessage("Informations enregistrées ✓")
      } else {
        setCentreMessage("Erreur lors de l'enregistrement")
      }
    } catch {
      setCentreMessage("Erreur lors de l'enregistrement")
    }
    setCentreSaving(false)
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactSaving(true)
    setContactMessage("")
    try {
      const res = await fetch("/api/admin/parametres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      })
      if (res.ok) {
        setContactMessage("Coordonnées enregistrées ✓")
      } else {
        setContactMessage("Erreur lors de l'enregistrement")
      }
    } catch {
      setContactMessage("Erreur lors de l'enregistrement")
    }
    setContactSaving(false)
  }

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault()
    setBioSaving(true)
    setBioMessage("")
    try {
      const res = await fetch("/api/admin/parametres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bioForm),
      })
      if (res.ok) {
        setBioMessage("Profil sage-femme enregistré ✓")
      } else {
        setBioMessage("Erreur lors de l'enregistrement")
      }
    } catch {
      setBioMessage("Erreur lors de l'enregistrement")
    }
    setBioSaving(false)
  }

  const handleSaveRdv = async (e: React.FormEvent) => {
    e.preventDefault()
    setRdvSaving(true)
    setRdvMessage("")
    try {
      const res = await fetch("/api/admin/parametres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rdvForm),
      })
      if (res.ok) {
        setRdvMessage("Créneaux enregistrés ✓")
      } else {
        setRdvMessage("Erreur lors de l'enregistrement")
      }
    } catch {
      setRdvMessage("Erreur lors de l'enregistrement")
    }
    setRdvSaving(false)
  }

  const toggleSlot = (period: "creneauxMatin" | "creneauxApresMidi", hour: number) => {
    setRdvForm(prev => {
      const current = prev[period]
      const next = current.includes(hour)
        ? current.filter(h => h !== hour)
        : [...current, hour].sort((a, b) => a - b)
      return { ...prev, [period]: next }
    })
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffSaving(true)
    setStaffMessage({ type: "", text: "" })

    const res = await fetch("/api/admin/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffForm),
    })

    const data = await res.json()

    if (!res.ok) {
      setStaffMessage({ type: "error", text: data.error || "Erreur" })
    } else {
      setStaffMessage({ type: "success", text: `Compte créé pour ${data.prenom} ${data.nom}` })
      setStaffForm({ email: "", nom: "", prenom: "", role: "SAGE_FEMME", password: "" })
      fetchStaff()
    }

    setStaffSaving(false)
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Supprimer ce compte ?")) return
    await fetch(`/api/admin/utilisateurs/${id}`, { method: "DELETE" })
    fetchStaff()
  }

  const tabs = [
    { key: "centre" as const, label: "Centre", icon: Building2 },
    { key: "contact" as const, label: "Contact & Réseaux", icon: MessageCircle },
    { key: "rdv" as const, label: "Créneaux RDV", icon: CalendarClock },
    { key: "sagefemme" as const, label: "Sage-femme", icon: Baby },
    { key: "staff" as const, label: "Personnel", icon: UserPlus },
    { key: "logs" as const, label: "Logs d'accès", icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-border-brand">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-body transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-primary-brand text-primary-brand"
                : "border-transparent text-gray-500 hover:text-text-main"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Centre info */}
      {activeTab === "centre" && (
        <div className="bg-white border border-border-brand p-6 max-w-2xl">
          <h3 className="font-display text-lg text-text-main mb-4">Informations du centre</h3>
          {centreMessage && <p className="text-sm text-primary-brand mb-3 font-body">{centreMessage}</p>}
          <form onSubmit={handleSaveCentre} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Nom du centre</label>
              <input value={centreForm.nomCentre} onChange={(e) => setCentreForm({ ...centreForm, nomCentre: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Fondatrice / Directrice</label>
              <input value={centreForm.fondatrice} onChange={(e) => setCentreForm({ ...centreForm, fondatrice: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="ex: Marie Jeanne" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Adresse complète</label>
              <input value={centreForm.adresse} onChange={(e) => setCentreForm({ ...centreForm, adresse: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="ex: Cocody, Riviera Palmeraie" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Horaires d&apos;ouverture</label>
              <textarea rows={4} value={centreForm.horaires} onChange={(e) => setCentreForm({ ...centreForm, horaires: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder={"Lun — Ven : 08h00 — 18h00\nSam : 09h00 — 16h00\nDim : Fermé"} />
            </div>
            <button type="submit" disabled={centreSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" /> {centreSaving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        </div>
      )}

      {/* Contact & réseaux sociaux */}
      {activeTab === "contact" && (
        <div className="bg-white border border-border-brand p-6 max-w-2xl">
          <h3 className="font-display text-lg text-text-main mb-1">Coordonnées & réseaux sociaux</h3>
          <p className="font-body text-[12px] text-text-muted-brand mb-5">Ces informations s&apos;affichent sur le site (footer, page contact, mentions légales, PDF…)</p>
          {contactMessage && <p className="text-sm text-primary-brand mb-3 font-body">{contactMessage}</p>}
          <form onSubmit={handleSaveContact} className="space-y-5">
            <fieldset className="space-y-4 border border-border-brand p-4">
              <legend className="px-2 font-body text-xs uppercase tracking-widest text-gold">Téléphone & Email</legend>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Téléphone principal</label>
                  <input value={contactForm.telephone} onChange={(e) => setContactForm({ ...contactForm, telephone: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="+225 05 75 97 51 22" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Email principal</label>
                  <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="contact@…" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Email rendez-vous (expéditeur emails)</label>
                <input type="email" value={contactForm.emailRdv} onChange={(e) => setContactForm({ ...contactForm, emailRdv: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="rdv@…" />
              </div>
            </fieldset>

            <fieldset className="space-y-4 border border-border-brand p-4">
              <legend className="px-2 font-body text-xs uppercase tracking-widest text-gold">WhatsApp</legend>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Numéro wa.me (sans +, sans espaces)</label>
                  <input value={contactForm.whatsappNumber} onChange={(e) => setContactForm({ ...contactForm, whatsappNumber: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="2250779190461" />
                  <p className="mt-1 font-body text-xs text-text-muted-brand">Utilisé dans le lien wa.me/…</p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Numéro WhatsApp affiché</label>
                  <input value={contactForm.whatsappDisplay} onChange={(e) => setContactForm({ ...contactForm, whatsappDisplay: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="+225 07 79 19 04 61" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Message pré-rempli WhatsApp</label>
                <input value={contactForm.whatsappMessage} onChange={(e) => setContactForm({ ...contactForm, whatsappMessage: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
            </fieldset>

            <fieldset className="space-y-4 border border-border-brand p-4">
              <legend className="flex items-center gap-1 px-2 font-body text-xs uppercase tracking-widest text-gold"><Share2 className="h-3 w-3" /> Réseaux sociaux</legend>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">URL Facebook</label>
                <input value={contactForm.facebook} onChange={(e) => setContactForm({ ...contactForm, facebook: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="https://www.facebook.com/…" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">URL Instagram</label>
                <input value={contactForm.instagram} onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="https://www.instagram.com/…" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Google Place ID (avis Google)</label>
                <input value={contactForm.googlePlaceId} onChange={(e) => setContactForm({ ...contactForm, googlePlaceId: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="ChIJ…" />
                <p className="mt-1 text-[11px] text-text-muted-brand font-body">Trouvable dans l&apos;URL de votre fiche Google Maps</p>
              </div>
            </fieldset>

            <button type="submit" disabled={contactSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" /> {contactSaving ? "Enregistrement…" : "Enregistrer les coordonnées"}
            </button>
          </form>
        </div>
      )}

      {/* Créneaux RDV */}
      {activeTab === "rdv" && (
        <div className="bg-white border border-border-brand p-6 max-w-2xl">
          <h3 className="font-display text-lg text-text-main mb-1">Créneaux de rendez-vous</h3>
          <p className="font-body text-[12px] text-text-muted-brand mb-5">
            Définissez les heures disponibles pour la prise de rendez-vous. Cliquez sur une heure pour l&apos;activer/désactiver.
          </p>
          {rdvMessage && <p className="text-sm text-primary-brand mb-3 font-body">{rdvMessage}</p>}
          <form onSubmit={handleSaveRdv} className="space-y-6">
            <fieldset className="border border-border-brand p-4">
              <legend className="px-2 font-body text-xs uppercase tracking-widest text-gold">Matin (6h — 12h)</legend>
              <div className="flex flex-wrap gap-2 mt-2">
                {[6, 7, 8, 9, 10, 11].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleSlot("creneauxMatin", h)}
                    className={cn(
                      "w-14 py-2 text-sm font-body border transition-colors",
                      rdvForm.creneauxMatin.includes(h)
                        ? "bg-primary-brand text-white border-primary-brand"
                        : "bg-white text-gray-500 border-border-brand hover:border-gold"
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="border border-border-brand p-4">
              <legend className="px-2 font-body text-xs uppercase tracking-widest text-gold">Après-midi (13h — 19h)</legend>
              <div className="flex flex-wrap gap-2 mt-2">
                {[13, 14, 15, 16, 17, 18, 19].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleSlot("creneauxApresMidi", h)}
                    className={cn(
                      "w-14 py-2 text-sm font-body border transition-colors",
                      rdvForm.creneauxApresMidi.includes(h)
                        ? "bg-primary-brand text-white border-primary-brand"
                        : "bg-white text-gray-500 border-border-brand hover:border-gold"
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="bg-gold-light border border-gold p-3">
              <p className="font-body text-[12px] text-gold">
                <strong>Note :</strong> La pause déjeuner (12h-13h) n&apos;est pas proposée. Les clientes ne pourront réserver que sur les créneaux activés ci-dessus.
              </p>
            </div>

            <button type="submit" disabled={rdvSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" /> {rdvSaving ? "Enregistrement…" : "Enregistrer les créneaux"}
            </button>
          </form>
        </div>
      )}

      {/* Sage-femme profile */}
      {activeTab === "sagefemme" && (
        <div className="bg-white border border-border-brand p-6 max-w-2xl">
          <h3 className="font-display text-lg text-text-main mb-1">Profil Sage-Femme</h3>
          <p className="font-body text-[12px] text-text-muted-brand mb-5">Ces informations s&apos;affichent sur la page sage-femme du site.</p>
          {bioMessage && <p className="text-sm text-primary-brand mb-3 font-body">{bioMessage}</p>}
          <form onSubmit={handleSaveBio} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Nom complet</label>
                <input value={bioForm.sageFemmeNom} onChange={(e) => setBioForm({ ...bioForm, sageFemmeNom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="ex: Ama Kouassi" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Années d&apos;expérience</label>
                <input value={bioForm.sageFemmeExperience} onChange={(e) => setBioForm({ ...bioForm, sageFemmeExperience: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="ex: 18 ans" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Titre / Qualification</label>
              <input value={bioForm.sageFemmeTitre} onChange={(e) => setBioForm({ ...bioForm, sageFemmeTitre: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="ex: Sage-femme diplômée d'État" />
            </div>
            <fieldset className="border border-border-brand p-4 space-y-3">
              <legend className="px-2 font-body text-xs uppercase tracking-widest text-gold">Paragraphes de présentation</legend>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Paragraphe 1</label>
                <textarea rows={3} value={bioForm.sageFemmePara1} onChange={(e) => setBioForm({ ...bioForm, sageFemmePara1: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand resize-none" placeholder="1er paragraphe de présentation…" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Paragraphe 2</label>
                <textarea rows={3} value={bioForm.sageFemmePara2} onChange={(e) => setBioForm({ ...bioForm, sageFemmePara2: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand resize-none" placeholder="2e paragraphe…" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Paragraphe 3 (optionnel)</label>
                <textarea rows={3} value={bioForm.sageFemmePara3} onChange={(e) => setBioForm({ ...bioForm, sageFemmePara3: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand resize-none" placeholder="3e paragraphe (optionnel)…" />
              </div>
            </fieldset>
            <button type="submit" disabled={bioSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" /> {bioSaving ? "Enregistrement…" : "Enregistrer le profil"}
            </button>
          </form>
        </div>
      )}

      {/* Staff management */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          {/* Staff list */}
          <div className="bg-white border border-border-brand overflow-hidden">
            <div className="px-4 py-3 border-b border-border-brand">
              <h3 className="font-display text-base text-text-main">Personnel existant</h3>
            </div>
            {staffLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="h-5 w-5 border-3 border-primary-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : staffList.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 font-body text-center">Aucun personnel</p>
            ) : (
              <table className="w-full text-sm font-body">
                <thead className="bg-bg-page">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Nom</th>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Email</th>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Rôle</th>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr key={s.id} className="border-t border-border-brand">
                      <td className="px-4 py-2.5 text-text-main">{s.prenom} {s.nom}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.email}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 bg-primary-brand/10 text-primary-brand">{roleLabels[s.role] || s.role}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => handleDeleteStaff(s.id)} className="p-1 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Create staff form */}
          <div className="bg-white border border-border-brand p-6 max-w-2xl">
            <h3 className="font-display text-base text-text-main mb-4">Créer un compte personnel</h3>
            {staffMessage.text && (
              <p className={cn("text-sm mb-3 font-body", staffMessage.type === "error" ? "text-red-600" : "text-primary-brand")}>
                {staffMessage.text}
              </p>
            )}
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Prénom</label>
                  <input required value={staffForm.prenom} onChange={(e) => setStaffForm({ ...staffForm, prenom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Nom</label>
                  <input required value={staffForm.nom} onChange={(e) => setStaffForm({ ...staffForm, nom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Email</label>
                <input required type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Mot de passe</label>
                <input required type="password" minLength={8} value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-body mb-1">Rôle</label>
                <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand">
                  <option value="SAGE_FEMME">Sage-femme</option>
                  <option value="ACCOMPAGNATEUR_MEDICAL">Accompagnateur médical</option>
                </select>
              </div>
              <button type="submit" disabled={staffSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50">
                <UserPlus className="h-4 w-4" /> {staffSaving ? "Création…" : "Créer le compte"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Access logs */}
      {activeTab === "logs" && (
        <div className="bg-white border border-border-brand overflow-hidden">
          <div className="px-4 py-3 border-b border-border-brand">
            <h3 className="font-display text-base text-text-main">Logs d&apos;accès médical</h3>
          </div>
          {logsLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="h-5 w-5 border-3 border-primary-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 font-body text-center">Aucun log d&apos;accès</p>
          ) : (
            <table className="w-full text-sm font-body">
              <thead className="bg-bg-page">
                <tr>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Date</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Utilisateur</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-border-brand">
                    <td className="px-4 py-2.5 text-gray-500">{new Date(log.date).toLocaleString("fr")}</td>
                    <td className="px-4 py-2.5 text-text-main">{log.user}</td>
                    <td className="px-4 py-2.5 text-gray-500">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
