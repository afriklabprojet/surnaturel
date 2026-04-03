import { Skeleton } from "@/components/ui/skeletons"

export default function LoadingBlog() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-white px-6 py-16 lg:px-10 text-center">
        <Skeleton className="mx-auto h-3 w-20 mb-4" />
        <Skeleton className="mx-auto h-10 w-48 mb-3" />
        <Skeleton className="mx-auto h-4 w-80 max-w-full" />
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-7xl px-6 pt-8 lg:px-10">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </section>

      {/* Article grid */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border-brand bg-white overflow-hidden rounded-lg">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
