import { Star } from "lucide-react"

export default function StarRating({ note, size = 16 }: { note: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= note ? "fill-gold text-gold" : "text-border-brand"}
        />
      ))}
    </div>
  )
}
