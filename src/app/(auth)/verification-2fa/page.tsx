"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import MotionDiv from "@/components/ui/MotionDiv"
import { motion } from "framer-motion"
import { Shield, Key, Loader2, ArrowLeft, AlertCircle } from "lucide-react"
import { fadeInUp, buttonHover } from "@/lib/animations"

function TwoFAVerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  
  const [code, setCode] = useState("")
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Get stored credentials
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("2fa_email")
    const storedPassword = sessionStorage.getItem("2fa_password")
    if (storedEmail && storedPassword) {
      setEmail(storedEmail)
      setPassword(storedPassword)
    } else {
      // No credentials stored, redirect to login
      router.push("/connexion")
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length < 6) {
      setError("Code invalide")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Verify the 2FA code
      const action = useBackupCode ? "backup" : "verify"
      const verifyRes = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, code }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok || !verifyData.valid) {
        setError(verifyData.error || "Code incorrect")
        setLoading(false)
        return
      }

      // Code is valid - get a bypass token for login
      const bypassRes = await fetch("/api/auth/complete-2fa-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, password }),
      })

      const bypassData = await bypassRes.json()

      if (bypassRes.ok && bypassData.bypassToken) {
        // Clear stored credentials
        sessionStorage.removeItem("2fa_email")
        sessionStorage.removeItem("2fa_password")
        
        // Sign in with NextAuth using bypass token
        const result = await signIn("credentials", {
          email,
          password,
          bypassToken: bypassData.bypassToken,
          redirect: false,
        })

        if (result?.ok) {
          router.push("/dashboard")
          router.refresh()
        } else {
          setError("Erreur de connexion")
        }
      } else {
        setError(bypassData.error || "Erreur lors de la connexion")
      }
    } catch {
      setError("Erreur de connexion")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-bg-page">
      <MotionDiv
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        {/* Back link */}
        <Link
          href="/connexion"
          className="flex items-center gap-2 mb-8 font-body text-[13px] text-text-muted-brand hover:text-text-main transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>

        {/* Card */}
        <div className="border border-border-brand bg-white p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 flex items-center justify-center bg-primary-light">
              <Shield size={32} className="text-primary-brand" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center font-display text-[24px] font-light text-text-main">
            Vérification en deux étapes
          </h1>
          <p className="mt-2 text-center font-body text-[13px] text-text-mid">
            {useBackupCode
              ? "Entrez un de vos codes de secours"
              : "Entrez le code à 6 chiffres de votre application d'authentification"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Code input */}
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-text-muted-brand mb-2">
                {useBackupCode ? "Code de secours" : "Code de vérification"}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase())}
                placeholder={useBackupCode ? "XXXX-XXXX" : "123456"}
                className="w-full border border-border-brand px-4 py-3 font-mono text-[18px] text-center tracking-widest focus:border-primary-brand focus:outline-none"
                maxLength={useBackupCode ? 9 : 6}
                autoFocus
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger">
                <AlertCircle size={16} />
                <span className="font-body text-[13px]">{error}</span>
              </div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || (useBackupCode ? code.length < 8 : code.length !== 6)}
              variants={buttonHover}
              whileHover="hover"
              whileTap="tap"
              className="w-full bg-primary-brand py-3 font-body text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Vérifier"}
            </motion.button>
          </form>

          {/* Toggle backup code */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setUseBackupCode(!useBackupCode)
                setCode("")
                setError("")
              }}
              className="inline-flex items-center gap-2 font-body text-[13px] text-primary-brand hover:text-primary-dark transition-colors"
            >
              <Key size={14} />
              {useBackupCode ? "Utiliser l'application" : "Utiliser un code de secours"}
            </button>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-6 text-center font-body text-[11px] text-text-muted-brand">
          Vous n&apos;avez plus accès à votre application d&apos;authentification ?
          <br />
          <Link href="/contact" className="text-primary-brand hover:underline">
            Contactez-nous
          </Link>
        </p>
      </MotionDiv>
    </div>
  )
}

export default function VerificationTwoFAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-brand" />
      </div>
    }>
      <TwoFAVerificationForm />
    </Suspense>
  )
}
