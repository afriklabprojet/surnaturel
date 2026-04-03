"use client"

import Link from "next/link"
import {
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useSiteConfig } from "@/components/providers/SiteConfigProvider"

const LIENS_RAPIDES = [
  { label: "Accueil", href: "/" },
  { label: "Soins & Services", href: "/soins" },
  { label: "Boutique", href: "/boutique" },
  { label: "Sage-femme", href: "/sage-femme" },
  { label: "Blog", href: "/blog" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
] as const

const LIENS_SOINS = [
  { label: "Hammam", href: "/soins/hammam-royal" },
  { label: "Gommage corps", href: "/soins/gommage-corps-luxe" },
  { label: "Soin amincissant", href: "/soins/soin-amincissant-expert" },
  { label: "Soin du visage", href: "/soins/soin-visage-eclat" },
  { label: "Post-accouchement", href: "/soins/programme-post-accouchement" },
  { label: "Conseil esthétique", href: "/soins/conseil-esthetique" },
  { label: "Sage-femme", href: "/sage-femme" },
] as const

export default function Footer() {
  const { t } = useI18n()
  const config = useSiteConfig()

  return (
    <footer className="bg-text-main">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo & description */}
          <div>
            <Link href="/" className="block">
              <p className="font-display text-xl font-light text-white">
                {config.nomCentre}
              </p>
              <p className="mt-1 font-body text-[9px] font-medium uppercase tracking-[0.2em] text-gold">
                Institut de bien-être
              </p>
            </Link>
            <p className="mt-6 font-body text-[13px] leading-relaxed text-white/55">
              {t.footer.description}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href={config.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center text-white/40 transition-colors duration-300 hover:text-gold"
              >
                <Facebook size={18} />
              </a>
              <a
                href={config.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center text-white/40 transition-colors duration-300 hover:text-gold"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* À propos / liens rapides */}
          <div>
            <h3 className="font-body text-xs font-medium uppercase tracking-[0.15em] text-gold">
              {t.footer.navigation}
            </h3>
            <ul className="mt-5 space-y-3">
              {LIENS_RAPIDES.map((lien) => (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    className="font-body text-[12px] text-white/55 transition-colors duration-300 hover:text-gold"
                  >
                    {lien.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soins */}
          <div>
            <h3 className="font-body text-xs font-medium uppercase tracking-[0.15em] text-gold">
              {t.footer.services}
            </h3>
            <ul className="mt-5 space-y-3">
              {LIENS_SOINS.map((lien) => (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    className="font-body text-[12px] text-white/55 transition-colors duration-300 hover:text-gold"
                  >
                    {lien.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-body text-xs font-medium uppercase tracking-[0.15em] text-gold">
              {t.footer.contact}
            </h3>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
                <span className="font-body text-[12px] text-white/55">
                  Abidjan, Côte d&apos;Ivoire
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-gold" />
                <a href={`tel:${config.telephoneTel}`} className="font-body text-[12px] text-white/55 hover:text-gold transition-colors duration-300">{config.telephone}</a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-gold" />
                <a href={`mailto:${config.email}`} className="font-body text-[12px] text-white/55 hover:text-gold transition-colors duration-300">
                  {config.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-body text-xs text-white/40">
            &copy; {new Date().getFullYear()} {config.nomCentre} — {config.fondatrice}.
            {t.footer.droits}
          </p>
          <div className="flex gap-6">
            <Link
              href="/mentions-legales"
              className="font-body text-xs text-white/40 transition-colors duration-300 hover:text-gold"
            >
              Mentions légales
            </Link>
            <Link
              href="/politique-confidentialite"
              className="font-body text-xs text-white/40 transition-colors duration-300 hover:text-gold"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/conditions-utilisation"
              className="font-body text-xs text-white/40 transition-colors duration-300 hover:text-gold"
            >
              CGU
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
