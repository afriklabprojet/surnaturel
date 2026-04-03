"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Calendar,
  ShoppingBag,
  Star,
  MessageCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Users,
  Newspaper,
  UserPlus,
  Heart,
  AlertCircle,
  CheckCircle,
  Gift,
  RefreshCw,
} from "lucide-react"
import { formatPrix, formatDate } from "@/lib/utils"
import { BtnArrow, BtnTextLine } from "@/components/ui/buttons"
import { staggerContainer, staggerItem } from "@/lib/animations"
import OnboardingWizard from "@/components/compte/OnboardingWizard"
import OnboardingFlow from "@/components/compte/OnboardingFlow"
import RecommendationsSection from "@/components/compte/RecommendationsSection"

interface SSRRdv {
  id: string
  dateHeure: string
  statut: string
  soin: { nom: string; duree: number; prix: number; slug?: string }
}

interface SSRRdvTermine {
  id: string
  dateHeure: string
  soin: { nom: string; duree: number; prix: number; slug?: string }
}

interface SSRCommande {
  id: string
  total: number
  statut: string
  createdAt: string
  lignes: { produit: { nom: string } }[]
}

interface Progression {
  pourcentage: number
  restant: number
  prochain: { nom: string; points: number; recompense: string } | null
}

interface RDVSansAvis {
  id: string
  date: string
  soin?: { nom: string } | null
}

interface DashboardClientProps {
  prenom: string
  today: string
  prochainRdv: SSRRdv | null
  derniereCommande: SSRCommande | null
  points: number
  palier: string
  progression: Progression
  rdvsAVenir: SSRRdv[]
  rdvsTermines: SSRRdvTermine[]
  dernieresCommandes: SSRCommande[]
  hasData: boolean
  isNewUser: boolean
  profilComplet: boolean
  hasRdv: boolean
  hasCommande: boolean
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

export default function DashboardClient({
  prenom,
  today,
  prochainRdv,
  derniereCommande,
  points,
  palier,
  progression,
  rdvsAVenir,
  rdvsTermines,
  dernieresCommandes,
  hasData,
  isNewUser,
  profilComplet,
  hasRdv,
  hasCommande,
}: DashboardClientProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false)
  const [messagesNonLus, setMessagesNonLus] = useState(0)
  const [countdown, setCountdown] = useState("")
  const [communaute, setCommunaute] = useState({
    connexions: 0,
    demandes: 0,
    posts: 0,
    loaded: false,
  })
  const [rdvsSansAvis, setRdvsSansAvis] = useState<RDVSansAvis[]>([])

