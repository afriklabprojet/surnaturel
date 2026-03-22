export default function GoldAccent({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-6 bg-gold" />
      <span className="block h-1.5 w-1.5 rounded-full bg-gold" />
      <span className="h-px w-6 bg-gold" />
    </div>
  )
}
