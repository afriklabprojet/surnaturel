"use client"

import { useState, createContext, useContext, useCallback, type ReactNode } from "react"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmOptions {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
  return ctx.confirm
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve })
    })
  }, [])

  function handleClose(result: boolean) {
    if (state) {
      state.resolve(result)
      setState(null)
    }
  }

  const variant = state?.options.variant ?? "default"
  const variantClasses = {
    danger: "border-danger bg-red-50",
    warning: "border-orange-400 bg-orange-50",
    default: "border-border-brand",
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state?.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => handleClose(false)}
        >
          <div
            className={`relative mx-4 w-full max-w-md border bg-white p-6 shadow-lg animate-in zoom-in-95 ${variantClasses[variant]}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleClose(false)}
              className="absolute right-4 top-4 text-text-muted-brand hover:text-text-main transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              {variant !== "default" && (
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center ${
                    variant === "danger" ? "bg-danger/10 text-danger" : "bg-orange-100 text-orange-600"
                  }`}
                >
                  <AlertTriangle size={20} />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-display text-[20px] font-normal text-text-main">
                  {state.options.title ?? "Confirmation"}
                </h3>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-text-mid">
                  {state.options.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleClose(false)}
                className="px-5 py-2.5 border border-border-brand font-body text-xs uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
              >
                {state.options.cancelLabel ?? "Annuler"}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-5 py-2.5 font-body text-xs uppercase tracking-widest text-white transition-colors ${
                  variant === "danger"
                    ? "bg-danger hover:bg-red-700"
                    : variant === "warning"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-primary-brand hover:bg-primary-dark"
                }`}
              >
                {state.options.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
