import { Skeleton, SkeletonTable } from "@/components/ui/skeletons"

export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  )
}
