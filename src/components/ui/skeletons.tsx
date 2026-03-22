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
        "animate-pulse bg-border-brand",
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
