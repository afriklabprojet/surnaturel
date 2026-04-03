import Link from "next/link"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-[80px] font-light leading-none text-gold">
        404
      </p>

      <h1 className="mt-4 font-display text-[28px] font-light text-text-main">
        Page introuvable
      </h1>

      <p className="mt-3 max-w-md font-body text-[14px] text-text-muted-brand">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>

      <div className="mt-2 h-px w-10 bg-gold" />

      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary-brand px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-white hover:bg-primary-dark transition-colors"
        >
          <Home size={14} />
          Accueil
        </Link>

        <Link
          href="/soins"
          className="inline-flex items-center gap-2 border border-border-brand bg-white px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] text-text-main hover:border-gold transition-colors"
        >
          <Search size={14} />
          Nos soins
        </Link>
      </div>
    </div>
  )
}
