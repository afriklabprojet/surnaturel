import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un montant en FCFA (Franc CFA)
 */
export function formatPrix(montant: number): string {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(montant)
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function genererCreneauCle(soinId: string, dateHeure: Date): string {
  const date = dateHeure.toISOString().split("T")[0] // YYYY-MM-DD
  const heure = dateHeure.getUTCHours().toString().padStart(2, "0")
  return `${soinId}_${date}_${heure}`
}

