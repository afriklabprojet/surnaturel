"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  ShoppingBag,
  BookOpen,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  UsersRound,
  Star,
  CalendarDays,
  BadgeCheck,
  Gift,
  Coins,
  Ban,
  Stethoscope,
  BarChart3,
  Package,
  UserCircle,
  HelpCircle,
  Tag,
  Award,
  ImageIcon,
  PlayCircle,
  Wrench,
  Percent,
  Mail,
  Heart,
  FileText,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  Palette,
} from "lucide-react"
import { useState, useEffect } from "react"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
type NavGroup = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    id: "commercial",
    label: "Activité commerciale",
    icon: TrendingUp,
    items: [
      { href: "/admin/rdv", label: "Rendez-vous", icon: Calendar },
      { href: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
      { href: "/admin/soins", label: "Soins", icon: Sparkles },
      { href: "/admin/boutique", label: "Boutique", icon: ShoppingBag },
      { href: "/admin/forfaits", label: "Forfaits", icon: Package },
      { href: "/admin/promo", label: "Codes Promo", icon: Percent },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
    items: [
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/blocages", label: "Blocages", icon: Ban },
      { href: "/admin/verification", label: "Vérification", icon: BadgeCheck },
      { href: "/admin/professionnels", label: "Professionnels", icon: Stethoscope },
    ],
  },
  {
    id: "contenu",
    label: "Contenu",
    icon: BookOpen,
    items: [
      { href: "/admin/blog", label: "Blog", icon: BookOpen },
      { href: "/admin/videos", label: "Témoignages Vidéo", icon: PlayCircle },
      { href: "/admin/galerie", label: "Galerie", icon: ImageIcon },
      { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
      { href: "/admin/messages", label: "Messages", icon: MessageCircle },
    ],
  },
  {
    id: "moderation",
    label: "Avis & Modération",
    icon: Star,
    items: [
      { href: "/admin/avis", label: "Avis", icon: Star },
      { href: "/admin/signalements", label: "Signalements", icon: AlertTriangle },
    ],
  },
  {
    id: "communaute",
    label: "Communauté",
    icon: UsersRound,
    items: [
      { href: "/admin/communaute", label: "Communauté", icon: UsersRound },
      { href: "/admin/groupes", label: "Groupes", icon: UsersRound },
      { href: "/admin/evenements", label: "Événements", icon: CalendarDays },
    ],
  },
  {
    id: "fidelite",
    label: "Fidélité & Parrainage",
    icon: Coins,
    items: [
      { href: "/admin/fidelite", label: "Fidélité", icon: Coins },
      { href: "/admin/parrainages", label: "Parrainages", icon: Gift },
      { href: "/admin/recompenses", label: "Récompenses", icon: Award },
    ],
  },
  {
    id: "equipe",
    label: "Équipe & Expertise",
    icon: UserCircle,
    items: [
      { href: "/admin/equipe", label: "Équipe", icon: UserCircle },
      { href: "/admin/sage-femme", label: "Espace Sage-Femme", icon: Heart },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    icon: Settings,
    items: [
      { href: "/admin/categories", label: "Catégories", icon: Tag },
      { href: "/admin/contenu", label: "Contenu du site", icon: FileText },
      { href: "/admin/branding", label: "Branding", icon: Palette },
      { href: "/admin/rapports", label: "Rapports", icon: BarChart3 },
      { href: "/admin/configuration", label: "Config. avancée", icon: Wrench },
      { href: "/admin/parametres", label: "Paramètres", icon: Settings },
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/admin": "Tableau de bord",
  "/admin/sage-femme": "Espace Sage-Femme",
  "/admin/rdv": "Rendez-vous",
  "/admin/clients": "Clients",
  "/admin/soins": "Soins",
  "/admin/forfaits": "Forfaits",
  "/admin/equipe": "Équipe",
  "/admin/faq": "FAQ",
  "/admin/categories": "Catégories",
  "/admin/branding": "Branding",
  "/admin/configuration": "Config. avancée",
  "/admin/boutique": "Boutique",
  "/admin/promo": "Codes Promo",
  "/admin/galerie": "Galerie Avant/Après",
  "/admin/videos": "Témoignages Vidéo",
  "/admin/commandes": "Commandes",
  "/admin/blog": "Blog",
  "/admin/newsletter": "Newsletter",
  "/admin/messages": "Messages",
  "/admin/communaute": "Communauté",
  "/admin/avis": "Avis",
  "/admin/signalements": "Signalements",
  "/admin/groupes": "Groupes",
  "/admin/evenements": "Événements",
  "/admin/verification": "Vérification",
  "/admin/parrainages": "Parrainages",
  "/admin/fidelite": "Fidélité",
  "/admin/recompenses": "Récompenses",
  "/admin/blocages": "Blocages",
  "/admin/professionnels": "Professionnels",
  "/admin/rapports": "Rapports",
  "/admin/contenu": "Contenu du site",
  "/admin/parametres": "Paramètres",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-open the group containing the current active page
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const activeGroup = navGroups.find((g) =>
      g.items.some((item) => pathname.startsWith(item.href))
    )
    return new Set(activeGroup ? [activeGroup.id] : [])
  })

  const isLoginPage = pathname === "/admin/login"
  const isSageFemme = session?.user?.role === "SAGE_FEMME"

  const visibleGroups = isSageFemme
    ? navGroups.filter((g) => g.id === "equipe")
    : navGroups

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  // Auto-open group when navigating to a page in it
  useEffect(() => {
    const activeGroup = navGroups.find((g) =>
      g.items.some((item) => pathname.startsWith(item.href))
    )
    if (activeGroup) {
      setOpenGroups((prev) => {
        if (prev.has(activeGroup.id)) return prev
        const next = new Set(prev)
        next.add(activeGroup.id)
        return next
      })
    }
  }, [pathname])

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const currentTitle =
    Object.entries(pageTitles).find(
      ([route]) => route === "/admin" ? pathname === "/admin" : pathname.startsWith(route)
    )?.[1] || "Administration"

  if (isLoginPage) {
    return <>{children}</>
  }

  const adminName = session?.user
    ? `${session.user.prenom || ""} ${session.user.nom || ""}`.trim() || session.user.email
    : ""

  return (
    <ConfirmProvider>
    <div className="flex h-screen bg-bg-page">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-primary-brand flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 relative">
          <Link href="/admin" className="block">
            <span className="font-display text-[17px] font-light text-white tracking-wide leading-tight block">
              Le Surnaturel de Dieu
            </span>
            <span className="font-body text-[8px] uppercase tracking-[0.2em] text-gold mt-1 block">
              Administration
            </span>
          </Link>
          <div className="w-7 h-px bg-gold mt-3" />
          <button
            className="absolute top-4 right-4 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {/* Dashboard — standalone top link (admin only) */}
          {!isSageFemme && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 mb-3 font-body text-[12px] uppercase tracking-widest font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-white/15 text-white border-l-[3px] border-white"
                  : "text-white/70 hover:bg-white/8 hover:text-white border-l-[3px] border-transparent"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Tableau de bord
            </Link>
          )}

          {/* Grouped sections */}
          <div className="space-y-0.5">
            {visibleGroups.map((group) => {
              const isOpen = openGroups.has(group.id)
              const hasActive = group.items.some((item) => isActive(item.href))
              return (
                <div key={group.id}>
                  {/* Group header button */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 font-body text-[10px] uppercase tracking-[0.15em] font-semibold transition-colors ${
                      hasActive ? "text-gold" : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    <group.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {/* Group items */}
                  {isOpen && (
                    <div className="pl-2 mb-1">
                      {group.items.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 font-body text-[11px] uppercase tracking-widest font-medium transition-colors ${
                              active
                                ? "bg-white/15 text-white border-l-[3px] border-white"
                                : "text-white/60 hover:bg-white/8 hover:text-white border-l-[3px] border-transparent"
                            }`}
                          >
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Bas sidebar — Nom admin + déconnexion */}
        <div className="p-4 border-t border-white/15 space-y-2">
          {adminName && (
            <p className="font-body text-xs text-white/60 truncate px-1">
              {adminName}
            </p>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-2 px-3 py-2 font-body text-xs uppercase tracking-widest text-red-300 hover:text-red-200 hover:bg-white/8 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border-brand flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-text-muted-brand" />
            </button>
            <h1 className="font-display text-[22px] font-light text-text-main">
              {currentTitle}
            </h1>
          </div>
          {session?.user && (
            <div className="flex items-center gap-3">
              <span className="font-body text-[13px] text-text-mid hidden sm:block">
                {adminName}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary-brand flex items-center justify-center text-white font-body text-xs uppercase">
                {(session.user.prenom?.[0] || "A")}
                {(session.user.nom?.[0] || "")}
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
    </ConfirmProvider>
  )
}
