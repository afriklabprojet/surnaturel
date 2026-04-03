import Link from "next/link"

interface ButtonPrimaryProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}

export default function ButtonPrimary({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: ButtonPrimaryProps) {
  const baseClasses = `inline-flex items-center justify-center gap-2 bg-primary-brand px-7 py-3.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`

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
