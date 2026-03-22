import Link from "next/link"

interface ButtonOutlineProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}

export default function ButtonOutline({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: ButtonOutlineProps) {
  const baseClasses = `inline-flex items-center justify-center gap-2 border border-primary-brand bg-transparent px-7 py-3.5 font-body text-[11px] font-medium uppercase tracking-[0.15em] text-primary-brand transition-colors duration-300 hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed ${className}`

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {children}
    </button>
  )
}
