"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Calendar,
  ShoppingBag,
  Star,
  MessageCircle,
  Clock,
  Sparkles,
  Loader2,
  ArrowRight,
  Users,
  Newspaper,
  UserPlus,
  Heart,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { formatPrix, formatDate } from "@/lib/utils"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations"

interface RDV {
  id: string
  dateHeure: string
  statut: string
  soin: { nom: string; duree: number; prix: number }
}

interface Commande {
  id: string
  total: number
  statut: string
  createdAt: string
  lignes: { produit: { nom: string } }[]
}

interface RDVSansAvis {
  id: string
  date: string
  soin?: { nom: string } | null
}

const STATUT_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  CONFIRME: { bg: "bg-primary-light", text: "text-primary-brand", label: "Confirmé" },
  EN_ATTENTE: { bg: "bg-gold-light", text: "text-gold-dark", label: "En attente" },
  ANNULE: { bg: "bg-[#FEE2E2]", text: "text-red-800", label: "Annulé" },
  TERMINE: { bg: "bg-border-brand", text: "text-text-mid", label: "Terminé" },
  PAYEE: { bg: "bg-primary-light", text: "text-primary-brand", label: "Payée" },
  EN_PREPARATION: { bg: "bg-gold-light", text: "text-gold-dark", label: "En préparation" },
  EXPEDIEE: { bg: "bg-primary-light", text: "text-primary-brand", label: "Expédiée" },
  LIVREE: { bg: "bg-border-brand", text: "text-text-mid", label: "Livrée" },
}

