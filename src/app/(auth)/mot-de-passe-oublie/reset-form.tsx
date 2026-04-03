"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { fadeInLeft, fadeInRight } from "@/lib/animations"

// ─── Schemas ─────────────────────────────────────────────────────

const demandeSchema = z.object({
  email: z.string().email("Adresse email invalide"),
})

const resetSchema = z.object({
  motDePasse: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmation: z.string().min(1, "Confirmez votre mot de passe"),
}).refine((d) => d.motDePasse === d.confirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmation"],
})

type DemandeData = z.infer<typeof demandeSchema>
type ResetData = z.infer<typeof resetSchema>

// ─── Composant ───────────────────────────────────────────────────

export default function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  return token ? <NouveauMotDePasse token={token} /> : <DemandeReset />
}

// ─── Étape 1 : demander un lien de reset ─────────────────────────

function DemandeReset() {
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DemandeData>({ resolver: zodResolver(demandeSchema) })

  async function onSubmit(data: DemandeData) {
    setErreur("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
      if (!res.ok) {
        const err = await res.json()
        setErreur(err.error || "Une erreur est survenue.")
        return
      }
      setSucces(true)
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.")
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Mobile : bandeau vert */}
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

      {/* Desktop : colonne gauche verte */}
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
            Pas de panique,{" "}
            <span className="font-body not-italic text-gold">
              on vous aide
            </span>
          </p>

          <p className="mt-6 font-body text-[13px] leading-relaxed text-white/80">
            Entrez votre adresse email et nous vous enverrons un lien
            pour réinitialiser votre mot de passe en toute sécurité.
          </p>
        </div>

        <div className="border-l-2 border-white/20 pl-5">
          <p className="font-display text-[13px] italic leading-relaxed text-white/45">
            &ldquo;Prendre soin de soi est le plus beau cadeau
            qu&apos;on puisse s&apos;offrir.&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Colonne droite : formulaire */}
      <motion.div
        variants={fadeInRight}
        initial="initial"
        animate="animate"
        className="flex items-center justify-center px-6 py-10 md:px-12"
      >
        <div className="w-full max-w-[400px]">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-gold" />
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-gold">
              Réinitialisation
            </span>
            <span className="h-px w-6 bg-gold" />
          </div>

          <h1 className="mt-5 text-center font-display text-[30px] font-light text-text-main">
            Mot de passe oublié
          </h1>

          <p className="mt-2 text-center font-body text-[12px] text-text-muted-brand">
            Vous vous souvenez ?{" "}
            <Link
              href="/connexion"
              className="text-primary-brand transition-colors duration-300 hover:text-primary-dark"
            >
              Se connecter
            </Link>
          </p>

          {succes ? (
            <div className="mt-8 border-l-2 border-primary-brand bg-primary-light/50 px-4 py-4 font-body text-[12px] text-primary-brand">
              <p className="font-medium">Email envoyé !</p>
              <p className="mt-1 text-xs">
                Si un compte existe avec cette adresse, vous recevrez un lien
                de réinitialisation dans quelques instants. Pensez à vérifier
                vos spams.
              </p>
            </div>
          ) : (
            <>
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 bg-primary-brand py-3.5 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-70"
                >
                  {isSubmitting && (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Étape 2 : nouveau mot de passe (avec token) ────────────────

function NouveauMotDePasse({ token }: { token: string }) {
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetData>({ resolver: zodResolver(resetSchema) })

  async function onSubmit(data: ResetData) {
    setErreur("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          motDePasse: data.motDePasse,
          confirmation: data.confirmation,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setErreur(result.error || "Une erreur est survenue.")
        return
      }
      setSucces(true)
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.")
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Mobile : bandeau vert */}
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

      {/* Desktop : colonne gauche verte */}
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
            Nouveau départ,{" "}
            <span className="font-body not-italic text-gold">
              nouveau mot de passe
            </span>
          </p>
        </div>

        <div className="border-l-2 border-white/20 pl-5">
          <p className="font-display text-[13px] italic leading-relaxed text-white/45">
            &ldquo;Prendre soin de soi est le plus beau cadeau
            qu&apos;on puisse s&apos;offrir.&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Colonne droite : formulaire */}
      <motion.div
        variants={fadeInRight}
        initial="initial"
        animate="animate"
        className="flex items-center justify-center px-6 py-10 md:px-12"
      >
        <div className="w-full max-w-[400px]">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-gold" />
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-gold">
              Réinitialisation
            </span>
            <span className="h-px w-6 bg-gold" />
          </div>

          <h1 className="mt-5 text-center font-display text-[30px] font-light text-text-main">
            Nouveau mot de passe
          </h1>

          {succes ? (
            <div className="mt-8 text-center">
              <div className="border-l-2 border-primary-brand bg-primary-light/50 px-4 py-4 text-left font-body text-[12px] text-primary-brand">
                <p className="font-medium">Mot de passe mis à jour !</p>
                <p className="mt-1 text-xs">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
              </div>
              <Link
                href="/connexion"
                className="mt-6 inline-flex items-center justify-center bg-primary-brand px-8 py-3.5 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-primary-dark"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <>
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
                <div>
                  <label
                    htmlFor="motDePasse"
                    className="mb-2 block font-body text-xs font-medium uppercase tracking-[0.2em] text-text-mid"
                  >
                    Nouveau mot de passe
                  </label>
                  <input
                    id="motDePasse"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("motDePasse")}
                    className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
                  />
                  {errors.motDePasse && (
                    <p className="mt-1.5 font-body text-xs text-danger-deep">
                      {errors.motDePasse.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmation"
                    className="mb-2 block font-body text-xs font-medium uppercase tracking-[0.2em] text-text-mid"
                  >
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("confirmation")}
                    className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
                  />
                  {errors.confirmation && (
                    <p className="mt-1.5 font-body text-xs text-danger-deep">
                      {errors.confirmation.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 bg-primary-brand py-3.5 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-70"
                >
                  {isSubmitting && (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isSubmitting ? "Réinitialisation..." : "Réinitialiser"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
