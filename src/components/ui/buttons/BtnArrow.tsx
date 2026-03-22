import Link from "next/link"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  disabled?: boolean
  type?: "button" | "submit"
}

export function BtnArrow({ children, onClick, href, className, disabled, type = "button" }: Props) {
  const base = `
    inline-flex items-center justify-center gap-2
    border border-primary-brand text-primary-brand
    px-5 py-2.5
    font-body text-[11px] tracking-[0.18em] uppercase
    transition-all duration-200
    hover:bg-primary-brand hover:text-white
    disabled:opacity-50 disabled:cursor-not-allowed
    group
  `
  
  const arrow = (
    <span className="transition-transform duration-200 group-hover:translate-x-1">
      →
    </span>
  )

  if (href) {
    return (
      <Link href={href} className={cn(base, className)}>
        {children}
        {arrow}
      </Link>
    )
  }

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn(base, className)}
    >
      {children}
      {arrow}
    </button>
  )
}