export default function PageDashboard() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [rdvs, setRdvs] = useState<RDV[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [stats, setStats] = useState({
    prochainRdv: null as RDV | null,
    derniereCommande: null as Commande | null,
    points: 0,
    palier: "Bronze",
    messagesNonLus: 0,
  })
  const [communaute, setCommunaute] = useState({
    connexions: 0,
    demandes: 0,
    posts: 0,
    loaded: false,
  })
  const [rdvsSansAvis, setRdvsSansAvis] = useState<RDVSansAvis[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [rdvRes, cmdRes, fideliteRes, msgRes] = await Promise.all([
          fetch("/api/rdv"),
          fetch("/api/commandes"),
          fetch("/api/fidelite"),
          fetch("/api/messages/conversations"),
        ])

        const rdvData = rdvRes.ok ? (await rdvRes.json()).rdvs || [] : []
        const cmdData = cmdRes.ok ? (await cmdRes.json()).commandes || [] : []
        const fideliteData = fideliteRes.ok ? await fideliteRes.json() : { points: 0, palierActuel: null }
        const msgData = msgRes.ok ? (await msgRes.json()).conversations || [] : []

        // Communauté
        try {
          const [connRes, feedRes] = await Promise.all([
            fetch("/api/communaute/connexions?type=all"),
            fetch("/api/communaute/posts?limit=1"),
          ])
          const connData = connRes.ok ? await connRes.json() : {}
          const feedData = feedRes.ok ? await feedRes.json() : {}
          const pendingRes = await fetch("/api/communaute/connexions?type=pending")
          const pendingData = pendingRes.ok ? await pendingRes.json() : {}
          setCommunaute({
            connexions: connData.contacts?.length || 0,
            demandes: pendingData.demandes?.length || 0,
            posts: feedData.total || 0,
            loaded: true,
          })
        } catch {}

        // Avis en attente
        try {
          const avisRes = await fetch("/api/avis?mesAvis=true")
          if (avisRes.ok) {
            const avisData = await avisRes.json()
            setRdvsSansAvis((avisData.rdvsSansAvis || []).slice(0, 3))
          }
        } catch {}

        // Filtrer RDV à venir
        const rdvsAVenir = rdvData.filter(
          (r: RDV) => new Date(r.dateHeure) > new Date() && r.statut !== "ANNULE"
        )

        setRdvs(rdvsAVenir.slice(0, 3))
        setCommandes(cmdData.slice(0, 3))
        setStats({
          prochainRdv: rdvsAVenir[0] || null,
          derniereCommande: cmdData[0] || null,
          points: fideliteData.points || 0,
          palier: fideliteData.palierActuel?.nom || "Bronze",
          messagesNonLus: msgData.filter((c: { unread: number }) => c.unread > 0).length,
        })

        // Onboarding : si aucun RDV et aucune commande, c'est un nouvel utilisateur
        if (rdvData.length === 0 && cmdData.length === 0) {
          const dismissed = localStorage.getItem("onboarding_dismissed")
          if (!dismissed) {
            setShowOnboarding(true)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary-brand" />
      </div>
    )
  }

  const prenom = session?.user?.prenom || "Client"
  const today = new Date().toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Bloc bienvenue */}
      <motion.section variants={staggerItem} className="border border-border-brand bg-white p-8">
        <h1 className="font-display text-[36px] font-light text-text-main">
          Bonjour {prenom}
        </h1>
        <p className="mt-1 font-body text-[14px] text-gold capitalize">{today}</p>
        <div className="mt-3 h-px w-10 bg-gold" />
      </motion.section>

      {/* Onboarding — nouvel utilisateur */}
      {showOnboarding && (
        <motion.section
          variants={staggerItem}
          className="border border-gold bg-gold-light p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles size={20} className="text-gold" />
                <h2 className="font-display text-[22px] font-light text-text-main">
                  Bienvenue au Surnaturel de Dieu, {prenom} !
                </h2>
              </div>
              <p className="font-body text-[14px] leading-relaxed text-text-mid max-w-2xl">
                C&apos;est votre première visite dans votre espace personnel. Voici comment commencer :
              </p>
            </div>
            <button
              onClick={() => {
                setShowOnboarding(false)
                localStorage.setItem("onboarding_dismissed", "true")
              }}
              className="font-body text-[11px] text-text-muted-brand hover:text-text-main transition-colors"
              aria-label="Fermer le guide de bienvenue"
            >
              ✕
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href="/prise-rdv"
              className="flex items-start gap-3 border border-gold/30 bg-white p-4 hover:border-gold transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center bg-primary-light shrink-0">
                <Calendar size={18} className="text-primary-brand" />
              </div>
              <div>
                <p className="font-body text-[13px] font-medium text-text-main group-hover:text-primary-brand transition-colors">
                  1. Réservez votre premier soin
                </p>
                <p className="mt-1 font-body text-[11px] text-text-muted-brand">
                  Hammam, gommage, visage... Choisissez et réservez en ligne.
                </p>
              </div>
            </Link>

            <Link
              href="/boutique"
              className="flex items-start gap-3 border border-gold/30 bg-white p-4 hover:border-gold transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center bg-gold-light shrink-0">
                <ShoppingBag size={18} className="text-gold" />
              </div>
              <div>
                <p className="font-body text-[13px] font-medium text-text-main group-hover:text-gold transition-colors">
                  2. Découvrez la boutique
                </p>
                <p className="mt-1 font-body text-[11px] text-text-muted-brand">
                  Des produits naturels pour prolonger les bienfaits chez vous.
                </p>
              </div>
            </Link>

            <Link
              href="/profil"
              className="flex items-start gap-3 border border-gold/30 bg-white p-4 hover:border-gold transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center bg-primary-light shrink-0">
                <CheckCircle size={18} className="text-primary-brand" />
              </div>
              <div>
                <p className="font-body text-[13px] font-medium text-text-main group-hover:text-primary-brand transition-colors">
                  3. Complétez votre profil
                </p>
                <p className="mt-1 font-body text-[11px] text-text-muted-brand">
                  Pour un accompagnement personnalisé et des recommandations sur-mesure.
                </p>
              </div>
            </Link>
          </div>
        </motion.section>
      )}

      {/* 4 cartes métriques */}
      <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Prochain RDV */}
        <div className="border-t-2 border-t-primary-brand border border-border-brand bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-primary-brand" />
            <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">
              Prochain RDV
            </span>
          </div>
          {stats.prochainRdv ? (
            <>
              <p className="font-display text-[16px] text-text-main">
                {stats.prochainRdv.soin.nom}
              </p>
              <p className="mt-1 font-body text-[13px] text-gold">
                {formatDate(new Date(stats.prochainRdv.dateHeure))} à{" "}
                {new Date(stats.prochainRdv.dateHeure).toLocaleTimeString("fr", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <span
                className={`mt-2 inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  STATUT_BADGE[stats.prochainRdv.statut]?.bg || ""
                } ${STATUT_BADGE[stats.prochainRdv.statut]?.text || ""}`}
              >
                {STATUT_BADGE[stats.prochainRdv.statut]?.label || stats.prochainRdv.statut}
              </span>
            </>
          ) : (
            <p className="font-body text-[13px] text-text-muted-brand">
              Aucun RDV à venir
            </p>
          )}
          <div className="mt-4">
            <BtnTextLine href="/mes-rdv">Voir</BtnTextLine>
          </div>
        </div>

        {/* Dernière commande */}
        <div className="border-t-2 border-t-gold border border-border-brand bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={18} className="text-gold" />
            <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">
              Dernière commande
            </span>
          </div>
          {stats.derniereCommande ? (
            <>
              <p className="font-body text-[12px] text-text-mid">
                N° {stats.derniereCommande.id.slice(0, 8)}
              </p>
              <p className="mt-1 font-display text-[20px] text-gold">
                {formatPrix(stats.derniereCommande.total)}
              </p>
              <span
                className={`mt-2 inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  STATUT_BADGE[stats.derniereCommande.statut]?.bg || ""
                } ${STATUT_BADGE[stats.derniereCommande.statut]?.text || ""}`}
              >
                {STATUT_BADGE[stats.derniereCommande.statut]?.label || stats.derniereCommande.statut}
              </span>
            </>
          ) : (
            <p className="font-body text-[13px] text-text-muted-brand">
              Aucune commande
            </p>
          )}
          <div className="mt-4">
            <BtnTextLine href="/commandes">Suivre</BtnTextLine>
          </div>
        </div>

        {/* Points fidélité */}
        <div className="border-t-2 border-t-gold border border-border-brand bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-gold" />
            <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">
              Points fidélité
            </span>
          </div>
          <p className="font-display text-[32px] text-gold">{stats.points}</p>
          <span className="mt-1 inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider bg-gold/10 text-gold">
            {stats.palier}
          </span>
          <div className="mt-4">
            <BtnTextLine href="/fidelite">Voir</BtnTextLine>
          </div>
        </div>

        {/* Messages */}
        <div className="border-t-2 border-t-primary-brand border border-border-brand bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} className="text-primary-brand" />
            <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">
              Messages
            </span>
          </div>
          {stats.messagesNonLus > 0 ? (
            <>
              <p className="font-display text-[24px] text-primary-brand">
                {stats.messagesNonLus}
              </p>
              <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider bg-primary-light text-primary-brand">
                Non lu{stats.messagesNonLus > 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <p className="font-body text-[13px] text-text-muted-brand">
              Aucun nouveau message
            </p>
          )}
          <div className="mt-4">
            <BtnTextLine href="/communaute">Lire</BtnTextLine>
          </div>
        </div>
      </motion.div>

      {/* Prochains RDV */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-display text-[24px] font-light text-text-main">
            Mes prochains rendez-vous
          </h2>
          <div className="h-px flex-1 bg-gold/30" />
        </div>

        {rdvs.length > 0 ? (
          <div className="space-y-3">
            {rdvs.map((rdv) => (
              <Link
                key={rdv.id}
                href={`/mes-rdv`}
                className="flex items-center gap-4 border border-border-brand border-l-2 border-l-gold bg-white p-4 hover:bg-bg-page transition-colors"
              >
                <Sparkles size={20} className="text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[16px] text-text-main">{rdv.soin.nom}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-body text-[12px] text-text-muted-brand">
                      {formatDate(new Date(rdv.dateHeure))}
                    </span>
                    <span className="font-body text-[12px] text-gold">
                      {new Date(rdv.dateHeure).toLocaleTimeString("fr", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    STATUT_BADGE[rdv.statut]?.bg || ""
                  } ${STATUT_BADGE[rdv.statut]?.text || ""}`}
                >
                  {STATUT_BADGE[rdv.statut]?.label || rdv.statut}
                </span>
                <ArrowRight size={16} className="text-text-muted-brand shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-border-brand bg-white p-8 text-center">
            <Calendar size={40} className="mx-auto text-border-brand mb-3" />
            <p className="font-body text-[14px] text-text-muted-brand">
              Aucun rendez-vous à venir
            </p>
            <BtnArrow href="/prise-rdv" className="mt-4 inline-flex">
              Prendre un RDV
            </BtnArrow>
          </div>
        )}

        <div className="mt-4">
          <BtnTextLine href="/mes-rdv">
            Voir tous mes RDV →
          </BtnTextLine>
        </div>
      </motion.section>

      {/* Dernières commandes */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-display text-[24px] font-light text-text-main">
            Mes dernières commandes
          </h2>
          <div className="h-px flex-1 bg-gold/30" />
        </div>

        {commandes.length > 0 ? (
          <div className="space-y-3">
            {commandes.map((cmd) => (
              <Link
                key={cmd.id}
                href={`/commandes/${cmd.id}`}
                className="flex items-center gap-4 border border-border-brand bg-white p-4 hover:bg-bg-page transition-colors"
              >
                <ShoppingBag size={20} className="text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[12px] text-text-muted-brand">
                    N° {cmd.id.slice(0, 8)} • {formatDate(new Date(cmd.createdAt))}
                  </p>
                  <p className="font-body text-[13px] text-text-mid truncate">
                    {cmd.lignes.map((l) => l.produit.nom).join(", ")}
                  </p>
                </div>
                <p className="font-display text-[16px] text-gold shrink-0">
                  {formatPrix(cmd.total)}
                </p>
                <span
                  className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    STATUT_BADGE[cmd.statut]?.bg || ""
                  } ${STATUT_BADGE[cmd.statut]?.text || ""}`}
                >
                  {STATUT_BADGE[cmd.statut]?.label || cmd.statut}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-border-brand bg-white p-8 text-center">
            <ShoppingBag size={40} className="mx-auto text-border-brand mb-3" />
            <p className="font-body text-[14px] text-text-muted-brand">
              Aucune commande
            </p>
            <BtnArrow href="/boutique" className="mt-4 inline-flex">
              Découvrir la boutique
            </BtnArrow>
          </div>
        )}

        <div className="mt-4">
          <BtnTextLine href="/commandes">
            Voir mes commandes →
          </BtnTextLine>
        </div>
      </motion.section>

      {/* Avis en attente */}
      {rdvsSansAvis.length > 0 && (
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-display text-[24px] font-light text-text-main">
              Donnez votre avis
            </h2>
            <div className="h-px flex-1 bg-gold/30" />
          </div>

          <div className="border border-border-brand bg-white p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center bg-gold-light shrink-0">
                <Star size={16} className="text-gold" />
              </div>
              <div>
                <p className="font-body text-[13px] text-text-main">
                  {rdvsSansAvis.length} soin{rdvsSansAvis.length > 1 ? "s" : ""} en attente d&apos;avis
                </p>
                <p className="font-body text-[11px] text-text-muted-brand mt-0.5">
                  Votre retour nous aide à améliorer nos services
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {rdvsSansAvis.map((rdv) => (
                <Link
                  key={rdv.id}
                  href={`/avis/${rdv.id}`}
                  className="flex items-center gap-3 p-3 border border-border-brand hover:border-gold transition-colors"
                >
                  <Sparkles size={16} className="text-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[12px] text-text-main truncate">
                      {rdv.soin?.nom || "Soin"}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className="text-border-brand" />
                    ))}
                  </div>
                  <ArrowRight size={14} className="text-text-muted-brand shrink-0" />
                </Link>
              ))}
            </div>

            <div className="mt-3">
              <BtnTextLine href="/avis">
                Tous mes avis →
              </BtnTextLine>
            </div>
          </div>
        </motion.section>
      )}

      {/* Section Communauté */}
      {communaute.loaded && (
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-display text-[24px] font-light text-text-main">
              Ma communauté
            </h2>
            <div className="h-px flex-1 bg-gold/30" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/communaute/reseau"
              className="border border-border-brand bg-white p-5 hover:bg-bg-page transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-primary-brand" />
                <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">
                  Connexions
                </span>
              </div>
              <p className="font-display text-[28px] text-text-main">{communaute.connexions}</p>
              {communaute.demandes > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider bg-gold-light text-gold-dark">
                  <UserPlus size={10} />
                  {communaute.demandes} demande{communaute.demandes > 1 ? "s" : ""}
                </span>
              )}
              <div className="mt-3">
                <span className="font-body text-[11px] text-gold uppercase tracking-[0.08em] group-hover:tracking-[0.14em] transition-all">
                  Voir le réseau →
                </span>
              </div>
            </Link>

            <Link
              href="/communaute"
              className="border border-border-brand bg-white p-5 hover:bg-bg-page transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Newspaper size={18} className="text-gold" />
                <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">
                  Fil d'actualité
                </span>
              </div>
              <p className="font-body text-[13px] text-text-mid mt-1">
                Découvrez les dernières publications de la communauté
              </p>
              <div className="mt-3">
                <span className="font-body text-[11px] text-gold uppercase tracking-[0.08em] group-hover:tracking-[0.14em] transition-all">
                  Accéder au fil →
                </span>
              </div>
            </Link>

            <Link
              href="/communaute/groupes"
              className="border border-border-brand bg-white p-5 hover:bg-bg-page transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart size={18} className="text-primary-brand" />
                <span className="font-body text-[11px] uppercase tracking-wider text-text-muted-brand">
                  Groupes & Événements
                </span>
              </div>
              <p className="font-body text-[13px] text-text-mid mt-1">
                Rejoignez des groupes et participez aux événements
              </p>
              <div className="mt-3">
                <span className="font-body text-[11px] text-gold uppercase tracking-[0.08em] group-hover:tracking-[0.14em] transition-all">
                  Explorer →
                </span>
              </div>
            </Link>
          </div>
        </motion.section>
      )}

      {/* Accès rapides */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-display text-[24px] font-light text-text-main">
            Accès rapides
          </h2>
          <div className="h-px flex-1 bg-gold/30" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/prise-rdv", label: "Prendre RDV", icon: Calendar, color: "text-primary-brand" },
            { href: "/boutique", label: "Boutique", icon: ShoppingBag, color: "text-gold" },
            { href: "/soins", label: "Nos soins", icon: Sparkles, color: "text-primary-brand" },
            { href: "/profil/modifier", label: "Mon profil", icon: CheckCircle, color: "text-gold" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2.5 border border-border-brand bg-white p-5 hover:border-gold transition-colors group text-center"
            >
              <item.icon size={22} className={`${item.color} group-hover:scale-110 transition-transform`} />
              <span className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-mid group-hover:text-gold transition-colors">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
