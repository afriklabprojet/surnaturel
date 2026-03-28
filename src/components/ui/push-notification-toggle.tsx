"use client"

import { Bell, BellOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { usePushNotifications } from "@/lib/hooks/use-push-notifications"
import { toast } from "sonner"

interface PushNotificationToggleProps {
  className?: string
  variant?: "compact" | "full"
}

export function PushNotificationToggle({
  className = "",
  variant = "full",
}: PushNotificationToggleProps) {
  const {
    supported,
    permission,
    loading,
    isSubscribed,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  async function handleToggle() {
    if (isSubscribed) {
      const success = await unsubscribe()
      if (success) {
        toast.success("Notifications désactivées")
      } else {
        toast.error("Erreur lors de la désactivation")
      }
    } else {
      const success = await subscribe()
      if (success) {
        toast.success("Notifications activées !")
      } else if (permission === "denied") {
        toast.error("Notifications bloquées dans les paramètres du navigateur")
      } else {
        toast.error("Erreur lors de l'activation")
      }
    }
  }

  // Non supporté
  if (!supported) {
    if (variant === "compact") return null
    return (
      <div className={`flex items-center gap-3 text-text-muted-brand ${className}`}>
        <BellOff size={20} />
        <span className="font-body text-[13px]">
          Push non disponible sur ce navigateur
        </span>
      </div>
    )
  }

  // Permission refusée
  if (permission === "denied") {
    if (variant === "compact") return null
    return (
      <div className={`flex items-center gap-3 rounded bg-red-50 px-4 py-3 ${className}`}>
        <AlertCircle size={20} className="text-red-600" />
        <div>
          <p className="font-body text-[14px] font-medium text-red-800">
            Notifications bloquées
          </p>
          <p className="font-body text-[12px] text-red-600">
            Modifiez les paramètres de votre navigateur pour les activer
          </p>
        </div>
      </div>
    )
  }

  // Version compacte (juste un bouton)
  if (variant === "compact") {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-2 ${className}`}
        title={isSubscribed ? "Désactiver les notifications" : "Activer les notifications"}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin text-text-muted-brand" />
        ) : isSubscribed ? (
          <Bell size={20} className="text-primary-brand" />
        ) : (
          <BellOff size={20} className="text-text-muted-brand" />
        )}
      </button>
    )
  }

  // Version complète
  return (
    <div className={`border border-border-brand bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <div className="flex h-10 w-10 items-center justify-center bg-primary-brand/10">
              <Bell size={20} className="text-primary-brand" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center bg-gray-100">
              <BellOff size={20} className="text-text-muted-brand" />
            </div>
          )}
          <div>
            <p className="font-body text-[14px] font-medium text-text-main">
              Notifications push
            </p>
            <p className="font-body text-[12px] text-text-muted-brand">
              {isSubscribed
                ? "Recevez des alertes même sans le site ouvert"
                : "Activez pour ne rien manquer"}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isSubscribed ? "bg-primary-brand" : "bg-gray-300"
          } ${loading ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              isSubscribed ? "left-[22px]" : "left-0.5"
            }`}
          />
          {loading && (
            <Loader2
              size={14}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white"
            />
          )}
        </button>
      </div>

      {isSubscribed && (
        <div className="mt-3 flex items-center gap-2 text-primary-brand">
          <CheckCircle size={14} />
          <span className="font-body text-[12px]">
            Notifications activées sur cet appareil
          </span>
        </div>
      )}
    </div>
  )
}
