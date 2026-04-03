"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  Heart,
  MessageCircle,
  Lock,
  Gift,
  Users,
  User,
  LogOut,
  ArrowLeft,
  Plus,
  Menu,
  X,
  Home,
  Star,
  MessagesSquare,
  MoreHorizontal,
} from "lucide-react"
import Notifications from "@/components/layout/Notifications"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"
import { ToastProvider } from "@/components/ui/toast"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Mon espace", icon: LayoutDashboard },
  { href: "/mes-rdv", label: "Mes rendez-vous", icon: Calendar },
  { href: "/commandes", label: "Mes commandes", icon: ShoppingBag },
  { href: "/favoris", label: "Mes favoris", icon: Heart },
  { href: "/communaute", label: "Communauté", icon: Users },
  { href: "/communaute/messages", label: "Messagerie", icon: MessageCircle },
  { href: "/suivi-medical", label: "Espace médical", icon: Lock },
  { href: "/avis", label: "Mes avis", icon: Star },
  { href: "/fidelite", label: "Fidélité", icon: Gift },
  { href: "/parrainage", label: "Parrainage", icon: MessagesSquare },
  { href: "/profil", label: "Mon profil", icon: User },
] as const

const MOBILE_NAV = [
  { href: "/dashboard", icon: Home, label: "Accueil" },
  { href: "/mes-rdv", icon: Calendar, label: "RDV" },
  { href: "/fidelite", icon: Gift, label: "Fidélité" },
  { href: "/profil", icon: User, label: "Profil" },
]

