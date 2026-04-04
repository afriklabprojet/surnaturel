import { Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

function AuthSkeleton() {
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* Colonne gauche verte — skeleton */}
      <div className="hidden bg-primary-brand md:flex md:flex-col md:justify-between md:px-12 md:py-14">
        <div>
          <div className="h-6 w-48 animate-pulse rounded bg-white/20" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-10 h-px w-8 bg-gold" />
          <div className="mt-8 h-8 w-64 animate-pulse rounded bg-white/20" />
          <div className="mt-10 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-56 animate-pulse rounded bg-white/10" />
            ))}
          </div>
        </div>
      </div>
      {/* Colonne droite — skeleton formulaire */}
      <div className="flex items-center justify-center px-6 py-10 md:px-12">
        <div className="w-full max-w-100 space-y-6">
          <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gold/20" />
          <div className="mx-auto h-8 w-64 animate-pulse rounded bg-border-brand/30" />
          <div className="space-y-4 pt-4">
            <div className="h-4 w-20 animate-pulse rounded bg-border-brand/30" />
            <div className="h-12 w-full animate-pulse rounded bg-border-brand/20" />
            <div className="h-4 w-24 animate-pulse rounded bg-border-brand/30" />
            <div className="h-12 w-full animate-pulse rounded bg-border-brand/20" />
            <div className="h-12 w-full animate-pulse rounded bg-primary-brand/20" />
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Navbar />
      <Suspense fallback={<AuthSkeleton />}>
        <main className="flex-1">{children}</main>
      </Suspense>
      <Footer />
    </>
  )
}
