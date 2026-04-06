import { Skeleton } from "@/components/ui/skeletons"

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-12rem)] border border-border-brand bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-border-brand p-4 space-y-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
      {/* Chat area */}
      <div className="flex-1 flex flex-col p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="flex-1" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
