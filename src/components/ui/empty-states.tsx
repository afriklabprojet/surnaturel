"use client"

import { motion } from "framer-motion"
import { fadeInUp } from "@/lib/animations"
import { BtnArrow } from "@/components/ui/buttons"
import {
  Calendar,
  ShoppingBag,
  Heart,
  Star,
  Users,
  Bell,
  Gift,
  Search,
  MessageSquare,
  Clock,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyStateType =
  | "rdv"
  | "commandes"
  | "favoris"
  | "avis"
  | "parrainage"
  | "notifications"
  | "fidelite"
  | "recherche"
  | "messages"
  | "historique"
  | "temoignages"
  | "videos"

interface EmptyStateProps {
  type: EmptyStateType
  className?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

const emptyStateConfig: Record<
  EmptyStateType,
  {
    icon: typeof Calendar
    title: string
    description: string
    defaultAction?: { label: string; href: string }
  }
> = {
  rdv: {
    icon: Calendar,
    title: "Aucun rendez-vous",
    description:
      "C'est le moment idéal pour prendre soin de vous ! Réservez votre premier soin et laissez-vous chouchouter.",
    defaultAction: { label: "Réserver mon soin", href: "/prise-rdv" },
  },
  commandes: {
    icon: ShoppingBag,
    title: "Aucune commande",
    description:
      "Nos produits naturels prolongent les bienfaits de vos soins à la maison. Explorez notre sélection !",
    defaultAction: { label: "Découvrir la boutique", href: "/boutique" },
  },
  favoris: {
    icon: Heart,
    title: "Aucun favori",
    description:
      "Ajoutez vos soins et produits préférés en favoris pour les retrouver facilement.",
    defaultAction: { label: "Explorer nos soins", href: "/soins" },
  },
  avis: {
    icon: Star,
    title: "Aucun avis",
    description:
      "Votre retour compte ! Après votre prochain soin, partagez votre expérience pour aider d'autres clientes.",
  },
  parrainage: {
    icon: Users,
    title: "Aucun parrainage",
    description:
      "Partagez votre expérience avec vos proches et gagnez 200 points fidélité par parrainage !",
    defaultAction: { label: "Parrainer une amie", href: "/parrainage" },
  },
  notifications: {
    icon: Bell,
    title: "Tout est calme",
    description:
      "Aucune notification pour le moment. Nous vous préviendrons de vos RDV et promotions.",
  },
  fidelite: {
    icon: Gift,
    title: "Pas encore de points",
    description:
      "Chaque soin et chaque commande vous rapprochent de récompenses exclusives. Lancez-vous !",
    defaultAction: { label: "Réserver un soin", href: "/prise-rdv" },
  },
  recherche: {
    icon: Search,
    title: "Aucun résultat",
    description:
      "Nous n'avons rien trouvé pour cette recherche. Essayez d'autres mots-clés ou parcourez nos catégories.",
  },
  messages: {
    icon: MessageSquare,
    title: "Aucun message",
    description:
      "Vous avez une question ? N'hésitez pas à nous écrire, nous répondons rapidement !",
    defaultAction: { label: "Nous écrire", href: "/contact" },
  },
  historique: {
    icon: Clock,
    title: "Aucun historique",
    description: "Votre historique d'activité apparaîtra ici après votre première visite.",
  },
  temoignages: {
    icon: Star,
    title: "Aucun avis pour le moment",
    description:
      "Soyez la première à partager votre expérience avec nous !",
    defaultAction: { label: "Prendre rendez-vous", href: "/prise-rdv" },
  },
  videos: {
    icon: Video,
    title: "Aucune vidéo disponible",
    description:
      "Les témoignages vidéo de nos clientes arrivent bientôt. Restez connectée !",
    defaultAction: { label: "Découvrir nos soins", href: "/soins" },
  },
}

export default function EmptyState({
  type,
  className,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  const finalAction = actionLabel
    ? { label: actionLabel, href: actionHref }
    : config.defaultAction

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {/* Illustration / Icône */}
      <div className="relative mb-6">
        {/* Background decorative circle */}
        <div className="absolute -inset-4 bg-primary-light opacity-50" />

        {/* Icon container */}
        <div className="relative flex h-16 w-16 items-center justify-center bg-bg-page">
          <Icon size={32} className="text-primary-brand" strokeWidth={1.5} />
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-2 -top-2 h-3 w-3 bg-gold opacity-60" />
        <div className="absolute -bottom-1 -left-1 h-2 w-2 bg-primary-brand opacity-40" />
      </div>

      {/* Title */}
      <h3 className="font-display text-[22px] font-light text-text-main">
        {config.title}
      </h3>

      {/* Description */}
      <p className="mx-auto mt-2 max-w-sm font-body text-[13px] font-light leading-relaxed text-text-muted-brand">
        {config.description}
      </p>

      {/* Action button */}
      {finalAction && (
        <div className="mt-6">
          {onAction ? (
            <button
              onClick={onAction}
              className="border border-primary-brand px-6 py-2.5 font-body text-[12px] font-medium text-primary-brand transition-colors hover:bg-primary-brand hover:text-white"
            >
              {finalAction.label}
            </button>
          ) : (
            <BtnArrow href={finalAction.href}>{finalAction.label}</BtnArrow>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Variante inline pour les listes
export function EmptyStateInline({
  type,
  className,
}: {
  type: EmptyStateType
  className?: string
}) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex items-center gap-4 border border-border-brand bg-bg-page p-6",
        className
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-white">
        <Icon size={24} className="text-text-muted-brand" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-body text-[13px] font-medium text-text-main">
          {config.title}
        </p>
        <p className="mt-0.5 font-body text-[12px] text-text-muted-brand">
          {config.description}
        </p>
      </div>
    </div>
  )
}
