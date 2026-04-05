"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Newspaper,
  Users,
  UsersRound,
  CalendarDays,
  Search,
  Bookmark,
  MessageCircle,
  Contact,
  Heart,
} from "lucide-react"

const TABS = [
  { href: "/communaute", label: "Fil", icon: Newspaper, exact: true },
  { href: "/communaute/reseau", label: "Réseau", icon: Users },
  { href: "/communaute/groupes", label: "Groupes", icon: UsersRound },
  { href: "/communaute/evenements", label: "Événements", icon: CalendarDays },
  { href: "/communaute/membres", label: "Membres", icon: Contact },
  { href: "/communaute/rencontres", label: "Rencontres", icon: Heart },
  { href: "/communaute/recherche", label: "Rechercher", icon: Search },
  { href: "/communaute/sauvegardes", label: "Sauvegardés", icon: Bookmark },
  { href: "/communaute/messages", label: "Messages", icon: MessageCircle },
] as const

export default function CommunauteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="space-y-5">
      {/* Sub-navigation communauté */}
      <nav className="sticky top-[76px] z-10 -mx-5 lg:-mx-8 px-5 lg:px-8 border-b border-border-brand bg-white/95 backdrop-blur-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-0.5 py-2 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href, "exact" in tab ? tab.exact : undefined)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-primary-light text-primary-brand"
                    : "text-text-muted-brand hover:text-text-mid hover:bg-bg-page"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {children}
    </div>
  )
}
