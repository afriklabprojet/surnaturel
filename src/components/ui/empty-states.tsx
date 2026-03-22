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
      "Vous n'avez pas encore de rendez-vous planifié. Prenez votre premier rendez-vous pour découvrir nos soins.",
    defaultAction: { label: "Prendre un RDV", href: "/prise-rdv" },
  },
  commandes: {
    icon: ShoppingBag,
    title: "Aucune commande",
    description:
      "Vous n'avez pas encore passé de commande. Découvrez notre sélection de produits de beauté.",
    defaultAction: { label: "Voir les produits", href: "/produits" },
  },
  favoris: {
    icon: Heart,
    title: "Aucun favori",
    description:
      "Vous n'avez pas encore ajouté de favoris. Explorez nos soins et produits pour créer votre liste.",
    defaultAction: { label: "Explorer les soins", href: "/soins" },
  },
  avis: {
    icon: Star,
    title: "Aucun avis",
    description:
      "Vous n'avez pas encore laissé d'avis. Partagez votre expérience après votre prochain rendez-vous !",
  },
  parrainage: {
    icon: Users,
    title: "Aucun parrainage",
    description:
      "Vous n'avez pas encore parrainé de proches. Invitez vos amis et gagnez des points fidélité !",
  },
  notifications: {
    icon: Bell,
    title: "Aucune notification",
    description:
      "Vous n'avez pas de nouvelles notifications. Nous vous tiendrons informé(e) de vos rendez-vous et promotions.",
  },
  fidelite: {
    icon: Gift,
    title: "Aucune activité",
    description:
      "Pas encore d'historique de points. Prenez un rendez-vous pour commencer à gagner des points !",
    defaultAction: { label: "Prendre un RDV", href: "/prise-rdv" },
  },
  recherche: {
    icon: Search,
    title: "Aucun résultat",
    description:
      "Aucun résultat ne correspond à votre recherche. Essayez avec d'autres termes.",
  },
  messages: {
    icon: MessageSquare,
    title: "Aucun message",
    description:
      "Vous n'avez pas de messages. Contactez-nous si vous avez des questions !",
    defaultAction: { label: "Nous contacter", href: "/contact" },
  },
  historique: {
    icon: Clock,
    title: "Aucun historique",
    description: "Aucune activité passée pour le moment.",
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
