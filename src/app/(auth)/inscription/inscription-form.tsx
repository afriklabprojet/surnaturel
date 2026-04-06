"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Gift } from "lucide-react"
import MotionDiv from "@/components/ui/MotionDiv"
import { fadeInLeft, fadeInRight, buttonHover } from "@/lib/animations"

// ─── Schema ──────────────────────────────────────────────────────

const schemaInscription = z
  .object({
    prenom: z.string().min(2, "Prénom trop court").max(50),
    nom: z.string().min(2, "Nom trop court").max(50),
    email: z.string().email("Adresse email invalide"),
    telephone: z
      .string()
      .min(10, "Numéro invalide")
      .regex(/^[+\d\s]+$/, "Format invalide"),
    motDePasse: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(/[A-Z]/, "Une majuscule requise")
      .regex(/[0-9]/, "Un chiffre requis"),
    confirmation: z.string(),
    conditions: z
      .boolean()
      .refine((v) => v, "Vous devez accepter les conditions"),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmation"],
  })

type InscriptionData = z.infer<typeof schemaInscription>

// ─── Force du mot de passe ───────────────────────────────────────

function getPasswordStrength(password: string): number {
  let s = 0
  if (password.length >= 8) s++
  if (/[A-Z]/.test(password)) s++
  if (/[0-9]/.test(password)) s++
  if (/[a-z]/.test(password)) s++
  return s
}

// ─── Composant ───────────────────────────────────────────────────

