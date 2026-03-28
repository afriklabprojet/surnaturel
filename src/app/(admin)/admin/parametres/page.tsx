"use client"

import { useEffect, useState } from "react"
import { UserPlus, Save, Building2, Shield, Trash2 } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<"centre" | "staff" | "logs">("centre")

  // Centre info
  const [centreForm, setCentreForm] = useState({
    nomCentre: "Le Surnaturel de Dieu",
    adresse: "",
    telephone: "",
    email: "",
    horaires: "",
  })
  const [centreSaving, setCentreSaving] = useState(false)
  const [centreMessage, setCentreMessage] = useState("")

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

  useEffect(() => {
    if (activeTab === "centre") fetchCentre()
    if (activeTab === "staff") fetchStaff()
    if (activeTab === "logs") fetchLogs()
  }, [activeTab])

  const fetchCentre = async () => {
    try {
      const res = await fetch("/api/admin/parametres")
      if (res.ok) {
        const data = await res.json()
        setCentreForm(data)
      }
    } catch { /* ignore */ }
  }

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
        setCentreMessage("Informations enregistrées")
      } else {
        setCentreMessage("Erreur lors de l'enregistrement")
      }
    } catch {
      setCentreMessage("Erreur lors de l'enregistrement")
    }
    setCentreSaving(false)
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
    { key: "staff" as const, label: "Personnel", icon: UserPlus },
    { key: "logs" as const, label: "Logs d'accès", icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border-brand">
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
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Nom du centre</label>
              <input value={centreForm.nomCentre} onChange={(e) => setCentreForm({ ...centreForm, nomCentre: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Adresse</label>
              <input value={centreForm.adresse} onChange={(e) => setCentreForm({ ...centreForm, adresse: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="Adresse complète" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Téléphone</label>
                <input value={centreForm.telephone} onChange={(e) => setCentreForm({ ...centreForm, telephone: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Email</label>
                <input type="email" value={centreForm.email} onChange={(e) => setCentreForm({ ...centreForm, email: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Horaires d&apos;ouverture</label>
              <textarea rows={3} value={centreForm.horaires} onChange={(e) => setCentreForm({ ...centreForm, horaires: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" placeholder="Lun-Ven : 8h-18h&#10;Sam : 9h-14h" />
            </div>
            <button type="submit" disabled={centreSaving} className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" /> {centreSaving ? "Enregistrement…" : "Enregistrer"}
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
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Nom</th>
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Email</th>
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Rôle</th>
                    <th className="text-left px-4 py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Action</th>
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
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Prénom</label>
                  <input required value={staffForm.prenom} onChange={(e) => setStaffForm({ ...staffForm, prenom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Nom</label>
                  <input required value={staffForm.nom} onChange={(e) => setStaffForm({ ...staffForm, nom: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Email</label>
                <input required type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Mot de passe</label>
                <input required type="password" minLength={8} value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-body mb-1">Rôle</label>
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
                  <th className="text-left px-4 py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Date</th>
                  <th className="text-left px-4 py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Utilisateur</th>
                  <th className="text-left px-4 py-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">Action</th>
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
