"use client"

import { useState, useEffect } from "react"
import { 
  Mail, 
  Send, 
  Users, 
  Eye, 
  MousePointer,
  Calendar,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react"

interface Newsletter {
  id: string
  sujet: string
  contenu: string
  type: string
  nbDestinataires: number
  nbOuvertures: number
  nbClics: number
  envoye: boolean
  dateEnvoi: string | null
  createdAt: string
}

interface Stats {
  totalEnvoyes: number
  totalDestinataires: number
  totalOuvertures: number
  tauxOuverture: number
}

export default function AdminNewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [nbAbonnes, setNbAbonnes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    sujet: "",
    messagePersonnalise: "",
    codePromo: {
      code: "",
      reduction: "",
      dateExpiration: "",
    },
    envoyerMaintenant: true,
  })

  const fetchNewsletters = async () => {
    try {
      const res = await fetch("/api/admin/newsletter")
      if (res.ok) {
        const data = await res.json()
        setNewsletters(data.newsletters || [])
        setStats(data.stats)
        setNbAbonnes(data.nbAbonnes || 0)
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const payload = {
        sujet: formData.sujet || undefined,
        messagePersonnalise: formData.messagePersonnalise || undefined,
        codePromo: formData.codePromo.code 
          ? formData.codePromo 
          : undefined,
        envoyerMaintenant: formData.envoyerMaintenant,
      }

      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        alert(
          data.envoyes 
            ? `Newsletter envoyée à ${data.envoyes} abonné(s) !`
            : "Newsletter créée"
        )
        setShowForm(false)
        setFormData({
          sujet: "",
          messagePersonnalise: "",
          codePromo: { code: "", reduction: "", dateExpiration: "" },
          envoyerMaintenant: true,
        })
        fetchNewsletters()
      } else {
        const error = await res.json()
        alert(error.error || "Erreur lors de l'envoi")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Abonnés actifs</p>
              <p className="text-2xl font-bold text-gray-900">{nbAbonnes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Newsletters envoyées</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEnvoyes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total ouvertures</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOuvertures || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <MousePointer className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux d'ouverture</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.tauxOuverture || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Envoi automatique : chaque dimanche à 10h</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchNewsletters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Envoyer manuellement
          </button>
        </div>
      </div>

      {/* Formulaire d'envoi manuel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Nouvelle newsletter</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sujet (optionnel)
              </label>
              <input
                type="text"
                value={formData.sujet}
                onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                placeholder="🌿 Les actualités du Surnaturel de Dieu"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message personnalisé (optionnel)
              </label>
              <textarea
                value={formData.messagePersonnalise}
                onChange={(e) => setFormData({ ...formData, messagePersonnalise: e.target.value })}
                rows={3}
                placeholder="Un message spécial pour vos abonnés..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Code promo (optionnel)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.codePromo.code}
                  onChange={(e) => setFormData({
                    ...formData,
                    codePromo: { ...formData.codePromo, code: e.target.value.toUpperCase() }
                  })}
                  placeholder="Code (ex: NEWSLETTER10)"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <input
                  type="text"
                  value={formData.codePromo.reduction}
                  onChange={(e) => setFormData({
                    ...formData,
                    codePromo: { ...formData.codePromo, reduction: e.target.value }
                  })}
                  placeholder="Réduction (ex: 10% de réduction)"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <input
                  type="text"
                  value={formData.codePromo.dateExpiration}
                  onChange={(e) => setFormData({
                    ...formData,
                    codePromo: { ...formData.codePromo, dateExpiration: e.target.value }
                  })}
                  placeholder="Expiration (ex: 31 décembre 2025)"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="envoyerMaintenant"
                checked={formData.envoyerMaintenant}
                onChange={(e) => setFormData({ ...formData, envoyerMaintenant: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="envoyerMaintenant" className="text-sm text-gray-700">
                Envoyer immédiatement à {nbAbonnes} abonné(s)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {formData.envoyerMaintenant ? "Envoyer" : "Créer brouillon"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des newsletters */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold">Historique des newsletters</h3>
        </div>
        
        {newsletters.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucune newsletter envoyée</p>
          </div>
        ) : (
          <div className="divide-y">
            {newsletters.map((nl) => (
              <div key={nl.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${nl.envoye ? "bg-green-100" : "bg-amber-100"}`}>
                      {nl.envoye ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{nl.sujet}</h4>
                      <p className="text-sm text-gray-500">
                        {nl.type === "HEBDOMADAIRE" ? "Automatique" : "Manuel"} • 
                        {nl.dateEnvoi ? formatDate(nl.dateEnvoi) : formatDate(nl.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{nl.nbDestinataires}</p>
                      <p className="text-gray-500">envoyés</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{nl.nbOuvertures}</p>
                      <p className="text-gray-500">ouvertures</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{nl.nbClics}</p>
                      <p className="text-gray-500">clics</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-primary">Newsletter automatique</p>
            <p className="text-gray-600 mt-1">
              La newsletter est envoyée automatiquement chaque dimanche à 10h aux abonnés. 
              Elle inclut les derniers articles de blog, les soins populaires et un éventuel code promo actif.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