export default function InscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeParrain = searchParams.get("parrain") ?? ""
  const [erreurServeur, setErreurServeur] = useState("")
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<InscriptionData>({
    resolver: zodResolver(schemaInscription),
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      motDePasse: "",
      confirmation: "",
      conditions: false,
    },
  })

  const motDePasse = watch("motDePasse") ?? ""
  const conditionsValue = watch("conditions")
  const strength = getPasswordStrength(motDePasse)
  const strengthColor =
    strength <= 1
      ? "bg-danger"
      : strength <= 2
        ? "bg-gold"
        : "bg-primary-brand"

  // Redirect après succès
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/connexion?inscription=ok")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  async function onSubmit(data: InscriptionData) {
    setErreurServeur("")
    try {
      const res = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          password: data.motDePasse,
          ...(codeParrain ? { codeParrainage: codeParrain } : {}),
        }),
      })

      if (res.status === 201) {
        setSuccess(true)
        return
      }

      const body: { error?: string } = await res.json()
      if (res.status === 409) {
        setErreurServeur(
          body.error ?? "Cette adresse email est déjà utilisée."
        )
      } else {
        setErreurServeur(body.error ?? "Une erreur est survenue.")
      }
    } catch {
      setErreurServeur(
        "Impossible de contacter le serveur. Veuillez réessayer."
      )
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
      <MotionDiv
        variants={fadeInLeft}
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
            Rejoignez notre communauté{" "}
            <span className="font-body not-italic text-gold">
              d&apos;exception
            </span>
          </p>

          <ul className="mt-10 space-y-4">
            {[
              "Inscription gratuite en 2 minutes",
              "Accès à tous nos soins et services",
              "Suivi médical personnalisé et confidentiel",
              "Offre de bienvenue — 10% sur votre 1er soin",
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
            &ldquo;La beauté commence au moment où vous décidez
            d&apos;être vous-même.&rdquo;
          </p>
        </div>
      </MotionDiv>

      {/* ─── Colonne droite : formulaire ───────────────────────── */}
      <MotionDiv
        variants={fadeInRight}
        className="flex items-center justify-center px-6 py-10 md:px-12"
      >
        <div className="w-full max-w-110">
          {/* Tag or */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-gold" />
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-gold">
              Nouveau membre
            </span>
            <span className="h-px w-6 bg-gold" />
          </div>

          <h1 className="mt-5 text-center font-display text-[30px] font-light text-text-main">
            Créer votre compte
          </h1>

          {codeParrain && (
            <div className="mt-4 flex items-center gap-3 border border-gold/30 bg-gold-light/50 px-4 py-3">
              <Gift size={18} className="shrink-0 text-gold" />
              <p className="font-body text-[12px] text-text-mid">
                Vous avez été invité(e) ! Créez votre compte pour recevoir{" "}
                <strong className="text-gold-dark">100 points de bienvenue</strong> + un bonus parrainage.
              </p>
            </div>
          )}

          <p className="mt-2 text-center font-body text-[12px] text-text-muted-brand">
            Déjà membre ?{" "}
            <Link
              href="/connexion"
              className="text-primary-brand transition-colors duration-300 hover:text-primary-dark"
            >
              Se connecter
            </Link>
          </p>

          {/* Message succès */}
          {success ? (
            <div className="mt-8 border-l-2 border-primary-brand bg-primary-light/50 px-4 py-4">
              <p className="font-body text-[13px] font-medium text-primary-brand">
                Compte créé avec succès !
              </p>
              <p className="mt-1 font-body text-xs text-primary-brand/70">
                Un email de vérification vous a été envoyé.
                Vérifiez votre boîte de réception pour activer votre compte.
              </p>
              <p className="mt-2 font-body text-xs text-text-muted-brand">
                Redirection vers la connexion...
              </p>
            </div>
          ) : (
            <>
              {/* Erreur serveur */}
              {erreurServeur && (
                <div className="mt-6 border-l-2 border-danger-deep px-4 py-3 font-body text-xs text-danger-deep">
                  {erreurServeur}
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="mt-8 space-y-4"
              >
                {/* Prénom + Nom */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="prenom"
                      className="mb-2 block font-body text-xs font-medium uppercase tracking-[0.2em] text-text-mid"
                    >
                      Prénom
                    </label>
                    <input
                      id="prenom"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Marie"
                      {...register("prenom")}
                      className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
                    />
                    {errors.prenom && (
                      <p className="mt-1.5 font-body text-xs text-danger-deep">
                        {errors.prenom.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="nom"
                      className="mb-2 block font-body text-xs font-medium uppercase tracking-[0.2em] text-text-mid"
                    >
                      Nom
                    </label>
                    <input
                      id="nom"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Jeanne"
                      {...register("nom")}
                      className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
                    />
                    {errors.nom && (
                      <p className="mt-1.5 font-body text-xs text-danger-deep">
                        {errors.nom.message}
                      </p>
                    )}
                  </div>
                </div>

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

                {/* Téléphone */}
                <div>
                  <label
                    htmlFor="telephone"
                    className="mb-2 block font-body text-xs font-medium uppercase tracking-[0.2em] text-text-mid"
                  >
                    Téléphone
                  </label>
                  <input
                    id="telephone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+225 00 00 00 00"
                    {...register("telephone")}
                    className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
                  />
                  {errors.telephone ? (
                    <p className="mt-1.5 font-body text-xs text-danger-deep">
                      {errors.telephone.message}
                    </p>
                  ) : (
                    <p className="mt-1.5 font-body text-xs text-text-muted-brand">
                      Pour la confirmation de vos rendez-vous
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
                  {/* Barre de force */}
                  {motDePasse.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 transition-colors duration-300 ${
                            i <= strength ? strengthColor : "bg-border-brand"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 font-body text-xs text-text-muted-brand">
                    Minimum 8 caractères avec majuscule et chiffre
                  </p>
                </div>

                {/* Confirmation */}
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
                    placeholder="Retapez votre mot de passe"
                    {...register("confirmation")}
                    className="w-full border border-border-brand bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none transition-all duration-300 placeholder:text-text-muted-brand/50 focus:border-gold focus:bg-white"
                  />
                  {errors.confirmation && (
                    <p className="mt-1.5 font-body text-xs text-danger-deep">
                      {errors.confirmation.message}
                    </p>
                  )}
                </div>

                {/* Conditions */}
                <div>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      {...register("conditions")}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center border transition-colors duration-200 ${
                        conditionsValue
                          ? "border-primary-brand bg-primary-brand"
                          : "border-border-brand"
                      }`}
                    >
                      {conditionsValue && (
                        <Check
                          size={12}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </span>
                    <span className="font-body text-[12px] leading-relaxed text-text-mid">
                      J&apos;accepte les{" "}
                      <Link
                        href="/conditions-utilisation"
                        target="_blank"
                        className="text-primary-brand underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        conditions d&apos;utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link
                        href="/politique-confidentialite"
                        target="_blank"
                        className="text-primary-brand underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        politique de confidentialité
                      </Link>
                    </span>
                  </label>
                  {errors.conditions && (
                    <p className="mt-1.5 pl-7.5 font-body text-xs text-danger-deep">
                      {errors.conditions.message}
                    </p>
                  )}
                </div>

                {/* Bouton */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 bg-primary-brand py-3.5 font-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-primary-dark disabled:opacity-70"
                >
                  {isSubmitting && (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isSubmitting ? "Création en cours..." : "Créer mon compte"}
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
                S&apos;inscrire avec Google
              </button>
            </>
          )}

          {/* Lien bas */}
          <p className="mt-8 text-center font-body text-[12px] text-text-muted-brand">
            Déjà membre ?{" "}
            <Link
              href="/connexion"
              className="text-primary-brand transition-colors duration-300 hover:text-primary-dark"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </MotionDiv>
    </div>
  )
}
