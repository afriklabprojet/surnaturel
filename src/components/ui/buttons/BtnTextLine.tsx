import Link from "next/link"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}

export function BtnTextLine({ children, onClick, href, className }: Props) {
  const base = `
    inline-flex items-center gap-2
    bg-transparent border-none text-primary-brand
    p-0 font-body text-[12px] 
    tracking-[0.1em] cursor-pointer
    group
  `

  const line = (
    <span className="block w-5 h-px bg-primary-brand transition-all duration-200 group-hover:w-8" />
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
