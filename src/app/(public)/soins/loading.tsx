import { Skeleton } from "@/components/ui/skeletons"

export default function LoadingSoins() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-white px-6 py-16 lg:px-10 text-center">
        <Skeleton className="mx-auto h-3 w-24 mb-4" />
        <Skeleton className="mx-auto h-10 w-80 mb-3" />
        <Skeleton className="mx-auto h-4 w-96 max-w-full" />
        <div className="mt-8 flex justify-center gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>

      {/* Filtres + Grille */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Search + Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border-brand bg-white overflow-hidden rounded-lg">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
