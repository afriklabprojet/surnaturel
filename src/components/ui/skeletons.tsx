"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

// Base skeleton component
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md",
        className
      )}
    />
  )
}

// Skeleton for text lines
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// Skeleton for cards (soins, produits)
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("border border-border-brand bg-white p-5", className)}>
      <Skeleton className="mb-4 h-48 w-full" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

// Skeleton for product cards grid
export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Skeleton for soin cards
export function SkeletonSoinCard({ className }: SkeletonProps) {
  return (
    <div className={cn("border border-border-brand bg-white", className)}>
      <Skeleton className="h-64 w-full" />
      <div className="p-6">
        <Skeleton className="mb-2 h-6 w-2/3" />
        <Skeleton className="mb-4 h-4 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  )
}

// Skeleton for dashboard stats
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-border-brand bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="mt-3 h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

// Skeleton for table rows
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-border-brand bg-white">
      {/* Header */}
      <div className="flex gap-4 border-b border-border-brand bg-bg-page px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b border-border-brand px-4 py-3 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Skeleton for RDV cards
export function SkeletonRDVCard({ className }: SkeletonProps) {
  return (
    <div className={cn("border border-border-brand bg-white p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-2 h-5 w-48" />
          <div className="mt-3 flex items-center gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

// Skeleton for profile
export function SkeletonProfile() {
  return (
    <div className="border border-border-brand bg-white p-8">
      <div className="flex items-center gap-6">
        <Skeleton className="h-20 w-20" />
        <div className="flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton for fidelite page
export function SkeletonFidelite() {
  return (
    <div className="space-y-8">
      {/* Points header */}
      <div className="border border-border-brand bg-white p-8 text-center">
        <Skeleton className="mx-auto h-3 w-24" />
        <Skeleton className="mx-auto mt-4 h-14 w-32" />
        <Skeleton className="mx-auto mt-2 h-3 w-12" />
        <Skeleton className="mx-auto mt-6 h-6 w-32" />
        <div className="mx-auto mt-6 max-w-md">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="mx-auto mt-2 h-3 w-48" />
        </div>
      </div>

      {/* Paliers */}
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border-brand bg-white p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="mt-4 h-5 w-20" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-4 h-8 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Historique */}
      <div>
        <Skeleton className="mb-4 h-6 w-24" />
        <SkeletonTable rows={5} cols={3} />
      </div>
    </div>
  )
}

// Skeleton for commande detail
export function SkeletonCommandeDetail() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border border-border-brand bg-white p-4">
              <Skeleton className="h-20 w-20" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-4 w-24" />
                <Skeleton className="mt-2 h-5 w-20" />
              </div>
            </div>
          ))}
        </div>

        <div className="border border-border-brand bg-white p-6">
          <Skeleton className="h-5 w-24" />
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between border-t border-border-brand pt-3">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton for avis page (reviews)
export function SkeletonAvis() {
  return (
    <div className="space-y-8">
      {/* RDV sans avis (cards to review) */}
      <div>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-border-brand bg-white p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Existing reviews */}
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border-brand bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-40" />
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-4" />
                    ))}
                  </div>
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-3/4" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Skeleton for favoris page
export function SkeletonFavoris() {
  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-4 border-b border-border-brand">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border-brand bg-white p-5">
            <Skeleton className="mb-3 h-40 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton for parrainage page
export function SkeletonParrainage() {
  return (
    <div className="space-y-8">
      {/* Code section */}
      <div className="border border-border-brand border-t-2 border-t-gold bg-white p-8 text-center">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto mt-4 h-10 w-48" />
        <Skeleton className="mx-auto mt-4 h-10 w-64" />
      </div>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border-brand bg-white p-5 text-center">
            <Skeleton className="mx-auto h-8 w-12" />
            <Skeleton className="mx-auto mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
      {/* History */}
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <SkeletonTable rows={4} cols={3} />
      </div>
    </div>
  )
}

// Skeleton for commandes page
export function SkeletonCommandes() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border-brand bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-12 w-12" />
            <Skeleton className="h-12 w-12" />
            <Skeleton className="h-12 w-12" />
            <div className="flex-1" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton for mes-rdv page
export function SkeletonMesRDV() {
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      {/* RDV cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRDVCard key={i} />
        ))}
      </div>
    </div>
  )
}

// ───────────────────── Témoignages (public) ─────────────────────
export function SkeletonTemoignages() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <Skeleton className="mx-auto h-4 w-24" />
          <Skeleton className="mx-auto h-10 w-80" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border-brand bg-bg-page px-6 py-12 lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16">
          <div className="text-center space-y-2">
            <Skeleton className="mx-auto h-14 w-16" />
            <Skeleton className="mx-auto h-4 w-24" />
            <Skeleton className="mx-auto h-3 w-20" />
          </div>
          <div className="w-full max-w-xs space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Avis */}
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border-brand bg-white p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

// ───────────────────── Formulaire avis (public) ─────────────────
export function SkeletonAvisForm() {
  return (
    <div className="min-h-screen bg-bg-page px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <Skeleton className="mx-auto h-16 w-16" />
          <Skeleton className="mx-auto h-8 w-60" />
          <Skeleton className="mx-auto h-px w-16" />
        </div>
        <div className="border border-border-brand bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10" />
            ))}
          </div>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE-LEVEL SKELETONS (for loading.tsx files)
// ═══════════════════════════════════════════════════════════════

// Skeleton for Boutique page
export function SkeletonBoutiquePage() {
  return (
    <>
      {/* Hero section */}
      <section className="bg-white px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center space-y-4">
            <Skeleton className="mx-auto h-4 w-32" />
            <Skeleton className="mx-auto h-10 w-64" />
            <Skeleton className="mx-auto h-4 w-80 max-w-full" />
          </div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>

        {/* Sort & count */}
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Product grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
          ))}
        </div>
      </section>
    </>
  )
}

