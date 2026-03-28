import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      className="flex items-center gap-2 font-body text-[12px] text-text-muted-brand mb-6"
      aria-label="Fil d'Ariane"
    >
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-primary-brand transition-colors"
      >
        <Home size={14} />
        <span className="sr-only">Accueil</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-border-brand" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-primary-brand transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-main font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
