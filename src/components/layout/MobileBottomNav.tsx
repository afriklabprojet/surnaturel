"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/lib/cart-context"
import {
  Home,
  Sparkles,
  ShoppingBag,
  Calendar,
  User,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/soins", icon: Sparkles, label: "Soins" },
  { href: "/prise-rdv", icon: Calendar, label: "RDV" },
  { href: "/boutique", icon: ShoppingBag, label: "Boutique" },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { totalArticles } = useCart()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-brand bg-white/95 backdrop-blur-sm safe-area-pb lg:hidden">
      <div className="flex items-center justify-around py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const isBoutique = item.href === "/boutique"
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 min-h-11 transition-colors ${
                active ? "text-primary-brand" : "text-text-muted-brand"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full" />
                )}
                {isBoutique && totalArticles > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-brand text-[8px] font-bold text-white">
                    {totalArticles > 9 ? "9+" : totalArticles}
                  </span>
                )}
              </div>
              <span className={`font-body text-[9px] ${active ? "font-medium" : ""}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
        {/* Compte / Connexion */}
        <Link
          href={session?.user ? "/dashboard" : "/connexion"}
          className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 min-h-11 transition-colors ${
            pathname === "/dashboard" || pathname === "/connexion" || pathname === "/profil"
              ? "text-primary-brand"
              : "text-text-muted-brand"
          }`}
        >
          <User size={20} strokeWidth={1.8} />
          <span className="font-body text-[9px]">
            {session?.user ? "Compte" : "Connexion"}
          </span>
        </Link>
      </div>
    </nav>
  )
}
