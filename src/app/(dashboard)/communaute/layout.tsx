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
} from "lucide-react"

const TABS = [
  { href: "/communaute", label: "Fil", icon: Newspaper, exact: true },
  { href: "/communaute/reseau", label: "Réseau", icon: Users },
  { href: "/communaute/groupes", label: "Groupes", icon: UsersRound },
  { href: "/communaute/evenements", label: "Événements", icon: CalendarDays },
  { href: "/communaute/membres", label: "Membres", icon: Contact },
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
      <nav className="-mx-5 lg:-mx-8 px-5 lg:px-8 border-b border-border-brand bg-white overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href, "exact" in tab ? tab.exact : undefined)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-3 font-body text-[11px] font-medium uppercase tracking-[0.08em] border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-gold text-gold"
                    : "border-transparent text-text-muted-brand hover:text-text-mid hover:border-border-brand"
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
