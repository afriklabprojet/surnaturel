"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react"
import { formatPrix } from "@/lib/utils"

interface RDVDuJour {
  id: string
  client: {
    id: string
    nom: string
    prenom: string
    telephone: string
    email: string
    image?: string
  }
  soin: {
    id: string
    nom: string
    duree: number
    prix: number
  }
  dateHeure: string
  duree: number
  statut: string
  notes?: string
  noteInterne?: string
  forfait?: {
    nom: string
    seancesRestantes: number
  }
}

interface Patient {
  id: string
  nom: string
  prenom: string
  telephone: string
  email: string
  image?: string
  _count: {
    rdvs: number
    fiches: number
  }
  derniereVisite?: string
  prochainRdv?: string
}

interface NoteSageFemme {
  id: string
  clientId: string
  clientNom: string
  contenu: string
  createdAt: string
}

interface DashboardSageFemme {
  rdvDuJour: RDVDuJour[]
  rdvEnAttente: number
  rdvConfirmes: number
  rdvAnnules: number
  patientsActifs: number
  prochainRdv?: RDVDuJour
  stats: {
    soinsAujourdhui: number
    revenuPotentiel: number
    dureeTotal: number
  }
}

export default function SageFemmeDashboard() {
  const [data, setData] = useState<DashboardSageFemme | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [notes, setNotes] = useState<NoteSageFemme[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"rdv" | "patients" | "notes">("rdv")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("TOUS")
  const [nouvelleNote, setNouvelleNote] = useState("")
  const [patientNote, setPatientNote] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [rdvRes, patientsRes, notesRes] = await Promise.all([
        fetch("/api/admin/sage-femme/dashboard"),
        fetch("/api/admin/sage-femme/patients"),
        fetch("/api/admin/sage-femme/notes"),
      ])

      if (rdvRes.ok) {
        const rdvData = await rdvRes.json()
        setData(rdvData)
      }
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json()
        setPatients(patientsData.patients || [])
      }
      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotes(notesData.notes || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateRdvStatut(rdvId: string, statut: string) {
    const res = await fetch(`/api/admin/rdv/${rdvId}/statut`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    })
    if (res.ok) {
      fetchData()
    }
  }

  async function addNote() {
    if (!nouvelleNote.trim() || !patientNote) return
    const res = await fetch("/api/admin/sage-femme/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: patientNote, contenu: nouvelleNote }),
    })
    if (res.ok) {
      setNouvelleNote("")
      setPatientNote("")
      fetchData()
    }
  }

  const formatHeure = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    })
  }

  const statutConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    EN_ATTENTE: { label: "En attente", color: "text-amber-600 bg-amber-100", icon: AlertCircle },
    CONFIRME: { label: "Confirmé", color: "text-primary-brand bg-green-100", icon: CheckCircle },
    ANNULE: { label: "Annulé", color: "text-red-600 bg-red-100", icon: XCircle },
    TERMINE: { label: "Terminé", color: "text-blue-600 bg-blue-100", icon: CheckCircle },
  }

  const rdvFiltres = data?.rdvDuJour.filter((rdv) => {
    if (filterStatut !== "TOUS" && rdv.statut !== filterStatut) return false
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      return (
        rdv.client.nom.toLowerCase().includes(search) ||
        rdv.client.prenom.toLowerCase().includes(search) ||
        rdv.soin.nom.toLowerCase().includes(search)
      )
    }
    return true
  }) || []

  const prochainRdv = data?.rdvDuJour.find(
    (rdv) => rdv.statut === "CONFIRME" && new Date(rdv.dateHeure) > new Date()
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] text-primary-brand">
            Tableau de bord Sage-Femme
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-muted-brand">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 border border-border-brand px-4 py-2 text-[13px] transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          <Link
            href="/admin/rdv/nouveau"
            className="flex items-center gap-2 bg-primary-brand px-4 py-2 text-[13px] text-white transition-colors hover:bg-primary-brand/90"
          >
            <Plus size={16} />
            Nouveau RDV
          </Link>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border-brand bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                RDV aujourd&apos;hui
              </p>
              <p className="mt-2 font-display text-[32px] text-primary-brand">
                {data?.stats.soinsAujourdhui || 0}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-primary-brand/30" />
          </div>
          <div className="mt-3 flex gap-3 text-[12px]">
            <span className="text-green-600">{data?.rdvConfirmes || 0} confirmés</span>
            <span className="text-amber-600">{data?.rdvEnAttente || 0} en attente</span>
          </div>
        </div>

        <div className="border border-border-brand bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                Temps de soins
              </p>
              <p className="mt-2 font-display text-[32px] text-gold">
                {Math.round((data?.stats.dureeTotal || 0) / 60)}h
              </p>
            </div>
            <Clock className="h-8 w-8 text-gold/30" />
          </div>
          <p className="mt-3 text-[12px] text-text-muted-brand">
            {data?.stats.dureeTotal || 0} minutes prévues
          </p>
        </div>

        <div className="border border-border-brand bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                Revenus prévus
              </p>
              <p className="mt-2 font-display text-[32px] text-text-main">
                {formatPrix(data?.stats.revenuPotentiel || 0)}
              </p>
            </div>
            <Sparkles className="h-8 w-8 text-primary-brand/30" />
          </div>
        </div>

        <div className="border border-border-brand bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                Patients actifs
              </p>
              <p className="mt-2 font-display text-[32px] text-primary-brand">
                {data?.patientsActifs || 0}
              </p>
            </div>
            <User className="h-8 w-8 text-primary-brand/30" />
          </div>
          <Link
            href="/admin/clients"
            className="mt-3 flex items-center text-[12px] text-primary-brand hover:underline"
          >
            Voir tous <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Prochain RDV */}
      {prochainRdv && (
        <div className="border-l-4 border-primary-brand bg-primary-brand/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-brand text-white">
                <Clock size={24} />
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Prochain rendez-vous
                </p>
                <p className="font-display text-[18px] text-primary-brand">
                  {prochainRdv.client.prenom} {prochainRdv.client.nom}
                </p>
                <p className="text-[13px] text-text-mid">
                  {prochainRdv.soin.nom} • {formatHeure(prochainRdv.dateHeure)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${prochainRdv.client.telephone}`}
                className="flex items-center gap-2 border border-primary-brand px-3 py-2 text-[13px] text-primary-brand transition-colors hover:bg-primary-brand hover:text-white"
              >
                <Phone size={14} />
                Appeler
              </a>
              <Link
                href={`/admin/rdv/${prochainRdv.id}`}
                className="flex items-center gap-2 bg-primary-brand px-3 py-2 text-[13px] text-white transition-colors hover:bg-primary-brand/90"
              >
                Voir détails
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border-brand">
        <div className="flex gap-6">
          {[
            { id: "rdv", label: "RDV du jour", count: data?.rdvDuJour.length },
            { id: "patients", label: "Mes patients", count: patients.length },
            { id: "notes", label: "Notes", count: notes.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`relative border-b-2 px-1 pb-3 text-[14px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-primary-brand text-primary-brand"
                  : "border-transparent text-text-muted-brand hover:text-text-main"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des tabs */}
      {activeTab === "rdv" && (
        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted-brand" />
              <input
                type="text"
                placeholder="Rechercher un patient ou un soin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-border-brand py-2 pl-10 pr-4 text-[14px] focus:border-primary-brand focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-text-muted-brand" />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="border border-border-brand px-3 py-2 text-[14px]"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>

          {/* Liste des RDV */}
          {rdvFiltres.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-text-muted-brand/30" />
              <p className="mt-4 text-text-muted-brand">Aucun rendez-vous trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rdvFiltres.map((rdv) => {
                const config = statutConfig[rdv.statut] || statutConfig.EN_ATTENTE
                const StatusIcon = config.icon
                const isPasse = new Date(rdv.dateHeure) < new Date()

                return (
                  <div
                    key={rdv.id}
                    className={`border border-border-brand bg-white p-4 transition-colors hover:bg-gray-50 ${
                      isPasse && rdv.statut !== "TERMINE" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-4">
                        {/* Heure */}
                        <div className="flex h-14 w-14 flex-col items-center justify-center border border-border-brand bg-gray-50">
                          <span className="font-display text-[18px] text-primary-brand">
                            {formatHeure(rdv.dateHeure).split(":")[0]}
                          </span>
                          <span className="text-xs text-text-muted-brand">
                            :{formatHeure(rdv.dateHeure).split(":")[1]}
                          </span>
                        </div>

                        {/* Info patient */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-text-main">
                              {rdv.client.prenom} {rdv.client.nom}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${config.color}`}
                            >
                              <StatusIcon size={12} />
                              {config.label}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-2 text-[13px] text-text-mid">
                            <Sparkles size={14} className="text-gold" />
                            {rdv.soin.nom}
                            <span className="text-text-muted-brand">
                              • {rdv.duree || rdv.soin.duree} min
                            </span>
                          </p>
                          {rdv.forfait && (
                            <p className="mt-1 text-[12px] text-primary-brand">
                              Forfait: {rdv.forfait.nom} ({rdv.forfait.seancesRestantes} séances restantes)
                            </p>
                          )}
                          {rdv.notes && (
                            <p className="mt-2 flex items-start gap-2 rounded bg-amber-50 p-2 text-[12px] text-amber-800">
                              <FileText size={14} className="mt-0.5 shrink-0" />
                              {rdv.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`tel:${rdv.client.telephone}`}
                          className="flex items-center gap-1 rounded border border-border-brand px-3 py-1.5 text-[12px] text-text-muted-brand transition-colors hover:border-primary-brand hover:text-primary-brand"
                          title={rdv.client.telephone}
                        >
                          <Phone size={14} />
                          Appeler
                        </a>
                        {rdv.statut === "EN_ATTENTE" && (
                          <button
                            onClick={() => updateRdvStatut(rdv.id, "CONFIRME")}
                            className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-green-700"
                          >
                            <CheckCircle size={14} />
                            Confirmer
                          </button>
                        )}
                        {rdv.statut === "CONFIRME" && (
                          <button
                            onClick={() => updateRdvStatut(rdv.id, "TERMINE")}
                            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-blue-700"
                          >
                            <CheckCircle size={14} />
                            Terminer
                          </button>
                        )}
                        <Link
                          href={`/admin/clients/${rdv.client.id}/fiche`}
                          className="flex items-center gap-1 rounded border border-primary-brand px-3 py-1.5 text-[12px] text-primary-brand transition-colors hover:bg-primary-brand hover:text-white"
                        >
                          <FileText size={14} />
                          Fiche
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "patients" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted-brand" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-border-brand py-2 pl-10 pr-4 text-[14px] focus:border-primary-brand focus:outline-none"
            />
          </div>

          {patients.length === 0 ? (
            <div className="py-12 text-center">
              <User className="mx-auto h-12 w-12 text-text-muted-brand/30" />
              <p className="mt-4 text-text-muted-brand">Aucun patient</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-border-brand bg-gray-50">
                    <th className="p-3 text-left font-medium text-text-muted-brand">Patient</th>
                    <th className="hidden p-3 text-left font-medium text-text-muted-brand md:table-cell">
                      Contact
                    </th>
                    <th className="hidden p-3 text-center font-medium text-text-muted-brand lg:table-cell">
                      RDV
                    </th>
                    <th className="hidden p-3 text-center font-medium text-text-muted-brand lg:table-cell">
                      Fiches
                    </th>
                    <th className="p-3 text-right font-medium text-text-muted-brand">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients
                    .filter((p) => {
                      if (!searchQuery) return true
                      const search = searchQuery.toLowerCase()
                      return (
                        p.nom.toLowerCase().includes(search) ||
                        p.prenom.toLowerCase().includes(search) ||
                        p.email.toLowerCase().includes(search)
                      )
                    })
                    .map((patient) => (
                      <tr key={patient.id} className="border-b border-border-brand">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {patient.image ? (
                              <img
                                src={patient.image}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-brand/10 text-primary-brand">
                                <User size={20} />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {patient.prenom} {patient.nom}
                              </p>
                              {patient.derniereVisite && (
                                <p className="text-[12px] text-text-muted-brand">
                                  Dernière visite: {formatDate(patient.derniereVisite)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden p-3 md:table-cell">
                          <p className="text-[13px]">{patient.email}</p>
                          <p className="text-[12px] text-text-muted-brand">{patient.telephone}</p>
                        </td>
                        <td className="hidden p-3 text-center lg:table-cell">
                          <span className="rounded bg-gray-100 px-2 py-1 text-[13px]">
                            {patient._count.rdvs}
                          </span>
                        </td>
                        <td className="hidden p-3 text-center lg:table-cell">
                          <span className="rounded bg-gray-100 px-2 py-1 text-[13px]">
                            {patient._count.fiches}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/clients/${patient.id}`}
                              className="rounded border border-border-brand px-3 py-1 text-[12px] transition-colors hover:border-primary-brand hover:text-primary-brand"
                            >
                              Profil
                            </Link>
                            <Link
                              href={`/admin/clients/${patient.id}/fiche`}
                              className="rounded bg-primary-brand px-3 py-1 text-[12px] text-white transition-colors hover:bg-primary-brand/90"
                            >
                              Fiche
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Formulaire nouvelle note */}
          <div className="border border-border-brand bg-white p-4">
            <h3 className="mb-3 font-medium text-text-main">Ajouter une note</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                className="border border-border-brand px-3 py-2 text-[14px] sm:w-48"
              >
                <option value="">Sélectionner un patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Votre note..."
                value={nouvelleNote}
                onChange={(e) => setNouvelleNote(e.target.value)}
                className="flex-1 border border-border-brand px-3 py-2 text-[14px] focus:border-primary-brand focus:outline-none"
              />
              <button
                onClick={addNote}
                disabled={!nouvelleNote.trim() || !patientNote}
                className="flex items-center gap-2 bg-primary-brand px-4 py-2 text-[13px] text-white transition-colors hover:bg-primary-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Ajouter
              </button>
            </div>
          </div>

          {/* Liste des notes */}
          {notes.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-text-muted-brand/30" />
              <p className="mt-4 text-text-muted-brand">Aucune note</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border border-border-brand bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-primary-brand">{note.clientNom}</p>
                      <p className="mt-1 text-[14px] text-text-main">{note.contenu}</p>
                    </div>
                    <p className="shrink-0 text-[12px] text-text-muted-brand">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
