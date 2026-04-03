"use client"

import { useState, createContext, useContext, useCallback, type ReactNode } from "react"
import { Check, X, AlertCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function addToast(message: string, type: ToastType) {
    const id = ++nextId
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]) // max 4 toasts
    setTimeout(() => dismiss(id), 3500)
  }

  const success = useCallback((msg: string) => addToast(msg, "success"), [])
  const error = useCallback((msg: string) => addToast(msg, "error"), [])
  const info = useCallback((msg: string) => addToast(msg, "info"), [])

  const ICONS = {
    success: <Check size={15} />,
    error: <AlertCircle size={15} />,
    info: <Info size={15} />,
  }

  const COLORS = {
    success: "border-l-primary-brand text-primary-brand",
    error: "border-l-danger text-danger",
    info: "border-l-gold text-gold",
  }

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}

      {/* ─── Toast container — bottom-center, au-dessus de la nav mobile ─── */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="alert"
              className={`flex items-center gap-3 bg-white border border-border-brand border-l-4 ${COLORS[toast.type]} px-5 py-3 shadow-xl min-w-[280px] max-w-sm pointer-events-auto`}
            >
              <span className={COLORS[toast.type].split(" ")[1]}>{ICONS[toast.type]}</span>
              <span className="font-body text-[13px] text-text-main flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-text-muted-brand hover:text-text-main transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}
