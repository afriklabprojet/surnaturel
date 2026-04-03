"use client"

import Link from "next/link"
import Image from "next/image"
import { ReactNode, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => ReactNode
  hideOnMobile?: boolean
  className?: string
  sortable?: boolean
  sortFn?: (a: T, b: T, direction: "asc" | "desc") => number
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  loading?: boolean
  emptyMessage?: string
  // Mobile card rendering
  mobileCard?: (item: T) => ReactNode
  // Action column
  actionRender?: (item: T) => ReactNode
  // Tri par défaut
  defaultSortKey?: string
  defaultSortDirection?: SortDirection
}

// ─── Responsive Table + Mobile Cards ─────────────────────────────

export function ResponsiveAdminTable<T>({
  data,
  columns,
  keyExtractor,
  loading,
  emptyMessage = "Aucune donnée trouvée",
  mobileCard,
  actionRender,
  defaultSortKey,
  defaultSortDirection = null,
}: ResponsiveTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection)

  // Gestion du clic sur une colonne triable
  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return
    
    if (sortKey === key) {
      // Cycle: asc → desc → null
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortDirection(null)
        setSortKey(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  // Données triées
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    const column = columns.find((col) => String(col.key) === sortKey)
    if (!column) return data

    return [...data].sort((a, b) => {
      // Utiliser sortFn custom si fourni
      if (column.sortFn) {
        return column.sortFn(a, b, sortDirection)
      }

      // Tri par défaut
      const aVal = (a as Record<string, unknown>)[sortKey]
      const bVal = (b as Record<string, unknown>)[sortKey]

      // Gérer les nulls/undefined
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sortDirection === "asc" ? -1 : 1
      if (bVal == null) return sortDirection === "asc" ? 1 : -1

      // Comparer selon le type
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === "asc" 
          ? aVal.getTime() - bVal.getTime() 
          : bVal.getTime() - aVal.getTime()
      }

      // String par défaut
      const strA = String(aVal).toLowerCase()
      const strB = String(bVal).toLowerCase()
      return sortDirection === "asc" 
        ? strA.localeCompare(strB, "fr") 
        : strB.localeCompare(strA, "fr")
    })
  }, [data, sortKey, sortDirection, columns])
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 bg-white border border-border-brand">
        <div className="h-6 w-6 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-white border border-border-brand">
        <p className="text-sm text-gray-500 font-body">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* ─── Mobile Cards (visible on sm and below) ─── */}
      <div className="md:hidden space-y-3">
        {sortedData.map((item) => (
          <div
            key={keyExtractor(item)}
            className="bg-white border border-border-brand p-4 transition-colors hover:border-gold/50"
          >
            {mobileCard ? (
              mobileCard(item)
            ) : (
              <DefaultMobileCard item={item} columns={columns} actionRender={actionRender} />
            )}
          </div>
        ))}
      </div>

      {/* ─── Desktop Table (hidden on mobile) ─── */}
      <div className="hidden md:block bg-white border border-border-brand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-bg-page">
              <tr>
                {columns.map((col) => {
                  const isActive = sortKey === String(col.key)
                  const isSortable = col.sortable
                  
                  return (
                    <th
                      key={String(col.key)}
                      onClick={() => handleSort(String(col.key), col.sortable)}
                      className={cn(
                        "text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-medium",
                        col.hideOnMobile && "hidden lg:table-cell",
                        col.className,
                        isSortable && "cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100/50 transition-colors"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        {isSortable && (
                          <span className="inline-flex flex-col items-center">
                            {isActive && sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-gold" />
                            ) : isActive && sortDirection === "desc" ? (
                              <ChevronDown className="h-4 w-4 text-gold" />
                            ) : (
                              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
                {actionRender && (
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-medium">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="border-t border-border-brand hover:bg-bg-page transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-3",
                        col.hideOnMobile && "hidden lg:table-cell",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[String(col.key)] ?? "—")}
                    </td>
                  ))}
                  {actionRender && <td className="px-4 py-3">{actionRender(item)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ─── Default Mobile Card (when no custom mobileCard provided) ────

function DefaultMobileCard<T>({
  item,
  columns,
  actionRender,
}: {
  item: T
  columns: Column<T>[]
  actionRender?: (item: T) => ReactNode
}) {
  const visibleColumns = columns.filter((col) => !col.hideOnMobile)

  return (
    <div className="space-y-2">
      {visibleColumns.map((col, idx) => (
        <div key={String(col.key)} className={idx === 0 ? "mb-3" : "flex items-center justify-between text-sm"}>
          {idx === 0 ? (
            <div className="font-medium text-text-main">
              {col.render ? col.render(item) : String((item as Record<string, unknown>)[String(col.key)] ?? "")}
            </div>
          ) : (
            <>
              <span className="text-gray-500">{col.label}</span>
              <span className="text-text-main">
                {col.render ? col.render(item) : String((item as Record<string, unknown>)[String(col.key)] ?? "—")}
              </span>
            </>
          )}
        </div>
      ))}
      {actionRender && <div className="pt-3 border-t border-border-brand mt-3">{actionRender(item)}</div>}
    </div>
  )
}

// ─── Mobile Action Button ────────────────────────────────────────

export function AdminMobileActionButton({
  href,
  icon,
  label,
  variant = "primary",
}: {
  href: string
  icon: ReactNode
  label: string
  variant?: "primary" | "outline"
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-body transition-colors",
        variant === "primary"
          ? "bg-primary-brand text-white hover:bg-primary-dark"
          : "border border-border-brand text-text-mid hover:bg-bg-page"
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

// ─── Admin Card Grid (for dashboards) ────────────────────────────

export function AdminCardGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }

  return <div className={cn("grid gap-4", gridCols[columns])}>{children}</div>
}

// ─── Admin Stat Card ─────────────────────────────────────────────

export function AdminStatCard({
  icon,
  label,
  value,
  subtext,
  trend,
  href,
  color = "primary",
}: {
  icon: ReactNode
  label: string
  value: string | number
  subtext?: string
  trend?: { value: number; positive: boolean }
  href?: string
  color?: "primary" | "gold" | "success" | "danger"
}) {
  const colorClasses = {
    primary: "bg-primary-light text-primary-brand",
    gold: "bg-gold-light text-gold",
    success: "bg-green-50 text-green-600",
    danger: "bg-red-50 text-red-600",
  }

  const Card = (
    <div
      className={cn(
        "border border-border-brand bg-white p-5 transition-colors",
        href && "hover:border-gold cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-2.5", colorClasses[color])}>{icon}</div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl text-text-main">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-gray-500 font-body">
        {label}
      </p>
      {subtext && <p className="mt-1 text-xs text-gray-400 font-body">{subtext}</p>}
    </div>
  )

  return href ? <Link href={href}>{Card}</Link> : Card
}

// ─── Pagination ──────────────────────────────────────────────────

export function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
  itemLabel = "élément",
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  itemLabel?: string
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border-brand bg-white">
      <p className="text-sm text-gray-500 font-body order-2 sm:order-1">
        {total} {itemLabel}{total > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="px-4 py-2 text-sm border border-border-brand disabled:opacity-50 font-body hover:bg-bg-page transition-colors"
        >
          Préc.
        </button>
        <span className="text-sm text-gray-500 font-body px-2">
          {page}/{totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-4 py-2 text-sm border border-border-brand disabled:opacity-50 font-body hover:bg-bg-page transition-colors"
        >
          Suiv.
        </button>
      </div>
    </div>
  )
}