// Skeleton for Dashboard page
export function SkeletonDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="border-b border-border-brand pb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      {/* Quick stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border-brand bg-white p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mt-4 h-7 w-20" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Two columns: Next RDV & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next RDV */}
        <div className="border border-border-brand bg-white p-6">
          <Skeleton className="h-5 w-36" />
          <div className="mt-6 space-y-4">
            <SkeletonRDVCard />
          </div>
          <Skeleton className="mt-4 h-9 w-full" />
        </div>

        {/* Recent orders */}
        <div className="border border-border-brand bg-white p-6">
          <Skeleton className="h-5 w-40" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-border-brand last:border-0">
                <Skeleton className="h-12 w-12" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-9 w-full" />
        </div>
      </div>

      {/* Fidelity section */}
      <div className="border border-border-brand bg-linear-to-r from-gold/5 to-primary-light/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-8 w-24" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="mt-4 h-2 w-full" />
      </div>
    </div>
  )
}

// Skeleton for Prise-RDV page (booking wizard)
export function SkeletonPriseRDVPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10 lg:py-16">
      {/* Header */}
      <div className="mb-10 text-center space-y-3">
        <Skeleton className="mx-auto h-4 w-28" />
        <Skeleton className="mx-auto h-9 w-72" />
        <Skeleton className="mx-auto h-4 w-96 max-w-full" />
      </div>

      {/* Stepper indicator */}
      <div className="mb-10 flex items-center justify-center gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="hidden sm:block h-3 w-20" />
            {i < 3 && <Skeleton className="h-0.5 w-8" />}
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div className="border border-border-brand bg-white p-8">
        {/* Step title */}
        <Skeleton className="mb-6 h-6 w-48" />

        {/* Services grid (step 1) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border-brand p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>
    </section>
  )
}

// ───────────────── Détail commande (dashboard) ──────────────────
export function SkeletonCommandeDetailPage() {
  return (
    <div className="space-y-8">
      {/* Retour */}
      <Skeleton className="h-4 w-36" />

      {/* Récapitulatif */}
      <div className="bg-white border border-border-brand p-6 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Articles */}
      <div className="bg-white border border-border-brand">
        <div className="p-4 border-b border-border-brand">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-border-brand p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex items-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────── Profil modifier (dashboard) ───────────────────
export function SkeletonProfilModifier() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-border-brand p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

// ──────────────── Suivi médical (dashboard) ─────────────────────
export function SkeletonSuiviMedical() {
  return (
    <div className="space-y-6">
      {/* Security header */}
      <div className="flex items-center gap-3 border border-border-brand bg-white p-4">
        <Skeleton className="h-8 w-8" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-brand overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 shrink-0" />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-border-brand p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────── QR Code RDV (dashboard) ───────────────────────
export function SkeletonQRCode() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-6 py-16 text-center">
      <Skeleton className="mx-auto h-8 w-64" />
      <Skeleton className="mx-auto h-px w-16" />
      <Skeleton className="mx-auto h-64 w-64" />
      <div className="space-y-2">
        <Skeleton className="mx-auto h-4 w-48" />
        <Skeleton className="mx-auto h-3 w-32" />
      </div>
      <Skeleton className="mx-auto h-10 w-40" />
    </div>
  )
}