const MORE_NAV_ITEMS = [
  { href: "/commandes", icon: ShoppingBag, label: "Commandes" },
  { href: "/communaute", icon: Users, label: "Communauté" },
  { href: "/communaute/messages", icon: MessageCircle, label: "Messagerie" },
  { href: "/favoris", icon: Heart, label: "Favoris" },
  { href: "/avis", icon: Star, label: "Avis" },
  { href: "/parrainage", icon: MessagesSquare, label: "Parrainage" },
  { href: "/suivi-medical", icon: Lock, label: "Médical" },
]

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Mon espace",
  "/profil": "Mon profil",
  "/mes-rdv": "Mes rendez-vous",
  "/commandes": "Mes commandes",
  "/favoris": "Mes favoris",
  "/communaute": "Communauté",
  "/communaute/reseau": "Communauté",
  "/communaute/groupes": "Communauté",
  "/communaute/evenements": "Communauté",
  "/communaute/recherche": "Communauté",
  "/communaute/sauvegardes": "Communauté",
  "/communaute/membres": "Communauté",
  "/communaute/messages": "Messagerie",
  "/notifications": "Notifications",
  "/suivi-medical": "Espace médical",
  "/avis": "Mes avis",
  "/fidelite": "Programme fidélité",
  "/parrainage": "Parrainage",
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [points, setPoints] = useState(0)
  const [profileProgress, setProfileProgress] = useState(0)
  const [isNewUser, setIsNewUser] = useState(false)

  const user = session?.user
  const initiales = user
    ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
    : ""

  // Fetch points and notifications
  const fetchStats = useCallback(async () => {
    try {
      const fideliteRes = await fetch("/api/fidelite")
      if (fideliteRes.ok) {
        const data = await fideliteRes.json()
        const pts = data.points || 0
        setPoints(pts)
        // Heuristique : 0 point → aucun soin complété, utilisatrice nouvelle
        setIsNewUser(pts === 0)
      }
      if (user) {
        let progress = 0
        if (user.prenom) progress += 20
        if (user.nom) progress += 20
        if (user.email) progress += 20
        if (user.photoUrl) progress += 20
        progress += 20 // email verified
        setProfileProgress(progress)
      }
    } catch {}
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/commandes/") ? "Détail commande" :
     pathname.startsWith("/communaute/") ? "Communauté" : "Espace client")

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/profil") return pathname === "/profil" || pathname === "/profil/modifier"
    if (href === "/communaute") return pathname.startsWith("/communaute") && !pathname.startsWith("/communaute/messages")
    if (href === "/communaute/messages") return pathname === "/communaute/messages"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <>
      {/* Avatar + nom + progression */}
      <div className="border-b border-border-brand px-5 py-6">
        <div className="flex items-center gap-3">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt=""
              className="h-11 w-11 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center bg-primary-brand text-white font-body text-[13px] font-medium">
              {initiales}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[16px] font-light text-text-main">
              {user?.prenom} {user?.nom}
            </p>
            <p className="truncate font-body text-xs text-text-muted-brand">
              {user?.email}
            </p>
          </div>
        </div>
        {/* Barre progression profil */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-body text-xs text-text-muted-brand">Profil complété</span>
            <span className="font-body text-xs font-medium text-gold">{profileProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-border-brand overflow-hidden">
            <div 
              className="h-full bg-gold transition-all duration-500" 
              style={{ width: `${profileProgress}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Bandeau premier pas — visible seulement pour les nouvelles utilisatrices */}
        {isNewUser && (
          <div className="mb-4 px-3 py-3 bg-primary-light border-l-2 border-primary-brand">
            <p className="font-body text-[11px] font-medium text-primary-brand uppercase tracking-wider mb-1">
              Commencez ici
            </p>
            <p className="font-body text-[11px] text-text-mid leading-snug">
              Prenez votre premier rendez-vous pour débloquer toutes les fonctionnalités.
            </p>
          </div>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            // L'espace médical n'est pertinent qu'après un premier soin
            const isMedical = item.href === "/suivi-medical"
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 font-body text-[13px] transition-colors ${
                    active
                      ? "border-l-2 border-gold bg-bg-page text-primary-brand font-medium"
                      : "border-l-2 border-transparent text-text-mid hover:bg-bg-page hover:text-text-main"
                  }`}
                >
                  <Icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {isMedical && isNewUser && (
                    <span className="font-body text-[9px] uppercase tracking-wider text-text-muted-brand border border-border-brand px-1.5 py-0.5 shrink-0">
                      1er soin requis
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border-brand px-5 py-4 space-y-3">
        {/* Points fidélité */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Star size={16} className="text-gold" />
          <span className="font-display text-[18px] font-light text-gold">{points}</span>
          <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">pts</span>
        </div>
        
        <Link
          href="/prise-rdv"
          onClick={() => setSidebarOpen(false)}
          className="flex w-full items-center justify-center gap-2 bg-primary-brand px-4 py-2.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={14} />
          Prendre un RDV
        </Link>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 font-body text-[12px] text-text-muted-brand hover:text-text-mid transition-colors"
        >
          <ArrowLeft size={13} />
          Retour au site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/connexion" })}
          className="flex w-full items-center justify-center gap-2 font-body text-[12px] text-danger hover:text-danger/80 transition-colors"
        >
          <LogOut size={13} />
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <ConfirmProvider>
      <ToastProvider>
    <div className="flex min-h-screen bg-bg-page">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-border-brand">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col bg-white shadow-lg">
            <div className="flex items-center justify-end px-4 pt-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-11 w-11 items-center justify-center text-text-muted-brand hover:text-text-main"
                aria-label="Fermer le menu"
              >
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[260px] flex flex-col pb-16 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-brand bg-white px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-11 w-11 items-center justify-center lg:hidden text-text-mid"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="font-display text-[24px] font-light text-text-main">
                {pageTitle}
              </h1>
              <span className="hidden sm:block font-body text-xs uppercase tracking-[0.15em] text-gold">
                ——— Espace personnel ———
              </span>
            </div>
          </div>
          
          {/* Notifications */}
          <Notifications userId={user?.id} />
        </header>

        {/* Content */}
        <main className="flex-1 p-5 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border-brand bg-white py-1 safe-area-pb lg:hidden">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 min-h-11 ${
                active ? "text-primary-brand" : "text-text-muted-brand"
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full" />
                )}
              </div>
              <span className={`font-body text-[9px] ${active ? "font-medium" : ""}`}>{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 min-h-11 text-text-muted-brand"
          aria-label="Plus de navigation"
        >
          <MoreHorizontal size={20} />
          <span className="font-body text-[9px]">Plus</span>
        </button>
      </nav>

      {/* More menu drawer */}
      {moreMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-border-brand"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-brand">
              <span className="font-display text-[16px] font-light text-text-main">Navigation</span>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-text-muted-brand hover:text-text-main"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-4">
              {MORE_NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 ${
                      active
                        ? "text-primary-brand bg-bg-page"
                        : "text-text-mid hover:bg-bg-page"
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-body text-[9px] text-center leading-tight">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
      </ToastProvider>
    </ConfirmProvider>
  )
}
