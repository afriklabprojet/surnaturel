"use client"

import { useState, useEffect, useCallback } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type PushPermissionState = "granted" | "denied" | "default" | "unsupported"

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)

  // Vérifier si push est supporté
  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC_KEY

    setSupported(isSupported)

    if (!isSupported) {
      setPermission("unsupported")
      return
    }

    // Vérifier la permission actuelle
    setPermission(Notification.permission as PushPermissionState)

    // Récupérer la subscription existante
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setSubscription(sub)
      })
    })
  }, [])

  // S'abonner aux notifications push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false

    setLoading(true)
    try {
      // Demander la permission
      const permission = await Notification.requestPermission()
      setPermission(permission as PushPermissionState)

      if (permission !== "granted") {
        setLoading(false)
        return false
      }

      // Enregistrer la subscription
      const registration = await navigator.serviceWorker.ready
      const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey.buffer as ArrayBuffer,
      })

      setSubscription(sub)

      // Envoyer au serveur
      const p256dhKey = sub.getKey("p256dh")
      const authKey = sub.getKey("auth")
      
      if (!p256dhKey || !authKey) {
        throw new Error("Clés push manquantes")
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))
            ),
            auth: btoa(
              String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))
            ),
          },
          userAgent: navigator.userAgent,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur serveur")
      }

      setLoading(false)
      return true
    } catch (error) {
      console.error("Erreur subscription push:", error)
      setLoading(false)
      return false
    }
  }, [supported])

  // Se désabonner
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false

    setLoading(true)
    try {
      // Supprimer côté serveur
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      // Supprimer côté client
      await subscription.unsubscribe()
      setSubscription(null)

      setLoading(false)
      return true
    } catch (error) {
      console.error("Erreur désabonnement push:", error)
      setLoading(false)
      return false
    }
  }, [subscription])

  return {
    supported,
    permission,
    subscription,
    loading,
    isSubscribed: !!subscription,
    subscribe,
    unsubscribe,
  }
}
