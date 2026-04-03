import { Skeleton } from "@/components/ui/skeletons"

export default function PublicLoading() {
  return (
    <div className="min-h-100 space-y-8 px-5 py-12 lg:px-8">
      {/* Hero skeleton */}
      <div className="mx-auto max-w-4xl text-center space-y-4">
        <Skeleton className="mx-auto h-10 w-72" />
        <Skeleton className="mx-auto h-4 w-96 max-w-full" />
        <Skeleton className="mx-auto h-4 w-80 max-w-full" />
      </div>

      {/* Content grid skeleton */}
      <div className="mx-auto max-w-7xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border-brand bg-white p-5 space-y-3">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
