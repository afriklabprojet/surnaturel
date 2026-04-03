import { Skeleton } from "@/components/ui/skeletons"

export default function CommunauteLoading() {
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0" />
        ))}
      </div>
      {/* Composer */}
      <div className="border border-border-brand bg-white p-4">
        <Skeleton className="h-20 w-full" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      {/* Posts */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-border-brand bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-48 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
