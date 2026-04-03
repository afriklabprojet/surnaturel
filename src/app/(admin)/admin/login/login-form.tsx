"use client"

import { useState } from "react"
import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar,
  Users,
  ShoppingBag,
  FileText,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"

interface Props {
  stats: {
    rdvAujourdhui: number
    clientsActifs: number
    commandesEnAttente: number
    articlesPublies: number
  }
}

export default function AdminLoginForm({ stats }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation côté client
    if (!email.trim()) {
      setError("L'adresse email est requise.")
      setLoading(false)
      return
    }
    if (!password) {
      setError("Le mot de passe est requis.")
      setLoading(false)
      return
    }

    try {
      let result: Awaited<ReturnType<typeof signIn>> | undefined

      try {
        result = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        })
      } catch (signInError) {
        // signIn peut lancer si le serveur est inaccessible
        const msg = signInError instanceof Error ? signInError.message : String(signInError)
        setError(`Impossible de contacter le serveur d'authentification. (${msg})`)
        return
      }

      if (!result) {
        setError("Aucune réponse du serveur d'authentification. Vérifiez votre connexion internet.")
        return
      }

      if (!result.ok) {
        // Détecter le code d'erreur — NextAuth v5 peut le passer dans .error ou .code
        const errCode = (result as { code?: string }).code ?? result.error ?? ""

        if (errCode.includes("EMAIL_NON_VERIFIE")) {
          setError("Votre adresse email n'est pas vérifiée. Consultez votre boîte de réception et cliquez sur le lien d'activation.")
        } else if (errCode.includes("2FA_REQUIRED")) {
          setError("La double authentification (2FA) est activée sur ce compte. Utilisez la page de connexion principale.")
        } else if (errCode.includes("CredentialsSignin") || errCode === "CredentialsSignin") {
          setError("Email ou mot de passe incorrect. Vérifiez vos identifiants administrateur.")
        } else if (result.status === 429) {
          setError("Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.")
        } else if (result.status && result.status >= 500) {
          setError(`Erreur serveur (${result.status}). La base de données est peut-être indisponible. Contactez le support.`)
        } else {
          setError(`Connexion impossible (code : ${errCode || result.status || "inconnu"}). Contactez le support si le problème persiste.`)
        }
        return
      }

      // Connexion réussie — vérifier le rôle ADMIN
      let session: { user?: { role?: string } } = {}
      try {
        const sessionRes = await fetch("/api/auth/session")
        if (!sessionRes.ok) {
          setError(`Impossible de récupérer la session (HTTP ${sessionRes.status}). Essayez de recharger la page.`)
          await signOut({ redirect: false })
          return
        }
        session = await sessionRes.json()
      } catch {
        setError("Connexion établie mais la session est illisible. Rechargez la page.")
        return
      }

      if (!session?.user?.role) {
        setError("Session invalide : aucun rôle utilisateur. Réessayez ou contactez le support.")
        await signOut({ redirect: false })
        return
      }

      if (session.user.role !== "ADMIN") {
        setError(`Accès refusé : votre compte a le rôle "${session.user.role}", pas "ADMIN". Contactez l'administrateur système.`)
        await signOut({ redirect: false })
        return
      }

      // Tout est OK — redirection vers le panel
      router.push("/admin")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Une erreur inattendue s'est produite : ${msg}. Rechargez la page et réessayez.`)
    } finally {
      setLoading(false)
    }
  }

  const statModules = [
    {
      icon: Calendar,
      label: "Rendez-vous aujourd'hui",
      value: stats.rdvAujourdhui,
    },
    { icon: Users, label: "Clients actifs", value: stats.clientsActifs },
    {
      icon: ShoppingBag,
      label: "Commandes en attente",
      value: stats.commandesEnAttente,
    },
    {
      icon: FileText,
      label: "Articles publiés",
      value: stats.articlesPublies,
    },
  ]

  return (
    <div className="flex min-h-screen">
      {/* ── Colonne gauche — fond sombre ── */}
      <div className="hidden lg:flex lg:w-120 xl:w-130 flex-col justify-between bg-admin-panel-deep px-10 py-10">
        <div className="space-y-8">
          {/* Logo */}
          <div className="space-y-1">
            <p className="font-display text-[17px] text-white tracking-wide">
              Le Surnaturel de Dieu
            </p>
            <p className="font-body text-[8px] uppercase tracking-[0.3em] text-gold">
              Institut de bien-être · Abidjan
            </p>
          </div>

          {/* Trait or */}
          <div className="w-7 h-px bg-gold" />

          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[rgba(184,151,42,0.3)] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="font-body text-[9px] uppercase tracking-[0.15em] text-gold">
              Espace Administration
            </span>
          </div>

          {/* Titre */}
          <div className="space-y-3">
            <h1 className="font-display text-[34px] font-light text-white leading-tight">
              Panel{" "}
              <em className="text-gold">administrateur</em>
            </h1>
            <p className="font-body text-[12px] text-white/35">
              Accès réservé au personnel autorisé.
            </p>
          </div>

          {/* Modules statistiques */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            {statModules.map((mod) => (
              <div
                key={mod.label}
                className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-admin-panel-mid">
                  <mod.icon className="h-3.5 w-3.5 text-primary-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-white/50 leading-tight truncate">
                    {mod.label}
                  </p>
                </div>
                <span className="font-display text-[14px] text-gold">
                  {mod.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Note de sécurité */}
        <div className="flex items-start gap-2 p-3 bg-[rgba(255,255,255,0.02)]">
          <Lock className="h-3.5 w-3.5 text-white/25 mt-0.5 shrink-0" />
          <p className="font-body text-xs text-white/25 leading-relaxed">
            Connexion sécurisée SSL — Accès strictement réservé au personnel
            habilité du centre.
          </p>
        </div>
      </div>

      {/* ── Colonne droite — formulaire ── */}
      <div className="flex-1 flex items-center justify-center bg-bg-page px-6 py-10">
        <div className="w-full max-w-100 space-y-8">
          {/* Tag or */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gold" />
            <span className="font-body text-xs uppercase tracking-[0.15em] text-gold">
              Accès sécurisé
            </span>
            <div className="h-px flex-1 bg-gold" />
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <h2 className="font-display text-[30px] font-light text-text-main">
              Connexion administrateur
            </h2>
            <p className="font-body text-[12px] text-text-muted-brand">
              Entrez vos identifiants pour accéder au panel
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-3 border border-red-300 bg-red-50 p-4">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700 mb-1">
                  Erreur de connexion
                </p>
                <p className="font-body text-xs text-red-900 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@lesurnatureldedieu.com"
                className="w-full px-3 py-2.5 font-body text-[14px] text-text-main bg-white border border-border-brand focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="font-body text-xs uppercase tracking-[0.18em] text-text-muted-brand block">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 font-body text-[14px] text-text-main bg-white border border-border-brand focus:outline-none focus:border-gold transition-colors placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-brand hover:text-text-mid transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Rester connecté */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span
                onClick={() => setRememberMe(!rememberMe)}
                className={`flex items-center justify-center w-4 h-4 border transition-colors ${
                  rememberMe
                    ? "bg-primary-brand border-primary-brand"
                    : "bg-white border-border-brand"
                }`}
              >
                {rememberMe && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
              <span className="font-body text-[12px] text-text-mid">
                Rester connecté sur cet appareil
              </span>
            </label>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-admin-panel-dark text-white font-body text-xs uppercase tracking-[0.22em] hover:bg-primary-brand disabled:opacity-50 transition-colors"
            >
              <span>{loading ? "Connexion en cours..." : "Accéder au panel"}</span>
              <ArrowRight className="h-3.5 w-3.5 text-gold" />
            </button>
          </form>

          {/* Mot de passe oublié */}
          <p className="text-center">
            <button
              type="button"
              className="font-body text-xs text-text-muted-brand hover:text-text-mid transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </p>

          {/* Séparateur */}
          <div className="h-px bg-border-brand" />

          {/* Retour au site */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 font-body text-[12px] text-text-muted-brand hover:text-text-mid transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au site public
          </Link>
        </div>
      </div>
    </div>
  )
}
