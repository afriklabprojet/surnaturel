"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"
import {
  Flame,
  Sparkles,
  Zap,
  Smile,
  Baby,
  Wand2,
  ChevronDown,
  Menu,
  X,
  ShoppingCart,
  User,
} from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useI18n } from "@/lib/i18n"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

const MiniCart = dynamic(() => import("@/components/boutique/MiniCart"), { ssr: false })
const SearchBar = dynamic(() => import("@/components/layout/SearchBar"), { ssr: false })

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Flame, Sparkles, Zap, Smile, Baby, Wand2,
}

interface NavChild { label: string; href: string; icon?: string }
interface NavItem { label: string; href: string; badge?: string; requiresAuth?: boolean; children?: NavChild[] }

interface SoinNav { slug: string; nom: string; icon?: string | null }

function buildNavigation(soins: SoinNav[]): NavItem[] {
  const soinsChildren: NavChild[] = [
    { label: "Tous les soins", href: "/soins", icon: "Sparkles" },
    ...soins.map((s) => ({ label: s.nom, href: `/soins/${s.slug}`, icon: s.icon ?? undefined })),
  ]
  return [
    { label: "Accueil", href: "/" },
    { label: "À propos", href: "/a-propos" },
    { label: "Soins & Services", href: "/soins", children: soinsChildren },
    {
      label: "Boutique",
      href: "/boutique",
      children: [
        { label: "Soins du corps", href: "/boutique?categorie=corps" },
        { label: "Soins du visage", href: "/boutique?categorie=visage" },
        { label: "Bien-être & santé", href: "/boutique?categorie=bien-etre" },
      ],
    },
    { label: "Sage-femme", href: "/sage-femme", badge: "RDV" },
    { label: "Communauté", href: "/communaute", requiresAuth: true },
    { label: "Blog", href: "/blog" },
  ]
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null)
  const [miniCartOpen, setMiniCartOpen] = useState(false)
  const [navigation, setNavigation] = useState<NavItem[]>(() => buildNavigation([]))
  const { totalArticles } = useCart()
  const { t } = useI18n()
  const { data: session } = useSession()
  const user = session?.user as { nom?: string; prenom?: string; photoUrl?: string; role?: string } | undefined

  useEffect(() => {
    fetch("/api/soins")
      .then((r) => r.ok ? r.json() : { soins: [] })
      .then((data: { soins: SoinNav[] }) => {
        setNavigation(buildNavigation(data.soins || []))
      })
      .catch(() => {/* keep default */})
  }, [])

  function handleDropdownEnter(label: string) { setOpenDropdown(label) }
  function handleDropdownLeave() { setOpenDropdown(null) }
  function handleDropdownKeyDown(e: React.KeyboardEvent, label: string, childrenCount: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpenDropdown((prev) => (prev === label ? null : label))
    } else if (e.key === "Escape") {
      setOpenDropdown(null)
    } else if (e.key === "ArrowDown" && openDropdown === label) {
      e.preventDefault()
      const firstItem = (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLAnchorElement>('[role="menuitem"]')
      firstItem?.focus()
    }
  }
  function handleMenuItemKeyDown(e: React.KeyboardEvent, parentLabel: string) {
    const items = Array.from(
      (e.currentTarget as HTMLElement).closest('[role="menu"]')?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? []
    )
    const idx = items.indexOf(e.currentTarget as HTMLAnchorElement)
    if (e.key === "ArrowDown") {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpenDropdown(null)
      ;(e.currentTarget as HTMLElement).closest('li')?.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
    }
  }
  function toggleMobileDropdown(label: string) {
    setOpenMobileDropdown((prev) => (prev === label ? null : label))
  }

  // Verrouiller le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileMenuOpen])

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-border-brand backdrop-blur bg-[color-mix(in_srgb,var(--color-bg-card)_95%,transparent)]">
      <nav className="flex h-18 items-center px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Logo */}
        <Link href="/" className="shrink-0 transition-opacity duration-300 hover:opacity-80">
          <div className="hidden sm:block">
            <p className="font-display text-lg font-light leading-tight text-text-main whitespace-nowrap">
              Le Surnaturel de Dieu
            </p>
            <p className="font-body text-[9px] font-medium uppercase tracking-[0.2em] text-gold">
              Institut de bien-être
            </p>
          </div>
          <p className="font-display text-lg font-light text-text-main sm:hidden">
            Le Surnaturel
          </p>
        </Link>

        {/* Navigation desktop — centré dans l'espace restant */}
        <ul className="hidden items-center justify-center flex-1 gap-0 lg:flex mx-4">
          {navigation.map((item) => (
            <li
              key={item.label}
              className="relative"
              onMouseEnter={() => item.children && handleDropdownEnter(item.label)}
              onMouseLeave={handleDropdownLeave}
            >
              {item.children ? (
                <>
                  <div
                    className="group flex items-center gap-1 px-2 lg:px-2.5 xl:px-3 py-2 font-body text-xs xl:text-xs font-medium uppercase tracking-[0.06em] text-text-mid transition-colors duration-300 hover:text-text-main whitespace-nowrap cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-expanded={openDropdown === item.label}
                    aria-haspopup="true"
                    onKeyDown={(e) => handleDropdownKeyDown(e, item.label, item.children!.length)}
                  >
                    <Link href={item.href} className="relative">
                      {item.label}
                      <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                    </Link>
                    <ChevronDown
                      size={13}
                      className={`shrink-0 transition-transform duration-300 ${openDropdown === item.label ? "rotate-180" : ""}`}
                    />
                  </div>
                  {openDropdown === item.label && (
                    <div
                      className="absolute left-0 top-full z-50 mt-0 w-64 animate-dropdown-in border border-border-brand bg-bg-card p-3 shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                      role="menu"
                      aria-label={item.label}
                    >
                      {item.children.map((child, idx) => {
                        const Icon = child.icon ? iconMap[child.icon] : null
                        const isFirst = idx === 0 && child.href === item.href
                        return (
                          <div key={child.href + child.label}>
                            <Link
                              href={child.href}
                              role="menuitem"
                              tabIndex={0}
                              onKeyDown={(e) => handleMenuItemKeyDown(e, item.label)}
                              className={`flex items-center gap-3 px-3 py-2.5 font-body text-[12px] transition-colors duration-300 hover:text-primary-brand focus:bg-primary-light/30 focus:outline-none ${
                                isFirst
                                  ? "font-medium text-primary-brand"
                                  : "text-text-mid"
                              }`}
                            >
                              {Icon && <Icon size={16} className="text-gold" />}
                              {child.label}
                            </Link>
                            {isFirst && <div className="my-1 h-px bg-border-brand" />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className="group flex items-center gap-1.5 px-2 lg:px-2.5 xl:px-3 py-2 font-body text-xs xl:text-xs font-medium uppercase tracking-[0.06em] text-text-mid transition-colors duration-300 hover:text-text-main whitespace-nowrap"
                >
                  <span className="relative">
                    {item.label}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                  </span>
                  {item.badge && (
                    <span className="rounded-sm bg-gold px-1.5 py-0.5 font-body text-[8px] font-semibold leading-none text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Right actions (desktop) */}
        <div className="hidden items-center gap-1.5 xl:gap-2 lg:flex shrink-0">
          <SearchBar />
          <ThemeToggle />
          <button
            onClick={() => setMiniCartOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-white/10"
            aria-label="Ouvrir le panier"
          >
            <ShoppingCart size={18} className="text-text-mid" />
            {totalArticles > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary-brand font-body text-[9px] font-semibold text-white">
                {totalArticles}
              </span>
            )}
          </button>
          {user ? (
            <Link
              href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
              className="inline-flex items-center gap-1.5 border border-primary-brand bg-transparent px-3 py-2 font-body text-xs font-medium uppercase tracking-widest text-primary-brand transition-colors duration-300 hover:bg-primary-light whitespace-nowrap"
            >
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <User size={14} />
              )}
              {user.prenom || t.nav.monEspace}
            </Link>
          ) : (
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center border border-primary-brand bg-transparent px-3 py-2 font-body text-xs font-medium uppercase tracking-widest text-primary-brand transition-colors duration-300 hover:bg-primary-light whitespace-nowrap"
            >
              {t.nav.connexion}
            </Link>
          )}
          <Link
            href="/prise-rdv"
            className="inline-flex items-center justify-center bg-primary-brand px-3 py-2 font-body text-xs font-medium uppercase tracking-widest text-white transition-colors duration-300 hover:bg-primary-dark whitespace-nowrap"
          >
            {t.nav.prendreRdv}
          </Link>
        </div>

        {/* Mobile: cart + theme + hamburger */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <SearchBar />
          <ThemeToggle />
          <button
            onClick={() => setMiniCartOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center"
            aria-label="Ouvrir le panier"
          >
            <ShoppingCart size={18} className="text-text-mid" />
            {totalArticles > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-primary-brand font-body text-xs font-medium text-white">
                {totalArticles}
              </span>
            )}
          </button>
          <button
            className="flex h-11 w-11 items-center justify-center"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileMenuOpen ? <X size={22} className="text-text-main" /> : <Menu size={22} className="text-text-main" />}
          </button>
        </div>
      </nav>

      {/* Mini-cart drawer */}
      <MiniCart open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
    </header>

      {/* Menu mobile — EN DEHORS du header pour éviter que backdrop-filter
          crée un containing block et empêche le fixed de couvrir tout le viewport */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-18 z-40 overflow-y-auto bg-bg-page px-6 pb-10 pt-6 lg:hidden">
          {/* Raccourcis rapides */}
          <div className="flex gap-2 mb-6 pb-6 border-b border-border-brand">
            <Link
              href="/prise-rdv"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-brand px-4 py-3 font-body text-xs font-medium uppercase tracking-widest text-white"
            >
              <Sparkles size={14} />
              Réserver un soin
            </Link>
            <Link
              href="/boutique"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 border border-gold bg-gold-light px-4 py-3 font-body text-xs font-medium uppercase tracking-widest text-gold"
            >
              <ShoppingCart size={14} />
              Boutique
            </Link>
          </div>

          <ul className="space-y-0">
            {navigation.map((item, i) => (
              <li key={item.label} className={i > 0 ? "border-t border-border-brand" : ""}>
                {item.children ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Link
                        href={item.href}
                        className="flex-1 py-4 font-body text-[13px] font-medium uppercase tracking-widest text-text-main"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                      <button
                        className="flex h-10 w-10 items-center justify-center"
                        onClick={() => toggleMobileDropdown(item.label)}
                        aria-expanded={openMobileDropdown === item.label}
                        aria-label={`Ouvrir le sous-menu ${item.label}`}
                      >
                        <ChevronDown
                          size={16}
                          className={`text-gold transition-transform duration-300 ${openMobileDropdown === item.label ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {openMobileDropdown === item.label && (
                      <ul className="mb-4 ml-4 space-y-2 border-l border-gold/30 pl-4">
                        {item.children.map((child) => {
                          const Icon = child.icon ? iconMap[child.icon] : null
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="flex items-center gap-3 py-2 font-body text-[12px] text-text-mid transition-colors duration-300 hover:text-primary-brand"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {Icon && <Icon size={16} className="text-gold" />}
                                {child.label}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 py-4 font-body text-[13px] font-medium uppercase tracking-widest text-text-main"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="bg-gold px-2 py-0.5 font-body text-[9px] font-medium text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile buttons */}
          <div className="mt-8 flex flex-col gap-3 border-t border-border-brand pt-8">
            {user ? (
              <Link
                href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                className="flex items-center justify-center gap-2 border border-primary-brand bg-transparent px-6 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-primary-brand transition-colors duration-300 hover:bg-primary-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <User size={14} />
                )}
                {user.prenom || t.nav.monEspace}
              </Link>
            ) : (
              <Link
                href="/connexion"
                className="flex items-center justify-center border border-primary-brand bg-transparent px-6 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-primary-brand transition-colors duration-300 hover:bg-primary-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.connexion}
              </Link>
            )}
            <Link
              href="/prise-rdv"
              className="flex items-center justify-center bg-primary-brand px-6 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.prendreRdv}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}