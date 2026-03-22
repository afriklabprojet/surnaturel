export default function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <span className="block h-px w-10 bg-gold" />
    </div>
  )
}
