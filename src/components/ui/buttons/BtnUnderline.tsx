import Link from "next/link"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}

export function BtnUnderline({ children, onClick, href, className }: Props) {
  const base = `
    inline-flex items-center gap-2
    bg-transparent border-none text-[#1A1A1A]
    py-1 px-0
    font-body text-[12px] tracking-[0.1em] uppercase
    relative cursor-pointer
    transition-colors duration-200
    hover:text-primary-brand
    after:content-[''] after:absolute after:bottom-0 after:left-0
    after:w-full after:h-px after:bg-gold
    after:scale-x-[0.3] after:origin-left
    after:transition-transform after:duration-300
    hover:after:scale-x-100
  `

  if (href) {
    return (
      <Link href={href} className={cn(base, className)}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={cn(base, className)}>
      {children}
    </button>
  )
}
