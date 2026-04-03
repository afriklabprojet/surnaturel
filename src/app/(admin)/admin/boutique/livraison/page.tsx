"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Save, MapPin, Truck, AlertCircle, GripVertical } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────

interface ZoneLivraison {
  id: string
  nom: string
  description: string
  frais: number
  delai: string
  actif: boolean
}

interface ConfigLivraison {
  zones: ZoneLivraison[]
  seuilGratuit: number | null
  messageGratuit: string
  zoneDefautId: string
}

// ─── Page Admin Livraison ────────────────────────────────────────

export default function PageAdminLivraison() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<ConfigLivraison | null>(null)

  // Charger la config
  useEffect(() => {
    fetch("/api/boutique/livraison")
      .then((res) => res.json())
      .then((data: ConfigLivraison) => {
        setConfig(data)
        setLoading(false)
      })
      .catch(() => {
        toast.error("Erreur lors du chargement")
        setLoading(false)
      })
  }, [])

  // Sauvegarder
  async function handleSave() {
    if (!config) return
    setSaving(true)

    try {
      const res = await fetch("/api/boutique/livraison", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur")
      }

      toast.success("Configuration sauvegardée")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  // Ajouter une zone
  function ajouterZone() {
    if (!config) return
    const newId = `zone_${Date.now()}`
    setConfig({
      ...config,
      zones: [
        ...config.zones,
        {
          id: newId,
          nom: "Nouvelle zone",
          description: "",
          frais: 0,
          delai: "3-5 jours",
          actif: true,
        },
      ],
    })
  }

  // Supprimer une zone
  function supprimerZone(id: string) {
    if (!config) return
    if (config.zones.length <= 1) {
      toast.error("Vous devez garder au moins une zone")
      return
    }
    if (config.zoneDefautId === id) {
      toast.error("Impossible de supprimer la zone par défaut")
      return
    }
    setConfig({
      ...config,
      zones: config.zones.filter((z) => z.id !== id),
    })
  }

  // Mettre à jour une zone
  function updateZone(id: string, updates: Partial<ZoneLivraison>) {
    if (!config) return
    setConfig({
      ...config,
      zones: config.zones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-6 text-center text-danger">
        Erreur lors du chargement de la configuration
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-light text-text-main flex items-center gap-3">
            <Truck className="h-6 w-6 text-gold" />
            Frais de livraison
          </h1>
          <p className="mt-1 font-body text-[13px] text-text-muted-brand">
            Configurez les zones et tarifs de livraison
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-brand font-body text-xs uppercase tracking-widest text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {/* Configuration générale */}
      <div className="bg-white border border-border-brand p-6">
        <h2 className="font-display text-[18px] font-light text-text-main mb-4">
          Livraison gratuite
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">
              Seuil de gratuité (F CFA)
            </label>
            <input
              type="number"
              value={config.seuilGratuit ?? ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  seuilGratuit: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Laisser vide pour désactiver"
              className="mt-2 w-full border border-border-brand px-4 py-3 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
            />
            <p className="mt-1 font-body text-[11px] text-text-muted-brand">
              Livraison gratuite à partir de ce montant. Laisser vide pour désactiver.
            </p>
          </div>

          <div>
            <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">
              Message affiché
            </label>
            <input
              type="text"
              value={config.messageGratuit}
              onChange={(e) => setConfig({ ...config, messageGratuit: e.target.value })}
              placeholder="Ex: Livraison gratuite dès 50 000 F CFA"
              className="mt-2 w-full border border-border-brand px-4 py-3 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="font-body text-xs uppercase tracking-widest text-text-muted-brand">
            Zone par défaut
          </label>
          <select
            value={config.zoneDefautId}
            onChange={(e) => setConfig({ ...config, zoneDefautId: e.target.value })}
            className="mt-2 w-full border border-border-brand px-4 py-3 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
          >
            {config.zones
              .filter((z) => z.actif)
              .map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.nom}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Zones de livraison */}
      <div className="bg-white border border-border-brand p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-light text-text-main flex items-center gap-2">
            <MapPin size={18} className="text-gold" />
            Zones de livraison
          </h2>
          <button
            onClick={ajouterZone}
            className="flex items-center gap-2 px-4 py-2 border border-primary-brand font-body text-xs uppercase tracking-widest text-primary-brand transition-colors hover:bg-primary-brand hover:text-white"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        <div className="space-y-4">
          {config.zones.map((zone, index) => (
            <div
              key={zone.id}
              className={`border p-4 transition-colors ${
                zone.actif ? "border-border-brand" : "border-dashed border-gray-300 bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 pt-2 text-gray-400">
                  <GripVertical size={16} />
                </div>

                <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                      Nom de la zone
                    </label>
                    <input
                      type="text"
                      value={zone.nom}
                      onChange={(e) => updateZone(zone.id, { nom: e.target.value })}
                      className="mt-1 w-full border border-border-brand px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div>
                    <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                      Frais (F CFA)
                    </label>
                    <input
                      type="number"
                      value={zone.frais}
                      onChange={(e) => updateZone(zone.id, { frais: Number(e.target.value) })}
                      min={0}
                      className="mt-1 w-full border border-border-brand px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div>
                    <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                      Délai
                    </label>
                    <input
                      type="text"
                      value={zone.delai}
                      onChange={(e) => updateZone(zone.id, { delai: e.target.value })}
                      placeholder="Ex: 24-48h"
                      className="mt-1 w-full border border-border-brand px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zone.actif}
                        onChange={(e) => updateZone(zone.id, { actif: e.target.checked })}
                        className="h-4 w-4 accent-primary-brand"
                      />
                      <span className="font-body text-[12px] text-text-main">Actif</span>
                    </label>

                    <button
                      onClick={() => supprimerZone(zone.id)}
                      className="ml-auto p-2 text-gray-400 hover:text-danger transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 ml-8">
                <label className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={zone.description}
                  onChange={(e) => updateZone(zone.id, { description: e.target.value })}
                  placeholder="Ex: Cocody, Plateau, Marcory..."
                  className="mt-1 w-full border border-border-brand px-3 py-2 font-body text-[13px] text-text-main outline-none focus:border-gold transition-colors"
                />
              </div>

              {config.zoneDefautId === zone.id && (
                <div className="mt-2 ml-8 flex items-center gap-1 text-primary-brand">
                  <AlertCircle size={12} />
                  <span className="font-body text-[11px]">Zone par défaut</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Aperçu */}
      <div className="bg-white border border-gold p-6">
        <h2 className="font-display text-[18px] font-light text-text-main mb-4">
          Aperçu
        </h2>
        <div className="space-y-2">
          {config.zones
            .filter((z) => z.actif)
            .map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between py-2 border-b border-border-brand last:border-0"
              >
                <div>
                  <span className="font-body text-[13px] text-text-main">{zone.nom}</span>
                  <span className="ml-2 font-body text-[11px] text-text-muted-brand">
                    ({zone.delai})
                  </span>
                </div>
                <span
                  className={`font-display text-[14px] ${
                    zone.frais === 0 ? "text-primary-brand" : "text-text-main"
                  }`}
                >
                  {zone.frais === 0 ? "Gratuit" : formatPrix(zone.frais)}
                </span>
              </div>
            ))}
        </div>
        {config.seuilGratuit && (
          <p className="mt-4 font-body text-[12px] text-primary-brand">
            {config.messageGratuit}
          </p>
        )}
      </div>
    </div>
  )
}
