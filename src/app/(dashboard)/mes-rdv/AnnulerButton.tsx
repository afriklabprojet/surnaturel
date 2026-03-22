"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { XCircle, Loader2, AlertCircle } from "lucide-react"

export default function AnnulerButton({ rdvId }: { rdvId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState("")

  async function handleAnnuler() {
    setLoading(true)
    setErreur("")

    try {
      const res = await fetch(`/api/rdv/${rdvId}`, { method: "PATCH" })

      if (res.ok) {
        router.refresh()
        setConfirming(false)
        return
      }

      const data: { error?: string } = await res.json()
      setErreur(data.error ?? "Impossible d'annuler ce rendez-vous.")
    } catch {
      setErreur("Erreur réseau. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-colors duration-200 hover:bg-red-50"
      >
        <XCircle size={14} />
        Annuler
      </button>
    )
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <p className="text-xs text-gray-500">Confirmer l&apos;annulation ?</p>
      {erreur && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle size={12} />
          {erreur}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          Non
        </button>
        <button
          onClick={handleAnnuler}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
          Oui, annuler
        </button>
      </div>
    </div>
  )
}
