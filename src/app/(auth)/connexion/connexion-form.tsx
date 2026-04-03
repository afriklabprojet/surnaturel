"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Fingerprint } from "lucide-react"
import { fadeInLeft, fadeInRight, staggerContainer, staggerItem, buttonHover } from "@/lib/animations"
import { isPlatformAuthenticatorAvailable, authenticateWithPasskey } from "@/lib/webauthn"

// ─── Schema ──────────────────────────────────────────────────────

const schemaConnexion = z.object({
  email: z.string().email("Adresse email invalide"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
})

type ConnexionData = z.infer<typeof schemaConnexion>

// ─── Composant ───────────────────────────────────────────────────

export default function ConnexionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inscriptionOk = searchParams.get("inscription") === "ok"
  const verification = searchParams.get("verification")
  const [erreur, setErreur] = useState("")
  const [emailNonVerifie, setEmailNonVerifie] = useState(false)
  const [emailPourRenvoi, setEmailPourRenvoi] = useState("")
  const [renvoiEnCours, setRenvoiEnCours] = useState(false)
  const [renvoiOk, setRenvoiOk] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ConnexionData>({
    resolver: zodResolver(schemaConnexion),
  })

  // Check biometric availability on mount
  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable)
  }, [])

  async function handleBiometricLogin() {
    setBiometricLoading(true)
    setErreur("")
    try {
      const result = await authenticateWithPasskey()
      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setErreur(result.error || "Authentification biométrique échouée")
      }
    } catch {
      setErreur("L'authentification biométrique n'a pas fonctionné. Essayez avec votre mot de passe.")
    }
    setBiometricLoading(false)
  }

  async function renvoyerVerification() {
    setRenvoiEnCours(true)
    setRenvoiOk(false)
    try {
      await fetch("/api/auth/renvoyer-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailPourRenvoi }),
      })
      setRenvoiOk(true)
    } catch { /* ignore */ }
    setRenvoiEnCours(false)
  }

  async function onSubmit(data: ConnexionData) {
    setErreur("")
    setEmailNonVerifie(false)
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.motDePasse,
        redirect: false,
      })
      if (result?.error) {
        if (result.code === "EMAIL_NON_VERIFIE" || result.error.includes("EMAIL_NON_VERIFIE")) {
          setEmailNonVerifie(true)
          setEmailPourRenvoi(data.email)
        } else if (result.code === "2FA_REQUIRED" || result.error.includes("2FA_REQUIRED")) {
          // Extract userId from error message (format: 2FA_REQUIRED:userId)
          const match = result.error.match(/2FA_REQUIRED:(\w+)/)
          const userId = match?.[1]
          if (userId) {
            // Store email temporarily and redirect to 2FA verification
            sessionStorage.setItem("2fa_email", data.email)
            sessionStorage.setItem("2fa_password", data.motDePasse)
            router.push(`/verification-2fa?userId=${userId}`)
          } else {
            setErreur("Erreur de configuration 2FA")
          }
        } else {
          setErreur("Email ou mot de passe incorrect")
        }
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.")
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* ─── Mobile : bandeau vert ─────────────────────────────── */}
      <div className="bg-primary-brand px-6 py-6 text-center md:hidden">
        <Link href="/">
          <p className="font-display text-[22px] font-light text-white">
            Le Surnaturel de Dieu
          </p>
          <p className="mt-1 font-body text-[9px] font-medium uppercase tracking-[0.2em] text-white/50">
            Institut de bien-être · Abidjan
          </p>
        </Link>
      </div>

      {/* ─── Desktop : colonne gauche verte ────────────────────── */}
      <motion.div
        variants={fadeInLeft}
        initial="initial"
        animate="animate"
        className="hidden bg-primary-brand md:flex md:flex-col md:justify-between md:px-12 md:py-14"
      >
        <div>
          <Link href="/">
            <p className="font-display text-[22px] font-light text-white">
              Le Surnaturel de Dieu
            </p>
            <p className="mt-1 font-body text-[9px] font-medium uppercase tracking-[0.2em] text-white/50">
              Institut de bien-être · Abidjan
            </p>
          </Link>

          <div className="mt-10 h-px w-8 bg-gold" />

          <p className="mt-8 font-display text-[28px] font-light italic leading-snug text-white">
            Votre espace bien-être{" "}
            <span className="font-body not-italic text-gold">
              personnel
            </span>
          </p>

          <ul className="mt-10 space-y-4">
            {[
              "Réservez vos soins en ligne 24h/24",
              "Accédez à votre espace médical confidentiel",
              "Rejoignez notre communauté bienveillante",
              "Commandez nos produits bien-être",
            ].map((text) => (
              <li
                key={text}
                className="flex items-start gap-3 font-body text-[13px] leading-relaxed text-white/80"
              >
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 bg-gold" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-l-2 border-white/20 pl-5">
          <p className="font-display text-[13px] italic leading-relaxed text-white/45">
            &ldquo;Prendre soin de soi est le plus beau cadeau
            qu&apos;on puisse s&apos;offrir.&rdquo;
          </p>
        </div>
      </motion.div>

      {/* ─── Colonne droite : formulaire ───────────────────────── */}
      <motion.div
        variants={fadeInRight}
        initial="initial"
        animate="animate"
        className="flex items-center justify-center px-6 py-10 md:px-12"
      >
        <div className="w-full max-w-100">
          {/* Tag or */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-gold" />
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-gold">
              Accès membre
            </span>
            <span className="h-px w-6 bg-gold" />
          </div>

          <h1 className="mt-5 text-center font-display text-[30px] font-light text-text-main">
            Bon retour parmi nous
          </h1>

          <p className="mt-2 text-center font-body text-[12px] text-text-muted-brand">
            Pas encore membre ?{" "}
            <Link
              href="/inscription"
              className="text-primary-brand transition-colors duration-300 hover:text-primary-dark"
            >
              Créer un compte
            </Link>
          </p>

          {/* Succès inscription */}
          {inscriptionOk && (
            <div className="mt-6 border-l-2 border-primary-brand bg-primary-light/50 px-4 py-3 font-body text-xs text-primary-brand">
              Compte créé ! Vérifiez votre email pour activer votre compte.
            </div>
          )}

          {/* Statut vérification email */}
          {verification === "ok" && (
            <div className="mt-6 border-l-2 border-primary-brand bg-primary-light/50 px-4 py-3 font-body text-xs text-primary-brand">
              Email vérifié avec succès ! Vous pouvez maintenant vous connecter.
            </div>
          )}
          {verification === "expired" && (
            <div className="mt-6 border-l-2 border-gold bg-gold-light/50 px-4 py-3 font-body text-xs text-text-mid">
              Le lien de vérification a expiré. Connectez-vous pour recevoir un nouveau lien.
            </div>
          )}
          {verification === "invalid" && (
            <div className="mt-6 border-l-2 border-danger-deep px-4 py-3 font-body text-xs text-danger-deep">
              Lien de vérification invalide ou déjà utilisé.
            </div>
          )}

          {/* Email non vérifié */}
          {emailNonVerifie && (
            <div className="mt-6 border-l-2 border-gold bg-gold-light/50 px-4 py-3">
              <p className="font-body text-xs text-text-mid">
                Votre adresse email n&apos;a pas encore été vérifiée.
                Consultez votre boîte de réception.
              </p>
              <button
                type="button"
                onClick={renvoyerVerification}
                disabled={renvoiEnCours || renvoiOk}
                className="mt-2 font-body text-xs font-medium text-primary-brand underline transition-colors hover:text-primary-dark disabled:opacity-50 disabled:no-underline"
              >
                {renvoiOk
                  ? "Email envoyé !"
                  : renvoiEnCours
                    ? "Envoi en cours..."
                    : "Renvoyer l\u2019email de vérification"}
              </button>
            </div>
          )}

          {/* Erreur */}
          {erreur && (
            <div className="mt-6 border-l-2 border-danger-deep px-4 py-3 font-body text-xs text-danger-deep">
              {erreur}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-body text-xs font-medium uppercase tracking-[0.2em] text-text-mid"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                {...register("email")}
                className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
              />
              {errors.email && (
                <p className="mt-1.5 font-body text-xs text-danger-deep">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="motDePasse"
                className="mb-2 block font-body text-xs font-medium uppercase tracking-[0.2em] text-text-mid"
              >
                Mot de passe
              </label>
              <input
                id="motDePasse"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("motDePasse")}
                className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
              />
              {errors.motDePasse && (
                <p className="mt-1.5 font-body text-xs text-danger-deep">
                  {errors.motDePasse.message}
                </p>
              )}
              <div className="mt-1.5 text-right">
                <Link
                  href="/mot-de-passe-oublie"
                  className="font-body text-xs text-text-muted-brand transition-colors duration-300 hover:text-text-mid"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 bg-primary-brand py-3.5 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-70"
            >
              {isSubmitting && (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          {/* Séparateur */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-brand" />
            <span className="font-body text-xs text-text-muted-brand">ou</span>
            <span className="h-px flex-1 bg-border-brand" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-3 border border-border-brand bg-white py-3 font-body text-[12px] text-text-mid transition-colors duration-300 hover:bg-bg-page"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuer avec Google
          </button>

          {/* Face ID / Touch ID — Visible uniquement si disponible */}
          {biometricAvailable && (
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={biometricLoading}
              className="mt-3 flex w-full items-center justify-center gap-3 border border-gold bg-gold-light/50 py-3 font-body text-[12px] text-gold-dark transition-colors duration-300 hover:bg-gold-light disabled:opacity-70"
            >
              {biometricLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
              ) : (
                <Fingerprint size={18} className="text-gold" />
              )}
              {biometricLoading ? "Vérification..." : "Face ID / Touch ID"}
            </button>
          )}

          {/* Lien bas */}
          <p className="mt-8 text-center font-body text-[12px] text-text-muted-brand">
            Pas encore membre ?{" "}
            <Link
              href="/inscription"
              className="text-primary-brand transition-colors duration-300 hover:text-primary-dark"
            >
              S&apos;inscrire gratuitement
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
