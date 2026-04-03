"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, ChevronLeft, Calendar } from "lucide-react"

interface SoinOption {
  id: string
  nom: string
  prix: number
  duree: number
}

interface ClientOption {
  id: string
  nom: string
  prenom: string
  email: string
}

export default function NouveauRDVPage() {
  const router = useRouter()

  const [soins, setSoins] = useState<SoinOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  const [form, setForm] = useState({
    soinId: "",
    dateHeure: "",
    notes: "",
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load soins
  useEffect(() => {
    fetch("/api/admin/soins?limit=100")
      .then((r) => r.json())
      .then((d) => setSoins(d.soins || []))
      .catch(() => {})
  }, [])

  // Search clients
  useEffect(() => {
    if (clientSearch.length < 2) {
      setClients([])
      return
    }
    const timer = setTimeout(() => {
      fetch(`/api/admin/clients?search=${encodeURIComponent(clientSearch)}&limit=10`)
        .then((r) => r.json())
        .then((d) => setClients(d.clients || []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [clientSearch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient) {
      setError("Veuillez sélectionner un client.")
      return
    }
    if (!form.soinId) {
      setError("Veuillez sélectionner un soin.")
      return
    }
    if (!form.dateHeure) {
      setError("Veuillez choisir une date et une heure.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedClient.id,
          soinId: form.soinId,
          dateHeure: new Date(form.dateHeure).toISOString(),
          notes: form.notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Erreur lors de la création du rendez-vous.")
        return
      }

      router.push("/admin/rdv")
    } catch {
      setError("Erreur réseau. Veuillez réessayer.")
    } finally {
      setSaving(false)
    }
  }

  const selectedSoin = soins.find((s) => s.id === form.soinId)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 font-body text-[12px] text-text-muted-brand hover:text-primary-brand transition-colors"
        >
          <ChevronLeft size={14} />
          Retour
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-primary-light">
            <Calendar size={16} className="text-primary-brand" />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-light text-text-main">
              Nouveau rendez-vous
            </h1>
            <p className="font-body text-[12px] text-text-muted-brand">
              Créer un rendez-vous pour un client
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client */}
        <div className="border border-border-brand bg-white p-5">
          <h2 className="mb-4 font-display text-[15px] font-light text-text-main">
            Client
          </h2>

          {selectedClient ? (
            <div className="flex items-center justify-between border border-border-brand bg-primary-light p-3">
              <div>
                <p className="font-body text-[13px] font-medium text-text-main">
                  {selectedClient.prenom} {selectedClient.nom}
                </p>
                <p className="font-body text-xs text-text-muted-brand">{selectedClient.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedClient(null); setClientSearch("") }}
                className="font-body text-xs text-danger hover:text-danger-deep transition-colors"
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 border border-border-brand bg-bg-page px-3">
                <Search size={14} className="shrink-0 text-text-muted-brand" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Rechercher par nom, prénom ou email…"
                  className="w-full bg-transparent py-2.5 font-body text-[13px] text-text-main placeholder:text-text-muted-brand outline-none"
                />
              </div>
              {showClientDropdown && clients.length > 0 && (
                <div className="absolute z-20 w-full border border-border-brand bg-white shadow-md">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedClient(c)
                        setShowClientDropdown(false)
                        setClientSearch("")
                      }}
                      className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-bg-page transition-colors border-b border-border-brand last:border-0"
                    >
                      <span className="font-body text-[13px] text-text-main">
                        {c.prenom} {c.nom}
                      </span>
                      <span className="font-body text-xs text-text-muted-brand">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {clientSearch.length >= 2 && clients.length === 0 && (
                <p className="mt-2 font-body text-[12px] text-text-muted-brand">Aucun client trouvé</p>
              )}
            </div>
          )}
        </div>

        {/* Soin */}
        <div className="border border-border-brand bg-white p-5">
          <h2 className="mb-4 font-display text-[15px] font-light text-text-main">Soin</h2>
          <select
            value={form.soinId}
            onChange={(e) => setForm((f) => ({ ...f, soinId: e.target.value }))}
            className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none focus:border-primary-brand"
          >
            <option value="">— Sélectionner un soin —</option>
            {soins.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
          {selectedSoin && (
            <div className="mt-3 flex gap-4">
              <span className="font-body text-[12px] text-text-muted-brand">
                Durée : <strong className="text-text-main">{selectedSoin.duree} min</strong>
              </span>
              <span className="font-body text-[12px] text-text-muted-brand">
                Prix : <strong className="text-text-main">{selectedSoin.prix.toLocaleString("fr")} F CFA</strong>
              </span>
            </div>
          )}
        </div>

        {/* Date & heure */}
        <div className="border border-border-brand bg-white p-5">
          <h2 className="mb-4 font-display text-[15px] font-light text-text-main">
            Date &amp; heure
          </h2>
          <input
            type="datetime-local"
            value={form.dateHeure}
            onChange={(e) => setForm((f) => ({ ...f, dateHeure: e.target.value }))}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main outline-none focus:border-primary-brand"
          />
        </div>

        {/* Notes */}
        <div className="border border-border-brand bg-white p-5">
          <h2 className="mb-4 font-display text-[15px] font-light text-text-main">
            Notes <span className="text-text-muted-brand">(optionnel)</span>
          </h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            maxLength={500}
            rows={4}
            placeholder="Instructions particulières, contre-indications, remarques…"
            className="w-full resize-none border border-border-brand bg-bg-page px-3 py-2.5 font-body text-[13px] text-text-main placeholder:text-text-muted-brand outline-none focus:border-primary-brand"
          />
          <p className="mt-1 text-right font-body text-xs text-text-muted-brand">
            {form.notes.length}/500
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="border border-red-200 bg-red-50 px-4 py-3 font-body text-[12px] text-danger">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-border-brand px-6 py-2.5 font-body text-xs uppercase tracking-[0.15em] text-text-mid transition-colors hover:bg-bg-page"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-brand px-6 py-2.5 font-body text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Créer le rendez-vous
          </button>
        </div>
      </form>
    </div>
  )
}
