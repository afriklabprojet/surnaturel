export default function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="h-px w-8 bg-gold" />
      <span className="font-body text-xs font-medium uppercase tracking-[0.15em] text-gold">
        {children}
      </span>
      <span className="h-px w-8 bg-gold" />
    </div>
  )
}
