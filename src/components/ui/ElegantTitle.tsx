interface ElegantTitleProps {
  children: React.ReactNode
  as?: "h1" | "h2" | "h3"
  accent?: string
  className?: string
}

export default function ElegantTitle({
  children,
  as: Tag = "h2",
  accent,
  className = "",
}: ElegantTitleProps) {
  return (
    <Tag
      className={`font-display font-light text-text-main ${className}`}
    >
      {children}
      {accent && (
        <em className="text-primary-brand"> {accent}</em>
      )}
    </Tag>
  )
}
