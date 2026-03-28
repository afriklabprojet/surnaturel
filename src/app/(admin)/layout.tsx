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
} from "lucide-react"
import { useState } from "react"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/sage-femme", label: "Espace Sage-Femme", icon: Heart },
  { href: "/admin/rdv", label: "Rendez-vous", icon: Calendar },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/soins", label: "Soins", icon: Sparkles },
  { href: "/admin/forfaits", label: "Forfaits", icon: Package },
  { href: "/admin/equipe", label: "Équipe", icon: UserCircle },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/categories", label: "Catégories", icon: Tag },
  { href: "/admin/boutique", label: "Boutique", icon: ShoppingBag },
  { href: "/admin/promo", label: "Codes Promo", icon: Percent },
  { href: "/admin/galerie", label: "Galerie Avant/Après", icon: ImageIcon },
  { href: "/admin/videos", label: "Témoignages Vidéo", icon: PlayCircle },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/communaute", label: "Communauté", icon: UsersRound },
  { href: "/admin/avis", label: "Avis", icon: Star },
  { href: "/admin/groupes", label: "Groupes", icon: UsersRound },
  { href: "/admin/evenements", label: "Événements", icon: CalendarDays },
  { href: "/admin/verification", label: "Vérification", icon: BadgeCheck },
  { href: "/admin/parrainages", label: "Parrainages", icon: Gift },
  { href: "/admin/fidelite", label: "Fidélité", icon: Coins },
  { href: "/admin/recompenses", label: "Récompenses", icon: Award },
  { href: "/admin/blocages", label: "Blocages", icon: Ban },
  { href: "/admin/professionnels", label: "Professionnels", icon: Stethoscope },
  { href: "/admin/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/admin/configuration", label: "Configuration", icon: Wrench },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
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
  "/admin/configuration": "Configuration",
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
  "/admin/groupes": "Groupes",
  "/admin/evenements": "Événements",
  "/admin/verification": "Vérification",
  "/admin/parrainages": "Parrainages",
  "/admin/fidelite": "Fidélité",
  "/admin/recompenses": "Récompenses",
  "/admin/blocages": "Blocages",
  "/admin/professionnels": "Professionnels",
  "/admin/rapports": "Rapports",
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

  const isLoginPage = pathname === "/admin/login"

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

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
        <div className="px-6 pt-6 pb-4">
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
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 font-body text-[12px] uppercase tracking-widest font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white border-l-[3px] border-white"
                    : "text-white/70 hover:bg-white/8 hover:text-white border-l-[3px] border-transparent"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bas sidebar — Nom admin + déconnexion */}
        <div className="p-4 border-t border-white/15 space-y-2">
          {adminName && (
            <p className="font-body text-[11px] text-white/60 truncate px-1">
              {adminName}
            </p>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-2 px-3 py-2 font-body text-[11px] uppercase tracking-widest text-red-300 hover:text-red-200 hover:bg-white/8 w-full transition-colors"
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
              <div className="h-8 w-8 rounded-full bg-primary-brand flex items-center justify-center text-white font-body text-[11px] uppercase">
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