  // Logique d'affichage onboarding
  useEffect(() => {
    const flowDone = localStorage.getItem("onboarding_flow_done")
    const wizardDismissed = localStorage.getItem("onboarding_dismissed")
    const allStepsComplete = profilComplet && hasRdv && hasCommande

    // Nouvelle utilisatrice sans RDV → modale de démarrage guidé (prioritaire)
    if (!flowDone && isNewUser && !hasRdv) {
      setShowOnboardingFlow(true)
    // Utilisatrice existante avec des étapes incomplètes → wizard inline
    } else if (!wizardDismissed && !allStepsComplete) {
      setShowOnboarding(true)
    }

    // Countdown pour le prochain RDV
    if (prochainRdv) {
      function updateCountdown() {
        const diff = new Date(prochainRdv!.dateHeure).getTime() - Date.now()
        if (diff <= 0) { setCountdown(""); return }
        const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
        const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        if (jours > 0) setCountdown(`dans ${jours}j ${heures}h`)
        else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setCountdown(`dans ${heures}h ${minutes}min`)
        }
      }
      updateCountdown()
      const timer = setInterval(updateCountdown, 60000)
      return () => clearInterval(timer)
    }
  }, [hasData, prochainRdv])

  useEffect(() => {
    async function fetchRealtimeData() {
      try {
        const [msgRes, avisRes] = await Promise.all([
          fetch("/api/messages/conversations"),
          fetch("/api/avis?mesAvis=true"),
        ])

        if (msgRes.ok) {
          const msgData = await msgRes.json()
          const conversations = msgData.conversations || []
          setMessagesNonLus(conversations.filter((c: { unread: number }) => c.unread > 0).length)
        }

        if (avisRes.ok) {
          const avisData = await avisRes.json()
          setRdvsSansAvis((avisData.rdvsSansAvis || []).slice(0, 3))
        }
      } catch { /* optionnel */ }

      try {
        const [connRes, feedRes, pendingRes] = await Promise.all([
          fetch("/api/communaute/connexions?type=all"),
          fetch("/api/communaute/posts?limit=1"),
          fetch("/api/communaute/connexions?type=pending"),
        ])
        const connData = connRes.ok ? await connRes.json() : {}
        const feedData = feedRes.ok ? await feedRes.json() : {}
        const pendingData = pendingRes.ok ? await pendingRes.json() : {}
        setCommunaute({
          connexions: connData.contacts?.length || 0,
          demandes: pendingData.demandes?.length || 0,
          posts: feedData.total || 0,
          loaded: true,
        })
      } catch { /* optionnel */ }
    }

    fetchRealtimeData()
  }, [hasData])

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

      {/* Modale plein-écran — première visite sans RDV */}
      {showOnboardingFlow && (
        <OnboardingFlow
          prenom={prenom}
          onDismiss={() => setShowOnboardingFlow(false)}
        />
      )}

      {/* Wizard inline — utilisatrice existante avec étapes incomplètes */}
      {showOnboarding && !showOnboardingFlow && (
        <OnboardingWizard
          prenom={prenom}
          profilComplet={profilComplet}
          hasRdv={hasRdv}
          hasCommande={hasCommande}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {/* 4 cartes métriques */}
      <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Prochain RDV */}
        <div className="border-t-2 border-t-primary-brand border border-border-brand bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-primary-brand" />
            <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
              Prochain RDV
            </span>
          </div>
          {prochainRdv ? (
            <>
              <p className="font-display text-[16px] text-text-main">
                {prochainRdv.soin.nom}
              </p>
              <p className="mt-1 font-body text-[13px] text-gold">
                {formatDate(new Date(prochainRdv.dateHeure))} à{" "}
                {new Date(prochainRdv.dateHeure).toLocaleTimeString("fr", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {countdown && (
                <p className="mt-1 flex items-center gap-1 font-body text-[12px] font-medium text-primary-brand">
                  <Clock size={12} />
                  {countdown}
                </p>
              )}
              <span
                className={`mt-2 inline-block px-2 py-0.5 text-xs uppercase tracking-wider ${
                  STATUT_BADGE[prochainRdv.statut]?.bg || ""
                } ${STATUT_BADGE[prochainRdv.statut]?.text || ""}`}
              >
                {STATUT_BADGE[prochainRdv.statut]?.label || prochainRdv.statut}
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
            <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
              Dernière commande
            </span>
          </div>
          {derniereCommande ? (
            <>
              <p className="font-body text-[12px] text-text-mid">
                N° {derniereCommande.id.slice(0, 8)}
              </p>
              <p className="mt-1 font-display text-[20px] text-gold">
                {formatPrix(derniereCommande.total)}
              </p>
              <span
                className={`mt-2 inline-block px-2 py-0.5 text-xs uppercase tracking-wider ${
                  STATUT_BADGE[derniereCommande.statut]?.bg || ""
                } ${STATUT_BADGE[derniereCommande.statut]?.text || ""}`}
              >
                {STATUT_BADGE[derniereCommande.statut]?.label || derniereCommande.statut}
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
            <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
              Points fidélité
            </span>
          </div>
          <p className="font-display text-[32px] text-gold">{points}</p>
          <span className="mt-1 inline-block px-2 py-0.5 text-xs uppercase tracking-wider bg-gold/10 text-gold">
            {palier}
          </span>
          {progression.prochain && (
            <div className="mt-3">
              <div className="h-1.5 w-full bg-border-brand overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-500"
                  style={{ width: `${progression.pourcentage}%` }}
                />
              </div>
              <p className="mt-1 font-body text-[11px] text-text-muted-brand">
                {progression.restant} pts avant <strong className="text-gold">{progression.prochain.nom}</strong>
              </p>
            </div>
          )}
          <div className="mt-4">
            <BtnTextLine href="/fidelite">Voir</BtnTextLine>
          </div>
        </div>

        {/* Messages */}
        <div className="border-t-2 border-t-primary-brand border border-border-brand bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} className="text-primary-brand" />
            <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
              Messages
            </span>
          </div>
          {messagesNonLus > 0 ? (
            <>
              <p className="font-display text-[24px] text-primary-brand">
                {messagesNonLus}
              </p>
              <span className="inline-block px-2 py-0.5 text-xs uppercase tracking-wider bg-primary-light text-primary-brand">
                Non lu{messagesNonLus > 1 ? "s" : ""}
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

        {rdvsAVenir.length > 0 ? (
          <div className="space-y-3">
            {rdvsAVenir.map((rdv) => (
              <Link
                key={rdv.id}
                href="/mes-rdv"
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
                  className={`shrink-0 px-2 py-0.5 text-xs uppercase tracking-wider ${
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

      {/* Réserver à nouveau */}
      {rdvsTermines.length > 0 && (
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-display text-[24px] font-light text-text-main">
              Réserver à nouveau
            </h2>
            <div className="h-px flex-1 bg-gold/30" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {rdvsTermines.map((rdv) => (
              <Link
                key={rdv.id}
                href={rdv.soin.slug ? `/prise-rdv?soin=${rdv.soin.slug}` : "/prise-rdv"}
                className="flex items-center gap-3 border border-border-brand bg-white p-4 hover:border-gold transition-colors group"
              >
                <RefreshCw size={16} className="text-gold shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-medium text-text-main truncate">
                    {rdv.soin.nom}
                  </p>
                  <p className="font-body text-[11px] text-text-muted-brand">
                    Dernier : {formatDate(new Date(rdv.dateHeure))}
                  </p>
                </div>
                <ArrowRight size={14} className="text-text-muted-brand shrink-0" />
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Dernières commandes */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-display text-[24px] font-light text-text-main">
            Mes dernières commandes
          </h2>
          <div className="h-px flex-1 bg-gold/30" />
        </div>

        {dernieresCommandes.length > 0 ? (
          <div className="space-y-3">
            {dernieresCommandes.map((cmd) => (
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
                  className={`shrink-0 px-2 py-0.5 text-xs uppercase tracking-wider ${
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
                <p className="font-body text-xs text-text-muted-brand mt-0.5">
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
                <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Connexions
                </span>
              </div>
              <p className="font-display text-[28px] text-text-main">{communaute.connexions}</p>
              {communaute.demandes > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-xs uppercase tracking-wider bg-gold-light text-gold-dark">
                  <UserPlus size={10} />
                  {communaute.demandes} demande{communaute.demandes > 1 ? "s" : ""}
                </span>
              )}
              <div className="mt-3">
                <span className="font-body text-xs text-gold uppercase tracking-[0.08em] group-hover:tracking-[0.14em] transition-all">
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
                <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Fil d&apos;actualité
                </span>
              </div>
              <p className="font-body text-[13px] text-text-mid mt-1">
                Découvrez les dernières publications de la communauté
              </p>
              <div className="mt-3">
                <span className="font-body text-xs text-gold uppercase tracking-[0.08em] group-hover:tracking-[0.14em] transition-all">
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
                <span className="font-body text-xs uppercase tracking-wider text-text-muted-brand">
                  Groupes &amp; Événements
                </span>
              </div>
              <p className="font-body text-[13px] text-text-mid mt-1">
                Rejoignez des groupes et participez aux événements
              </p>
              <div className="mt-3">
                <span className="font-body text-xs text-gold uppercase tracking-[0.08em] group-hover:tracking-[0.14em] transition-all">
                  Explorer →
                </span>
              </div>
            </Link>
          </div>
        </motion.section>
      )}

      {/* Recommandations personnalisées */}
      {!showOnboarding && (
        <RecommendationsSection
          type="mixed"
          title="Recommandé pour vous"
          subtitle="Basés sur vos préférences"
          maxItems={4}
          basedOn="history"
        />
      )}

      {/* Accès rapides */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-display text-[24px] font-light text-text-main">
            Accès rapides
          </h2>
          <div className="h-px flex-1 bg-gold/30" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { href: "/prise-rdv", label: "Prendre RDV", icon: Calendar, color: "text-primary-brand" },
            { href: "/boutique", label: "Boutique", icon: ShoppingBag, color: "text-gold" },
            { href: "/soins", label: "Nos soins", icon: Sparkles, color: "text-primary-brand" },
            { href: "/parrainage", label: "Parrainer", icon: Gift, color: "text-gold" },
            { href: "/profil/modifier", label: "Mon profil", icon: CheckCircle, color: "text-primary-brand" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2.5 border border-border-brand bg-white p-5 hover:border-gold transition-colors group text-center"
            >
              <item.icon size={22} className={`${item.color} group-hover:scale-110 transition-transform`} />
              <span className="font-body text-xs font-medium uppercase tracking-[0.08em] text-text-mid group-hover:text-gold transition-colors">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
