import Link from "next/link"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}

export function BtnSerif({ children, onClick, href, className }: Props) {
  const base = `
    inline-flex items-center gap-3
    bg-transparent border-none text-[#1A1A1A]
    p-0 font-heading 
    text-base italic font-light
    cursor-pointer
    transition-colors duration-200
    hover:text-primary-brand
    group
  `

  const line = (
    <span className="block w-6 h-px bg-gold transition-all duration-200 group-hover:w-10" />
  )

  if (href) {
    return (
      <Link href={href} className={cn(base, className)}>
        {line}
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={cn(base, className)}>
      {line}
      {children}
    </button>
  )
}
