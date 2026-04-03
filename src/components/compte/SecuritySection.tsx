"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Shield,
  Smartphone,
  Key,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  Laptop,
  Tablet,
  Monitor,
  X,
  Eye,
  EyeOff,
  QrCode,
  Download,
} from "lucide-react"
import { staggerItem } from "@/lib/animations"
import { BtnArrow } from "@/components/ui/buttons"

interface Session {
  id: string
  deviceName: string
  deviceType: string
  ipAddress: string
  location: string | null
  lastActiveAt: string
  createdAt: string
  isCurrent: boolean
}

interface TwoFactorStatus {
  enabled: boolean
  enabledAt: string | null
  backupCodesRemaining: number
}

export function SecuritySection() {
  // 2FA State
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFactorStatus | null>(null)
  const [setupMode, setSetupMode] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [loading2FA, setLoading2FA] = useState(false)
  const [message2FA, setMessage2FA] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Disable 2FA state
  const [showDisable, setShowDisable] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // ─── Load 2FA status ────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/2fa")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setTwoFAStatus(data)
      })
      .catch(() => {})
  }, [])

  // ─── Load sessions ──────────────────────────────────────────────

  useEffect(() => {
    setLoadingSessions(true)
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions)
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false))
  }, [])

  // ─── Start 2FA setup ────────────────────────────────────────────

  const startSetup = async () => {
    setLoading2FA(true)
    setMessage2FA(null)
    try {
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      })
      const data = await res.json()
      if (res.ok) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setSetupMode(true)
      } else {
        setMessage2FA({ type: "error", text: data.error || "Erreur" })
      }
    } catch {
      setMessage2FA({ type: "error", text: "Erreur de connexion" })
    }
    setLoading2FA(false)
  }

  // ─── Enable 2FA (verify code) ───────────────────────────────────

  const enable2FA = async () => {
    if (verifyCode.length !== 6) {
      setMessage2FA({ type: "error", text: "Code à 6 chiffres requis" })
      return
    }

    setLoading2FA(true)
    setMessage2FA(null)
    try {
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code: verifyCode }),
      })
      const data = await res.json()
      if (res.ok) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        setSetupMode(false)
        setTwoFAStatus({ enabled: true, enabledAt: new Date().toISOString(), backupCodesRemaining: 8 })
        setMessage2FA({ type: "success", text: "2FA activée !" })
      } else {
        setMessage2FA({ type: "error", text: data.error || "Code incorrect" })
      }
    } catch {
      setMessage2FA({ type: "error", text: "Erreur de connexion" })
    }
    setLoading2FA(false)
  }

  // ─── Disable 2FA ────────────────────────────────────────────────

  const disable2FA = async () => {
    if (!disablePassword) {
      setMessage2FA({ type: "error", text: "Mot de passe requis" })
      return
    }

    setLoading2FA(true)
    setMessage2FA(null)
    try {
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", password: disablePassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFAStatus({ enabled: false, enabledAt: null, backupCodesRemaining: 0 })
        setShowDisable(false)
        setDisablePassword("")
        setMessage2FA({ type: "success", text: "2FA désactivée" })
      } else {
        setMessage2FA({ type: "error", text: data.error || "Erreur" })
      }
    } catch {
      setMessage2FA({ type: "error", text: "Erreur de connexion" })
    }
    setLoading2FA(false)
  }

  // ─── Copy backup codes ──────────────────────────────────────────

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // ─── Revoke session ─────────────────────────────────────────────

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId)
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE" })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      }
    } catch {
      // Ignore
    }
    setRevokingId(null)
  }

  // ─── Revoke all sessions ────────────────────────────────────────

  const revokeAllSessions = async () => {
    setRevokingId("all")
    try {
      const res = await fetch("/api/sessions?all=true", { method: "DELETE" })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrent))
      }
    } catch {
      // Ignore
    }
    setRevokingId(null)
  }

  // ─── Device icon ────────────────────────────────────────────────

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === "mobile") return <Smartphone size={18} className="text-primary-brand" />
    if (type === "tablet") return <Tablet size={18} className="text-primary-brand" />
    return <Laptop size={18} className="text-primary-brand" />
  }

  return (
    <>
      {/* ─── Section 2FA ─── */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-6 bg-gold" />
          <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
            Authentification à deux facteurs
          </span>
          <div className="h-px flex-1 bg-gold/30" />
        </div>

        <div className="border border-border-brand bg-white p-6 space-y-4">
          {/* Status */}
          {twoFAStatus && (
            <div className="flex items-start gap-4">
              <div className={`p-3 ${twoFAStatus.enabled ? "bg-primary-light" : "bg-gray-100"}`}>
                <Shield size={24} className={twoFAStatus.enabled ? "text-primary-brand" : "text-gray-400"} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[16px] font-light text-text-main">
                    2FA {twoFAStatus.enabled ? "activée" : "désactivée"}
                  </h3>
                  {twoFAStatus.enabled && <CheckCircle size={14} className="text-primary-brand" />}
                </div>
                <p className="font-body text-[13px] text-text-mid mt-1">
                  {twoFAStatus.enabled
                    ? `Activée le ${new Date(twoFAStatus.enabledAt!).toLocaleDateString("fr")}. ${twoFAStatus.backupCodesRemaining} code(s) de secours restant(s).`
                    : "Ajoutez une couche de sécurité supplémentaire à votre compte."}
                </p>
              </div>
            </div>
          )}

          {/* Message */}
          {message2FA && (
            <div
              className={`flex items-center gap-2 p-3 ${
                message2FA.type === "success" ? "bg-primary-light text-primary-brand" : "bg-danger/10 text-danger"
              }`}
            >
              {message2FA.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="font-body text-[13px]">{message2FA.text}</span>
            </div>
          )}

          {/* Setup mode - Show QR code */}
          {setupMode && qrCode && (
            <div className="border border-primary-brand/20 bg-primary-light/30 p-6 space-y-4">
              <h4 className="font-display text-[14px] text-text-main flex items-center gap-2">
                <QrCode size={18} className="text-primary-brand" />
                Configuration 2FA
              </h4>

              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* QR Code */}
                <div className="bg-white p-4 border border-border-brand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                </div>

                <div className="flex-1 space-y-4">
                  <p className="font-body text-[13px] text-text-mid">
                    1. Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
                  </p>

                  {/* Manual entry */}
                  <div>
                    <p className="font-body text-xs text-text-muted-brand mb-1">Ou entrez ce code manuellement :</p>
                    <code className="block bg-white border border-border-brand px-3 py-2 font-mono text-[12px] text-text-main break-all">
                      {secret}
                    </code>
                  </div>

                  {/* Verify */}
                  <div>
                    <p className="font-body text-xs text-text-muted-brand mb-1">2. Entrez le code à 6 chiffres :</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        className="w-32 border border-border-brand px-4 py-2 font-mono text-[16px] text-center tracking-widest focus:border-primary-brand focus:outline-none"
                        maxLength={6}
                      />
                      <button
                        onClick={enable2FA}
                        disabled={loading2FA || verifyCode.length !== 6}
                        className="bg-primary-brand px-4 py-2 font-body text-xs uppercase tracking-widest text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {loading2FA ? <Loader2 size={14} className="animate-spin" /> : "Vérifier"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSetupMode(false)}
                className="font-body text-[13px] text-text-muted-brand hover:text-text-main"
              >
                Annuler
              </button>
            </div>
          )}

          {/* Backup codes modal */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white border border-border-brand p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-[18px] text-text-main flex items-center gap-2">
                    <Key size={20} className="text-gold" />
                    Codes de secours
                  </h3>
                  <button onClick={() => setShowBackupCodes(false)} className="text-text-muted-brand hover:text-text-main">
                    <X size={20} />
                  </button>
                </div>

                <p className="font-body text-[13px] text-text-mid mb-4">
                  Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois pour accéder à votre compte si vous perdez accès à votre application d'authentification.
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="bg-bg-page border border-border-brand px-3 py-2 font-mono text-[13px] text-center">
                      {code}
                    </code>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyBackupCodes}
                    className="flex-1 flex items-center justify-center gap-2 border border-border-brand px-4 py-2 font-body text-xs uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
                  >
                    {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copiedCode ? "Copié !" : "Copier"}
                  </button>
                  <button
                    onClick={() => {
                      const text = `Codes de secours 2FA - Surnaturel de Dieu\n\n${backupCodes.join("\n")}\n\nConservez ces codes en lieu sûr !`
                      const blob = new Blob([text], { type: "text/plain" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "codes-secours-2fa.txt"
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-brand px-4 py-2 font-body text-xs uppercase tracking-widest text-white hover:bg-primary-dark transition-colors"
                  >
                    <Download size={14} />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Disable 2FA modal */}
          {showDisable && (
            <div className="border border-danger/30 bg-danger/5 p-4 space-y-3">
              <p className="font-body text-[13px] text-danger">
                Entrez votre mot de passe pour désactiver la 2FA :
              </p>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full border border-danger/30 px-4 py-2 pr-10 font-body text-[14px] focus:border-danger focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-brand"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={disable2FA}
                  disabled={loading2FA}
                  className="bg-danger px-4 py-2 font-body text-xs uppercase tracking-widest text-white hover:bg-danger/90 transition-colors disabled:opacity-50"
                >
                  {loading2FA ? <Loader2 size={14} className="animate-spin" /> : "Désactiver 2FA"}
                </button>
                <button
                  onClick={() => { setShowDisable(false); setDisablePassword("") }}
                  className="border border-border-brand px-4 py-2 font-body text-xs uppercase tracking-widest text-text-mid hover:bg-bg-page transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!setupMode && !showDisable && twoFAStatus && (
            <div className="pt-2">
              {twoFAStatus.enabled ? (
                <button
                  onClick={() => setShowDisable(true)}
                  className="border border-danger/50 px-4 py-2 font-body text-[13px] text-danger hover:bg-danger/10 transition-colors"
                >
                  Désactiver la 2FA
                </button>
              ) : (
                <BtnArrow onClick={startSetup} disabled={loading2FA}>
                  {loading2FA ? <Loader2 size={14} className="animate-spin" /> : "Activer la 2FA"}
                </BtnArrow>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Section Sessions ─── */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-6 bg-gold" />
          <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
            Sessions actives
          </span>
          <div className="h-px flex-1 bg-gold/30" />
        </div>

        <div className="border border-border-brand bg-white p-6 space-y-4">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-brand" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="font-body text-[13px] text-text-mid text-center py-4">
              Aucune session active enregistrée.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-4 p-3 border ${
                      session.isCurrent ? "border-primary-brand bg-primary-light/30" : "border-border-brand"
                    }`}
                  >
                    <DeviceIcon type={session.deviceType} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-body text-[13px] font-medium text-text-main truncate">
                          {session.deviceName}
                        </p>
                        {session.isCurrent && (
                          <span className="shrink-0 px-2 py-0.5 bg-primary-brand text-white font-body text-[10px] uppercase tracking-wider">
                            Session actuelle
                          </span>
                        )}
                      </div>
                      <p className="font-body text-[11px] text-text-muted-brand">
                        {session.ipAddress}
                        {session.location && ` · ${session.location}`}
                        {" · "}
                        Dernière activité {new Date(session.lastActiveAt).toLocaleDateString("fr", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => revokeSession(session.id)}
                        disabled={revokingId === session.id}
                        className="shrink-0 px-3 py-1.5 border border-danger/50 text-danger font-body text-[11px] uppercase tracking-wider hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        {revokingId === session.id ? <Loader2 size={12} className="animate-spin" /> : "Révoquer"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {sessions.filter((s) => !s.isCurrent).length > 0 && (
                <button
                  onClick={revokeAllSessions}
                  disabled={revokingId === "all"}
                  className="w-full border border-danger/30 px-4 py-2 font-body text-[13px] text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  {revokingId === "all" ? (
                    <Loader2 size={14} className="animate-spin mx-auto" />
                  ) : (
                    "Révoquer toutes les autres sessions"
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </motion.section>
    </>
  )
}
